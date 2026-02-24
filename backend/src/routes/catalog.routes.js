const express = require('express');
const router = express.Router();

// 🇮🇳 THE GRAND INDIAN CULINARY REPOSITORY
const REGIONAL_STORES = [
    // --- NORTH INDIA ---
    {
        id: 'st_north_1',
        name: 'Haldiram\'s Delhi',
        type: 'North Indian',
        storeType: 'food',
        region: 'North',
        rating: 4.7,
        distance: 2.1,
        tags: ['Chole Bhature', 'Raj Kachori', 'Sweets'],
        image_url: '/assets/north_hero.png'
    },
    {
        id: 'st_north_2',
        name: 'Bihar Se Hai',
        type: 'Bihari Special',
        storeType: 'food',
        region: 'North',
        rating: 4.8,
        distance: 4.5,
        tags: ['Litti Chokha', 'Sattu Paratha'],
        image_url: '/assets/bihar_hero.png'
    },
    // --- SOUTH INDIA ---
    {
        id: 'st_south_1',
        name: 'MTR - Mavalli Tiffin Rooms',
        type: 'South Indian',
        storeType: 'food',
        region: 'South',
        rating: 4.9,
        distance: 1.5,
        tags: ['Rava Idli', 'Masala Dosa', 'Filter Coffee'],
        image_url: '/assets/dosa_hero.png'
    },
    {
        id: 'st_south_2',
        name: 'Kerala Kitchen',
        type: 'Malayali Special',
        storeType: 'food',
        region: 'South',
        rating: 4.7,
        distance: 5.2,
        tags: ['Appam', 'Veg Stew', 'Karimeen Pollichathu'],
        image_url: '/assets/kerala_hero.png'
    },
    // --- GROCERY STORES ---
    {
        id: 'st_groc_1',
        name: 'BigBasket Now',
        type: 'Supermarket',
        storeType: 'grocery',
        region: 'Pan-India',
        rating: 4.8,
        distance: 2.5,
        tags: ['Organic', 'Imported', 'Fresh'],
        image_url: '/assets/grocery_hero.png'
    },
    {
        id: 'st_groc_2',
        name: 'Reliance Fresh',
        type: 'Grocery',
        storeType: 'grocery',
        region: 'Pan-India',
        rating: 4.6,
        distance: 3.8,
        tags: ['Staples', 'Daily Needs', 'Deals'],
        image_url: '/assets/grocery_hero.png'
    }
];

const REGIONAL_PRODUCTS = {
    // Food
    'st_north_1': [
        { id: 'p_n1', name: 'Classic Chole Bhature', price: 18500, category: 'North Indian' },
        { id: 'p_n2', name: 'Raj Kachori Chaat', price: 12500, category: 'Street Food' }
    ],
    // ... other food products
    // Grocery
    'st_groc_1': [
        { id: 'p_g1', name: 'Organic Basmati Rice (5kg)', price: 85000, category: 'Staples' },
        { id: 'p_g2', name: 'Extra Virgin Olive Oil (1L)', price: 125000, category: 'Imported' },
        { id: 'p_g3', name: 'Alphonso Mangoes (1 Dozen)', price: 95000, category: 'Fresh' }
    ],
    'st_groc_2': [
        { id: 'p_g4', name: 'Aashirvaad Atta (10kg)', price: 42000, category: 'Staples' },
        { id: 'p_g5', name: 'Amul Butter (500g)', price: 26500, category: 'Snacks' }
    ]
};

// GET /stores with type and region filtering
router.get('/stores', (req, res) => {
    const { region, type } = req.query;
    let results = REGIONAL_STORES;
    if (type) {
        results = results.filter(s => s.storeType === type);
    }
    if (region) {
        results = results.filter(s => s.region === region);
    }
    res.json(results);
});

// GET /products
router.get('/products', (req, res) => {
    const { storeId } = req.query;
    const products = REGIONAL_PRODUCTS[storeId] || [];
    res.json(products);
});

module.exports = router;
