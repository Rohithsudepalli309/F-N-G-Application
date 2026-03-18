# F&G Application

A full-stack **Food & Grocery** delivery platform built as a monorepo.

```
Customer (React Native Android/iOS)
  └─► Backend (Node.js / Express / Socket.IO)
        ├─► PostgreSQL 16
        ├─► Admin Dashboard  (React / Vite)
        └─► Merchant Dashboard (React / Vite)

Driver App (SwiftUI iOS)  ──────────────────►  Backend (Socket.IO)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js 20, Express 4, TypeScript 5 |
| Database | PostgreSQL 16 |
| Real-time | Socket.IO 4 |
| Admin Dashboard | React 18, Vite, Tailwind CSS, Recharts, Leaflet |
| Merchant Dashboard | React 18, Vite, Tailwind CSS, Recharts |
| Customer App | React Native 0.74, Zustand, React Navigation 6 |
| Driver App | SwiftUI (iOS 15+), Keychain, Socket.IO-Client-Swift |
| Container | Docker, Docker Compose |

---

## Quick Start — Docker Compose

> **Requires:** Docker Desktop 24+

```bash
# 1. Clone the repo
git clone https://github.com/Rohithsudepalli309/F-N-G-Application.git
cd "F-N-G-Application"

# 2. Set your secrets (copy the example and edit)
cp .env.example .env
# Edit .env → set a strong JWT_SECRET

# 3. Bring up all services
docker compose up -d

# 4. Open the dashboards
#    Admin:    http://localhost:8080   (admin@fng.app / Admin@123)
#    Merchant: http://localhost:8081
#    Backend:  http://localhost:3002/health
```

On **first boot** PostgreSQL auto-runs all SQL files in `backend/src/migrations/`
via the Docker entrypoint — no manual migration step needed.

If you pull new changes with additional migrations, run:

```bash
docker compose exec backend node migrate.js
```

To seed demo data (optional):

```bash
docker compose exec backend npx ts-node-dev --transpile-only src/seed.ts
```

---

## Local Development (without Docker)

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| PostgreSQL | 15 or 16 |
| Android Studio + JDK 17 | (customer app Android) |
| Xcode 15+ | (customer app iOS / driver app) |

---

### 1 · Backend

```bash
cd backend
cp .env.example .env          # fill in DATABASE_URL and JWT_SECRET
npm install
npm run dev                   # http://localhost:3002
```

Run the schema migration once against a fresh database:

```bash
# psql -U fng_user -d fng_db -f src/migrations/001_schema.sql
# or via npm script:
npm run migrate
```

Seed default admin + demo data:

```bash
npm run seed
```

Run integration tests (requires PostgreSQL + Redis running):

```bash
cd backend
npm test
```

Default admin credentials after seeding:

| Field | Value |
|---|---|
| Email | admin@fng.app |
| Password | Admin@123 |

---

### 2 · Admin Dashboard

```bash
cd apps/admin-dashboard
pnpm install
pnpm dev                      # http://localhost:5173
```

Set the API base URL (optional — defaults to `http://localhost:3002/api/v1`):

```bash
VITE_API_URL=http://localhost:3002/api/v1 pnpm dev
```

---

### 3 · Merchant Dashboard

```bash
cd apps/merchant-dashboard
pnpm install
pnpm dev                      # http://localhost:5174
```

---

### 4 · Customer App (React Native)

```bash
cd apps/customer-app
pnpm install

# Android
npx react-native run-android

# iOS (macOS only)
npx pod-install ios
npx react-native run-ios
```

Update the API base URL in `src/services/api.ts` to your machine's IP when
testing on a physical device.

#### Windows reliable preview workflow

When UI changes do not appear on the emulator, use this command from `apps/customer-app`:

```bash
npm run dev:refresh
```

What it does automatically:

- Kills stale process on Metro port `8081`
- Starts Metro and waits until `packager-status:running`
- Re-applies `adb reverse` for `8081` and `3002`
- Reinstalls debug APK and relaunches `MainActivity`

After this, future UI edits should appear with Dev Menu -> Reload (or press `r` in Metro terminal).

#### Realtime rendering across the app (Fast Refresh)

