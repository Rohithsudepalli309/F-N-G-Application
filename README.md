# F&G — Food & Grocery Delivery Platform

A full-stack, real-time delivery platform built as a monorepo:  
**Node.js backend · React+Vite admin dashboard · React Native customer app · SwiftUI driver app**

---

## Architecture Overview

```
┌────────────────────┐     REST + WebSocket (Socket.IO)    ┌───────────────────────┐
│  Customer App      │ ◄──────────────────────────────────►│                       │
│  (React Native)    │                                      │   Node.js Backend     │
├────────────────────┤     REST                            │   Express + Postgres  │
│  Driver App        │ ◄──────────────────────────────────►│   + Socket.IO         │
│  (SwiftUI iOS)     │                                      │   + Razorpay          │
├────────────────────┤     REST + WebSocket                 │                       │
│  Admin Dashboard   │ ◄──────────────────────────────────►└───────────┬───────────┘
│  (React + Vite)    │                                                  │
└────────────────────┘                                       PostgreSQL │
                                                             (port 5432)│
```

---

## Repository Structure

```
F-N-G-APPLICATION/
├── backend/                 # Express API + Socket.IO
│   ├── src/
│   │   ├── app.js           # Express app entry
│   │   ├── config/
│   │   │   └── init_db.js   # Idempotent DB schema (15 tables)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── store.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── coupon.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── driver.routes.js
│   │   │   └── admin.routes.js
│   │   ├── services/
│   │   │   ├── analytics.service.js
│   │   │   └── notification.service.js
│   │   └── tests/
│   │       ├── auth.test.js
│   │       ├── payment.test.js
│   │       └── api.test.js   # Orders, Admin, Coupons
│   └── Dockerfile
├── apps/
│   ├── admin-dashboard/     # React + Vite + Tailwind + Recharts
│   │   ├── src/
│   │   │   ├── pages/       # Dashboard, Orders, Stores, Management, Analytics, Payouts, Settings
│   │   │   ├── services/    # apiClient (axios)
│   │   │   └── store/       # Zustand: useAuthStore
│   │   └── Dockerfile       # nginx:1.27-alpine
│   ├── customer-app/        # React Native (Android)
│   │   ├── src/
│   │   │   ├── screens/     # Onboarding, Home, Stores, Cart, Orders, Profile ...
│   │   │   ├── store/       # Zustand: useAuthStore, useCartStore, useOrderStore
│   │   │   ├── utils/
│   │   │   │   └── notifications.ts  # FCM stub (activate when ready)
│   │   │   └── theme/       # Typography, colors, spacing
│   │   └── android/
│   └── driver-app/          # SwiftUI (iOS)
│       └── Sources/
├── docker-compose.yml
└── build_docker.ps1
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18 LTS+ | Required for backend + admin |
| npm | 9+ | Used by all Node packages |
| PostgreSQL | 14 – 16 | Or use Docker Compose |
| Java JDK | 17 | Android builds (customer app) |
| Android Studio | Flamingo+ | Emulator or physical device |
| Xcode | 15+ | Driver app (macOS only) |
| Docker Desktop | 24+ | Optional — for containerised run |

---

## Quick Start

### Option A — Docker Compose (Recommended)

```bash
# 1. Clone
git clone https://github.com/Rohithsudepalli309/F-N-G-Application.git
cd F-N-G-Application

# 2. Create env file
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set RAZORPAY_KEY_ID and JWT_SECRET

# 3. Build & start (postgres + backend + admin dashboard)
docker-compose up --build

# Services:
#   Backend API  →  http://localhost:3000
#   Admin Panel  →  http://localhost:3001
```

### Option B — Local Development

#### Backend

```bash
cd backend
cp .env.example .env      # Fill in values (see Environment Variables below)
npm install
node src/config/init_db.js   # Creates all tables (idempotent)
npm run dev                  # nodemon src/app.js  →  http://localhost:3000
```

#### Admin Dashboard

```bash
cd apps/admin-dashboard
npm install
npm run dev                  # Vite dev server  →  http://localhost:5173
```

#### Customer App (Android)

```bash
cd apps/customer-app
npm install

# Start Metro bundler
npx react-native start

# In a second terminal
npx react-native run-android
```

---

## Environment Variables (`backend/.env`)

```dotenv
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/fng_db

# Auth
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret

# FCM (optional)
FCM_SERVER_KEY=your_fcm_server_key

