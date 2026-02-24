import SwiftUI

struct OTPView: View {
    let phone: String
    @EnvironmentObject var authStore: AuthStore
    @State private var otp = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "lock.shield")
                .font(.system(size: 64))
                .foregroundColor(.orange)

            Text("Enter OTP")
                .font(.largeTitle.bold())

            Text("Sent to \(phone)")
                .foregroundColor(.secondary)

            TextField("6-digit OTP", text: $otp)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .font(.system(size: 32, weight: .bold, design: .monospaced))
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .padding(.horizontal)

            if let error = errorMessage {
                Text(error).foregroundColor(.red).font(.caption)
            }

            Button(action: verifyOTP) {
                if isLoading {
                    ProgressView().tint(.white)
                } else {
                    Text("Verify & Login")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding()
            .background(otp.count == 6 ? Color.orange : Color.gray)
            .foregroundColor(.white)
            .cornerRadius(12)
            .padding(.horizontal)
            .disabled(otp.count != 6 || isLoading)

            Spacer()
        }
    }

    private func verifyOTP() {
        isLoading = true
        errorMessage = nil
        Task {
            do {
                struct LoginRequest: Encodable { let phone: String; let otp: String }
                let response: AuthResponse = try await APIService.shared.post(
                    "/auth/login",
                    body: LoginRequest(phone: phone, otp: otp)
                )
                // AuthStore validates role = "driver" before storing token
                await MainActor.run { authStore.login(token: response.token, user: response.user) }
            } catch {
                await MainActor.run { errorMessage = "Invalid OTP, please try again" }
            }
            await MainActor.run { isLoading = false }
        }
    }
}
