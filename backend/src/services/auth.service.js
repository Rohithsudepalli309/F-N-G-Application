const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');
const { z } = require('zod');

// Input Validation Schemas
const signupSchema = z.object({
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  password: z.string().min(5), // Reduced for convenience during dev if needed, or keep at 8
  role: z.enum(['customer', 'merchant', 'driver', 'admin']),
  name: z.string().min(1)
}).refine(data => data.phone || data.email, {
  message: "Either phone or email must be provided"
});

const loginSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string()
}).refine(data => data.phone || data.email, {
  message: "Either phone or email must be provided"
});

class AuthService {
  // 1. Generate Tokens
  generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
  }

  // 2. Signup
  async signup(data) {
    let { phone, email, password, role, name } = signupSchema.parse(data);

    // Standardize for India (+91) if phone is present
    if (phone && phone.length === 10) {
      phone = `+91${phone}`;
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // DB Insert
    try {
      const result = await db.query(
        `INSERT INTO users (phone, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, role, name`,
        [phone || null, email || null, hashedPassword, role, name]
      );
      
      const user = result.rows[0];
      logger.info(`User registered: ${user.id} (${user.role})`);
      return this.generateTokens(user);
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        throw new Error('User already exists');
      }
      throw err;
    }
  }

  // 3. Login
  async login(data) {
    let { phone, email, password } = loginSchema.parse(data);

    let user;
    if (email) {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    } else if (phone) {
      // Standardize for India (+91)
      if (phone.length === 10) {
        phone = `+91${phone}`;
      }
      const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
      user = result.rows[0];
    }

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new Error('Invalid credentials');
    }

    logger.info(`User logged in: ${user.id}`);
    return {
      tokens: this.generateTokens(user),
      user: { id: user.id, name: user.name, role: user.role }
    };
  }

  // 4. OTP Mock (For MVP)
  async sendOtp(phone) {
    // In production, integrate SMS provider here.
    const otp = '123456'; // Fixed for tests
    logger.info(`OTP sent to ${phone}: ${otp}`);
    return { message: 'OTP sent', requestId: 'req_mock_123' };
  }
}

module.exports = new AuthService();
