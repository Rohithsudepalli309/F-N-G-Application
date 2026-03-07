import SwiftUI
import MapKit

struct OrderDetailView: View {
    let order: AssignedOrder
    @EnvironmentObject var authStore: AuthStore
    @EnvironmentObject var orderStore: OrderStore
    @ObservedObject private var locationManager = LocationManager.shared
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 12.9716, longitude: 77.5946),
        span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02)
    )

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {

                // ── Map ─────────────────────────────────────────────────────
                Map(coordinateRegion: $region, showsUserLocation: true)
                    .frame(height: 240)
                    .cornerRadius(12)
                    .onAppear {
                        region.center = CLLocationCoordinate2D(
                            latitude: order.deliveryAddress.lat,
                            longitude: order.deliveryAddress.lng
                        )
                    }

                // ── Order Info ──────────────────────────────────────────────
                Group {
                    infoRow(icon: "number", title: "Order ID", value: String(order.id.prefix(8)))
                    infoRow(icon: "indianrupeesign.circle", title: "Amount", value: "₹\(order.totalAmount / 100)")
                    infoRow(icon: "mappin.and.ellipse", title: "Deliver To", value: order.deliveryAddress.text)
                    infoRow(icon: "clock", title: "Status", value: order.status.rawValue.capitalized)
                }
                .padding(.horizontal)

                // ── Action Buttons ──────────────────────────────────────────
                actionButtons
                    .padding()
            }
        }
        .navigationTitle("Order Detail")
        .navigationBarTitleDisplayMode(.inline)
    }

    @State private var deliveryOTP = ""
    @State private var isAccepting = false
    @State private var isRejecting = false

    @ViewBuilder
    private var actionButtons: some View {
        let isActive = orderStore.activeOrder?.id == order.id

        if isActive {
            // ── Secure Delivery OTP Input
            VStack(spacing: 12) {
                Text("Customer Delivery OTP")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                TextField("Enter 6-digit OTP", text: $deliveryOTP)
                    .keyboardType(.numberPad)
                    .font(.title2.bold().monospaced())
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                Button {
                    Task { await orderStore.completeOrder(order, otp: deliveryOTP) }
                } label: {
                    Label("Complete Delivery", systemImage: "checkmark.seal.fill")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(deliveryOTP.count == 6 ? Color.green : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .disabled(deliveryOTP.count != 6)
            }

        } else if order.status == .ready || order.status == .placed || order.status == .assigned {
            // ── Accept & Decline (only when no active order)
            VStack(spacing: 10) {
                Button {
                    Task {
                        isAccepting = true
                        await orderStore.acceptOrder(order)
                        isAccepting = false
                    }
                } label: {
                    Group {
                        if isAccepting {
                            ProgressView().tint(.white)
                        } else {
                            Label("Accept & Start Delivery", systemImage: "scooter")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(orderStore.activeOrder == nil ? Color.orange : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(orderStore.activeOrder != nil || isAccepting)

                Button {
                    Task {
                        isRejecting = true
                        await orderStore.rejectOrder(order)
                        isRejecting = false
                    }
                } label: {
                    Group {
                        if isRejecting {
                            ProgressView()
                        } else {
                            Label("Decline", systemImage: "xmark")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .foregroundColor(.primary)
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.red.opacity(0.45), lineWidth: 1))
                }
                .disabled(isRejecting)
            }

        } else {
            Text("No actions available for this order status.")
                .foregroundColor(.secondary)
                .font(.caption)
        }
    }

    private func infoRow(icon: String, title: String, value: String) -> some View {
        HStack(alignment: .top) {
            Image(systemName: icon).foregroundColor(.orange).frame(width: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.caption).foregroundColor(.secondary)
                Text(value).fontWeight(.medium)
            }
        }
    }
}