# CORS
ADMIN_DASHBOARD_URL=http://localhost:3001
```

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/send-otp` | Send OTP to phone |
| POST | `/auth/verify-otp` | Verify OTP → JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/fcm-token` | Register FCM device token |

### Stores & Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stores` | List active stores (type, lat/lng, radius) |
| GET | `/stores/:id` | Store details |
| GET | `/products/:storeId` | Products for a store |
| GET | `/grocery/categories` | Grocery category list |
| GET | `/grocery/products` | Grocery products (category filter) |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create order |
| GET | `/orders` | My order history |
| GET | `/orders/:id` | Order detail + items |
| POST | `/orders/:id/cancel` | Cancel (pending/placed only) |
| POST | `/orders/:id/rate` | Rate completed order |

### Coupons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/coupons` | List active coupons |
| POST | `/coupons/validate` | Validate + get discount amount |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payment/create-order` | Create Razorpay order |
| POST | `/payment/webhook` | Razorpay webhook handler |

### Driver

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/driver/assignments` | My delivery assignments |
| PATCH | `/driver/assignments/:id` | Update delivery status |
| POST | `/driver/location` | Broadcast real-time location |

### Admin (JWT — admin role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | KPI counts + revenue |
| GET | `/admin/orders` | Paginated orders (status filter) |
| PATCH | `/admin/orders/:id/status` | Update status → emits Socket.IO + push |
| GET | `/admin/users` | Customer list |
| PATCH | `/admin/users/:id/status` | Toggle `is_active` |
| GET | `/admin/stores` | Store list |
| PATCH | `/admin/stores/:id` | Toggle `is_active` |
| GET | `/admin/analytics` | 7-day revenue + top stores |
| GET | `/admin/payouts` | Driver payout breakdown |
| POST | `/admin/coupons` | Create coupon |
| DELETE | `/admin/coupons/:id` | Deactivate coupon |

---

## Real-time Events (Socket.IO)

```javascript
// Customer: track order
socket.emit('join_order_room', orderId)

// Admin Dashboard
socket.emit('join_admin_room')

// Driver: broadcast location
socket.emit('join_driver_room', driverId)
socket.emit('driver_location', { driverId, lat, lng })
```

| Event | Room | Payload |
|-------|------|---------|
| `order_status_update` | `order_${id}` | `{ orderId, status, updatedAt }` |
| `order.platform.update` | `admin` | `{ orderId, status }` |
| `fleet.location.updated` | `admin` | `{ driverId, lat, lng, timestamp }` |

---

## Running Tests

```bash
cd backend
npm test                   # All suites

npx jest auth              # OTP auth tests
npx jest payment           # Payment webhook tests
npx jest api               # Orders + Admin + Coupons tests
```

---

## Docker Services

| Service | Image | Port |
|---------|-------|------|
| `postgres` | postgres:16-alpine | 5432 |
| `backend` | node:20-alpine | 3000 |
| `admin-dashboard` | nginx:1.27-alpine | 3001 |

```powershell
# PowerShell build helper (Windows)
.\build_docker.ps1
```

---

## Database Schema

15 tables managed by `backend/src/config/init_db.js` (auto-runs on startup):

`users` · `addresses` · `otps` · `stores` · `products` · `grocery_categories` ·  
`grocery_products` · `coupons` · `orders` · `order_items` · `order_assignments` ·  
`agent_locations` · `reviews` · `deliveries` · `notifications`

Full schema: [docs/database_schema.md](docs/database_schema.md)

---

## Feature Checklist

- [x] OTP-based phone authentication (JWT + refresh tokens)
- [x] Multi-type store browsing (restaurant / grocery / dark store)
- [x] Cart with store-conflict detection
- [x] Coupon validation with flat/percent discounts + caps
- [x] Razorpay payment integration (orders + webhooks)
- [x] Real-time order tracking via Socket.IO
- [x] Driver assignment + live location streaming
- [x] Admin dashboard — KPIs, orders, user/store management
- [x] Analytics — 7-day revenue chart, top stores, order heatmap
- [x] Driver payout calculations (10% platform commission)
- [x] FCM push notifications (stub — activate with `@rnfirebase`)
- [x] Docker Compose deployment
- [x] Integration test suite (auth, payments, orders, admin, coupons)

---

## Contributing

1. Fork → feature branch → PR to `main`
2. Run `npm test` in `backend/` before submitting
3. TypeScript must compile with 0 errors: `npx tsc --noEmit` in each app

---

## License

MIT © 2024 F&G Platform

**Repository maintained by [Rohithsudepalli309](https://github.com/Rohithsudepalli309)**
