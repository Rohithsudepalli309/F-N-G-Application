import SwiftUI

@main
struct DriverApp: App {
    @StateObject private var authStore = AuthStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authStore)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var authStore: AuthStore

    var body: some View {
        Group {
            if authStore.isAuthenticated {
                OrderListView()
                    .environmentObject(authStore)
            } else {
                SplashAndAuthView()
                    .environmentObject(authStore)
            }
        }
        .animation(.easeInOut, value: authStore.isAuthenticated)
    }
}

struct SplashAndAuthView: View {
    @EnvironmentObject var authStore: AuthStore
    @State private var showLogin = false

    var body: some View {
        if showLogin {
            LoginView()
                .environmentObject(authStore)
        } else {
            // Splash
            VStack(spacing: 16) {
                Image(systemName: "scooter")
                    .font(.system(size: 100))
                    .foregroundColor(.orange)
                Text("FNG Delivery Partner")
                    .font(.title.bold())
                Text("Delivering moments, not just meals")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(.systemBackground))
            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                    withAnimation { showLogin = true }
                }
            }
        }
    }
}
