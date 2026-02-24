import Foundation
import Combine

/// Single source of truth for auth state.
/// Observes force-logout notifications for auto-logout on 401.
@MainActor
final class AuthStore: ObservableObject {
    @Published var isAuthenticated = false
    @Published var driver: DriverUser?

    private var cancellables = Set<AnyCancellable>()

    init() {
        // Restore session from Keychain on cold start
        if KeychainManager.loadToken() != nil {
            isAuthenticated = true
        }
        // Listen for forced logout (401 from any API call)
        NotificationCenter.default
            .publisher(for: .driverForceLogout)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.logout() }
            .store(in: &cancellables)
    }

    func login(token: String, user: DriverUser) {
        guard user.role == "driver" else {
            // SECURITY: reject non-driver tokens
            return
        }
        KeychainManager.saveToken(token)
        self.driver = user
        self.isAuthenticated = true
    }

    func logout() {
        KeychainManager.deleteToken()
        driver = nil
        isAuthenticated = false
    }
}
