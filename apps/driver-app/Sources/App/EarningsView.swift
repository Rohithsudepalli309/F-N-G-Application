import SwiftUI

struct EarningsView: View {
    @State private var period: String = "today"
    @State private var summary: EarningsSummary?
    @State private var history: [DeliveryHistoryItem] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    private let periods = [("today", "Today"), ("week", "7 Days"), ("month", "30 Days")]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // ── Period Picker ─────────────────────────────────────
                    Picker("Period", selection: $period) {
                        ForEach(periods, id: \.0) { p in
                            Text(p.1).tag(p.0)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)
                    .onChange(of: period) { _, _ in Task { await load() } }

                    // ── Stats Cards ────────────────────────────────────────
                    if let s = summary {
                        statsGrid(s)
                    } else if isLoading {
                        ProgressView("Loading earnings…").padding(.top, 40)
                    }

                    // ── Delivery History ───────────────────────────────────
                    if !history.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Recent Deliveries")
                                .font(.headline)
                                .padding(.horizontal)
                            ForEach(history) { item in
                                historyRow(item)
                            }
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Earnings")
            .task { await load() }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: { Text(errorMessage ?? "") }
        }
    }

    // MARK: - Stats

    private func statsGrid(_ s: EarningsSummary) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            statCard(title: "Payout", value: "₹\(s.totalPayout / 100)", icon: "indianrupeesign.circle.fill", color: .green)
            statCard(title: "Deliveries", value: "\(s.deliveries)", icon: "box.truck.fill", color: .orange)
            statCard(title: "Avg per Delivery", value: "₹\(s.avgPerDelivery / 100)", icon: "chart.bar.fill", color: .blue)
        }
        .padding(.horizontal)
    }

    private func statCard(title: String, value: String, icon: String, color: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(value)
                .font(.title2.bold())
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(14)
    }

    // MARK: - History Row

    private func historyRow(_ item: DeliveryHistoryItem) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(item.orderNumber)
                    .font(.subheadline.bold())
                Text(item.storeName)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 3) {
                Text("₹\(item.payout / 100)")
                    .font(.subheadline.bold())
                    .foregroundColor(.green)
                Text(formattedDate(item.deliveredAt))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
        .background(Color(.systemBackground))
    }

    // MARK: - Data

    private func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let resp: EarningsResponse = try await APIService.shared.get("/driver/earnings?period=\(period)")
            summary = resp.earnings
            history = resp.history ?? []
        } catch {
            errorMessage = "Could not load earnings. Check your connection."
        }
    }

    private func formattedDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: iso) else { return iso }
        let df = DateFormatter()
        df.dateStyle = .short
        df.timeStyle = .short
        return df.string(from: date)
    }
}
