const db = require('./src/config/db');
const logger = require('./src/config/logger');

const CATEGORIES = [
  'Fruits & Vegetables', 'Dairy, Bread & Eggs', 'Atta, Rice, Oil & Dals', 
  'Meat, Fish & Eggs', 'Masala & Dry Fruits', 'Breakfast & Sauces', 
  'Packaged Food', 'Tea, Coffee & More', 'Ice Creams & More', 
  'Frozen Food', 'Sweet Cravings', 'Cold Drinks & Juices', 
  'Munchies', 'Biscuits & Cookies', 'Skincare', 
  'Makeup & Beauty', 'Bath & Body', 'Haircare'
];

const BASE_PRODUCTS = [
  // Fruits & Veg
  { name: 'Alphonso Mango', cat: 'Fruits & Vegetables', p: 120000, op: 150000, u: '1 Dozen', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=400' },
  { name: 'Fresh Broccoli', cat: 'Fruits & Vegetables', p: 8500, op: 11000, u: '1 Unit', img: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&q=80&w=400' },
  { name: 'Washington Apples', cat: 'Fruits & Vegetables', p: 24000, op: 32000, u: '1kg', img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400' },
  
  // Dairy
  { name: 'Amul Gold Milk', cat: 'Dairy, Bread & Eggs', p: 3300, op: 3300, u: '500ml', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400' },
  { name: 'Mother Dairy Paneer', cat: 'Dairy, Bread & Eggs', p: 9500, op: 11000, u: '200g', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400' },
  { name: 'Britannia Cheese', cat: 'Dairy, Bread & Eggs', p: 16500, op: 19500, u: '10 Slices', img: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&q=80&w=400' },

  // Munchies
  { name: 'Lays Magic Masala', cat: 'Munchies', p: 2000, op: 2000, u: '50g', img: 'https://images.unsplash.com/photo-1566478431375-71436a548624?auto=format&fit=crop&q=80&w=400' },
  { name: 'Kurkure Masala', cat: 'Munchies', p: 2000, op: 2000, u: '90g', img: 'https://images.unsplash.com/photo-1599490659223-33306fa02930?auto=format&fit=crop&q=80&w=400' },
  { name: 'Doritos Nachos', cat: 'Munchies', p: 5000, op: 6000, u: '75g', img: 'https://images.unsplash.com/photo-1599490659223-33306fa02930?auto=format&fit=crop&q=80&w=400' },

  // Staples
  { name: 'India Gate Rice', cat: 'Atta, Rice, Oil & Dals', p: 85000, op: 110000, u: '5kg', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' },
  { name: 'Aashirvaad Atta', cat: 'Atta, Rice, Oil & Dals', p: 42000, op: 55000, u: '10kg', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400' },

  // Personal Care
  { name: 'Dove Soap', cat: 'Bath & Body', p: 16500, op: 19500, u: '3x100g', img: 'https://images.unsplash.com/photo-1600857062241-99e5adeec130?auto=format&fit=crop&q=80&w=400' },
  { name: 'Nivea Body Lotion', cat: 'Skincare', p: 34500, op: 42000, u: '400ml', img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=400' },
];

const VARIATIONS = [
  { s: 'Value Pack', f: 1.5, u: 'Large' },
  { s: 'Mini', f: 0.5, u: 'Small' },
  { s: 'Family Pack', f: 2.2, u: 'Jumbo' },
  { s: 'Party Size', f: 3.5, u: 'Party' },
  { s: 'Value Plus', f: 1.2, u: 'Promo' },
];

async function seed() {
  try {
    logger.info('🚀 Initiating Hyper-Realistic Massive Seeding...');
    const storeId = 'st_zepto_central';

    await db.query('DELETE FROM products WHERE store_id = $1', [storeId]);

    let count = 0;
    
    // Inject at least 320 items
    for (const cat of CATEGORIES) {
      const baseForCat = BASE_PRODUCTS.filter(bp => bp.cat === cat);
      const itemsToUse = baseForCat.length > 0 ? baseForCat : BASE_PRODUCTS.slice(0, 3);

      for (const base of itemsToUse) {
        // Base item
        const pid = 'p_real_' + Math.random().toString(36).substr(2, 9);
        await db.query(`INSERT INTO products (id, store_id, name, description, price, original_price, unit, category, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [pid, storeId, base.name, `Premium ${base.name} - Fresh and direct to you.`, base.p, base.op, base.u, cat, base.img]);
        count++;

        // Varieties
        for (const v of VARIATIONS) {
          const vid = 'p_var_' + Math.random().toString(36).substr(2, 9);
          await db.query(`INSERT INTO products (id, store_id, name, description, price, original_price, unit, category, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [vid, storeId, `${base.name} (${v.s})`, `Savings on ${base.name} ${v.s}.`, Math.round(base.p * v.f), Math.round(base.op * v.f), `${v.u} Unit`, cat, base.img]);
          count++;
        }
      }
    }

    // Fill up to 320+ with random extras
    while (count < 320) {
      const base = BASE_PRODUCTS[Math.floor(Math.random() * BASE_PRODUCTS.length)];
      const rid = 'p_ext_' + Math.random().toString(36).substr(2, 9);
      const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      await db.query(`INSERT INTO products (id, store_id, name, description, price, original_price, unit, category, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [rid, storeId, `${base.name} (Special Edition)`, `Exclusive variety of ${base.name}.`, Math.round(base.p * 1.1), Math.round(base.op * 1.1), 'Special', cat, base.img]);
      count++;
    }

    logger.info(`✨ Successfully injected ${count} production-grade items across all categories.`);
    process.exit(0);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}

seed();
