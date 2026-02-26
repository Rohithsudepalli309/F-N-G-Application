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
  { name: 'Onion (Pyaz)', cat: 'Fruits & Vegetables', p: 3500, op: 4500, u: '1 kg', img: 'https://www.bigbasket.com/media/uploads/p/l/10000148_30-fresho-onion.jpg' },
  { name: 'Tomato (Hybrid)', cat: 'Fruits & Vegetables', p: 2500, op: 3000, u: '1 kg', img: 'https://www.bigbasket.com/media/uploads/p/l/10000200_17-fresho-tomato-hybrid.jpg' },
  { name: 'Potato (Aloo)', cat: 'Fruits & Vegetables', p: 4000, op: 5500, u: '1 kg', img: 'https://www.bigbasket.com/media/uploads/p/l/10000159_27-fresho-potato.jpg' },
  { name: 'Fresh Coriander', cat: 'Fruits & Vegetables', p: 1500, op: 2000, u: '100 g', img: 'https://www.bigbasket.com/media/uploads/p/l/10000097_19-fresho-coriander-leaves.jpg' },
  
  // Dairy
  { name: 'Amul Taaza Toned Milk', cat: 'Dairy, Bread & Eggs', p: 2700, op: 2700, u: '500 ml', img: 'https://www.bigbasket.com/media/uploads/p/l/104153_9-amul-taaza-toned-milk.jpg' },
  { name: 'Amul Butter - Pasteurized', cat: 'Dairy, Bread & Eggs', p: 5800, op: 6000, u: '100 g', img: 'https://www.bigbasket.com/media/uploads/p/l/104152_8-amul-butter-pasteurized.jpg' },
  { name: 'Britannia Good Day Cookies', cat: 'Dairy, Bread & Eggs', p: 3000, op: 3500, u: '218 g', img: 'https://www.bigbasket.com/media/uploads/p/l/1202888_2-britannia-good-day-cashew-cookies.jpg' },
  { name: 'Farm Fresh Brown Eggs', cat: 'Dairy, Bread & Eggs', p: 8500, op: 10000, u: '6 pcs', img: 'https://www.bigbasket.com/media/uploads/p/l/40072320_5-fresho-farm-eggs-regular-medium-antibiotic-residue-free.jpg' },

  // Munchies
  { name: 'Lays American Style', cat: 'Munchies', p: 2000, op: 2000, u: '50 g', img: 'https://www.bigbasket.com/media/uploads/p/l/1204018_2-lays-potato-chips-american-style-cream-onion-flavour.jpg' },
  { name: 'Kurkure Masala Munch', cat: 'Munchies', p: 2000, op: 2000, u: '90 g', img: 'https://www.bigbasket.com/media/uploads/p/l/281026_10-kurkure-namkeen-masala-munch.jpg' },
  { name: 'Haldirams Bhujia Sev', cat: 'Munchies', p: 5500, op: 6000, u: '200 g', img: 'https://www.bigbasket.com/media/uploads/p/l/264560_6-haldirams-namkeen-bhujia-sev.jpg' },

  // Cold Drinks
  { name: 'Coca Cola Soft Drink', cat: 'Cold Drinks & Juices', p: 4000, op: 4000, u: '750 ml', img: 'https://www.bigbasket.com/media/uploads/p/l/251006_11-coca-cola-diet-coke-soft-drink.jpg' },
  { name: 'Thumbs Up Soft Drink', cat: 'Cold Drinks & Juices', p: 4000, op: 4000, u: '750 ml', img: 'https://www.bigbasket.com/media/uploads/p/l/251014_11-thumbs-up-soft-drink.jpg' },
  { name: 'Red Bull Energy Drink', cat: 'Cold Drinks & Juices', p: 12500, op: 12500, u: '250 ml', img: 'https://www.bigbasket.com/media/uploads/p/l/104191_17-red-bull-energy-drink.jpg' },

  // Staples
  { name: 'Aashirvaad Whole Wheat Atta', cat: 'Atta, Rice, Oil & Dals', p: 42000, op: 55000, u: '10 kg', img: 'https://www.bigbasket.com/media/uploads/p/l/126906_8-aashirvaad-atta-whole-wheat.jpg' },
  { name: 'India Gate Basmati Rice', cat: 'Atta, Rice, Oil & Dals', p: 85000, op: 110000, u: '5 kg', img: 'https://www.bigbasket.com/media/uploads/p/l/40058882_13-india-gate-basmati-rice-feast-rozzana.jpg' },
  { name: 'Fortune Sunlite Refined Oil', cat: 'Atta, Rice, Oil & Dals', p: 13500, op: 15500, u: '1 Ltr', img: 'https://www.bigbasket.com/media/uploads/p/l/242671_1-fortune-sunlite-refined-sunflower-oil.jpg' },

  // Personal/Home Care
  { name: 'Surf Excel Easy Wash', cat: 'Cleaning Essentials', p: 16500, op: 19500, u: '1.5 kg', img: 'https://www.bigbasket.com/media/uploads/p/l/212684_16-surf-excel-easy-wash-detergent-powder.jpg' },
  { name: 'Vim Dishwash Liquid', cat: 'Cleaning Essentials', p: 11000, op: 12500, u: '500 ml', img: 'https://www.bigbasket.com/media/uploads/p/l/10000940_26-vim-dishwash-gel-lemon.jpg' },
  { name: 'Colgate Strong Teeth', cat: 'Bath & Body', p: 9500, op: 11000, u: '200 g', img: 'https://www.bigbasket.com/media/uploads/p/l/1206124_2-colgate-strong-teeth-anticavity-toothpaste-with-amino-shakti.jpg' },
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
