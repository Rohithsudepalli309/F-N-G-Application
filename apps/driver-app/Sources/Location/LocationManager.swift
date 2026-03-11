import Foundation
import CoreLocation
import Combine

/// Manages background location updates with:
///  - 3-second throttle
///  - Speed sanity check (rejects teleports > 120 km/h)
///  - Publishes location only when actively assigned an order
final class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    static let shared = LocationManager()

    private let locationManager = CLLocationManager()
    @Published var currentLocation: CLLocationCoordinate2D?
    @Published var heading: Double = 0
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined

    var activeOrderId: String?          // Set when driver accepts an order
    private var lastEmitTime: Date = .distantPast
    private var lastLocation: CLLocation?
    private let emitInterval: TimeInterval = 3  // seconds
    private let maxSpeedKmh: Double = 120       // sanity limit

    weak var socketService: SocketService?

    override private init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 5          // meters
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.allowsBackgroundLocationUpdates = true // requires ± background mode
        locationManager.showsBackgroundLocationIndicator = true
    }

    func requestPermissions() {
        locationManager.requestAlwaysAuthorization()
    }

    func startTracking() {
        guard authorizationStatus == .authorizedAlways else { return }
        locationManager.startUpdatingLocation()
        locationManager.startUpdatingHeading()
    }

    func stopTracking() {
        locationManager.stopUpdatingLocation()
        locationManager.stopUpdatingHeading()
        activeOrderId = nil
    }

    // MARK: - Delegate
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        heading = newHeading.trueHeading
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last,
              let orderId = activeOrderId else { return }

        // ── Throttle ─────────────────────────────────────────────────────
        let now = Date()
        guard now.timeIntervalSince(lastEmitTime) >= emitInterval else { return }

        // ── Speed Sanity Check (fraud / GPS jump prevention) ─────────────
        if let prev = lastLocation {
            let elapsed = location.timestamp.timeIntervalSince(prev.timestamp)
            let distanceM = location.distance(from: prev)
            let speedKmh = (distanceM / elapsed) * 3.6
            if speedKmh > maxSpeedKmh {
                // Reject impossible teleport
                return
            }
        }

        lastEmitTime = now
        lastLocation = location
        currentLocation = location.coordinate

        // ── Emit via Socket ONLY ──────────────────────────────────────────
        let payload = LocationPayload(
            orderId: orderId,
            lat: location.coordinate.latitude,
            lng: location.coordinate.longitude,
            bearing: heading,
            timestamp: Int64(now.timeIntervalSince1970 * 1000)
        )
        socketService?.emitLocation(payload)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("[LocationManager] Error: \(error.localizedDescription)")
    }
}
