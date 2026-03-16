# F and G Customer App (Expo Preview)

This folder is an Expo managed app for fast device preview without native SDK builds.

## Run on your phone (Expo Go)

1. Install Expo Go on your phone.
2. In a terminal:

```bash
cd apps/customer-app-expo
npm run start
```

If you hit port conflicts, use the stable launcher:

```bash
npm run start:stable
```

This command frees common Metro/Expo ports (8081-8084) and starts Expo tunnel on fixed port 8081.

3. Scan the QR code shown in the terminal or Expo DevTools.
4. Keep VS Code open and edit App.tsx.
5. Save and watch the app reload on your phone instantly.

## Useful commands

```bash
npm run start
npm run start:tunnel
npm run start:stable
npm run android
npm run ios
npm run web
```

## Notes

- This is a managed Expo workflow path for rapid UI iteration.
- The existing native React Native app remains in apps/customer-app.
- If you want full feature parity in Expo, native-only dependencies from the legacy app must be replaced with Expo-compatible alternatives.
