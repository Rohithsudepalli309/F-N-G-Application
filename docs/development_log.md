# F&G Application: Development Log

A detailed chronological record of the application's building process, technical challenges, and resolutions.

---

## 📅 Initial Phase: UI/UX & Backend Core

### **Milestone: Modernizing the Aesthetics**
- **Admin Dashboard**: Implemented a "Sleek Professional" design system using Tailwind CSS. Added custom animations, KPI card accents, and real-time status indicators.
- **Customer App**: Redesigned the mobile interface for a premium feel. Added "Login Hero" animations, spring-press interactions, and skeleton loaders to replace static loading states.

### **Milestone: Backend Authentication Overhaul**
- **Security Upgrade**: Replaced native `bcrypt` with `bcryptjs` to avoid binary compilation issues in the local environment.
- **Data Seeding**: Created `init_db.js` and `seed_admin.js` to automate PostgreSQL schema creation and admin user provisioning.

---

## 🛠️ Recovery Phase: Native Reconstruction

### **Challenge: Missing Android Source**
- **Discovery**: The `apps/customer-app` was missing its native `android` and `ios` project folders, making it impossible to build.
- **Resolution**: Successfully reconstructed the native wrappers. Connected existing React Native source code (`src/`, `App.tsx`, `index.js`) to the new native project structure.

---

## 🏗️ Build Phase: The "Stubborn" Gradle Debugging

### **Challenge: Gradle SSL/PKIX Handshake Failures**
- **Problem**: Gradle was unable to download dependencies due to SSL certificate verification issues (`ValidatorException`).
- **Solution 1 (Config)**: Added `javax.net.ssl.trustStoreType=WINDOWS-ROOT` to use the native Windows truststore.
- **Solution 2 (Aggressive)**: Forced HTTP repositories and injected JVM arguments to bypass insecure certificate checks in local development.

### **Challenge: Java Compatibility "BUG!"**
- **Problem**: Gradle 8.3 was crashing with "Unsupported class file major version 67" because the system was running Java 23.
- **Resolution**: Identified **JDK 17** as the stable requirement for React Native 0.73.6. Forced `org.gradle.java.home` in `gradle.properties` to use the Microsoft Build of OpenJDK 17.

---

## 📦 Stabilization Phase: Dependency Conflicts

### **Challenge: Android SDK 35 Incompatibility**
- **Problem**: Upgrading to SDK 35 (to satisfy `core-ktx`) broke `react-native-maps` native compilation due to missing `UIBlockViewResolver`.
- **Final Resolution**: 
    1. Reverted and locked project to **Android SDK 34**.
    2. Implemented a Global `resolutionStrategy` in the root `build.gradle` to force `androidx.core:core:1.12.0` (which does NOT require SDK 35).
    3. Downgraded `react-native-maps` to **v1.10.0** for perfect compatibility with RN 0.73.6.

---

## 🚀 Lifecycle Phase: GitHub & Handover

### **Milestone: Secure Repository Migration**
- **Challenge**: Initial push of 147MB timed out consistently.
- **Resolution**: 
    1. Optimized repository size by excluding `node_modules` and heavy `.npm-cache` folders in `.gitignore`.
    2. Implemented a **Segmented Push** (4 Phases: Backend → Dashboards → Source → Native) to guarantee success.
- **Visibility**: Repository successfully finalized as **PUBLIC** at [Rohithsudepalli309/F-N-G-Application](https://github.com/Rohithsudepalli309/F-N-G-Application).

### **Challenge: IDE Sync Error (com.android.tools.build:gradle:null)**
- **Problem**: The IDE (Android Studio) was failing to sync because the Android Gradle Plugin (AGP) version was missing in the classpath line of the root build.gradle.
- **Resolution**: Explicitly set the AGP version to **8.1.1** (stable for RN 0.73.6). This allowed the IDE to resolve task dependencies successfully.
