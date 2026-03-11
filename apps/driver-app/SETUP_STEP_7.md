# Driver App Setup Instructions (Step 7)

## Platform
- **iOS 15+**, SwiftUI, Xcode 15+

## 1. Open in Xcode
Create a new SwiftUI project and import the files from `apps/driver-app/Sources/`.

## 2. Swift Package Manager — Required Dependency
Add via Xcode → File → Add Package:
- **URL**: `https://github.com/socketio/socket.io-client-swift`
- **Product**: `SocketIO`
Then uncomment the SocketIO integration code in `SocketService.swift`.

## 3. Info.plist Keys (REQUIRED)
```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Delivery tracking requires always-on location.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>FNG needs location while delivering orders.</string>
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
</array>
```

## 4. Backend URL
Update `APIService.swift` and `SocketService.swift`:
```swift
// Replace with your server IP (use machine IP for device testing)
// Backend runs on port 3002
let base = URL(string: "http://YOUR_SERVER_IP:3002/api/v1")!
```

## 5. Screens Implemented
| Screen | File |
| :--- | :--- |
| Splash | `DriverApp.swift` |
| Login (Phone) | `LoginView.swift` |
| OTP Verify | `OTPView.swift` |
| Availability Toggle + Order List | `OrderListView.swift` |
| Incoming Order Sheet (30s timer) | `IncomingOrderSheet.swift` |
| Order Detail + Accept / Deliver | `OrderDetailView.swift` |

## 6. API Endpoints (backend)
| Method | Path | Description |
| :--- | :--- | :--- |
| POST | `/api/v1/auth/otp` | Request OTP for phone |
| POST | `/api/v1/auth/otp/verify` | Verify OTP → JWT (`accessToken`) |
| GET | `/api/v1/driver/orders` | Driver's assigned orders |
| POST | `/api/v1/driver/accept` | Accept an order `{ orderId }` |
| POST | `/api/v1/driver/reject` | Decline an order `{ orderId }` |
| POST | `/api/v1/driver/pickup` | Mark collected from store `{ orderId }` |
| POST | `/api/v1/driver/complete` | Deliver with OTP `{ orderId, otp }` |

## 7. Socket.IO Events
| Event | Direction | Description |
| :--- | :--- | :--- |
| `driver:location` | Driver → Server | GPS coordinates (every ~3 s) |
| `order.new_assignment` | Server → Driver | Push new order to nearby drivers |
| `order:status` | Server → Client Order Room | Status update broadcast |

## 8. Security Enforcement
- JWT stored in **Keychain** (not UserDefaults)
- Role `driver` validated before token save
- Location emitted via **Socket.IO ONLY** (no REST fallback)
- Speed sanity check: >120 km/h updates are silently rejected
- One active order at a time (enforced in `OrderStore`)
