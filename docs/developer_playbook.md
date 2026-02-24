# Developer's Playbook: Building Success

A strategic guide derived from the F&G Application build, designed to streamline future development and avoid common pitfalls.

---

## 🏗️ Phase 1: Environment Hardening
*Always verify these foundations before writing a single line of UI code.*

- **Standardize Java**: For React Native projects (v0.73 and below), ALWAYS use **JDK 17**. Newer versions (Java 21+) frequently break Gradle compatibility.
- **Android SDK Locking**: Do not blindly follow "Update Available" prompts in Android Studio. Identify the SDK version supported by your dependencies (like Maps) and lock it in `build.gradle`.
- **SSL Resilience**: If building behind a firewall or restricted network, prepare your `gradle.properties` with:
  ```properties
  systemProp.javax.net.ssl.trustStoreType=WINDOWS-ROOT
  android.suppressUnsupportedCompileSdk=35
  ```

---

## 🛠️ Phase 2: Dependency Strategy
*Avoid "Dependency Hell" by being proactive.*

- **Prefer bcryptjs**: In Node.js projects, use `bcryptjs` instead of `bcrypt`. It has zero native dependencies and won't crash your build during cross-platform deployment.
- **Global Resolution Rules**: When a sub-dependency forces a high SDK version (like `core:1.15.0`), use a Global Resolution Strategy in your root `build.gradle`:
  ```gradle
  allprojects {
      configurations.all {
          resolutionStrategy {
              force 'androidx.core:core:1.12.0'
          }
      }
  }
  ```
- **Clean Syncs**: If the IDE is reporting errors that don't match your terminal build, **Stop the Daemons**:
  ```powershell
  ./gradlew --stop; Stop-Process -Name java -Force
  ```

---

## 🎨 Phase 3: Visual Excellence
*User experience is built on micro-interactions.*

- **Skeleton Loaders**: Never show a blank white screen. Use `Animated.loop` to create pulsing skeleton cards while data is fetching.
- **Spring Physics**: Use `Animated.spring` for buttons. A subtle scale-down (0.95) on press makes an app feel physical and responsive.
- **Color Consistency**: Define a single source of truth for branding (e.g., `#FF5200`) and apply it across the app, chart fills, and login gradients.

---

## 🚀 Phase 4: Lifecycle & GitHub
*Safely managing your IP.*

- **Aggressive .gitignore**: Exclude `.npm-cache`, `.gradle`, and `.pnpm-store`. These add hundreds of useless megabytes to your repo.
- **Large Repo Pushing**: If Git times out, increase the post-buffer:
  ```bash
  git config http.postBuffer 524288000
  git config http.version HTTP/1.1
  ```
- **Segmented Pushing**: For giant projects, push folders one by one rather than everything at once. It’s safer and easier to debug.
