const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  
  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
  
  // Firebase (Future placeholder)
  FCM_SERVER_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid Environment Variables:", JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

module.exports = _env.data;
