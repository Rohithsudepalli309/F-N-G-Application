const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../config/logger');
const db = require('../config/db');

// In-memory rate limiting for location updates
const locationUpdateTracker = new Map(); // driverId -> { count, windowStart }
const RATE_LIMIT_MAX = 60;   // max 60 emissions per 60 seconds
const RATE_LIMIT_WINDOW = 60 * 1000;

function isRateLimited(driverId) {
  const now = Date.now();
  const record = locationUpdateTracker.get(driverId) || { count: 0, windowStart: now };
  if (now - record.windowStart > RATE_LIMIT_WINDOW) {
    locationUpdateTracker.set(driverId, { count: 1, windowStart: now });
    return false;
  }
  if (record.count >= RATE_LIMIT_MAX) return true;
  locationUpdateTracker.set(driverId, { count: record.count + 1, windowStart: record.windowStart });
  return false;
}

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket'],
  });

  // ─── 1. SOCKET MIDDLEWARE (Soft Auth) ────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        socket.user = decoded; // { id, role }
        socket.authenticated = true;
      } catch (err) {
        logger.warn(`Socket token invalid: ${err.message}`);
        socket.authenticated = false;
      }
    } else {
      socket.authenticated = false;
    }
    
    // We allow connection, but sub-handlers must check socket.authenticated
    next();
  });

  // ─── 2. CONNECTION HANDLER ────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userLog = socket.user 
      ? `(user: ${socket.user.id}, role: ${socket.user.role})`
      : '(unauthenticated)';
    logger.info(`Socket connected: ${socket.id} ${userLog}`);

    // ── 2a. CUSTOMER: Subscribe to their order ──────────────────────────
    socket.on('subscribe_order', async ({ orderId }) => {
      if (!socket.authenticated) {
        return socket.emit('error', { message: 'Authentication required' });
      }
      if (!orderId) return socket.emit('error', { message: 'orderId required' });

      // Validate: customer must own this order
      if (socket.user.role === 'customer') {
        try {
          const result = await db.query(
            'SELECT id FROM orders WHERE id = $1 AND customer_id = $2',
            [orderId, socket.user.id]
          );
          if (result.rows.length === 0) {
            logger.warn(`Unauthorized order subscription attempt by ${socket.user.id}`);
            socket.emit('error', { message: 'Access denied' });
            return socket.disconnect(true);
          }
        } catch (err) {
          logger.error('DB error on subscribe_order:', err);
          return socket.emit('error', { message: 'Server error' });
        }
      }

      const room = `order:${orderId}`;
      socket.join(room);
      logger.info(`${socket.user.id} joined room ${room}`);
      socket.emit('subscribed', { room, orderId });
    });

      // ── 2b. DRIVER: Emit location update ────────────────────────────────
    socket.on('driver.location.emit', async ({ orderId, lat, lng, bearing, timestamp }) => {
      if (!socket.authenticated) {
        return socket.emit('error', { message: 'Authentication required' });
      }
      // SECURITY: Only drivers allowed
      if (socket.user.role !== 'driver') {
        logger.warn(`Non-driver ${socket.user.id} tried to emit location`);
        return socket.disconnect(true);
      }

      // Rate limiting
      if (isRateLimited(socket.user.id)) {
        return socket.emit('error', { message: 'Rate limit exceeded for location updates' });
      }

      // Validate driver is assigned to this order
      try {
        const result = await db.query(
          'SELECT id FROM deliveries WHERE order_id = $1 AND driver_id = $2',
          [orderId, socket.user.id]
        );
        if (result.rows.length === 0) {
          logger.warn(`Driver ${socket.user.id} not assigned to order ${orderId}`);
          return socket.emit('error', { message: 'Not assigned to this order' });
        }
      } catch (err) {
        logger.error('DB error on driver.location.emit:', err);
        return;
      }

      // Valid payload only
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return socket.emit('error', { message: 'Invalid payload' });
      }

      // Broadcast sanitized update to order room (customers listening)
      const room = `order:${orderId}`;
      const payload = { 
        orderId, 
        driverId: socket.user.id,
        timestamp: timestamp || Date.now(),
        payload: { lat, lng, bearing: bearing || 0 }
      };

      io.to(room).emit('driver.location.updated', payload);
      
      // Also broadcast to admin room for fleet tracking
      io.to('admin').emit('fleet.location.updated', payload);
    });

    // ── 2c. ADMIN: Join admin room ──────────────────────────────────────
    if (socket.authenticated && socket.user.role === 'admin') {
      socket.join('admin');
      logger.info(`Admin ${socket.user.id} joined admin management room`);
    }

    // ── 2d. Disconnect ───────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} reason: ${reason}`);
    });
  });

  return io;
}

// ─── 3. SERVER-SIDE BROADCAST HELPERS (called from OrderService) ─────────────
function notifyOrderStatus(io, orderId, status) {
  io.to(`order:${orderId}`).emit('order.status.updated', {
    orderId,
    timestamp: Date.now(),
    payload: { status },
  });
}

function notifyOrderCompleted(io, orderId) {
  io.to(`order:${orderId}`).emit('order.completed', {
    orderId,
    timestamp: Date.now(),
    payload: { message: 'Your order has been delivered!' },
  });
}

function notifyOtpSent(io, phone, otp) {
  // Broadcase to a special 'dev:otp' room for real-time dev visibility
  io.emit('dev:otp', { phone, otp, timestamp: Date.now() });
}

module.exports = { initSocketServer, notifyOrderStatus, notifyOrderCompleted, notifyOtpSent };
