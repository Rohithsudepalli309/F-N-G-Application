const http = require('http');
const express = require('express');
const { securitySetup } = require('./middleware/security');
const authRoutes = require('./routes/auth.routes');
const paymentRoutes = require('./routes/payment.routes');
const driverRoutes = require('./routes/driver.routes');
const catalogRoutes = require('./routes/catalog.routes');
const orderRoutes = require('./routes/order.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const addressRoutes = require('./routes/addresses.routes');
const couponRoutes = require('./routes/coupons.routes');
const searchRoutes = require('./routes/search.routes');
const groceryRoutes = require('./routes/grocery.routes');
const adminRoutes = require('./routes/admin.routes');
const { initSocketServer } = require('./services/socket.service');
const priceEngine = require('./services/priceEngine.service');
const { initDb } = require('./config/init_db');
const logger = require('./config/logger');
const env = require('./config/env');

// Initialize Database Schema
initDb().catch(err => {
  logger.error('Failed to initialize database:', err);
});

const app = express();
const httpServer = http.createServer(app);

// 1. Security & Middleware
securitySetup(app);
app.use(express.json());

// 2. REST Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/driver', driverRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/grocery', groceryRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', catalogRoutes); // /api/v1/stores + /api/v1/products

// 3. Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 4. initialize Socket.IO (attaches to same HTTP server)
const io = initSocketServer(httpServer);
priceEngine.init(io);

// 5. Make io available to routes (for broadcasting from REST handlers)
app.set('io', io);

// 6. Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// 7. Start
if (require.main === module) {
  const BIND_IP = '0.0.0.0'; // Bind to all interfaces for LAN access 
  httpServer.listen(env.PORT, BIND_IP, () => {
    logger.info(`Server + WebSocket running on ${BIND_IP}:${env.PORT} [${env.NODE_ENV}]`);
  });
}

module.exports = { app, httpServer, io };
