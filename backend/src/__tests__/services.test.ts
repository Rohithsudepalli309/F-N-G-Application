import pool from '../db';
import { checkVultureRisk, flagUser } from '../services/fraud';
import { recordDemand, getSurgeMultiplier } from '../services/surge';
import { earnPoints, getUserPoints, redeemPoints } from '../services/loyalty';
import { redis } from '../redis';

// Mock DB and Redis
jest.mock('../db', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
const mockQuery = (pool.query as jest.Mock);

jest.mock('../redis', () => ({
  redis: {
    pipeline: jest.fn().mockReturnValue({
      zadd: jest.fn().mockReturnThis(),
      zremrangebyscore: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
    zcount: jest.fn(),
  },
  SURGE_KEY_PREFIX: 'surge:',
}));

describe('Backend Services (TEST-001)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fraud Service', () => {
    it('should identify high vulture risk for shared devices', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ user_count: '3' }] });
      const result = await checkVultureRisk('u1', 'd1');
      expect(result.risk).toBe('high');
      expect(result.reason).toContain('shared with 3 other accounts');
    });

    it('should flag user using correct nested jsonb_set', async () => {
      await flagUser('u1', 'Test reason');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('jsonb_set'),
        ['u1', '"Test reason"']
      );
    });
  });

  describe('Surge Service', () => {
    it('should return 1.5x multiplier for high demand', async () => {
      (redis.zcount as jest.Mock).mockResolvedValue(35);
      const multiplier = await getSurgeMultiplier(1);
      expect(multiplier).toBe(1.5);
    });

    it('should default to 1.0x surge', async () => {
       (redis.zcount as jest.Mock).mockResolvedValue(5);
       const multiplier = await getSurgeMultiplier(1);
       expect(multiplier).toBe(1.0);
    });
  });

  describe('Loyalty Service', () => {
    it('should earn points based on amount', async () => {
      await earnPoints('u1', 'o1', 100.5);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO loyalty_points'),
        ['u1', 'o1', 100]
      );
    });

    it('should redeem points if balance is sufficient', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ balance: 500 }] });
      const success = await redeemPoints('u1', 200);
      expect(success).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO loyalty_points'),
        ['u1', -200]
      );
    });
  });
});
