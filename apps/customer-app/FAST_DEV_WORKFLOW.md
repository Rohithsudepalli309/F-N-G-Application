# Fast React Native Android Workflow (FNG)

Use this when Expo Go is not suitable and you need real native-module behavior.

## Terminal A (keep running)

```bash
cd apps/customer-app
npm run dev:metro
```

## Terminal B (run once per install/build)

```bash
cd apps/customer-app
npm run dev:android
```

## Terminal C (optional logs)

```bash
cd apps/customer-app
npm run dev:logs
```

## Rules for speed

1. Keep Terminal A open all the time.
2. Do not rerun full Android build after every small UI change.
3. Save files for Fast Refresh.
4. Rebuild (`npm run dev:android`) only when native deps/config changed.
5. Ensure one emulator/device is connected (`adb devices`) before running Android build.

## If no device is detected

- Start an emulator from Android Studio Device Manager, or
- Connect phone with USB debugging enabled.
