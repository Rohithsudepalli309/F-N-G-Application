---

# Customer App Native Reconstruction

This plan outlines the steps to restore the missing native Android folders and entry points for the `customer-app`, allowing it to be built and run on an emulator.

## Proposed Changes

### [Component Name] Customer App (React Native)

#### [NEW] [index.js](file:///d:/MOBILE%20APPLICATION%20%20DEV/F%20N%20G%20APPLICATION/apps/customer-app/index.js)
- Entry point for React Native.
- Registers the main component with `AppRegistry`.

#### [NEW] [App.tsx](file:///d:/MOBILE%20APPLICATION%20%20DEV/F%20N%20G%20APPLICATION/apps/customer-app/App.tsx)
- Main application component.
- Wraps `AppNavigator` and provides necessary contexts (if any).

#### [NEW] [app.json](file:///d:/MOBILE%20APPLICATION%20%20DEV/F%20N%20G%20APPLICATION/apps/customer-app/app.json)
- Configuration for React Native metadata (name, displayName).

#### [NEW] [android/](file:///d:/MOBILE%20APPLICATION%20%20DEV/F%20N%20G%20APPLICATION/apps/customer-app/android/)
- Complete native Android project structure.
- Generated using `react-native init` template and customized for `customer-app`.

## Verification Plan

### Automated Tests
- Run `pnpm start` in `apps/customer-app` to verify Metro bundler starts without configuration errors.

---

# Gradle SSL/PKIX Error Resolution

This plan addresses the `sun.security.validator.ValidatorException: PKIX path building failed` error during the Android build.

## Proposed Changes

### [Component Name] Android Build Configuration

#### [MODIFY] [gradle.properties](file:///d:/MOBILE%20APPLICATION%20%20DEV/F%20N%20G%20APPLICATION/apps/customer-app/android/gradle.properties)
- Add `systemProp.javax.net.ssl.trustStoreType=WINDOWS-ROOT` to use the Windows native truststore.

#### [FIX] Dependency Version Stabilization
- Revert `compileSdkVersion` and `targetSdkVersion` to 34.
- Force `androidx.core:core-ktx:1.12.0` (compatible with SDK 34).
- Downgrade `react-native-maps` to `1.10.0` (stable for RN 0.73).
- Suppress SDK 35 compatibility warnings in `gradle.properties`.

#### [FIX] JDK 17 Requirement
- Standardize on JDK 17 (Microsoft Build) to resolve `Unsupported class file major version 67` error caused by Java 23.
- Set `org.gradle.java.home` in `gradle.properties`.

## Verification Plan

### Manual Verification
### Manual Verification
- Run `gradlew help` in `apps/customer-app/android` to verify that Gradle can resolve dependencies without crashing or SSL errors.
- Sync project in Android Studio to clear any cached IDE errors.

---

# GitHub Repository Setup

This plan covers the secure initialization and push of the codebase to a new GitHub repository.

## Proposed Changes

### [Component Name] Version Control

#### [NEW] [.gitignore](file:///d:/MOBILE%20APPLICATION%20%20DEV/F%20N%20G%20APPLICATION/.gitignore)
- Comprehensive root gitignore to exclude `node_modules`, `.env`, build folders, and IDE settings.

## Verification Plan

### Manual Verification
- Verify that the new repository exists on `github.com/Rohithsudepalli309`.
- Verify that sensitive files are NOT present in the repository.
