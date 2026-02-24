# Setup Instructions - Step 4 (Backend)

## 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (v16+)
- Razorpay Account (Test Mode)

## 2. Install Dependencies
Navigate to `backend/` and run:
```bash
npm install
```

## 3. Environment Variables
Create a `.env` file in `backend/` with the following secrets:

```env
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fng_db

# Auth Secrets (Generate random 32+ char strings)
JWT_SECRET=replace_with_secure_random_string_32_chars
JWT_REFRESH_SECRET=replace_with_secure_random_string_refresh_32_chars

# Razorpay (From Dashboard)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

## 4. Database Setup
Run the SQL from `../docs/database_schema.md` in your PostgreSQL instance to create the tables.

## 5. Run Server
```bash
npm run dev
```

## 6. Verify
- Health: `GET http://localhost:3000/health`
- Auth: `POST http://localhost:3000/api/v1/auth/signup`
