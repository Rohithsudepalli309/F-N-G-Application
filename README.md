# F&G Retail Application 🛒🔥

A comprehensive multi-platform retail ecosystem featuring an Admin Dashboard, a Customer Mobile App, and a robust Backend service with real-time price synchronization.

---

## 🏗️ Project Structure

- **`apps/admin-dashboard`**: A React + Vite + Tailwind CSS dashboard for managing orders, catalog, and monitoring system health.
- **`apps/customer-app`**: A React Native mobile application for customers with real-time price updates and smooth UI/UX.
- **`backend`**: Node.js service powered by PostgreSQL and Socket.io for real-time data streaming and secure authentication.
- **`docs`**: Detailed system architecture, development logs, and technical playbooks.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (Standardized for stability)
- **Java**: JDK 17 (Microsoft Build of OpenJDK)
- **Database**: PostgreSQL (Ensure `fng_db` is created)

### 2. Installation
```powershell
# Install dependencies for the entire workspace
pnpm install
```

### 3. Running the Apps
- **Backend**: `cd backend; npm start`
- **Admin**: `cd apps/admin-dashboard; npm run dev`
- **Mobile**: `cd apps/customer-app; pnpm android` (Ensure emulator is running)

---

## 📚 Documentation
- **[Development Log](docs/development_log.md)**: A "Time to Time" record of the building process and bug resolutions.
- **[Developer Playbook](docs/developer_playbook.md)**: Technical best practices and guides for future builds.
- **[System Architecture](docs/system_architecture.md)**: Deep dive into the backend and real-time engine.

## 🏆 Key Features
- **Real-time Price Flash**: Prices light up green/red when changed via WebSocket.
- **Segmented Push Strategy**: Optimized for large repository stability.
- **Advanced Auth**: Secure JWT-based login using `bcryptjs`.

---

## 🛡️ Security
This project uses an optimized `.gitignore` to protect sensitive data. Never commit your `.env` files.

**Repository maintained by [Rohithsudepalli309](https://github.com/Rohithsudepalli309)**
