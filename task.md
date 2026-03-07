# Task: Build Real-time Food + Grocery Delivery Platform

## Step 7: Driver App (Completed) ✅
- [x] SwiftUI App Structure
- [x] Auth (Login, OTP, Keychain JWT)
- [x] LocationManager (throttle, anti-fraud)
- [x] SocketService (location emission only)
- [x] OrderStore + Order Screens

## Step 8: Admin Dashboard (Completed) ✅
- [x] React + Vite + Tailwind setup
- [x] LoginPage (JWT auth, useAuthStore)
- [x] Layout (sidebar nav, protected routes)
- [x] Dashboard (KPI cards, live map, charts)
- [x] OrdersMonitor (socket live-feed, table)
- [x] ManagementPage (users + stores CRUD, toggle active)
- [x] FleetManagement (driver cards, online status)
- [x] CouponsPage (create / deactivate coupons)
- [x] AnalyticsPage (revenue bars, top stores)
- [x] PayoutsPage (weekly/monthly driver earnings, CSV export)
- [x] Backend: all admin routes (stats, orders, users, stores, coupons, analytics, payouts)

## Step 9: Production Hardening & Deployment (Completed) ✅
- [x] `.env.example` — comprehensive root env template (DB, JWT, Razorpay, FCM, VITE)
- [x] `init_db.js` — idempotent schema includes `deliveries` table + `users.is_online`
- [x] Backend: `GET /admin/payouts` route returns per-driver earnings (gross, commission, net)
- [x] Backend: admin `PATCH /orders/:id/status` now emits socket event + push notification
- [x] Customer App: `registerFcmToken` utility (stub, wired to `login`; activate with `@rnfirebase`)
- [x] Analytics service: fixed `delivery_lat/lng` → `address_lat/lng` column references
- [x] ManagementPage: fixed response extraction (`data[type]`) + correct PATCH routes
- [x] TypeScript: **0 errors** in `customer-app` (fixed `fontFamily.medium` + `background` style)
- [x] TypeScript: **0 errors** in `admin-dashboard`

## Step 10: Integration Testing, README & Final Cleanup (Completed) ✅
- [x] `analytics.service.js` heatmap query: fixed `delivery_lat/lng` → `address_lat/lng` (second occurrence)
- [x] `.gitignore` updated — excludes `compose_logs.txt`, `docker_build_*.log`, `tsc_errors*.txt`, `bundle_err.txt`
- [x] `backend/src/tests/api.test.js` — new integration test suite (mock Express + supertest):
  - Orders: GET list, POST create (201), POST cancel (200 + 404)
  - Admin: GET stats (KPIs), GET orders (pagination + status filter), PATCH status, GET payouts (commission math)
  - Coupons: flat discount, percent+cap, invalid code, below-min-amount, missing params
  - Auth guards: 401 (no token), 403 (non-admin on admin routes)
- [x] `README.md` — complete overhaul: architecture diagram, prerequisites, Docker Compose + local dev guides,
      full API reference tables, Socket.IO events, feature checklist, test commands

## Step 11: Merchant Dashboard (Completed) ✅
- [x] `backend/src/config/init_db.js` — added `owner_id INTEGER REFERENCES users(id)` to `stores` table +
      idempotent `ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_id` for existing databases
- [x] `backend/src/routes/merchant.routes.js` — 10 protected endpoints:
  - `GET  /merchant/profile`
  - `GET  /merchant/orders` (paginated, filterable by status)
  - `PATCH /merchant/orders/:id/accept` → `preparing`, emits `order_status_update`
  - `PATCH /merchant/orders/:id/reject` → `cancelled`, emits `order_status_update`
  - `PATCH /merchant/orders/:id/ready`  → `ready`, emits `delivery:order_ready`
  - `GET  /merchant/menu`
  - `PATCH /merchant/products/:id/availability`
  - `PATCH /merchant/products/:id/stock`
  - `PATCH /merchant/store/toggle`
  - `GET  /merchant/analytics?period=week|month`
