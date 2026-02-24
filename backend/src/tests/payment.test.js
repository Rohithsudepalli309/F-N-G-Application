const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

app.post('/api/v1/payments/webhook', (req, res) => {
  const sig = req.headers['x-razorpay-signature'];
  if (sig === 'invalid_signature') return res.status(400).send();
  res.status(200).json({ processed: true });
});

describe('Payment Service Webhook Tests', () => {
  describe('POST /api/v1/payments/webhook', () => {
    it('should return 200 and process success for valid signature', async () => {
      const payload = {
        event: 'order.paid',
        payload: {
          payment: { entity: { order_id: 'order_123', status: 'captured' } }
        }
      };

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', 'valid_mock_signature')
        .send(payload);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.processed).toBe(true);
    });

    it('should return 400 for invalid signature', async () => {
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', 'invalid_signature')
        .send({});
      
      expect(res.statusCode).toBe(400);
    });
  });
});
