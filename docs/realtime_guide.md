# 🚀 Running your F&G Application in Real-Time

To experience the full "Food & Grocery" ecosystem with live price updates and real-time dashboard tracking, you need to have **three terminals** running simultaneously.

---

## 🟩 Step 1: Start the Backend (The Engine)
The backend manages the database and emits the live price updates via Socket.IO every 30 seconds.

1.  Open a terminal in `d:/MOBILE APPLICATION  DEV/F N G APPLICATION/backend`.
2.  Run:
    ```powershell
    pnpm dev
    ```
    *Wait for the message: `Server + WebSocket started on port 3000`.*

---

## 🟦 Step 2: Start the Admin Dashboard (The Nerve Center)
The dashboard allows you to manage stores and view real-time revenue stats.

1.  Open a new terminal in `d:/MOBILE_APPLICATION__DEV/F_N_G_APPLICATION/apps/admin-dashboard`.
2.  Run:
    ```powershell
    npx vite --host --port 5173
    ```
3.  **Open in Browser**: [http://localhost:5173](http://localhost:5173)
4.  **Login**: `admin1@gmail.com` / `admin`

---

## 🟧 Step 3: Start the Customer App (The Live Experience)
This is where you will see the **real-time price flashes** I built.

1.  Open a new terminal in `d:/MOBILE_APPLICATION__DEV/F_N_G_APPLICATION/apps/customer-app`.
2.  **Start Metro**:
    ```powershell
    ./start-metro.ps1
    ```
3.  **Launch the App**:
    *   Press `a` for Android Emulator.
    *   Press `i` for iOS Simulator.

---

## 🔥 How to verify "Real-Time" works:
1.  **Open the Store Screen** in the mobile app.
2.  **Watch the Product Prices**: Every 30 seconds, the backend triggers a price change.
3.  **Visual Proof**: You will see the price tags on the mobile screen flash **Green** (for a price drop) or **Red** (for a price increase) before fading back to normal.
4.  **Admin Proof**: Check the "Revenue" chart in the Admin Dashboard; it will update live as simulated orders are processed by the backend.

> [!TIP]
> Keep your **Backend Terminal** visible. You will see lines like `INFO: Price updates emitted` every time the real-time engine sends data to the apps.
