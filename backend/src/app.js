const http = require('http');
const express = require('express');
const { securitySetup } = require('./middleware/security');
const authRoutes = require('./routes/auth.routes');
const paymentRoutes = require('./routes/payment.routes');
const driverRoutes = require('./routes/driver.routes');
const catalogRoutes = require('./routes/catalog.routes');
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
app.use('/api/v1', catalogRoutes); // Mounted as /api/v1/stores and /api/v1/products

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
  httpServer.listen(env.PORT, () => {
    logger.info(`Server + WebSocket running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

module.exports = { app, httpServer, io };
