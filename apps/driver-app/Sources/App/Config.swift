import Foundation

/// Single source of truth for server addresses.
///
/// LOCAL DEVELOPMENT — update `devBaseURL` to match your machine:
///   Physical device (Wi-Fi): http://<your-LAN-IP>:3002
///   Physical device (USB):   http://127.0.0.1:3002  (after `iproxy 3002 3002`)
///   Simulator:               http://127.0.0.1:3002
///
/// PRODUCTION — set `prodBaseURL` to your deployed domain.
enum Config {
    // ← Change this to your dev machine's LAN IP
    private static let devBaseURL  = "http://192.168.221.78:3002"
    // ← Your production server
    private static let prodBaseURL = "https://api.fng.in"

    /// `true` when built with a Release configuration or when IS_PRODUCTION
    /// is set in the environment (e.g. CI/CD pipeline).
    static let isProduction: Bool = {
        if ProcessInfo.processInfo.environment["IS_PRODUCTION"] == "1" { return true }
        #if DEBUG
        return false
        #else
        return true
        #endif
    }()

    static var baseURL: URL {
        URL(string: isProduction ? prodBaseURL : devBaseURL)!
    }

    static var apiV1: URL {
        baseURL.appendingPathComponent("api/v1")
    }
}
