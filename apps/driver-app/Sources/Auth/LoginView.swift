import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authStore: AuthStore
    @State private var phone = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var navigateToOTP = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "scooter")
                    .font(.system(size: 72))
                    .foregroundColor(.orange)

                Text("Driver Login")
                    .font(.largeTitle.bold())

                Text("Enter your registered phone number")
                    .foregroundColor(.secondary)

                TextField("+91 99999 99999", text: $phone)
                    .keyboardType(.phonePad)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .padding(.horizontal)

                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }

                Button(action: sendOTP) {
                    if isLoading {
                        ProgressView().tint(.white)
                    } else {
                        Text("Send OTP")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding()
                .background(phone.count >= 10 ? Color.orange : Color.gray)
                .foregroundColor(.white)
                .cornerRadius(12)
                .padding(.horizontal)
                .disabled(phone.count < 10 || isLoading)

                Spacer()
            }
            .navigationDestination(isPresented: $navigateToOTP) {
                OTPView(phone: phone)
                    .environmentObject(authStore)
            }
        }
    }

    private func sendOTP() {
        isLoading = true
        errorMessage = nil
        Task {
            do {
                struct OTPRequest: Encodable { let phone: String; let role: String }
                struct OTPResponse: Decodable { let message: String }
                let _: OTPResponse = try await APIService.shared.post(
                    "/auth/otp",
                    body: OTPRequest(phone: phone, role: "driver")
                )
                await MainActor.run { navigateToOTP = true }
            } catch {
                await MainActor.run { errorMessage = "Failed to send OTP" }
            }
            await MainActor.run { isLoading = false }
        }
    }
}
