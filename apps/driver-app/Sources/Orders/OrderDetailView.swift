import SwiftUI
import MapKit

struct OrderDetailView: View {
    let order: AssignedOrder
    @EnvironmentObject var authStore: AuthStore
    @EnvironmentObject var orderStore: OrderStore
    @ObservedObject private var locationManager = LocationManager.shared
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 17.385044, longitude: 78.486671),
        span: MKCoordinateSpan(latitudeDelta: 0.06, longitudeDelta: 0.06)
    )

    // Delivery coords (may be zero if customer didn't have GPS)
    private var deliveryCoord: CLLocationCoordinate2D? {
        guard let lat = order.deliveryAddress.lat, let lng = order.deliveryAddress.lng,
              lat != 0, lng != 0 else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {

                // ── Map ─────────────────────────────────────────────────────
                Map(coordinateRegion: $region, showsUserLocation: true, annotationItems: mapAnnotations) { ann in
                    MapMarker(coordinate: ann.coord, tint: ann.tint)
                }
                .frame(height: 240)
                .cornerRadius(12)
                .onAppear { centreMap() }

                // ── Order Info ──────────────────────────────────────────────
                Group {
                    infoRow(icon: "number",              title: "Order #", value: order.orderNumber)
                    infoRow(icon: "storefront",          title: "Pick Up",  value: order.storeName)
                    infoRow(icon: "mappin.and.ellipse",  title: "Deliver To", value: order.deliveryAddress.displayText)
                    infoRow(icon: "indianrupeesign.circle", title: "Amount",  value: "₹\(order.totalAmount / 100)")
                    if order.estimatedKm > 0 {
                        infoRow(icon: "road.lanes",      title: "Distance", value: String(format: "%.1f km", order.estimatedKm))
                    }
                    infoRow(icon: "clock",               title: "Status",  value: order.status.rawValue.capitalized)
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

    // Build annotation list for the map
    private var mapAnnotations: [MapPin] {
        var pins: [MapPin] = []
        if order.storeLat != 0, order.storeLng != 0 {
            pins.append(MapPin(id: "store", coord:
                CLLocationCoordinate2D(latitude: order.storeLat, longitude: order.storeLng), tint: .blue))
        }
        if let dc = deliveryCoord {
            pins.append(MapPin(id: "delivery", coord: dc, tint: .red))
        }
        return pins
    }

    private func centreMap() {
        if let dc = deliveryCoord {
            region.center = dc
        } else if order.storeLat != 0 {
            region.center = CLLocationCoordinate2D(latitude: order.storeLat, longitude: order.storeLng)
        }
    }

    @State private var deliveryOTP = ""
    @State private var isAccepting = false
    @State private var isRejecting = false
    @State private var isPickingUp = false

    @ViewBuilder
    private var actionButtons: some View {
        let isActive      = orderStore.activeOrder?.id == order.id
        let currentStatus = orderStore.activeOrder?.status ?? order.status

        if isActive && currentStatus == .outForDelivery {
            // ── Phase 2: En-route — show OTP completion only
            VStack(spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "scooter")
                        .foregroundColor(.orange)
                    Text("On the way · Enter OTP to complete")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
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

        } else if isActive && (currentStatus == .assigned || currentStatus == .pickup) {
            // ── Phase 1: Head to store — show Picked Up button
            VStack(spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "bag.fill")
                        .foregroundColor(.blue)
                    Text("Collect the order from the store, then tap below")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.bottom, 4)

                Button {
                    Task {
                        isPickingUp = true
                        await orderStore.pickupOrder(order)
                        isPickingUp = false
                    }
                } label: {
                    Group {
                        if isPickingUp {
                            ProgressView().tint(.white)
                        } else {
                            Label("Order Picked Up", systemImage: "bag.fill.badge.plus")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isPickingUp)
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
