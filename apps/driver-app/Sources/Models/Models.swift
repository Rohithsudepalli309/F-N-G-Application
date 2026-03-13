import Foundation
import CoreLocation
import SwiftUI

// MARK: - User / Auth
struct AuthResponse: Codable {
    let accessToken: String
    let user: DriverUser
}

struct DriverUser: Codable {
    let id: Int
    let name: String?
    let role: String
}

// MARK: - Driver Profile
struct DriverProfile: Codable {
    let id: Int
    let name: String
    let phone: String
    let vehicleType: String
    let isAvailable: Bool
    let totalDeliveries: Int

    enum CodingKeys: String, CodingKey {
        case id, name, phone
        case vehicleType     = "vehicle_type"
        case isAvailable     = "is_available"
        case totalDeliveries = "total_deliveries"
    }
}

// MARK: - Order
/// Matches the camelCase shape returned by GET /driver/orders and POST /driver/accept.
struct AssignedOrder: Codable, Identifiable {
    let id: Int
    let orderNumber: String
    let storeName: String
    let storeAddress: String
    let storeLat: Double
    let storeLng: Double
    let status: OrderStatus
    let totalAmount: Int          // paise
    let itemCount: Int
    let estimatedKm: Double
    let driverPayout: Int         // paise
    let customerName: String
    let customerPhone: String
    let deliveryOtp: String
    let createdAt: String?

    // deliveryAddress comes as a nested JSON object from Postgres JSONB
    let deliveryAddress: DeliveryAddress

    enum CodingKeys: String, CodingKey {
        case id, status
        case orderNumber     = "orderNumber"
        case storeName       = "storeName"
        case storeAddress    = "storeAddress"
        case storeLat        = "storeLat"
        case storeLng        = "storeLng"
        case totalAmount     = "totalAmount"
        case itemCount       = "itemCount"
        case estimatedKm     = "estimatedKm"
        case driverPayout    = "driverPayout"
        case customerName    = "customerName"
        case customerPhone   = "customerPhone"
        case deliveryOtp     = "deliveryOtp"
        case createdAt       = "createdAt"
        case deliveryAddress = "deliveryAddress"
    }
}

/// Delivery address stored as JSONB — matches fields from AddAddressScreen / addresses table.
struct DeliveryAddress: Codable {
    let lat: Double?
    let lng: Double?
    let label: String?
    let addressLine: String?
    let city: String?
    let pincode: String?

    enum CodingKeys: String, CodingKey {
        case lat, lng, label
        case addressLine = "address_line"
        case city, pincode
    }

    var displayText: String {
        [addressLine, city, pincode].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ", ")
    }
}

// MARK: - Earnings
struct EarningsSummary: Codable {
    let period: String
    let totalPayout: Int
    let deliveries: Int
    let avgPerDelivery: Int

    enum CodingKeys: String, CodingKey {
        case period
        case totalPayout     = "totalPayout"
        case deliveries
        case avgPerDelivery  = "avgPerDelivery"
    }
}

struct EarningsResponse: Codable {
    let earnings: EarningsSummary
    let history: [DeliveryHistoryItem]?
}

struct DeliveryHistoryItem: Codable, Identifiable {
    let id: Int
    let orderNumber: String
    let storeName: String
    let payout: Int
    let deliveredAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case orderNumber = "orderNumber"
        case storeName   = "storeName"
        case payout
        case deliveredAt = "deliveredAt"
    }
}

enum OrderStatus: String, Codable {
    case pending, placed, preparing, ready, assigned, pickup
    case outForDelivery = "out_for_delivery"
    case delivered, cancelled
}

// MARK: - Location
struct LocationPayload: Encodable {
    let orderId: Int
    let lat: Double
    let lng: Double
    let bearing: Double
    let timestamp: Int64

// MARK: - Map Annotation Helper
struct MapPin: Identifiable {
    let id: String
    let coord: CLLocationCoordinate2D
    let tint: Color
}
}
