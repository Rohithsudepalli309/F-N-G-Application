import { Router } from 'express';
import { PersonalizationService } from '../services/personalization';
import { requireAuth } from '../middleware/auth';
import { logger } from '../logger';

const router = Router();

/**
 * GET /personalization/basket
 * 
 * Returns personalized "Smart Basket" recommendations for the logged-in user.
 */
router.get('/basket', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const recommendations = await PersonalizationService.getBasketRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    logger.error('Error in /personalization/basket:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /personalization/recommendations/:productId
 * 
 * Returns "Frequently Bought Together" items for a specific product.
 */
router.get('/recommendations/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid Product ID' });
    }
    const recommendations = await PersonalizationService.getFrequentlyBoughtTogether(productId);
    res.json(recommendations);
  } catch (error) {
    logger.error('Error in /personalization/recommendations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /personalization/suggestions
 * 
 * Returns personalized search suggestions for a query.
 */
router.get('/suggestions', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const query = req.query.q as string;
    if (!query) {
      return res.json([]);
    }
    const suggestions = await PersonalizationService.getSearchSuggestions(userId, query);
    res.json(suggestions);
  } catch (error) {
    logger.error('Error in /personalization/suggestions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /personalization/coupons
 * 
 * Returns personalized coupons for the user.
 */
router.get('/coupons', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const coupons = await PersonalizationService.getPersonalizedCoupons(userId);
    res.json(coupons);
  } catch (error) {
    logger.error('Error in /personalization/coupons:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