- [x] `backend/src/app.js` — registered `/api/v1/merchant` router
- [x] `apps/merchant-dashboard/` — full React 18 + Vite 5 + TypeScript + Tailwind 3 SPA (emerald theme, port 5174 / Docker 8081):
  - Config: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `index.html`, `nginx.conf`, `Dockerfile`
  - `src/styles/index.css` — Tailwind + custom `.card`, `.btn-primary`, `.btn-danger`, `.input`, `.badge`
  - `src/store/useAuthStore.ts` — Zustand persist (`merchant_auth`)
  - `src/services/api.ts` — Axios client with JWT interceptor
  - `src/services/socket.ts` — Socket.IO singleton
  - `src/components/Layout.tsx` — dark slate sidebar, emerald active indicators, mobile overlay
  - `src/pages/LoginPage.tsx` — email+password login, role-guard (merchant/admin only)
  - `src/pages/OrdersPage.tsx` — live socket feed, 7 status tabs, Accept / Reject / Ready actions
  - `src/pages/MenuPage.tsx` — product grid grouped by category, availability toggle, stock warning
  - `src/pages/AnalyticsPage.tsx` — KPI cards, revenue + orders bar charts (Recharts), top-products table
- [x] `docker-compose.yml` — added `merchant-dashboard` service (port 8081)
- [x] `.github/workflows/ci.yml` — added `merchant-dashboard-ci` build job

## Step 12: End-to-End Bug Fixes & F&G Pro Subscription (Completed) ✅

### Critical Backend Fixes
- [x] `backend/src/routes/order.routes.js` — `GET /orders/:id`: changed `JOIN stores` → `LEFT JOIN stores` so
      grocery orders (store_id NULL) no longer crash the endpoint. Added `FILTER (WHERE oi.id IS NOT NULL)` to
      `json_agg` to prevent null artefacts in the items array.
- [x] `backend/src/routes/order.routes.js` — `POST /orders/:id/rate`: complete rewrite to accept camelCase
      `{ foodRating, deliveryRating, comment, tags[] }` from mobile client (was expecting snake_case `rating` field
      which client never sent). Computes composite rating as average of sub-ratings. Stores `tags TEXT[]`.
      Only updates store's average rating when `store_id` is non-null (grocery orders have no store).
- [x] `backend/src/services/order.service.js` — `createOrder()` rewritten to be order-type aware:
      - Generates server-side order ID: `FNG-{FOOD|GRO}-{timestamp}-{rand}` (client no longer needs to send `id`)
      - Accepts `{ type, storeId?, items, totalAmount, deliveryFee?, address? }` — matches both food and grocery clients
      - Food path: `UPDATE products SET stock = stock - qty` + `INSERT order_items` with `product_id` FK
      - Grocery path: `UPDATE grocery_products SET stock_quantity - qty` (correct table) + `INSERT order_items`
        with `product_id = NULL` (no FK violation)

### Schema Hardening (idempotent migrations added to `init_db.js`)
- [x] `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE`
- [x] `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMP`
- [x] `ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'food'` + CHECK constraint
- [x] `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tags TEXT[]`
- [x] Version bumped: `v2 — full spec` → `v3 — grocery + review tags + pro membership`

### F&G Pro Subscription (new feature)
- [x] `backend/src/routes/pro.routes.js` — 3 new endpoints registered at `/api/v1/pro`:
      - `POST /subscribe`: validates planId (monthly/quarterly/annual), creates Razorpay order, returns order details
      - `POST /verify`: validates Razorpay HMAC signature, upgrades user `is_pro = TRUE` + sets `pro_expires_at`
      - `GET  /status`: returns current Pro status, auto-downgrades expired subscriptions on read
- [x] `backend/src/app.js` — registered `proRoutes` at `/api/v1/pro`
- [x] `apps/customer-app/src/screens/FngProScreen.tsx` — `handleSubscribe()` stub replaced with real flow:
      1. `POST /pro/subscribe` → get Razorpay order ID + amount
      2. Open `RazorpayCheckout.open()` with plan details
      3. `POST /pro/verify` → confirm payment + backend upgrade
      Handles user cancellation gracefully (Razorpay code 0) without showing an error alert.

### TypeScript
- [x] `customer-app` `tsc --noEmit` passes with **0 errors**

## Step 13: Missing Routes — Favorites, Payment Methods, Referrals & BuyAgain (Completed) ✅

### Problem
Gap analysis revealed four screens hitting non-existent backend routes plus three missing DB tables.

### DB Schema (init_db.js — v4)
- [x] `user_favorites` table — `(id, user_id FK, target_type CHECK('store'|'product'), target_id, created_at)`
      with `UNIQUE (user_id, target_type, target_id)` constraint
- [x] `payment_methods` table — `(id, user_id FK, type CHECK('upi'|'card'|'wallet'), identifier, provider, is_default, created_at)`
- [x] `referrals` table — `(id, referrer_id FK, referred_id FK, code, status CHECK('pending'|'completed'), coins_awarded, created_at)`
      with unique index on `referred_id` (each user can only be referred once)
