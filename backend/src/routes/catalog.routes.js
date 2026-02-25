const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalog.service');

// GET /stores with type and region filtering
router.get('/stores', async (req, res, next) => {
    try {
        const { region, type } = req.query;
        const results = await catalogService.getStores({ region, type });
        res.json(results);
    } catch (err) {
        next(err);
    }
});

// GET /products
router.get('/products', async (req, res, next) => {
    try {
        const { storeId, category, search } = req.query;
        const products = await catalogService.getProducts({ storeId, category, search });
        res.json(products);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
