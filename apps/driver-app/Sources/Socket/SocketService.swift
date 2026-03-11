import Foundation
import SocketIO

/// Socket.IO client for Driver App.
/// Driver emits `driver.location.emit`; listens for `order.new_assignment`.
final class SocketService: ObservableObject {
    static let shared = SocketService()

    @Published var isConnected = false
    private var manager: SocketManager?
    private var socket: SocketIOClient?

    /// Called when `order.new_assignment` arrives from server.
    private var newOrderHandler: ((AssignedOrder) -> Void)?

    private init() {}

    // MARK: - Register handler for incoming order notifications
    func onNewOrderAssignment(_ handler: @escaping (AssignedOrder) -> Void) {
        newOrderHandler = handler
    }

    // MARK: - Connect (called after driver logs in and goes Online)
    func connect(token: String) {
        let serverURLString = Config.baseURL.absoluteString
        
        let manager = SocketManager(
            socketURL: URL(string: serverURLString)!,
            config: [
                .log(false),
                .compress,
                .reconnects(true),
                .reconnectAttempts(-1),           // infinite
                .reconnectWait(1),
                .reconnectWaitMax(30),
                .extraHeaders(["Authorization": "Bearer \(token)"])
            ]
        )
        let socket = manager.defaultSocket

        socket.on(clientEvent: .connect) { [weak self] _, _ in
            DispatchQueue.main.async { self?.isConnected = true }
        }
        socket.on(clientEvent: .disconnect) { [weak self] _, _ in
            DispatchQueue.main.async { self?.isConnected = false }
        }
        socket.on("error") { data, _ in
            print("[Socket] Error: \(data)")
        }

        // Incoming order notification from server (broadcast to 'drivers' room)
        socket.on("order.new_assignment") { [weak self] data, _ in
            guard let self = self,
                  let payload = data.first as? [String: Any],
                  let orderDict = payload["order"] as? [String: Any],
                  let jsonData = try? JSONSerialization.data(withJSONObject: orderDict),
                  let order = try? JSONDecoder().decode(AssignedOrder.self, from: jsonData)
            else {
                print("[Socket] Could not decode order.new_assignment payload")
                return
            }
            DispatchQueue.main.async { self.newOrderHandler?(order) }
        }

        self.manager = manager
        self.socket = socket
        socket.connect()
        
        print("[SocketService] Connecting to \(serverURLString)...")
    }

    // MARK: - Emit Location (DRIVER-ONLY, no REST fallback)
    func emitLocation(_ payload: LocationPayload) {
        guard isConnected, let socket = socket else {
            print("[SocketService] Not connected — location update dropped")
            return
        }
        
        if let data = try? JSONEncoder().encode(payload),
           let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            socket.emit("driver:location", dict)
        }
        
        print("[SocketService] emitLocation: \(payload.lat), \(payload.lng) for order \(payload.orderId)")
    }

    // MARK: - Disconnect (logout / go Offline)
    func disconnect() {
        socket?.disconnect()
        isConnected = false
    }
}