- [x] `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(30)` — unique partial index for non-null codes
- [x] Version bumped: `v3` → `v4 — favorites + payment methods + referrals`

### Backend Fixes

**users.routes.js — `GET /users/favorites`** (was broken)
- [x] Rewrote SELECT to return full store shape: `cuisine_tags`, `rating`,
      `delivery_time_min AS delivery_time`, `is_active` via `COALESCE(s.name, p.name)` JOIN
- [x] `FavoritesScreen.tsx` interface `{ name, cuisine_tags, rating, delivery_time, image_url, is_active }` now satisfied

**New: `backend/src/routes/referrals.routes.js`**
- [x] `GET /referrals` — returns `{ code, totalInvites, successfulInvites, coinsEarned, pendingCoins }`;
      auto-generates a deterministic code (`FNG-{userId padded}`) and persists it if none exists
- [x] `POST /referrals/apply` — validates code, prevents self-referral + double-apply, inserts completed referral
      row with 50 coins awarded

**New: `backend/src/routes/payment_methods.routes.js`**
- [x] `GET /payment-methods` — lists user's saved methods ordered by `is_default DESC`
- [x] `POST /payment-methods` — inserts new method; atomically clears existing default if `is_default: true`
- [x] `DELETE /payment-methods/:id` — deletes by id + user_id guard (404 if not found or not owned)

**app.js — route registration**
- [x] `/api/v1/referrals` → `referrals.routes.js`
- [x] `/api/v1/payment-methods` → `payment_methods.routes.js`

### Frontend — BuyAgainScreen.tsx
- [x] Removed hardcoded `RECENT_ITEMS` mock array
- [x] Added `useEffect` → `GET /orders`, filters delivered orders, flattens `order_items` across all orders,
      deduplicates by item name (most-recent order wins), maps to `ProductCard`-compatible shape
      (fallback `image` = flaticon icon, `weight: ''`, `deliveryTime: '15 mins'`)
- [x] Loading spinner, error state with **Retry** button, empty-state message
- [x] TypeScript: **0 new errors** (`BuyAgainScreen.tsx` clean, pre-existing `HomeScreen` style issues unchanged)

## Step 14: Navigation Bug Fixes, TypeScript Cleanup & DB Schema Completion (Completed) ✅

### Navigation Bugs Fixed

**`OrderConfirmedScreen.tsx` + `OrderReviewScreen.tsx`** — `CommonActions.reset`
- [x] Both screens were reset-navigating to `'MainTabs'` which does not exist in the RootStack
      (actual name is `'Main'`). Fixed both to `CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })`

**`SettingsScreen.tsx`** — Broken catch-all navigation
- [x] All 10 menu items (orders, profile, addresses, support, payment, rewards, notifications, gift, suggest, info)
      now navigate to the correct ProfileStack screen:
      - `support / gift / suggest / info` → `HelpSupport`
      - `payment` → `PaymentMethods`
      - `notifications` → `Notifications`
      - `rewards` → `FngPro`
      - `addresses` → `SavedAddresses` (was wrongly sending to `LocationSelect`)
      - `orders` → `OrdersTab`
      - `profile` → `ProfileMain`

**`ProfileScreen.tsx`** — Cross-stack BuyAgain navigation
- [x] `navigate('BuyAgain')` → `navigate('HomeTab', { screen: 'BuyAgain' })` — BuyAgain only exists
      inside HomeStack, cross-stack navigation required

### TypeScript Cleanup

**`apps/customer-app/src/store/tests/useAuthStore.test.ts`**
- [x] Removed `state.setToken` calls (property never existed in `AuthState`). Tests now use
      `login()` / `logout()` which are the actual store actions. `tsc --noEmit` → **0 errors**

### DB Schema Completion (init_db.js — v5)

**`backend/src/config/init_db.js`**
- [x] Added missing `transactions` table (was referenced in version comment but never created):
      `(id, user_id FK, order_id FK, razorpay_order_id, razorpay_payment_id, razorpay_signature,
       amount, currency, status CHECK('pending'|'success'|'failed'|'refunded'), method, created_at)`
      + indexes on `user_id` and `order_id`

**`backend/src/services/payment.service.js`**
- [x] `createOrder()` INSERT now includes `user_id` column (was only inserting `order_id, razorpay_order_id,
      amount, status`) — transaction ledger now records the paying user
- [x] Status CHECK aligned with service values: `'success'` (was `'paid'` in schema but `'success'` in code)
