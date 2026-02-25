const db = require('./src/config/db');
const logger = require('./src/config/logger');

const REAL_PRODUCTS = [
  // --- 1. FRUITS & VEGETABLES ---
  { name: 'Alphonso Mango (Ratnagiri)', category: 'Fruits & Vegetables', price: 120000, original_price: 150000, unit: '1 Dozen', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=400' },
  { name: 'Fresh Broccoli', category: 'Fruits & Vegetables', price: 8500, original_price: 11000, unit: '1 Unit', img: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&q=80&w=400' },
  { name: 'Button Mushrooms', category: 'Fruits & Vegetables', price: 4500, original_price: 6000, unit: '200g', img: 'https://images.unsplash.com/photo-1504624720597-6494435e329d?auto=format&fit=crop&q=80&w=400' },
  { name: 'Baby Spinach (Organic)', category: 'Fruits & Vegetables', price: 3500, original_price: 5000, unit: '200g', img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400' },
  { name: 'Red Bell Pepper', category: 'Fruits & Vegetables', price: 7500, original_price: 9500, unit: '500g', img: 'https://images.unsplash.com/photo-1563513307166-ac725656501a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Washington Apples (Red)', category: 'Fruits & Vegetables', price: 24000, original_price: 32000, unit: '1kg', img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400' },

  // --- 2. DAIRY, BREAD & EGGS ---
  { name: 'Amul Gold (Full Cream Milk)', category: 'Dairy, Bread & Eggs', price: 3300, original_price: 3300, unit: '500ml', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400' },
  { name: 'Epigamia Greek Yogurt (Blueberry)', category: 'Dairy, Bread & Eggs', price: 6500, original_price: 8000, unit: '90g', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=400' },
  { name: 'Fresh Paneer (Malai Content)', category: 'Dairy, Bread & Eggs', price: 10500, original_price: 13000, unit: '200g', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400' },
  { name: 'The Baker\'s Dozen Ciabatta', category: 'Dairy, Bread & Eggs', price: 9500, original_price: 12000, unit: '1 Unit', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400' },

  // --- 3. ATTA, RICE, OIL & DALS ---
  { name: 'India Gate Basmati Rice', category: 'Atta, Rice, Oil & Dals', price: 85000, original_price: 110000, unit: '5kg', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' },
  { name: 'Aashirvaad Select Wheat Atta', category: 'Atta, Rice, Oil & Dals', price: 42000, original_price: 55000, unit: '10kg', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400' },
  { name: 'Saffola Gold Blended Oil', category: 'Atta, Rice, Oil & Dals', price: 75000, original_price: 90000, unit: '5L', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400' },

  // --- 4. MEAT, FISH & EGGS ---
  { name: 'Licious Chicken Curry Cut', category: 'Meat, Fish & Eggs', price: 29500, original_price: 35000, unit: '450g', img: 'https://images.unsplash.com/photo-1587593817645-425017df7fdb?auto=format&fit=crop&q=80&w=400' },
  { name: 'Fresh Sear Fish (Seer)', category: 'Meat, Fish & Eggs', price: 85000, original_price: 110000, unit: '500g', img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=400' },
  { name: 'Eggs (Pack of 12)', category: 'Meat, Fish & Eggs', price: 9600, original_price: 12000, unit: '12 Units', img: 'https://images.unsplash.com/photo-1582722872445-44ad5c789d75?auto=format&fit=crop&q=80&w=400' },

  // --- 5. MASALA & DRY FRUITS ---
  { name: 'Everest Meat Masala', category: 'Masala & Dry Fruits', price: 4500, original_price: 5500, unit: '50g', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400' },
  { name: 'Premium Cashews (W320)', category: 'Masala & Dry Fruits', price: 25000, original_price: 35000, unit: '200g', img: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?auto=format&fit=crop&q=80&w=400' },
  { name: 'California Almonds', category: 'Masala & Dry Fruits', price: 18500, original_price: 25000, unit: '200g', img: 'https://images.unsplash.com/photo-1508817628294-5a453fa0b8fb?auto=format&fit=crop&q=80&w=400' },

  // --- 6. BREAKFAST & SAUCES ---
  { name: 'Kellogg\'s Corn Flakes', category: 'Breakfast & Sauces', price: 21000, original_price: 25000, unit: '475g', img: 'https://images.unsplash.com/photo-1516746874052-70b92e74ec8b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Kissan Tomato Ketchup', category: 'Breakfast & Sauces', price: 14500, original_price: 18000, unit: '1kg', img: 'https://images.unsplash.com/photo-1589135398302-383bc3709b1f?auto=format&fit=crop&q=80&w=400' },
  { name: 'Fun Foods Peanut Butter', category: 'Breakfast & Sauces', price: 16500, original_price: 19500, unit: '340g', img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=400' },

  // --- 7. PACKAGED FOOD ---
  { name: 'MTR Ready To Eat Paneer', category: 'Packaged Food', price: 12500, original_price: 15000, unit: '300g', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400' },
  { name: 'Saffola Masala Oats', category: 'Packaged Food', price: 18500, original_price: 21000, unit: '400g', img: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&q=80&w=400' },

  // --- 8. TEA, COFFEE & MORE ---
  { name: 'Red Label Tea', category: 'Tea, Coffee & More', price: 42500, original_price: 48000, unit: '500g', img: 'https://images.unsplash.com/photo-1544787210-282dc9210aa6?auto=format&fit=crop&q=80&w=400' },
  { name: 'Nescafe Classic Instant', category: 'Tea, Coffee & More', price: 18500, original_price: 22000, unit: '100g', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400' },
  { name: 'Starbucks Roast Whole Bean', category: 'Tea, Coffee & More', price: 125000, original_price: 150000, unit: '250g', img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=400' },

  // --- 9. ICE CREAMS & MORE ---
  { name: 'Amul Vanilla Gold', category: 'Ice Creams & More', price: 23500, original_price: 25000, unit: '1.25L', img: 'https://images.unsplash.com/photo-1563805042-7684c849a135?auto=format&fit=crop&q=80&w=400' },
  { name: 'Kwality Wall\'s Choco Blast', category: 'Ice Creams & More', price: 6500, original_price: 9000, unit: '1 Unit', img: 'https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&q=80&w=400' },
  { name: 'Baskin Robbins Pralines', category: 'Ice Creams & More', price: 14500, original_price: 18000, unit: '150ml', img: 'https://images.unsplash.com/photo-1516559828984-fb3b923ca1d1?auto=format&fit=crop&q=80&w=400' },

  // --- 10. FROZEN FOOD ---
  { name: 'McCain Smiles', category: 'Frozen Food', price: 14500, original_price: 17500, unit: '415g', img: 'https://images.unsplash.com/photo-1573082811475-21763c8a7732?auto=format&fit=crop&q=80&w=400' },
  { name: 'ITC Master Chef Prawns', category: 'Frozen Food', price: 42500, original_price: 52000, unit: '200g', img: 'https://images.unsplash.com/photo-1559740038-1914a851bdf8?auto=format&fit=crop&q=80&w=400' },

  // --- 11. SWEET CRAVINGS ---
  { name: 'Cadbury Dairy Milk Silk', category: 'Sweet Cravings', price: 8500, original_price: 9000, unit: '60g', img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Ferrero Rocher (T16)', category: 'Sweet Cravings', price: 54500, original_price: 65000, unit: '200g', img: 'https://images.unsplash.com/photo-1548335132-8406f5255f05?auto=format&fit=crop&q=80&w=400' },

  // --- 12. COLD DRINKS & JUICES ---
  { name: 'Real Fruit Power Mixed', category: 'Cold Drinks & Juices', price: 11500, original_price: 13500, unit: '1L', img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Mountain Dew Bottle', category: 'Cold Drinks & Juices', price: 4000, original_price: 5000, unit: '750ml', img: 'https://images.unsplash.com/photo-1527960669566-f882ba85a4c6?auto=format&fit=crop&q=80&w=400' },
  { name: 'Monster Energy Drink', category: 'Cold Drinks & Juices', price: 12500, original_price: 15000, unit: '350ml', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400' },

  // --- 13. MUNCHIES ---
  { name: 'Lays Magic Masala', category: 'Munchies', price: 2000, original_price: 2000, unit: '50g', img: 'https://images.unsplash.com/photo-1566478431375-71436a548624?auto=format&fit=crop&q=80&w=400' },
  { name: 'Doritos Cheese Supreme', category: 'Munchies', price: 5000, original_price: 6000, unit: '75g', img: 'https://images.unsplash.com/photo-1599490659223-33306fa02930?auto=format&fit=crop&q=80&w=400' },
  { name: 'Too Yumm Karare', category: 'Munchies', price: 2000, original_price: 2500, unit: '50g', img: 'https://images.unsplash.com/photo-1613919113166-2990042787e1?auto=format&fit=crop&q=80&w=400' },

  // --- 14. BISCUITS & COOKIES ---
  { name: 'Parle-G Gold Pack', category: 'Biscuits & Cookies', price: 2500, original_price: 3000, unit: '200g', img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=400' },
  { name: 'Sunfeast Dark Fantasy', category: 'Biscuits & Cookies', price: 4500, original_price: 5500, unit: '100g', img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=400' },

  // --- 15. SKINCARE ---
  { name: 'Nivea Soft Cream', category: 'Skincare', price: 22500, original_price: 26000, unit: '200ml', img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Neutrogena Hydro Boost', category: 'Skincare', price: 85000, original_price: 110000, unit: '50ml', img: 'https://images.unsplash.com/photo-1556228720-195b674e8b09?auto=format&fit=crop&q=80&w=400' },

  // --- 16. MAKEUP & BEAUTY ---
  { name: 'Lakme Absolute Foundation', category: 'Makeup & Beauty', price: 65000, original_price: 75000, unit: '30ml', img: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&q=80&w=400' },
  { name: 'Maybelline Colossal Kajal', category: 'Makeup & Beauty', price: 18500, original_price: 22000, unit: '1 Unit', img: 'https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?auto=format&fit=crop&q=80&w=400' },

  // --- 17. BATH & BODY ---
  { name: 'Dove Cream Beauty Bar', category: 'Bath & Body', price: 16500, original_price: 19500, unit: '3x100g', img: 'https://images.unsplash.com/photo-1600857062241-99e5adeec130?auto=format&fit=crop&q=80&w=400' },
  { name: 'Dettol Original Soap', category: 'Bath & Body', price: 14500, original_price: 16000, unit: '4x125g', img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400' },

  // --- 18. HAIRCARE ---
  { name: 'Head & Shoulders Shampoo', category: 'Haircare', price: 34500, original_price: 42000, unit: '340ml', img: 'https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?auto=format&fit=crop&q=80&w=400' },
  { name: 'Tresemme Smooth & Shine', category: 'Haircare', price: 42500, original_price: 55000, unit: '580ml', img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=400' },

  // --- EXTRA VARIETY PACK (MASSIVE FILLER) ---
  { name: 'Kiwi Fruit (Imported)', category: 'Fruits & Vegetables', price: 14500, original_price: 18000, unit: '3 Units', img: 'https://images.unsplash.com/photo-1585059895324-58bc44996968?auto=format&fit=crop&q=80&w=400' },
  { name: 'Dragon Fruit', category: 'Fruits & Vegetables', price: 8500, original_price: 12000, unit: '1 Unit', img: 'https://images.unsplash.com/photo-1527324688101-016748a5a828?auto=format&fit=crop&q=80&w=400' },
  { name: 'Avocado (Hass)', category: 'Fruits & Vegetables', price: 18500, original_price: 25000, unit: '1 Unit', img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400' },
  { name: 'Gorgon Nut (Makhana)', category: 'Masala & Dry Fruits', price: 14500, original_price: 18500, unit: '100g', img: 'https://images.unsplash.com/photo-1606830733744-0ad7a6db3efb?auto=format&fit=crop&q=80&w=400' },
  { name: 'Walnut Kernels', category: 'Masala & Dry Fruits', price: 42000, original_price: 55000, unit: '250g', img: 'https://images.unsplash.com/photo-1589733902784-993f3b1f5d52?auto=format&fit=crop&q=80&w=400' },
  { name: 'Quinoa (Organic)', category: 'Atta, Rice, Oil & Dals', price: 34500, original_price: 45000, unit: '500g', img: 'https://images.unsplash.com/photo-1606132791485-f538350cc459?auto=format&fit=crop&q=80&w=400' },
  { name: 'Brown Rice (Unpolished)', category: 'Atta, Rice, Oil & Dals', price: 14500, original_price: 18500, unit: '1kg', img: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&q=80&w=400' },
  { name: 'Cold Pressed Coconut Oil', category: 'Atta, Rice, Oil & Dals', price: 32500, original_price: 42000, unit: '500ml', img: 'https://images.unsplash.com/photo-1590779033100-2e4574996969?auto=format&fit=crop&q=80&w=400' },
];

async function seedProducts() {
  try {
    logger.info('🚀 Initiating Massive Catalog Overhaul...');

    const storeId = 'st_zepto_central';
    await db.query(`
      INSERT INTO stores (id, name, type, store_type, region, rating, distance, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `, [storeId, 'F&G Central Mega Depot', 'Hypermarket', 'grocery', 'Pan-India', 4.9, 0.8, 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800']);

    logger.info('✅ Mega Depot Synchronized.');

    await db.query('DELETE FROM products WHERE store_id = $1', [storeId]);
    logger.info('🧹 Database Purged for Fresh Injection.');

    let count = 0;
    // We will multiply the variety by cloning with variations to reach 100+
    for (const p of REAL_PRODUCTS) {
      const pid = 'p_' + p.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30) + '_' + Math.floor(Math.random() * 100000);
      
      await db.query(`
        INSERT INTO products (id, store_id, name, description, price, original_price, unit, category, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        pid, 
        storeId, 
        p.name, 
        `Freshly sourced ${p.name}. Premium quality guaranteed by F&G.`, 
        p.price, 
        p.original_price, 
        p.unit, 
        p.category, 
        p.img
      ]);
      count++;
    }

    // Add extra clones for volume
    for (let i = 0 ; i < 40; i++) {
        const base = REAL_PRODUCTS[Math.floor(Math.random() * REAL_PRODUCTS.length)];
        const pid = `p_vol_${i}_${Math.floor(Math.random() * 10000)}`;
        await db.query(`
            INSERT INTO products (id, store_id, name, description, price, original_price, unit, category, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            pid, storeId, `${base.name} (Value Pack)`, `Bulk savings on ${base.name}.`, 
            Math.round(base.price * 1.8), Math.round(base.original_price * 2), `Bulk Pack`, base.category, base.img
          ]);
          count++;
    }

    logger.info(`✨ MISSION COMPLETE: Seeded ${count} high-fidelity products across 18 categories.`);
    process.exit(0);
  } catch (err) {
    logger.error('❌ Injection failed:', err);
    process.exit(1);
  }
}

seedProducts();