Use this for day-to-day UI development from `apps/customer-app`:

```bash
npm run dev:live
```

What `dev:live` does:

- Ensures backend is running on `3002`
- Starts emulator if not running
- Starts Metro on `8081` (without `--reset-cache`)
- Re-applies `adb reverse` for `8081` and `3002`
- Installs app only if missing, then launches app

Use `npm run dev:refresh` only when updates appear stale, Metro is broken, or port `8081` is stuck.

---

### 5 · Driver App (Swift)

1. Open Xcode and create a new SwiftUI project.
2. Drag in all files from `apps/driver-app/Sources/`.
3. Add the Socket.IO package via **File → Add Package**:
   `https://github.com/socketio/socket.io-client-swift`
4. Add the required `Info.plist` keys (location & background modes) — see
   `apps/driver-app/SETUP_STEP_7.md`.
5. Update the backend URL in `APIService.swift` and `SocketService.swift`.

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32-char random secret |
| `PORT` | – | Default `3002` |
| `NODE_ENV` | – | `development` or `production` |
| `ALLOWED_ORIGINS` | ✅ prod | Comma-separated CORS origins — **required in production** |
| `DATABASE_SSL` | – | `true` for hosted PG (Supabase, RDS) |
| `DATABASE_SSL_CA` | – | Root CA certificate PEM for hosted PG (see below) |
| `RAZORPAY_KEY_ID` | – | Razorpay payment key |
| `RAZORPAY_KEY_SECRET` | – | Razorpay payment secret |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ prod | Razorpay webhook HMAC secret — **required in production** |

### Root `.env` (Docker Compose overrides)

| Variable | Description |
|---|---|
| `JWT_SECRET` | Overrides the secret used inside the backend container |

---

## API Routes (backend)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/send-otp` | – | Send OTP to phone |
| POST | `/api/v1/auth/verify-otp` | – | Verify OTP, return JWT |
| POST | `/api/v1/auth/admin/login` | – | Admin email/password login |
| GET | `/api/v1/stores` | – | List stores |
| GET | `/api/v1/orders` | JWT | Customer orders |
| POST | `/api/v1/orders` | JWT | Place new order |
| GET | `/api/v1/merchant/orders` | JWT (merchant) | Merchant order list |
| GET | `/api/v1/admin/stats` | JWT (admin) | Platform KPI stats |
| GET | `/api/v1/analytics/stats` | JWT (admin) | Analytics data |
| GET | `/health` | – | Health check |

Full route listing: `backend/src/routes/`

---

## Real-Time Events (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `join_order` | Client → Server | Subscribe to an order room |
| `order_status` | Server → Client | Order status update |
| `driver_location` | Driver → Server | GPS coordinate push |
| `driver_location` | Server → Merchant/Admin | Broadcast driver position |
| `new_order` | Server → Driver | Incoming order notification |

---

## Project Structure

```
.
├── docker-compose.yml
├── .env.example                  # Root secrets for Docker Compose
├── apps/
│   ├── admin-dashboard/          # React + Vite (port 5173 / Docker 8080)
│   ├── merchant-dashboard/       # React + Vite (port 5174 / Docker 8081)
│   ├── customer-app/             # React Native (Android & iOS)
│   └── driver-app/               # SwiftUI (iOS 15+)
└── backend/
    ├── src/
    │   ├── server.ts             # Express entry (port 3002)
    │   ├── socket.ts             # Socket.IO handlers
    │   ├── db.ts                 # pg Pool
    │   ├── routes/               # auth, stores, orders, merchant, admin …
    │   ├── middleware/auth.ts    # JWT middleware
    │   ├── migrations/           # 001_schema.sql
    │   └── seed.ts               # Demo seed data
    ├── Dockerfile
    └── .env.example
```

---

## Release Gate Policy (Main Branch)

Pull requests to `main` must pass CI and release-gate checks before merge.

### Required status checks

Configure GitHub branch protection for `main` to require these checks:

- `Backend - type-check, test & build`
- `Admin Dashboard - type-check, test & build`
- `Merchant Dashboard - type-check, test & build`
- `Customer App - type-check`
- `Release Gate - required checks`

