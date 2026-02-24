import Foundation
import Combine

/// Manages driver's assigned orders.
/// MVP: One active order at a time.
@MainActor
final class OrderStore: ObservableObject {
    @Published var orders: [AssignedOrder] = []
    @Published var activeOrder: AssignedOrder?
    @Published var isLoading = false
    @Published var errorMessage: String?

    // MARK: - Fetch assigned orders
    func fetchOrders() async {
        isLoading = true
        defer { isLoading = false }
        do {
            // Backend returns only orders assigned to authenticated driver
            let fetched: [AssignedOrder] = try await APIService.shared.get("/driver/orders")
            orders = fetched
            // Restore active order if any is in progress
            activeOrder = fetched.first { $0.status == .pickup || $0.status == .ready }
        } catch {
            errorMessage = "Failed to load orders"
        }
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
            // Activate location tracking for this order
            LocationManager.shared.activeOrderId = order.id
            LocationManager.shared.startTracking()
        } catch {
            errorMessage = "Failed to accept order"
        }
    }

    // MARK: - Complete / deliver an order
    func completeOrder(_ order: AssignedOrder) async {
        do {
            struct Body: Encodable { let orderId: String }
            struct Resp: Decodable { let success: Bool }
            let _: Resp = try await APIService.shared.post("/driver/complete", body: Body(orderId: order.id))
            activeOrder = nil
            LocationManager.shared.stopTracking()
            await fetchOrders()
        } catch {
            errorMessage = "Failed to complete order"
        }
    }
}
