const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');
const { z } = require('zod');
const { notifyOtpSent } = require('./socket.service');

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
  password: z.string().optional(),
  otp: z.string().optional()
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
      return {
        tokens: this.generateTokens(user),
        user: { id: user.id, name: user.name, role: user.role, address: user.address }
      };
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        throw new Error('User already exists');
      }
      throw err;
    }
  }

  // 3. Login
  async login(data) {
    let { phone, email, password, otp } = loginSchema.parse(data);

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

    // OTP Verification (Mock for dev)
    if (otp) {
      if (otp !== '123456') {
        throw new Error('Invalid OTP');
      }
      
      // AUTO-REGISTRATION: If user doesn't exist, create them
      if (!user && phone) {
        logger.info(`Auto-registering new phone user: ${phone}`);
        const signupResult = await db.query(
          `INSERT INTO users (phone, role, name) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (phone) DO UPDATE SET role = EXCLUDED.role
           RETURNING id, role, name`,
          [phone, 'customer', 'New User']
        );
        user = signupResult.rows[0];
      } else if (!user) {
        throw new Error('User not found and no phone provided for auto-registration');
      }
    } else if (password) {
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new Error('Invalid credentials');
      }
    } else {
      throw new Error('Either password or OTP is required');
    }

    logger.info(`User logged in: ${user.id}`);
    return {
      tokens: this.generateTokens(user),
      user: { id: user.id, name: user.name, role: user.role, address: user.address }
    };
  }

  // 4. Update Profile
  async updateProfile(userId, data) {
    const { name, email, address } = data;
    
    // Dynamically build update query
    const fields = [];
    const values = [];
    let idx = 1;

    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (email) { fields.push(`email = $${idx++}`); values.push(email); }
    if (address) { fields.push(`address = $${idx++}`); values.push(address); }

    if (fields.length === 0) return { message: 'No changes' };

    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, name, email, role, address`;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // 5. OTP Real-Time (Fast2SMS + Socket.io)
  async sendOtp(phone, io) {
    if (!phone) throw new Error('Phone number is required');

    // Standardize
    let formattedPhone = phone;
    if (phone.length === 10) formattedPhone = `+91${phone}`;

    // 1. Generate OTP (Random 6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const isDev = process.env.NODE_ENV === 'development';
    
    // 2. Real-time Dev Broadcast (via Socket.io)
    if (io) {
      notifyOtpSent(io, formattedPhone, otp);
    }

    // 3. Real SMS via Fast2SMS (if key present)
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (apiKey && !isDev) {
      try {
        const response = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${otp}&numbers=${phone.replace('+91', '')}`);
        const data = await response.json();
        if (!data.return) {
          logger.error(`Fast2SMS Error: ${data.message}`);
        } else {
          logger.info(`Real SMS sent to ${formattedPhone}`);
          return { message: 'OTP sent to mobile', requestId: data.request_id };
        }
      } catch (err) {
        logger.error(`SMS Provider failure: ${err.message}`);
      }
    }

    // 4. Fallback (Development)
    const dummyOtp = '123456'; 
    logger.info(`DEV MODE: OTP for ${formattedPhone} is ${otp} (Mock: ${dummyOtp})`);
    
    return { 
      message: 'OTP sent (Debug Mode)', 
      requestId: 'req_dev_' + Date.now(),
      // In dev, we can actually return it for easier testing if needed, 
      // but usually we check logs or socket
      debugOtp: otp 
    };
  }
}

module.exports = new AuthService();
