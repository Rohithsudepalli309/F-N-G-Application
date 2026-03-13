import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authStore: AuthStore
    @State private var profile: DriverProfile?
    @State private var isLoading = false
    @State private var showEdit = false
    @State private var editName = ""
    @State private var editVehicle = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading profile…")
                } else if let p = profile {
                    List {
                        Section("Account") {
                            row(icon: "person.fill", label: "Name", value: p.name)
                            row(icon: "phone.fill", label: "Phone", value: p.phone)
                        }
                        Section("Vehicle") {
                            row(icon: "scooter", label: "Vehicle Type", value: p.vehicleType.isEmpty ? "Not set" : p.vehicleType)
                        }
                        Section("Stats") {
                            row(icon: "box.truck.fill", label: "Total Deliveries", value: "\(p.totalDeliveries)")
                            row(icon: "circle.fill",   label: "Status",
                                value: p.isAvailable ? "Online" : "Offline",
                                valueColor: p.isAvailable ? .green : .red)
                        }
                        Section {
                            Button("Edit Profile") { startEdit(p) }
                                .foregroundColor(.orange)
                        }
                        Section {
                            Button("Log Out", role: .destructive) { authStore.logout() }
                        }
                    }
                } else {
                    Text("Profile not available")
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("My Profile")
            .task { await load() }
            .refreshable { await load() }
            .sheet(isPresented: $showEdit) {
                editSheet
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: { Text(errorMessage ?? "") }
        }
    }

    // MARK: - Edit Sheet

    private var editSheet: some View {
        NavigationStack {
            Form {
                Section("Display Name") {
                    TextField("Full Name", text: $editName)
                }
                Section("Vehicle Type") {
                    Picker("Vehicle", selection: $editVehicle) {
                        Text("Bicycle").tag("bicycle")
                        Text("Motorcycle").tag("motorcycle")
                        Text("Scooter").tag("scooter")
                        Text("Car").tag("car")
                        Text("Electric Bike").tag("ebike")
                    }
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showEdit = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await save() }
                    }
                    .disabled(isSaving)
                }
            }
        }
    }

    // MARK: - Helpers

    private func row(icon: String, label: String, value: String, valueColor: Color = .primary) -> some View {
        HStack {
            Image(systemName: icon).foregroundColor(.orange).frame(width: 24)
            Text(label).foregroundColor(.secondary)
            Spacer()
            Text(value).foregroundColor(valueColor).fontWeight(.medium)
        }
    }

    private func startEdit(_ p: DriverProfile) {
        editName    = p.name
        editVehicle = p.vehicleType
        showEdit    = true
    }

    // MARK: - Data

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            profile = try await APIService.shared.get("/driver/profile")
        } catch {
            errorMessage = "Could not load profile."
        }
    }

    private func save() async {
        isSaving = true
        defer { isSaving = false }
        do {
            struct Body: Encodable { let name: String; let vehicleType: String }
            struct Resp: Decodable  { let ok: Bool }
            let _: Resp = try await APIService.shared.post("/driver/profile", body: Body(name: editName, vehicleType: editVehicle))
            showEdit = false
            await load()
        } catch {
            errorMessage = "Could not save profile."
        }
    }
}
