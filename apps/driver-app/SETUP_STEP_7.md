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
let base = URL(string: "http://YOUR_SERVER_IP:3000/api/v1")!
```

## 5. Screens Implemented
| Screen | File |
| :--- | :--- |
| Splash | `DriverApp.swift` |
| Login (Phone) | `LoginView.swift` |
| OTP Verify | `OTPView.swift` |
| Availability Toggle + Order List | `OrderListView.swift` |
| Order Detail + Accept / Deliver | `OrderDetailView.swift` |

## 6. Security Enforcement
- JWT stored in **Keychain** (not UserDefaults)
- Role `driver` validated before token save
- Location emitted via **Socket.IO ONLY** (no REST fallback)
- Speed sanity check: >120 km/h updates are silently rejected
- One active order at a time (enforced in `OrderStore`)
