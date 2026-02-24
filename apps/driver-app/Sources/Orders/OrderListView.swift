import SwiftUI

struct OrderListView: View {
    @EnvironmentObject var authStore: AuthStore
    @StateObject private var orderStore = OrderStore()
    @State private var isOnline = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // ── Availability Toggle ────────────────────────────────────
                availabilityBar

                // ── Active Order Banner ────────────────────────────────────
                if let active = orderStore.activeOrder {
                    activeOrderBanner(active)
                }

                // ── Order List ─────────────────────────────────────────────
                if orderStore.isLoading {
                    ProgressView("Fetching orders…").padding()
                } else if orderStore.orders.isEmpty {
                    ContentUnavailableView(
                        "No Orders",
                        systemImage: "tray",
                        description: Text("New deliveries will appear here")
                    )
                } else {
                    List(orderStore.orders) { order in
                        NavigationLink(destination: OrderDetailView(order: order)
                            .environmentObject(authStore)
                            .environmentObject(orderStore)
                        ) {
                            OrderRowView(order: order)
                        }
                    }
                    .listStyle(.plain)
                    .refreshable { await orderStore.fetchOrders() }
                }
            }
            .navigationTitle("Deliveries")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Logout") { authStore.logout() }
                        .foregroundColor(.red)
                }
            }
            .task { await orderStore.fetchOrders() }
            .alert("Error", isPresented: .constant(orderStore.errorMessage != nil)) {
                Button("OK") { orderStore.errorMessage = nil }
            } message: {
                Text(orderStore.errorMessage ?? "")
            }
        }
    }

    // ── Sub-views ──────────────────────────────────────────────────────────
    private var availabilityBar: some View {
        HStack {
            Text(isOnline ? "🟢 Online" : "🔴 Offline")
                .fontWeight(.semibold)
            Spacer()
            Toggle("", isOn: $isOnline)
                .tint(.orange)
                .onChange(of: isOnline) { _, online in
                    if online {
                        LocationManager.shared.requestPermissions()
                        if let token = KeychainManager.loadToken() {
                            SocketService.shared.connect(token: token)
                        }
                    } else {
                        SocketService.shared.disconnect()
                        LocationManager.shared.stopTracking()
                    }
                }
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.systemGray6))
    }

    private func activeOrderBanner(_ order: AssignedOrder) -> some View {
        HStack {
            Image(systemName: "scooter").foregroundColor(.orange)
            Text("Active: #\(order.id.prefix(8))").fontWeight(.semibold)
            Spacer()
            Text(order.status.rawValue.capitalized)
                .font(.caption).foregroundColor(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.15))
    }
}

struct OrderRowView: View {
    let order: AssignedOrder
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Order #\(order.id.prefix(8))")
                    .fontWeight(.bold)
                Spacer()
                StatusBadge(status: order.status)
            }
            Text(order.deliveryAddress.text)
                .font(.caption)
                .foregroundColor(.secondary)
            Text("₹\(order.totalAmount / 100)")
                .font(.caption)
                .foregroundColor(.green)
        }
        .padding(.vertical, 4)
    }
}

struct StatusBadge: View {
    let status: OrderStatus
    var body: some View {
        Text(status.rawValue.capitalized)
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color(for: status))
            .foregroundColor(.white)
            .cornerRadius(8)
    }

    private func color(for status: OrderStatus) -> Color {
        switch status {
        case .ready:     return .blue
        case .pickup:    return .orange
        case .delivered: return .green
        case .cancelled: return .red
        default:         return .gray
        }
    }
}
