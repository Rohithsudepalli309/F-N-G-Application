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
    let storeId: String?
    let status: OrderStatus
    let totalAmount: Int          // paisa
    let deliveryAddress: Address
    let createdAt: String
    // Fields added for incoming order card (populated by enhanced GET /driver/orders)
    let storeName: String?
    let pickupAddress: Address?
    let itemsCount: Int?

    enum CodingKeys: String, CodingKey {
        case id, status
        case storeId          = "store_id"
        case totalAmount      = "total_amount"
        case deliveryAddress  = "delivery_address"
        case createdAt        = "created_at"
        case storeName        = "store_name"
        case pickupAddress    = "pickup_address"
        case itemsCount       = "items_count"
    }
}

struct Address: Codable {
    let lat: Double
    let lng: Double
    let text: String
}

enum OrderStatus: String, Codable {
    case pending, placed, preparing, ready, assigned, pickup, delivered, cancelled
}

// MARK: - Location
struct LocationPayload: Encodable {
    let orderId: String
    let lat: Double
    let lng: Double
    let bearing: Double
    let timestamp: Int64
}
