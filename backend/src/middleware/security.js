const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 1. Rate Limiter (DDoS Protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit login attempts
  message: { error: 'Too many login attempts, please try again later.' }
});

// 2. Security Headers & CORS
const securitySetup = (app) => {
  app.use(helmet()); // Sets generic security headers
  app.use(cors({
    origin: '*', // Lock this down in production!
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature']
  }));
  app.use(globalLimiter);
};

module.exports = {
  securitySetup,
  authLimiter
};