The `E2E - Playwright smoke` job is conditionally executed when dashboard or `tests/` paths change.
Its result is validated by `Release Gate - required checks`, which allows `e2e=skipped` for unrelated changes and fails on `failure` or `cancelled`.

### Flaky-test and rerun policy

- If E2E fails once, rerun the failed job once.
- If it fails again, treat it as a real blocker and fix before merge.
- Do not bypass required checks for convenience.

### Branch protection checklist

1. Open repository `Settings -> Branches -> Add rule`.
2. Branch name pattern: `main`.
3. Enable `Require a pull request before merging`.
4. Enable `Require status checks to pass before merging`.
5. Select all required checks listed above.
6. Enable `Require branches to be up to date before merging`.

---

## Ports Reference

| Service | Local | Docker |
|---|---|---|
| Backend | 3002 | 3002 |
| PostgreSQL | 5432 | 5432 |
| Admin Dashboard | 5173 | 8080 |
| Merchant Dashboard | 5174 | 8081 |

---

## Scripts Reference

### Backend
```bash
npm run dev       # ts-node-dev hot reload
npm run build     # tsc → dist/
npm run start     # node dist/server.js
npm run migrate   # run 001_schema.sql on connected DB
npm run seed      # insert demo data
```

### Admin / Merchant Dashboards
```bash
pnpm dev          # Vite dev server
pnpm build        # TypeScript check + Vite build
pnpm preview      # Serve the production build locally
```

### Customer App
```bash
npx react-native start           # Metro bundler
npx react-native run-android     # Build and install on Android
npx react-native run-ios         # Build and install on iOS (macOS only)
```

---

## Production Deployment

### Required environment variables

Before going live, ensure these are set in your production environment (Railway,
Render, Fly.io, EC2, etc.):

```
NODE_ENV=production
JWT_SECRET=<random 32+ char string>          # openssl rand -hex 32
ALLOWED_ORIGINS=https://admin.yourdomain.com,https://merchant.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_SSL=true
DATABASE_SSL_CA=<root CA PEM — see below>
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<webhook secret from Razorpay dashboard>
```

### Setting up `DATABASE_SSL_CA` (Supabase / AWS RDS)

Hosted Postgres providers require you to verify their TLS certificate using
their root CA. Steps:

**Supabase**
1. Dashboard → Settings → Database → scroll to *SSL Certificate* → Download.
2. Flatten the PEM to a single line:
   ```bash
   awk 'NF {ORS="\\n"; print}' supabase-ca.pem
   ```
3. Set the output as the `DATABASE_SSL_CA` environment variable.

**AWS RDS**
1. Download the regional bundle from AWS:
   ```bash
   curl -o rds-ca.pem https://truststore.pki.rds.amazonaws.com/<region>/<region>-bundle.pem
   ```
2. Flatten and set:
   ```bash
   awk 'NF {ORS="\\n"; print}' rds-ca.pem
   ```

The value you set will look like:
```
DATABASE_SSL_CA=-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----
```

The backend automatically converts `\n` back to real newlines before passing
the certificate to `node-postgres`.

> If your provider uses a CA that Node.js already trusts (e.g. Let's Encrypt),
> leave `DATABASE_SSL_CA` empty — `rejectUnauthorized: true` will still verify
> the server certificate using Node's built-in CA bundle.

### Running database migrations

Run all migrations in order against your production database:

```bash
psql $DATABASE_URL -f backend/src/migrations/001_schema.sql
psql $DATABASE_URL -f backend/src/migrations/002_wallet_surge.sql
psql $DATABASE_URL -f backend/src/migrations/003_notifications_favourites_referrals_pro.sql
psql $DATABASE_URL -f backend/src/migrations/004_sub_category.sql
psql $DATABASE_URL -f backend/src/migrations/005_addresses_v2.sql
psql $DATABASE_URL -f backend/src/migrations/006_security_hardening.sql
```

---

## Contributing

1. Fork the repo and create a feature branch.
2. Follow the TypeScript strict (`noImplicitAny`, `strictNullChecks`) rules — **0 errors enforced**.
3. Keep commits small and scoped.
4. Open a pull request — CI will run type-check + build on all apps.
