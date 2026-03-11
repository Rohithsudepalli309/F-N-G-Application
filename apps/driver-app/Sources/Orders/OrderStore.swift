import Foundation
import Combine

/// Manages driver's assigned orders.
/// MVP: One active order at a time.
@MainActor
final class OrderStore: ObservableObject {
    @Published var orders: [AssignedOrder] = []
    @Published var activeOrder: AssignedOrder?
    @Published var incomingOrder: AssignedOrder?   // shown in IncomingOrderSheet
    @Published var isLoading = false
    @Published var errorMessage: String?

    private var autoDeclineTimer: Timer?

    // MARK: - Fetch assigned orders
    func fetchOrders() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let fetched: [AssignedOrder] = try await APIService.shared.get("/driver/orders")
            orders = fetched
            // Only restore active if truly assigned to this driver (pickup or assigned status)
            activeOrder = fetched.first { $0.status == .pickup || $0.status == .assigned }
        } catch {
            errorMessage = "Failed to load orders"
        }
    }

    // MARK: - Incoming order (socket push)
    /// Called when `order.new_assignment` is received from server.
    /// Ignored while driver already has an active delivery.
    func setIncomingOrder(_ order: AssignedOrder) {
        guard activeOrder == nil else { return }
        incomingOrder = order
        autoDeclineTimer?.invalidate()
        autoDeclineTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: false) { [weak self] _ in
            DispatchQueue.main.async { self?.dismissIncoming() }
        }
    }

    func dismissIncoming() {
        incomingOrder = nil
        autoDeclineTimer?.invalidate()
        autoDeclineTimer = nil
    }

    // MARK: - Accept an order
    func acceptOrder(_ order: AssignedOrder) async {
        guard activeOrder == nil else {
            errorMessage = "Complete your current delivery first"
            return
        }
        do {
            struct Body: Encodable { let orderId: String }
            struct Resp: Decodable { let success: Bool }
            let _: Resp = try await APIService.shared.post("/driver/accept", body: Body(orderId: order.id))
            activeOrder = order
            LocationManager.shared.activeOrderId = order.id
            LocationManager.shared.startTracking()
            await fetchOrders()
        } catch {
            errorMessage = "Failed to accept order"
        }
    }

    // MARK: - Reject / decline an order
    func rejectOrder(_ order: AssignedOrder) async {
        dismissIncoming()
        // Non-blocking — no status change on backend; other drivers remain eligible
        struct Body: Encodable { let orderId: String }
        struct Resp: Decodable { let success: Bool }
        _ = try? await APIService.shared.post("/driver/reject", body: Body(orderId: order.id)) as Resp
    }

    // MARK: - Pickup — driver collected order from store/restaurant
    func pickupOrder(_ order: AssignedOrder) async {
        do {
            struct Body: Encodable { let orderId: String }
            struct Resp: Decodable { let success: Bool }
            let _: Resp = try await APIService.shared.post("/driver/pickup", body: Body(orderId: order.id))
            await fetchOrders()  // refresh so activeOrder status reflects out_for_delivery
        } catch {
            errorMessage = "Failed to mark pickup — please try again"
        }
    }

    // MARK: - Complete / deliver an order
    func completeOrder(_ order: AssignedOrder, otp: String) async {
        do {
            struct Body: Encodable { let orderId: String; let otp: String }
            struct Resp: Decodable { let success: Bool }
            let _: Resp = try await APIService.shared.post("/driver/complete", body: Body(orderId: order.id, otp: otp))
            activeOrder = nil
            LocationManager.shared.stopTracking()
            await fetchOrders()
        } catch {
            errorMessage = "Failed to complete order. Invalid OTP?"
        }
    }

}
