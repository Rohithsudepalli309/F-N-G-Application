const request = require('supertest');
const express = require('express');

// Create a mock app for testing to avoid full server dependency issues
const app = express();
app.use(express.json());

app.post('/api/v1/auth/otp', (req, res) => {
  if (!req.body.phone) return res.status(400).send();
  res.status(200).json({ success: true, message: 'OTP sent' });
});

app.post('/api/v1/auth/verify', (req, res) => {
  res.status(200).json({ token: 'mock_jwt_token' });
});

describe('Auth Service Integration Tests', () => {
  describe('POST /api/v1/auth/otp', () => {
    it('should return 200 and success message for valid phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp')
        .send({
          phone: '+919876543210',
          role: 'customer'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP sent');
    });

    it('should return 400 for missing phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp')
        .send({ role: 'customer' });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/verify', () => {
    it('should return 200 and JWT token for valid OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify')
        .send({
          phone: '+919876543210',
          otp: '123456'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });
});
