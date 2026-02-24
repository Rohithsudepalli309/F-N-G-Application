# F&G Mobile Application — Visual Design Preview

Since I cannot generate a live video of the mobile device, I have prepared this **high-fidelity design specification** to show you exactly how the new overhauled screens look and behave.

---

## 🔐 1. Branded Login Screen
The login experience has been transformed from a plain form to a **premium branded entry**.

| Element | Visual Behavior | Implementation Highlight |
| :--- | :--- | :--- |
| **Hero Background** | Vibrant Orange (#FF5200) covering top 38% of screen | `StyleSheet: { height: height * 0.38, backgroundColor: '#FF5200' }` |
| **Floating Logo** | A🛒 logo that gently floats up and down in a loop | `Easing.inOut(Easing.ease)` with `Animated.loop` |
| **Form Entry** | White card with rounded corners that slides up from the bottom | `Animated.timing` on screen mount |
| **Button** | Branded orange button with **Spring Bounce** on interaction | `Animated.spring` for a tactile "clicky" feel |

> [!NOTE]
> **Check out the code**: [LoginScreen.tsx](file:///d:/MOBILE%20APPLICATION%20%20DEV/F%20N%20G%20APPLICATION/apps/customer-app/src/screens/LoginScreen.tsx)

---

## 🏠 2. Dynamic Home Screen
The main dashboard now feels "alive" even while data is still loading.

### 🔄 Performance Fix
I fixed the **Duplicate Fetch Bug**. Previously, the app made two requests on every load. Now, it uses a single, clean effect with a "cancel" flag.

### 💀 Skeleton Loaders (New!)
Instead of a blank screen, users now see **pulsing grey cards** that represent the store shapes while images are being retrieved.
```typescript
// Skeleton Pulse Logic
Animated.loop(
  Animated.sequence([
    Animated.timing(opacity, { toValue: 0.3, duration: 800 }),
    Animated.timing(opacity, { toValue: 0.7, duration: 800 })
  ])
).start();
```

---

## 🛍️ 3. "Live" Store Screen
This screen now includes real-time feedback when prices change on the server.

### ⚡ Price Flash Animation
When a price update arrives via the Socket.IO engine:
- If price **drops**: The background of the price tag flashes **Green** softly and fades back.
- If price **rises**: The background flashes **Red**.

### 🛒 Floating Cart Fix
I resolved the issue where the "View Cart" bar would cover the last product in the list. I added a `contentContainerStyle` with bottom padding exactly matching the bar height.

---

## 🏗️ Design System Upgrade
I have standardized the following across all mobile screens:
- **Primary Color**: `#FF5200` (F&G Brand Orange)
- **Secondary Color**: `#FF8C00` (Gradient Accent)
- **Typography**: Clean, bold headers with secondary info in subtle grey.
- **Interactions**: Every button now uses a spring-scale animation for haptic feedback.

**You can see all these screens in action by running the Metro bundler (`./start-metro.ps1`).**
