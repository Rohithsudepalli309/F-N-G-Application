import Foundation
import SocketIO

/// Socket.IO client for Driver App.
/// Driver emits ONLY `driver.location.emit` — no other events.
final class SocketService: ObservableObject {
    static let shared = SocketService()

    @Published var isConnected = false
    private var manager: SocketManager?
    private var socket: SocketIOClient?

    private init() {}

    // MARK: - Connect (called after driver logs in and goes Online)
    func connect(token: String) {
        // Use 127.0.0.1 for iOS simulator, or replace with your machine's local IP for physical devices
        let serverURLString = "http://127.0.0.1:3000" 
        
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
            socket.emit("driver.location.emit", dict)
        }
        
        print("[SocketService] emitLocation: \(payload.lat), \(payload.lng) for order \(payload.orderId)")
    }

    // MARK: - Disconnect (logout / go Offline)
    func disconnect() {
        socket?.disconnect()
        isConnected = false
    }
}
