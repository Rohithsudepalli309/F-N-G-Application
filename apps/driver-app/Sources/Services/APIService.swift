import Foundation

/// Centralised API client. JWT is injected per-request from Keychain.
/// No business logic lives here — only transport.
final class APIService {
    static let shared = APIService()
    private let base = URL(string: "http://192.168.1.1:3000/api/v1")! 

    private init() {}

    // MARK: - Generic Request
    func request<T: Decodable>(_ path: String,
                               method: String = "GET",
                               body: Encodable? = nil) async throws -> T {
        var url = base.appendingPathComponent(path)
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Inject JWT
        if let token = KeychainManager.loadToken() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            req.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: req)

        if let http = response as? HTTPURLResponse, http.statusCode == 401 {
            // Token invalid → force logout
            NotificationCenter.default.post(name: .driverForceLogout, object: nil)
            throw APIError.unauthorized
        }

        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Helpers
    func post<T: Decodable>(_ path: String, body: Encodable) async throws -> T {
        try await request(path, method: "POST", body: body)
    }

    func get<T: Decodable>(_ path: String) async throws -> T {
        try await request(path, method: "GET")
    }
}

enum APIError: Error {
    case unauthorized
    case invalidResponse
}

extension Notification.Name {
    static let driverForceLogout = Notification.Name("driverForceLogout")
}
