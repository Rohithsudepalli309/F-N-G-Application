const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../config/logger');

// 1. Authenticate Token Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Token verification failed: ${err.message}`);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // { id: '...', role: '...' }
    next();
  });
};

// 2. Role-Based Access Control (RBAC)
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'User not authenticated' });

    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}. Required: ${roles}`);
      return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
