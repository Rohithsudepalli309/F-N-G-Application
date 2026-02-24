import Foundation

// MARK: - User / Auth
struct AuthResponse: Codable {
    let token: String
    let user: DriverUser
}

struct DriverUser: Codable {
    let id: String
    let name: String
    let role: String
}

// MARK: - Order
struct AssignedOrder: Codable, Identifiable {
    let id: String
    let storeId: String
    let status: OrderStatus
    let totalAmount: Int          // cents/paisa
    let deliveryAddress: Address
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, status, totalAmount = "total_amount"
        case storeId = "store_id"
        case deliveryAddress = "delivery_address"
        case createdAt = "created_at"
    }
}

struct Address: Codable {
    let lat: Double
    let lng: Double
    let text: String
}

enum OrderStatus: String, Codable {
    case pending, placed, preparing, ready, pickup, delivered, cancelled
}

// MARK: - Location
struct LocationPayload: Encodable {
    let orderId: String
    let lat: Double
    let lng: Double
    let bearing: Double
    let timestamp: Int64
}
