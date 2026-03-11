# Customer App Setup Instructions

## 1. Prerequisites
- Node.js (v18+)
- Android Studio / Xcode
- React Native CLI or Expo (This project uses standard RN CLI)

## 2. Directory
Navigate to `apps/customer-app`

## 3. Install
```bash
npm install
```
*Note: Ensure `react-native-razorpay` is linked if on older RN versions.*

## 4. Run
**Android**:
```bash
npm run android
```

## 5. Environment
Update `src/services/api.ts` with your machine's IP address if using emulator (e.g., `http://10.0.2.2:3000` for Android).

## 6. Features Implemented
- **Auth**: OTP Login (Simulated)
- **Store**: Browse Stores & Products
- **Cart**: Add/Remove Items, Persistent State
- **Payment**: Native Razorpay SDK parameters passed from server.
