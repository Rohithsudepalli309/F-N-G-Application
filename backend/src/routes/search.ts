import { Router } from 'express';
import { searchEngine } from '../services/searchDiscovery';

const router = Router();

router.get('/', async (req, res) => {
  const query = String(req.query.query ?? req.query.q ?? '').trim();
  if (!query) {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  const results = await searchEngine.search(query);

  // Return product-shaped items first so existing customer UI can render cards safely.
  const normalized = results.map((item) => {
    if (item.type === 'product') {
      const metadata = item.metadata as Record<string, unknown>;
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        price: Number(metadata.price ?? 0),
        original_price: metadata.original_price ? Number(metadata.original_price) : null,
        image_url: String(metadata.image_url ?? ''),
        unit: String(metadata.unit ?? ''),
        type: item.type,
        score: item.score,
      };
    }

    return {
      id: `store-${item.id}`,
      name: item.name,
      category: item.category,
      price: 0,
      original_price: null,
      image_url: String((item.metadata as Record<string, unknown>).image_url ?? ''),
      unit: 'store',
      type: item.type,
      score: item.score,
    };
  });

  res.json(normalized);
});

router.get('/suggestions', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) {
    res.json({ suggestions: [] });
    return;
  }

  const suggestions = await searchEngine.getSuggestions(q);
  res.json({ suggestions });
});

export default router;
