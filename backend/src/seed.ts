/**
 * Seed development data.
 * Run: npx ts-node-dev --transpile-only src/seed.ts
 */
import bcrypt from 'bcryptjs';
import pool from './db';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('[seed] Seeding development data...');

    // ── Merchant user ──────────────────────────────────────────────────────
    const merchantHash = await bcrypt.hash('Merchant@123', 12);
    const merchantRes = await client.query(
      `INSERT INTO users (email, phone, name, password, role)
       VALUES ('merchant@fng.app', '9999900001', 'Pizza Palace Owner', $1, 'merchant')
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [merchantHash]
    );
    const merchantId = merchantRes.rows[0].id;

    // ── Store ──────────────────────────────────────────────────────────────
    const storeRes = await client.query(
      `INSERT INTO stores
         (owner_id, name, description, store_type, cuisine_tags,
          image_url, delivery_time_min, min_order_amount, owner_name, phone, email)
       VALUES ($1, 'Pizza Palace', 'Best pizzas in town!', 'restaurant',
               '{"Italian","Pizza"}',
               'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
               30, 19900, 'Pizza Palace Owner', '9999900001', 'merchant@fng.app')
       ON CONFLICT DO NOTHING RETURNING id`,
      [merchantId]
    );
    const storeId = storeRes.rows[0]?.id;

    if (storeId) {
      // ── Products ───────────────────────────────────────────────────────
      const products = [
        { name: 'Margherita Pizza', price: 29900, original_price: 39900, category: 'Pizzas', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
        { name: 'Pepperoni Pizza',  price: 34900, original_price: 44900, category: 'Pizzas', is_veg: false, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300' },
        { name: 'Garlic Bread',     price:  9900, original_price: 12900, category: 'Sides',  is_veg: true,  image_url: 'https://images.unsplash.com/photo-1619535860434-cf9b902a5ece?w=300' },
        { name: 'Coke 500ml',       price:  4900, original_price:  5900, category: 'Drinks', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300' },
      ];
      for (const p of products) {
        await client.query(
          `INSERT INTO products (store_id, name, price, original_price, category, is_veg, stock, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,100,$7) ON CONFLICT DO NOTHING`,
          [storeId, p.name, p.price, p.original_price, p.category, p.is_veg, p.image_url]
        );
      }
      console.log('[seed] Products seeded.');
    }

    // ── Grocery store + products for HomeScreen categories ────────────────
    const groceryMerchantRes = await client.query(
      `INSERT INTO users (email, phone, name, password, role)
       VALUES ('grocery@fng.app', '9999900002', 'F&G Grocery Owner', $1, 'merchant')
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [merchantHash]
    );
    const groceryMerchantId = groceryMerchantRes.rows[0].id;

    const groceryStoreRes = await client.query(
      `INSERT INTO stores
         (owner_id, name, description, store_type, cuisine_tags,
          image_url, delivery_time_min, min_order_amount, owner_name, phone, email)
       VALUES ($1, 'F&G Grocery', 'Fresh groceries delivered fast', 'grocery',
               '{"Grocery","Fresh"}',
               'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
               20, 9900, 'F&G Grocery Owner', '9999900002', 'grocery@fng.app')
       ON CONFLICT DO NOTHING RETURNING id`,
      [groceryMerchantId]
    );
    const groceryStoreId = groceryStoreRes.rows[0]?.id;

    if (groceryStoreId) {
      const groceryProducts = [
        // Fruits & Vegetables
        { name: 'Fresh Tomatoes 1kg',    price: 4900,  original_price: 6900,  category: 'Fruits & Vegetables', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300' },
        { name: 'Banana 1 Dozen',        price: 3900,  original_price: 4900,  category: 'Fruits & Vegetables', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300' },
        { name: 'Spinach 250g',          price: 2900,  original_price: 3900,  category: 'Fruits & Vegetables', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300' },
        { name: 'Apples 1kg',            price: 14900, original_price: 17900, category: 'Fruits & Vegetables', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300' },
        // Munchies
        { name: 'Lays Classic 150g',     price: 3900,  original_price: 4500,  category: 'Munchies', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1600952901326-60f3e3ccaed0?w=300' },
        { name: 'Kurkure Masala 90g',    price: 2900,  original_price: 3500,  category: 'Munchies', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300' },
        { name: 'Oreo Biscuits 150g',    price: 4500,  original_price: 5500,  category: 'Munchies', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300' },
        { name: 'Maggi Noodles 70g',     price: 1900,  original_price: 2200,  category: 'Munchies', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300' },
        // Dairy, Bread & Eggs
        { name: 'Amul Milk 1L',          price: 6900,  original_price: 7200,  category: 'Dairy, Bread & Eggs', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300' },
        { name: 'Eggs 12 Pack',          price: 8900,  original_price: 9900,  category: 'Dairy, Bread & Eggs', is_veg: false, image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300' },
        { name: 'Bread Loaf 400g',       price: 4900,  original_price: 5500,  category: 'Dairy, Bread & Eggs', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300' },
        { name: 'Amul Butter 100g',      price: 5700,  original_price: 6200,  category: 'Dairy, Bread & Eggs', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1589985270827-cb73e57e5a35?w=300' },
        // Cleaning Essentials
        { name: 'Surf Excel Detergent',  price: 18900, original_price: 22000, category: 'Cleaning Essentials', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300' },
        { name: 'Vim Dishwash 500ml',    price: 8900,  original_price: 10500, category: 'Cleaning Essentials', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=300' },
        { name: 'Dettol Handwash 250ml', price: 9900,  original_price: 11500, category: 'Cleaning Essentials', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300' },
        { name: 'Floor Cleaner 1L',      price: 11900, original_price: 13900, category: 'Cleaning Essentials', is_veg: true,  image_url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300' },
      ];
      for (const p of groceryProducts) {
        await client.query(
          `INSERT INTO products (store_id, name, price, original_price, category, is_veg, stock, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,100,$7) ON CONFLICT DO NOTHING`,
          [groceryStoreId, p.name, p.price, p.original_price, p.category, p.is_veg, p.image_url]
        );
      }
      console.log('[seed] Grocery products seeded.');
    }

    // ── Sample coupon ──────────────────────────────────────────────────────
    await client.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_uses)
       VALUES ('WELCOME50', 'Flat ₹50 off on first order', 'flat', 5000, 19900, 500)
       ON CONFLICT (code) DO NOTHING`
    );

    console.log('[seed] ✅ Done!');
    console.log('');
    console.log('Accounts to login with:');
    console.log('  Admin    → admin@fng.app   / Admin@123');
    console.log('  Merchant → merchant@fng.app / Merchant@123');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
