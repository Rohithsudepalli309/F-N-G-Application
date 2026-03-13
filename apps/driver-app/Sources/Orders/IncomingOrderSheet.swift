import SwiftUI

/// Full-screen modal shown when the server pushes a new `order.new_assignment` event.
/// Auto-dismisses (treats as decline) after 30 seconds if the driver takes no action.
struct IncomingOrderSheet: View {
    let order: AssignedOrder
    let onAccept: () -> Void
    let onDecline: () -> Void

    @State private var timeRemaining = 30
    @State private var trimEnd: CGFloat = 1.0

    private let countdown = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                header

                ScrollView {
                    VStack(spacing: 20) {
                        timerRing
                        earningsBadges
                        routeCard
                        actionButtons
                    }
                    .padding(20)
                }
            }
        }
        .onReceive(countdown) { _ in
            if timeRemaining > 0 {
                timeRemaining -= 1
                withAnimation(.linear(duration: 1)) {
                    trimEnd = CGFloat(timeRemaining) / 30.0
                }
            } else {
                onDecline()
            }
        }
    }

    // MARK: - Sub-views

    private var header: some View {
        HStack(spacing: 10) {
            Image(systemName: "bell.badge.fill")
                .foregroundColor(.orange)
                .font(.title2)
            Text("New Delivery Request")
                .font(.title3.bold())
                .foregroundColor(.white)
            Spacer()
        }
        .padding()
        .background(Color.white.opacity(0.06))
    }

    private var timerRing: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.12), lineWidth: 7)
                .frame(width: 88, height: 88)
            Circle()
                .trim(from: 0, to: trimEnd)
                .stroke(
                    timeRemaining > 10 ? Color.orange : Color.red,
                    style: StrokeStyle(lineWidth: 7, lineCap: .round)
                )
                .frame(width: 88, height: 88)
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("\(timeRemaining)")
                    .font(.title2.bold())
                    .foregroundColor(.white)
                    .monospacedDigit()
                Text("sec")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }

    private var earningsBadges: some View {
        HStack(spacing: 12) {
            BadgeView(
                icon: "indianrupeesign.circle.fill",
                value: "₹\(order.driverPayout / 100)",
                color: .green,
                label: "Payout"
            )
            BadgeView(
                icon: "bag.fill",
                value: "\(order.itemCount)",
                color: .orange,
                label: "Items"
            )
            if order.estimatedKm > 0 {
                BadgeView(
                    icon: "road.lanes",
                    value: String(format: "%.1f km", order.estimatedKm),
                    color: .blue,
                    label: "Distance"
                )
            }
        }
    }

    private var routeCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Pickup row
            HStack(alignment: .top, spacing: 12) {
                VStack {
                    Circle().fill(Color.orange).frame(width: 10, height: 10)
                    Rectangle()
                        .fill(Color.white.opacity(0.2))
                        .frame(width: 2, height: 36)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("PICKUP")
                        .font(.caption2.uppercaseSmallCaps())
                        .foregroundColor(.secondary)
                    Text(order.storeName.isEmpty ? "FNG Store" : order.storeName)
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                    if !order.storeAddress.isEmpty {
                        Text(order.storeAddress)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }
                Spacer()
            }
            .padding(.horizontal)
            .padding(.top)

            // Delivery row
            HStack(alignment: .top, spacing: 12) {
                Circle().fill(Color.green).frame(width: 10, height: 10)
                VStack(alignment: .leading, spacing: 3) {
                    Text("DELIVER TO")
                        .font(.caption2.uppercaseSmallCaps())
                        .foregroundColor(.secondary)
                    let addr = order.deliveryAddress.displayText
                    Text(addr.isEmpty ? "Customer location" : addr)
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                        .lineLimit(2)
                }
                Spacer()
            }
            .padding(.horizontal)
            .padding(.bottom)
        }
        .background(Color.white.opacity(0.08))
        .cornerRadius(16)
    }

    private var actionButtons: some View {
        HStack(spacing: 14) {
            Button(action: onDecline) {
                Label("Decline", systemImage: "xmark")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .foregroundColor(.white)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.red.opacity(0.55), lineWidth: 1)
                    )
            }
            Button(action: onAccept) {
                Label("Accept", systemImage: "checkmark")
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .foregroundColor(.black)
                    .background(Color.orange)
                    .cornerRadius(14)
            }
        }
    }
}

// MARK: - Badge helper

private struct BadgeView: View {
    let icon: String
    let value: String
    let color: Color
    let label: String

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title2)
            Text(value)
                .font(.title3.bold())
                .foregroundColor(.white)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color.white.opacity(0.08))
        .cornerRadius(12)
    }
}
