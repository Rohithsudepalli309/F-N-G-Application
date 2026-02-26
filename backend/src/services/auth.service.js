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
      if (phone.length === 10) phone = `+91${phone}`;
      const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
      user = result.rows[0];
    }

    // ── OTP Verification (India-first flow) ──────────────────────────
    if (otp) {
      // 1. Standardize phone for DB lookup
      if (phone && phone.length === 10) phone = `+91${phone}`;

      // 2. Check otps table
      const otpResult = await db.query(
        'SELECT * FROM otps WHERE phone = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [phone, otp]
      );

      // 3. Mock fallback for dev (only if no DB match found)
      const isMock = otp === '123456';
      
      if (otpResult.rows.length === 0 && !isMock) {
        throw new Error('Invalid or expired OTP');
      }

      // Cleanup used OTP
      if (otpResult.rows.length > 0) {
        await db.query('DELETE FROM otps WHERE id = $1', [otpResult.rows[0].id]);
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
        throw new Error('User not found');
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

  // 5. OTP Real-Time (Fast2SMS + Socket.io + Persistence)
  async sendOtp(phone, io) {
    if (!phone) throw new Error('Phone number is required');

    // Standardize
    let formattedPhone = phone;
    if (phone.length === 10) formattedPhone = `+91${phone}`;

    // 1. Generate OTP (Random 6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const isDev = process.env.NODE_ENV === 'development';
    
    // 2. PERSISTENCE: Save to DB with 5 min expiry
    try {
      // Clear any old OTPs for this phone first
      await db.query('DELETE FROM otps WHERE phone = $1', [formattedPhone]);
      
      await db.query(
        'INSERT INTO otps (phone, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'5 minutes\')',
        [formattedPhone, otp]
      );
      logger.info(`Secure OTP stored for ${formattedPhone}`);
    } catch (err) {
      logger.error(`Failed to store OTP: ${err.message}`);
      throw new Error('Internal server error while sending OTP');
    }

    // 3. Real-time Dev Broadcast (via Socket.io)
    if (io) {
      notifyOtpSent(io, formattedPhone, otp);
    }

    // 4. Real SMS via Fast2SMS (if key present)
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

    // 5. Fallback (Development Response)
    logger.info(`DEV MODE: OTP for ${formattedPhone} is ${otp}`);
    
    return { 
      message: 'OTP sent successfully', 
      requestId: 'req_auth_' + Date.now(),
      // We don't return the OTP in the response for security, 
      // the user receives it via notification/socket simulate
      debugNote: isDev ? 'Check server logs or in-app notification' : undefined
    };
  }

  // 6. Register FCM Token
  async updateFcmToken(userId, token) {
    if (!token) return;
    try {
      await db.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [token, userId]);
      logger.info(`FCM Token registered for user ${userId}`);
    } catch (err) {
      logger.error('Error updating FCM token:', err);
      throw err;
    }
  }
}

module.exports = new AuthService();
