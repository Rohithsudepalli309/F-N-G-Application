/**
 * seed_mega.js
 * Seeds 800+ products across 55 Grocery categories across ALL 3 stores.
 * Run: node seed_mega.js  (from /backend folder with Docker running)
 */
const db = require('./src/config/db');

// ─── 55 CATEGORIES (modelled like Swiggy Grocery / Blinkit) ─────────────────
const CATEGORIES = [
  { name: 'Fruits & Vegetables',          emoji: '🥦', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80' },
  { name: 'Fresh Fruits',                  emoji: '🍎', img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80' },
  { name: 'Fresh Vegetables',              emoji: '🥕', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80' },
  { name: 'Exotic & Organic Veggies',      emoji: '🌿', img: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&q=80' },
  { name: 'Herbs & Flowers',               emoji: '🌸', img: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=400&q=80' },
  { name: 'Dairy, Bread & Eggs',           emoji: '🥛', img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80' },
  { name: 'Milk',                           emoji: '🥛', img: 'https://images.unsplash.com/photo-1500180209-9af46c9b7a1c?w=400&q=80' },
  { name: 'Curd & Paneer',                 emoji: '🥙', img: 'https://images.unsplash.com/photo-1573246123716-6b1782bbf8fe?w=400&q=80' },
  { name: 'Butter & Cheese',               emoji: '🧀', img: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&q=80' },
  { name: 'Eggs',                          emoji: '🥚', img: 'https://images.unsplash.com/photo-1516195851888-6f1a981a862e?w=400&q=80' },
  { name: 'Bakery & Bread',                emoji: '🍞', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80' },
  { name: 'Atta, Rice, Oil & Dals',        emoji: '🌾', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80' },
  { name: 'Atta & Flours',                 emoji: '🌻', img: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&q=80' },
  { name: 'Rice & Poha',                   emoji: '🍚', img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80' },
  { name: 'Oils & Ghee',                   emoji: '🫙', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { name: 'Dals & Pulses',                 emoji: '🫘', img: 'https://images.unsplash.com/photo-1611690951566-b4a4f9fd7e4c?w=400&q=80' },
  { name: 'Sugar & Salt',                  emoji: '🧂', img: 'https://images.unsplash.com/photo-1584473457493-17c4c24290c5?w=400&q=80' },
  { name: 'Meat, Fish & Eggs',             emoji: '🍗', img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80' },
  { name: 'Chicken',                        emoji: '🍗', img: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80' },
  { name: 'Fish & Seafood',                emoji: '🐟', img: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80' },
  { name: 'Masala & Dry Fruits',           emoji: '🌶️', img: 'https://images.unsplash.com/photo-1506802913710-b2985dcd0c20?w=400&q=80' },
  { name: 'Whole Spices',                  emoji: '🫙', img: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80' },
  { name: 'Dry Fruits & Nuts',             emoji: '🥜', img: 'https://images.unsplash.com/photo-1548359591-abd3f0e8c3a5?w=400&q=80' },
  { name: 'Breakfast & Sauces',            emoji: '🥣', img: 'https://images.unsplash.com/photo-1504556074145-e0b78def9474?w=400&q=80' },
  { name: 'Cereals & Oats',               emoji: '🥣', img: 'https://images.unsplash.com/photo-1517093602195-b40af9083f71?w=400&q=80' },
  { name: 'Sauces & Spreads',             emoji: '🫙', img: 'https://images.unsplash.com/photo-1606868306217-dbf5046868d2?w=400&q=80' },
  { name: 'Pickles & Chutney',            emoji: '🫙', img: 'https://images.unsplash.com/photo-1599458252573-56ae36120de1?w=400&q=80' },
  { name: 'Packaged Food',                emoji: '📦', img: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&q=80' },
  { name: 'Noodles & Pasta',              emoji: '🍜', img: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=400&q=80' },
  { name: 'Ready to Eat',                 emoji: '🥘', img: 'https://images.unsplash.com/photo-1603133872871-1e31b35be55e?w=400&q=80' },
  { name: 'Canned & Tinned Food',         emoji: '🥫', img: 'https://images.unsplash.com/photo-1634913787066-77f3d0b9dc14?w=400&q=80' },
  { name: 'Tea, Coffee & More',           emoji: '☕', img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80' },
  { name: 'Tea',                           emoji: '🍵', img: 'https://images.unsplash.com/photo-1561336526-2914f13ceb36?w=400&q=80' },
  { name: 'Coffee',                        emoji: '☕', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  { name: 'Cold Drinks & Juices',          emoji: '🥤', img: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80' },
  { name: 'Carbonated Drinks',            emoji: '🥤', img: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&q=80' },
  { name: 'Fruit Juices & Nectars',       emoji: '🍊', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
  { name: 'Energy & Sports Drinks',       emoji: '⚡', img: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&q=80' },
  { name: 'Water & Coconut Water',        emoji: '💧', img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80' },
  { name: 'Munchies',                     emoji: '🍿', img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80' },
  { name: 'Chips & Crisps',               emoji: '🥔', img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80' },
  { name: 'Namkeen & Bhujia',             emoji: '🫘', img: 'https://images.unsplash.com/photo-1513575949965-c61ab40ee789?w=400&q=80' },
  { name: 'Biscuits & Cookies',           emoji: '🍪', img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80' },
  { name: 'Chocolates & Sweets',          emoji: '🍫', img: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&q=80' },
  { name: 'Sweet Cravings',               emoji: '🍬', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
  { name: 'Ice Creams & More',            emoji: '🍦', img: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80' },
  { name: 'Frozen Food',                  emoji: '🧊', img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80' },
  { name: 'Cleaning Essentials',          emoji: '🧹', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { name: 'Laundry',                      emoji: '🧺', img: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&q=80' },
  { name: 'Toilet & Floor Cleaners',      emoji: '🫧', img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80' },
  { name: 'Personal Care',                emoji: '🧴', img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80' },
  { name: 'Skincare',                     emoji: '✨', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80' },
  { name: 'Haircare',                     emoji: '💆', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80' },
  { name: 'Bath & Body',                  emoji: '🛁', img: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&q=80' },
  { name: 'Baby Care',                    emoji: '👶', img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80' },
  { name: 'Pet Care',                     emoji: '🐾', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' },
  { name: 'Paan Corner',                  emoji: '🌿', img: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=400&q=80' },
];

// ─── 800+ PRODUCTS keyed by category ─────────────────────────────────────────
const PRODUCTS = [

  // ── Fruits & Vegetables ────────────────────────────────────────────────────
  { name: 'Onion (Pyaz)', cat: 'Fruits & Vegetables', p: 3500, op: 4500, u: '1 kg', desc: 'Farm-fresh red onions' },
  { name: 'Tomato (Hybrid)', cat: 'Fruits & Vegetables', p: 2500, op: 3000, u: '500 g', desc: 'Juicy hybrid tomatoes' },
  { name: 'Potato (Aloo)', cat: 'Fruits & Vegetables', p: 4000, op: 5500, u: '1 kg', desc: 'Premium table potatoes' },
  { name: 'Green Chilli', cat: 'Fruits & Vegetables', p: 1200, op: 1500, u: '100 g', desc: 'Spicy & fresh green chillies' },
  { name: 'Ginger (Adrak)', cat: 'Fruits & Vegetables', p: 2200, op: 2800, u: '200 g', desc: 'Fresh organic ginger' },
  { name: 'Garlic (Lahsun)', cat: 'Fruits & Vegetables', p: 1500, op: 2000, u: '100 g', desc: 'Indian garlic bulbs' },
  { name: 'Fresh Coriander', cat: 'Fruits & Vegetables', p: 1000, op: 1500, u: '100 g', desc: 'Leafy fresh coriander' },
  { name: 'Cauliflower (Gobi)', cat: 'Fruits & Vegetables', p: 3500, op: 4000, u: '1 pc (~600g)', desc: 'Crisp white cauliflower' },
  { name: 'Spinach (Palak)', cat: 'Fruits & Vegetables', p: 1800, op: 2200, u: '250 g', desc: 'Baby spinach leaves' },
  { name: 'Brinjal (Baingan)', cat: 'Fruits & Vegetables', p: 2500, op: 3000, u: '500 g', desc: 'Round purple brinjal' },

  // ── Fresh Fruits ───────────────────────────────────────────────────────────
  { name: 'Banana (Elaichi)', cat: 'Fresh Fruits', p: 4500, op: 5500, u: '1 dozen', desc: 'Sweet elaichi bananas' },
  { name: 'Apple Shimla (Pack)', cat: 'Fresh Fruits', p: 12000, op: 14500, u: '4 pcs (~700g)', desc: 'Crisp Shimla apples' },
  { name: 'Watermelon', cat: 'Fresh Fruits', p: 8000, op: 10000, u: '1 pc (~3 kg)', desc: 'Sweet seedless watermelon' },
  { name: 'Mango (Alphonso)', cat: 'Fresh Fruits', p: 25000, op: 30000, u: '6 pcs (~1 kg)', desc: 'Alphonso king of mangoes' },
  { name: 'Grapes (Green)', cat: 'Fresh Fruits', p: 7500, op: 9000, u: '500 g', desc: 'Seedless green grapes' },
  { name: 'Orange (Nagpur)', cat: 'Fresh Fruits', p: 6000, op: 7500, u: '4 pcs', desc: 'Juicy Nagpur oranges' },
  { name: 'Papaya (Ripe)', cat: 'Fresh Fruits', p: 5500, op: 7000, u: '1 pc (~1 kg)', desc: 'Fresh ripe papaya' },
  { name: 'Pomegranate', cat: 'Fresh Fruits', p: 11000, op: 13500, u: '2 pcs (~500g)', desc: 'Arils-rich pomegranate' },
  { name: 'Pineapple', cat: 'Fresh Fruits', p: 9000, op: 11000, u: '1 pc (~1.2 kg)', desc: 'Sweet & tangy pineapple' },
  { name: 'Guava (Amrood)', cat: 'Fresh Fruits', p: 4000, op: 5000, u: '500 g', desc: 'Crunchy fresh guava' },
  { name: 'Kiwi', cat: 'Fresh Fruits', p: 8000, op: 10000, u: '3 pcs', desc: 'New Zealand kiwi' },
  { name: 'Strawberry', cat: 'Fresh Fruits', p: 9500, op: 12000, u: '200 g', desc: 'Juicy fresh strawberries' },

  // ── Fresh Vegetables ───────────────────────────────────────────────────────
  { name: 'Capsicum (Green)', cat: 'Fresh Vegetables', p: 3500, op: 4500, u: '3 pcs (~300g)', desc: 'Crisp green capsicum' },
  { name: 'Capsicum (Red)', cat: 'Fresh Vegetables', p: 4500, op: 5500, u: '2 pcs (~250g)', desc: 'Sweet red capsicum' },
  { name: 'Carrot (Gajar)', cat: 'Fresh Vegetables', p: 3000, op: 4000, u: '500 g', desc: 'Crunchy orange carrots' },
  { name: 'Beans (French)', cat: 'Fresh Vegetables', p: 2800, op: 3500, u: '250 g', desc: 'Tender French beans' },
  { name: 'Peas (Matar)', cat: 'Fresh Vegetables', p: 5500, op: 7000, u: '500 g', desc: 'Fresh green peas' },
  { name: 'Bitter Gourd (Karela)', cat: 'Fresh Vegetables', p: 2500, op: 3000, u: '250 g', desc: 'Nutrient-rich karela' },
  { name: 'Lady Finger (Bhindi)', cat: 'Fresh Vegetables', p: 3200, op: 4000, u: '250 g', desc: 'Tender okra pods' },
  { name: 'Ridge Gourd (Turai)', cat: 'Fresh Vegetables', p: 2000, op: 2500, u: '500 g', desc: 'Fresh ridge gourd' },
  { name: 'Bottle Gourd (Lauki)', cat: 'Fresh Vegetables', p: 2200, op: 2800, u: '1 pc (~700g)', desc: 'Tender bottle gourd' },
  { name: 'Beetroot', cat: 'Fresh Vegetables', p: 3000, op: 3800, u: '500 g', desc: 'Deep red beetroot' },
  { name: 'Sweet Corn', cat: 'Fresh Vegetables', p: 2500, op: 3200, u: '2 ears', desc: 'Yellow sweet corn' },
  { name: 'Mushroom (Button)', cat: 'Fresh Vegetables', p: 5500, op: 7000, u: '200 g', desc: 'Farm-grown button mushrooms' },

  // ── Exotic & Organic Veggies ───────────────────────────────────────────────
  { name: 'Zucchini', cat: 'Exotic & Organic Veggies', p: 6500, op: 8000, u: '250 g', desc: 'Imported Italian zucchini' },
  { name: 'Broccoli', cat: 'Exotic & Organic Veggies', p: 7000, op: 9000, u: '1 pc (~350g)', desc: 'Premium green broccoli' },
  { name: 'Asparagus', cat: 'Exotic & Organic Veggies', p: 12000, op: 15000, u: '150 g', desc: 'Tender fresh asparagus' },
  { name: 'Cherry Tomatoes', cat: 'Exotic & Organic Veggies', p: 8000, op: 10000, u: '250 g', desc: 'Sweet cherry tomatoes' },
  { name: 'Organic Spinach', cat: 'Exotic & Organic Veggies', p: 4500, op: 5500, u: '200 g', desc: 'Certified organic spinach' },
  { name: 'Red Cabbage', cat: 'Exotic & Organic Veggies', p: 5000, op: 6000, u: '1 pc (~600g)', desc: 'Purple red cabbage' },
  { name: 'Iceberg Lettuce', cat: 'Exotic & Organic Veggies', p: 6000, op: 7500, u: '1 pc', desc: 'Crisp iceberg lettuce' },
  { name: 'Baby Carrots', cat: 'Exotic & Organic Veggies', p: 5500, op: 7000, u: '200 g', desc: 'Mini sweet baby carrots' },
  { name: 'Organic Tomatoes', cat: 'Exotic & Organic Veggies', p: 6000, op: 7500, u: '500 g', desc: 'Certified organic tomatoes' },

  // ── Herbs & Flowers ────────────────────────────────────────────────────────
  { name: 'Fresh Mint (Pudina)', cat: 'Herbs & Flowers', p: 1200, op: 1500, u: '50 g', desc: 'Aromatic fresh mint' },
  { name: 'Curry Leaves', cat: 'Herbs & Flowers', p: 800, op: 1000, u: '50 g', desc: 'Fragrant curry leaves' },
  { name: 'Fresh Dill', cat: 'Herbs & Flowers', p: 1500, op: 2000, u: '50 g', desc: 'Aromatic dill weed' },
  { name: 'Basil Leaves', cat: 'Herbs & Flowers', p: 2000, op: 2500, u: '30 g', desc: 'Italian fresh basil' },
  { name: 'Lemon Grass', cat: 'Herbs & Flowers', p: 1800, op: 2200, u: '100 g', desc: 'Citrusy lemon grass' },
  { name: 'Turmeric Root', cat: 'Herbs & Flowers', p: 2500, op: 3000, u: '100 g', desc: 'Fresh turmeric root' },

  // ── Dairy, Bread & Eggs (broad) ────────────────────────────────────────────
  { name: 'Amul Taaza Toned Milk', cat: 'Dairy, Bread & Eggs', p: 2700, op: 2700, u: '500 ml', desc: 'Pasteurized toned milk' },
  { name: 'Amul Gold Full Cream Milk', cat: 'Dairy, Bread & Eggs', p: 3200, op: 3200, u: '500 ml', desc: 'Rich full cream milk' },
  { name: 'Farm Fresh Eggs', cat: 'Dairy, Bread & Eggs', p: 7200, op: 9000, u: '6 pcs', desc: 'Free-range brown eggs' },
  { name: 'Amul Butter — Pasteurized', cat: 'Dairy, Bread & Eggs', p: 5800, op: 6500, u: '100 g', desc: 'Classic salted butter' },
  { name: 'Britannia Milk Bread', cat: 'Dairy, Bread & Eggs', p: 4500, op: 5000, u: '400 g', desc: 'Soft sandwich bread' },

  // ── Milk ───────────────────────────────────────────────────────────────────
  { name: 'Amul Taaza (1 Litre)', cat: 'Milk', p: 5200, op: 5200, u: '1 L', desc: 'Toned pasturised milk' },
  { name: 'Mother Dairy Full Cream', cat: 'Milk', p: 6800, op: 6800, u: '1 L', desc: 'Full cream rich milk' },
  { name: 'Nandini Toned Milk', cat: 'Milk', p: 5400, op: 5400, u: '1 L', desc: 'Karnataka Nandini milk' },
  { name: 'Aavin Standardised Milk', cat: 'Milk', p: 5200, op: 5200, u: '1 L', desc: 'Tamil Nadu Aavin milk' },
  { name: 'Amul A2 Milk', cat: 'Milk', p: 9000, op: 10000, u: '500 ml', desc: 'Premium A2 desi cow milk' },
  { name: 'Soya Milk', cat: 'Milk', p: 9500, op: 11000, u: '500 ml', desc: 'Unsweetened soy milk' },
  { name: 'Almond Milk', cat: 'Milk', p: 14000, op: 16000, u: '250 ml', desc: 'Creamy almond milk' },

  // ── Curd & Paneer ──────────────────────────────────────────────────────────
  { name: 'Amul Masti Dahi', cat: 'Curd & Paneer', p: 6000, op: 6500, u: '400 g', desc: 'Creamy set curd' },
  { name: 'Mother Dairy Mishti Dahi', cat: 'Curd & Paneer', p: 5500, op: 6000, u: '200 g', desc: 'Sweet Bengali mishti doi' },
  { name: 'Amul Paneer', cat: 'Curd & Paneer', p: 10000, op: 12000, u: '200 g', desc: 'Soft fresh paneer' },
  { name: 'Nandini Paneer', cat: 'Curd & Paneer', p: 9500, op: 11000, u: '200 g', desc: 'Karnataka farm paneer' },
  { name: 'Low Fat Dahi', cat: 'Curd & Paneer', p: 5000, op: 5500, u: '400 g', desc: 'Pro-biotic low fat curd' },
  { name: 'Greek Yogurt', cat: 'Curd & Paneer', p: 12000, op: 14000, u: '200 g', desc: 'Thick strained Greek yogurt' },

  // ── Butter & Cheese ────────────────────────────────────────────────────────
  { name: 'Amul Butter (100 g)', cat: 'Butter & Cheese', p: 5800, op: 6500, u: '100 g', desc: 'Classic yellow butter' },
  { name: 'Amul Butter (500 g)', cat: 'Butter & Cheese', p: 27000, op: 30000, u: '500 g', desc: 'Economy family pack' },
  { name: 'Zilch Sugar-free Peanut Butter', cat: 'Butter & Cheese', p: 25000, op: 29000, u: '340 g', desc: 'High-protein peanut butter' },
  { name: 'Philadelphia Cream Cheese', cat: 'Butter & Cheese', p: 24000, op: 28000, u: '180 g', desc: 'Smooth cream cheese' },
  { name: 'Amul Cheese Slices', cat: 'Butter & Cheese', p: 9500, op: 11000, u: '200 g', desc: 'Processed cheese slices' },
  { name: 'Britannia Cheese Spread', cat: 'Butter & Cheese', p: 10000, op: 12000, u: '180 g', desc: 'Creamy cheese spread' },
  { name: 'Mozzarella Block', cat: 'Butter & Cheese', p: 22000, op: 26000, u: '200 g', desc: 'Italian-style mozzarella' },

  // ── Eggs ───────────────────────────────────────────────────────────────────
  { name: 'Brown Eggs (6 pcs)', cat: 'Eggs', p: 9000, op: 11000, u: '6 pcs', desc: 'Farm-fresh brown eggs' },
  { name: 'White Eggs (12 pcs)', cat: 'Eggs', p: 15000, op: 18000, u: '12 pcs', desc: 'Antibiotic-free white eggs' },
  { name: 'Country Eggs (Desi)', cat: 'Eggs', p: 11000, op: 14000, u: '6 pcs', desc: 'Free-range desi eggs' },
  { name: 'Duck Eggs', cat: 'Eggs', p: 14000, op: 17000, u: '6 pcs', desc: 'Rich duck eggs' },
  { name: 'Quail Eggs', cat: 'Eggs', p: 9000, op: 11000, u: '12 pcs', desc: 'Tiny nutritious quail eggs' },
  { name: 'Pasteurized Liquid Eggs', cat: 'Eggs', p: 18000, op: 21000, u: '500 ml', desc: 'Ready-to-use liquid eggs' },

  // ── Bakery & Bread ─────────────────────────────────────────────────────────
  { name: 'Britannia Milk Bread', cat: 'Bakery & Bread', p: 4500, op: 5000, u: '400 g', desc: 'Soft white bread loaf' },
  { name: 'English Oven Multigrain', cat: 'Bakery & Bread', p: 5500, op: 6500, u: '400 g', desc: 'Seeded multigrain bread' },
  { name: 'Harvest Gold White Bread', cat: 'Bakery & Bread', p: 4200, op: 5000, u: '400 g', desc: 'Classic white sandwich bread' },
  { name: 'Sourdough Loaf', cat: 'Bakery & Bread', p: 18000, op: 22000, u: '500 g', desc: 'Artisan slow-fermented sourdough' },
  { name: 'Whole Wheat Bread', cat: 'Bakery & Bread', p: 5500, op: 6500, u: '400 g', desc: 'High-fibre wheat bread' },
  { name: 'Baguette', cat: 'Bakery & Bread', p: 12000, op: 15000, u: '1 pc (~300g)', desc: 'French-style baguette' },
  { name: 'Burger Buns (4 pcs)', cat: 'Bakery & Bread', p: 5000, op: 6000, u: '4 pcs', desc: 'Soft sesame burger buns' },
  { name: 'Pita Bread', cat: 'Bakery & Bread', p: 8000, op: 10000, u: '4 pcs', desc: 'Pocket pita rounds' },
  { name: 'Croissant', cat: 'Bakery & Bread', p: 6500, op: 8000, u: '2 pcs', desc: 'Flaky butter croissant' },

  // ── Atta & Flours ──────────────────────────────────────────────────────────
  { name: 'Aashirvaad Whole Wheat Atta (5 kg)', cat: 'Atta & Flours', p: 22000, op: 28000, u: '5 kg', desc: 'MP wheat atta' },
  { name: 'Aashirvaad Whole Wheat Atta (10 kg)', cat: 'Atta & Flours', p: 42000, op: 55000, u: '10 kg', desc: 'Economy atta pack' },
  { name: 'Fortune Chakki Fresh (5 kg)', cat: 'Atta & Flours', p: 21000, op: 26000, u: '5 kg', desc: 'Stone-ground chakki atta' },
  { name: 'Patanjali Atta', cat: 'Atta & Flours', p: 20000, op: 24000, u: '5 kg', desc: 'Organic wheat flour' },
  { name: 'Maida (All Purpose Flour)', cat: 'Atta & Flours', p: 4500, op: 5500, u: '1 kg', desc: 'Refined wheat flour' },
  { name: 'Besan (Gram Flour)', cat: 'Atta & Flours', p: 8500, op: 10000, u: '500 g', desc: 'Fine chickpea flour' },
  { name: 'Ragi Flour', cat: 'Atta & Flours', p: 7000, op: 8500, u: '500 g', desc: 'Finger millet ragi atta' },
  { name: 'Jowar Flour', cat: 'Atta & Flours', p: 6500, op: 8000, u: '500 g', desc: 'Gluten-free sorghum flour' },
  { name: 'Rice Flour', cat: 'Atta & Flours', p: 5000, op: 6000, u: '500 g', desc: 'Fine idli/dosa rice flour' },
  { name: 'Cornflour', cat: 'Atta & Flours', p: 4000, op: 5000, u: '500 g', desc: 'Fine cornstarch flour' },

  // ── Rice & Poha ────────────────────────────────────────────────────────────
  { name: 'India Gate Basmati (5 kg)', cat: 'Rice & Poha', p: 85000, op: 110000, u: '5 kg', desc: 'Premium aged basmati' },
  { name: 'India Gate Basmati (1 kg)', cat: 'Rice & Poha', p: 18000, op: 22000, u: '1 kg', desc: 'Long grain basmati rice' },
  { name: 'Daawat Super Basmati', cat: 'Rice & Poha', p: 17000, op: 21000, u: '1 kg', desc: 'Extra long basmati' },
  { name: 'Sona Masuri Rice', cat: 'Rice & Poha', p: 9500, op: 12000, u: '1 kg', desc: 'Everyday short-grain rice' },
  { name: 'Brown Rice', cat: 'Rice & Poha', p: 12000, op: 15000, u: '1 kg', desc: 'Whole grain brown rice' },
  { name: 'Thick Poha', cat: 'Rice & Poha', p: 5500, op: 7000, u: '500 g', desc: 'Thick beaten rice flakes' },
  { name: 'Thin Poha', cat: 'Rice & Poha', p: 5000, op: 6500, u: '500 g', desc: 'Thin beaten rice flakes' },
  { name: 'Beaten Rice (Chira)', cat: 'Rice & Poha', p: 5500, op: 7000, u: '500 g', desc: 'Bengali style flattened rice' },

  // ── Oils & Ghee ────────────────────────────────────────────────────────────
  { name: 'Fortune Sunflower Oil (1 L)', cat: 'Oils & Ghee', p: 13500, op: 15500, u: '1 L', desc: 'Light refined sunflower oil' },
  { name: 'Fortune Sunflower Oil (5 L)', cat: 'Oils & Ghee', p: 63000, op: 72000, u: '5 L', desc: 'Economy sunflower oil' },
  { name: 'Dhara Mustard Oil', cat: 'Oils & Ghee', p: 15000, op: 18000, u: '1 L', desc: 'Kachi Ghani mustard oil' },
  { name: 'KPL Cold Pressed Coconut Oil', cat: 'Oils & Ghee', p: 22000, op: 27000, u: '500 ml', desc: 'Virgin coconut oil' },
  { name: 'Saffola Gold Oil', cat: 'Oils & Ghee', p: 16000, op: 19000, u: '1 L', desc: 'Low absorb heart-care oil' },
  { name: 'Amul Pure Ghee', cat: 'Oils & Ghee', p: 58000, op: 68000, u: '1 L', desc: 'Traditional cow ghee' },
  { name: 'Patanjali Desi Ghee', cat: 'Oils & Ghee', p: 54000, op: 65000, u: '1 L', desc: 'Organic desi ghee' },
  { name: 'Nutralite Margarine', cat: 'Oils & Ghee', p: 9500, op: 11000, u: '200 g', desc: 'Healthy plant-based spread' },
  { name: 'Extra Virgin Olive Oil', cat: 'Oils & Ghee', p: 55000, op: 65000, u: '500 ml', desc: 'Cold pressed Italian EVOO' },

  // ── Dals & Pulses ──────────────────────────────────────────────────────────
  { name: 'Toor Dal (Arhar)', cat: 'Dals & Pulses', p: 17000, op: 21000, u: '1 kg', desc: 'Split pigeon pea dal' },
  { name: 'Moong Dal (Dhuli)', cat: 'Dals & Pulses', p: 16000, op: 19000, u: '1 kg', desc: 'Split washed moong dal' },
  { name: 'Chana Dal', cat: 'Dals & Pulses', p: 12500, op: 15000, u: '1 kg', desc: 'Split Bengal gram' },
  { name: 'Masoor Dal', cat: 'Dals & Pulses', p: 11000, op: 13500, u: '1 kg', desc: 'Red lentils' },
  { name: 'Rajma (Red Kidney Beans)', cat: 'Dals & Pulses', p: 18000, op: 22000, u: '1 kg', desc: 'Kashmiri red rajma' },
  { name: 'Kabuli Chana', cat: 'Dals & Pulses', p: 16000, op: 20000, u: '1 kg', desc: 'White chickpeas' },
  { name: 'Black Chana', cat: 'Dals & Pulses', p: 14000, op: 17000, u: '1 kg', desc: 'Black Bengal gram' },
  { name: 'Urad Dal (Whole)', cat: 'Dals & Pulses', p: 19000, op: 23000, u: '1 kg', desc: 'Black whole urad dal' },
  { name: 'Urad Dal (Dhuli)', cat: 'Dals & Pulses', p: 20000, op: 24000, u: '1 kg', desc: 'White split urad dal' },

  // ── Sugar & Salt ───────────────────────────────────────────────────────────
  { name: 'Tata Sugar (1 kg)', cat: 'Sugar & Salt', p: 4800, op: 5500, u: '1 kg', desc: 'Fine white granulated sugar' },
  { name: 'Tata Sugar (5 kg)', cat: 'Sugar & Salt', p: 23000, op: 27000, u: '5 kg', desc: 'Economy sugar pack' },
  { name: 'Demerara Brown Sugar', cat: 'Sugar & Salt', p: 9000, op: 11000, u: '500 g', desc: 'Raw cane brown sugar' },
  { name: 'Tata Iodised Salt', cat: 'Sugar & Salt', p: 2500, op: 3000, u: '1 kg', desc: 'Iodine-enriched table salt' },
  { name: 'Rock Salt (Sendha Namak)', cat: 'Sugar & Salt', p: 5000, op: 6000, u: '500 g', desc: 'Himalayan pink rock salt' },
  { name: 'Black Salt (Kala Namak)', cat: 'Sugar & Salt', p: 3500, op: 4500, u: '200 g', desc: 'Earthy black sulfur salt' },
  { name: 'Stevia Sweetener', cat: 'Sugar & Salt', p: 25000, op: 30000, u: '100 sachets', desc: 'Zero-cal natural sweetener' },

  // ── Chicken ────────────────────────────────────────────────────────────────
  { name: 'Chicken Curry Cut (500 g)', cat: 'Chicken', p: 18000, op: 22000, u: '500 g', desc: 'Farm-fresh curry pieces' },
  { name: 'Chicken Boneless (500 g)', cat: 'Chicken', p: 22000, op: 27000, u: '500 g', desc: 'Lean boneless breast' },
  { name: 'Chicken Wings (6 pcs)', cat: 'Chicken', p: 14000, op: 17000, u: '6 pcs (~450g)', desc: 'Meaty chicken wings' },
  { name: 'Chicken Mince (Keema)', cat: 'Chicken', p: 18000, op: 22000, u: '500 g', desc: 'Ground chicken keema' },
  { name: 'Chicken Sausages', cat: 'Chicken', p: 12000, op: 14500, u: '200 g', desc: 'Smoky chicken sausages' },
  { name: 'Chicken Franks', cat: 'Chicken', p: 10000, op: 12500, u: '200 g', desc: 'Ready-to-cook franks' },
  { name: 'Whole Chicken (Dressed)', cat: 'Chicken', p: 32000, op: 38000, u: '~1.2 kg', desc: 'Whole dressed broiler' },

  // ── Fish & Seafood ─────────────────────────────────────────────────────────
  { name: 'Rohu Fish (Cleaned)', cat: 'Fish & Seafood', p: 25000, op: 30000, u: '500 g', desc: 'Fresh water Rohu fish' },
  { name: 'Prawns (Medium)', cat: 'Fish & Seafood', p: 35000, op: 42000, u: '500 g', desc: 'De-veined medium prawns' },
  { name: 'Hilsa (Ilish) Pieces', cat: 'Fish & Seafood', p: 55000, op: 70000, u: '500 g', desc: 'Seasonal Hilsa fish' },
  { name: 'Pomfret (Paplet)', cat: 'Fish & Seafood', p: 48000, op: 58000, u: '2 pcs (~500g)', desc: 'White Pomfret fish' },
  { name: 'Tuna Can (in Brine)', cat: 'Fish & Seafood', p: 9500, op: 11500, u: '160 g', desc: 'Ready-to-eat tuna chunks' },
  { name: 'Surmai (King Fish)', cat: 'Fish & Seafood', p: 45000, op: 55000, u: '500 g', desc: 'Steak-cut king fish' },

  // ── Whole Spices ───────────────────────────────────────────────────────────
  { name: 'Cumin Seeds (Jeera)', cat: 'Whole Spices', p: 5500, op: 7000, u: '200 g', desc: 'Whole cumin seeds' },
  { name: 'Coriander Seeds', cat: 'Whole Spices', p: 4000, op: 5000, u: '200 g', desc: 'Whole dhania seeds' },
  { name: 'Black Pepper (Kali Mirch)', cat: 'Whole Spices', p: 10000, op: 12500, u: '100 g', desc: 'Black peppercorns' },
  { name: 'Cloves (Laung)', cat: 'Whole Spices', p: 12000, op: 15000, u: '50 g', desc: 'Aromatic cloves' },
  { name: 'Cardamom (Elaichi Green)', cat: 'Whole Spices', p: 25000, op: 30000, u: '50 g', desc: 'Green cardamom pods' },
  { name: 'Cinnamon Sticks', cat: 'Whole Spices', p: 8000, op: 10000, u: '100 g', desc: 'Ceylon cinnamon bark' },
  { name: 'Bay Leaves (Tej Patta)', cat: 'Whole Spices', p: 3000, op: 3800, u: '50 g', desc: 'Dried bay leaves' },
  { name: 'Star Anise (Chakri Phool)', cat: 'Whole Spices', p: 9000, op: 11000, u: '50 g', desc: 'Anise-flavoured star pods' },
  { name: 'Turmeric Powder (Haldi)', cat: 'Masala & Dry Fruits', p: 4500, op: 5500, u: '200 g', desc: 'Pure turmeric powder' },
  { name: 'Red Chilli Powder', cat: 'Masala & Dry Fruits', p: 6000, op: 7500, u: '200 g', desc: 'Hot Guntur chilli powder' },
  { name: 'Coriander Powder', cat: 'Masala & Dry Fruits', p: 4200, op: 5200, u: '200 g', desc: 'Ground coriander powder' },
  { name: 'Garam Masala', cat: 'Masala & Dry Fruits', p: 7500, op: 9000, u: '100 g', desc: 'Blended spice mix' },
  { name: 'MTR Sambar Powder', cat: 'Masala & Dry Fruits', p: 5500, op: 6500, u: '100 g', desc: 'Authentic South Indian blend' },
  { name: 'Everest Chicken Masala', cat: 'Masala & Dry Fruits', p: 8500, op: 10000, u: '100 g', desc: 'Special chicken spice mix' },
  { name: 'Kitchen King Masala', cat: 'Masala & Dry Fruits', p: 7000, op: 8500, u: '100 g', desc: 'Versatile all-purpose masala' },
  { name: 'Chaat Masala', cat: 'Masala & Dry Fruits', p: 4500, op: 5500, u: '100 g', desc: 'Tangy street food spice' },
  { name: 'Pav Bhaji Masala', cat: 'Masala & Dry Fruits', p: 5000, op: 6000, u: '100 g', desc: 'Mumbai-style bhaji spice' },
  { name: 'Biryani Masala', cat: 'Masala & Dry Fruits', p: 6500, op: 8000, u: '100 g', desc: 'Fragrant biryani spice blend' },

  // ── Dry Fruits & Nuts ──────────────────────────────────────────────────────
  { name: 'Almonds (Badam)', cat: 'Dry Fruits & Nuts', p: 55000, op: 65000, u: '250 g', desc: 'Premium California almonds' },
  { name: 'Cashews (Kaju)', cat: 'Dry Fruits & Nuts', p: 45000, op: 55000, u: '200 g', desc: 'Whole W320 cashews' },
  { name: 'Pistachios (Pista)', cat: 'Dry Fruits & Nuts', p: 65000, op: 75000, u: '200 g', desc: 'Roasted salted pistachios' },
  { name: 'Raisins (Kismis)', cat: 'Dry Fruits & Nuts', p: 9000, op: 11000, u: '200 g', desc: 'Golden yellow raisins' },
  { name: 'Walnuts (Akhrot)', cat: 'Dry Fruits & Nuts', p: 40000, op: 48000, u: '200 g', desc: 'Brain-shaped California walnuts' },
  { name: 'Dates (Khajoor)', cat: 'Dry Fruits & Nuts', p: 18000, op: 22000, u: '250 g', desc: 'Medjool Medjool dates' },
  { name: 'Figs (Anjeer)', cat: 'Dry Fruits & Nuts', p: 22000, op: 27000, u: '200 g', desc: 'Dried Afghan figs' },
  { name: 'Peanuts (Moongphali)', cat: 'Dry Fruits & Nuts', p: 5000, op: 6500, u: '200 g', desc: 'Roasted salted peanuts' },
  { name: 'Flax Seeds (Alsi)', cat: 'Dry Fruits & Nuts', p: 6000, op: 7500, u: '200 g', desc: 'Omega-rich flax seeds' },
  { name: 'Chia Seeds', cat: 'Dry Fruits & Nuts', p: 14000, op: 17000, u: '200 g', desc: 'Superfood chia seeds' },

  // ── Cereals & Oats ─────────────────────────────────────────────────────────
  { name: 'Quaker Oats', cat: 'Cereals & Oats', p: 9500, op: 12000, u: '500 g', desc: 'Rolled oats for porridge' },
  { name: 'Kelloggs Cornflakes', cat: 'Cereals & Oats', p: 12000, op: 15000, u: '475 g', desc: 'Classic breakfast cornflakes' },
  { name: 'Kelloggs Muesli', cat: 'Cereals & Oats', p: 22000, op: 27000, u: '500 g', desc: 'Fruit & nut muesli' },
  { name: 'Bagrry\'s Steel Cut Oats', cat: 'Cereals & Oats', p: 18000, op: 22000, u: '500 g', desc: 'Slow-cook steel cut oats' },
  { name: 'Maggi Masala Oats', cat: 'Cereals & Oats', p: 7500, op: 9000, u: '200 g', desc: 'Spiced masala instant oats' },
  { name: 'Chocos Chocolate Cereal', cat: 'Cereals & Oats', p: 11000, op: 13500, u: '375 g', desc: 'Chocolate wholegrain loops' },
  { name: 'Dalia (Broken Wheat)', cat: 'Cereals & Oats', p: 6000, op: 7500, u: '500 g', desc: 'Healthy broken wheat dalia' },
  { name: 'Granola — Honey Almond', cat: 'Cereals & Oats', p: 20000, op: 24000, u: '400 g', desc: 'Crunchy baked granola' },

  // ── Sauces & Spreads ───────────────────────────────────────────────────────
  { name: 'Maggi Hot & Sweet Sauce', cat: 'Sauces & Spreads', p: 9500, op: 11000, u: '500 g', desc: 'Tangy tomato chilli sauce' },
  { name: 'Kissan Tomato Ketchup', cat: 'Sauces & Spreads', p: 8500, op: 10000, u: '500 g', desc: 'Classic tomato ketchup' },
  { name: 'Dr. Oetker Mayonnaise', cat: 'Sauces & Spreads', p: 15000, op: 18000, u: '250 g', desc: 'Eggless mayo' },
  { name: 'Ching\'s Soy Sauce', cat: 'Sauces & Spreads', p: 7000, op: 8500, u: '200 ml', desc: 'Dark soy sauce' },
  { name: 'Tabasco Red Pepper Sauce', cat: 'Sauces & Spreads', p: 11000, op: 13000, u: '60 ml', desc: 'Hot Louisiana pepper sauce' },
  { name: 'Nutella (200 g)', cat: 'Sauces & Spreads', p: 18000, op: 22000, u: '200 g', desc: 'Hazelnut cocoa spread' },
  { name: 'Organic Honey', cat: 'Sauces & Spreads', p: 22000, op: 27000, u: '250 g', desc: 'Raw organic forest honey' },
  { name: 'Mixed Fruit Jam', cat: 'Sauces & Spreads', p: 9000, op: 11000, u: '200 g', desc: 'Kissan mixed fruit jam' },

  // ── Pickles & Chutney ──────────────────────────────────────────────────────
  { name: 'Mango Pickle (Aam Achaar)', cat: 'Pickles & Chutney', p: 9500, op: 12000, u: '500 g', desc: 'Spicy raw mango achaar' },
  { name: 'Mixed Vegetable Pickle', cat: 'Pickles & Chutney', p: 9000, op: 11000, u: '500 g', desc: 'Mix veg achaar in oil' },
  { name: 'Lime Pickle (Nimbu Achaar)', cat: 'Pickles & Chutney', p: 8500, op: 10500, u: '500 g', desc: 'Tangy lime pickle' },
  { name: 'Green Chilli Pickle', cat: 'Pickles & Chutney', p: 7500, op: 9500, u: '300 g', desc: 'Fiery green mirchi pickle' },
  { name: 'Imli (Tamarind) Chutney', cat: 'Pickles & Chutney', p: 6000, op: 7500, u: '200 g', desc: 'Sweet-sour tamarind chutney' },
  { name: 'Coriander Mint Chutney', cat: 'Pickles & Chutney', p: 5500, op: 7000, u: '200 g', desc: 'Fresh hari chutney' },

  // ── Noodles & Pasta ────────────────────────────────────────────────────────
  { name: 'Maggi Noodles (2 min)', cat: 'Noodles & Pasta', p: 1500, op: 1500, u: '70 g', desc: 'Classic masala noodles' },
  { name: 'Maggi Noodles (4-pack)', cat: 'Noodles & Pasta', p: 5500, op: 5500, u: '280 g', desc: '4-pack masala Maggi' },
  { name: 'Ching\'s Hakka Noodles', cat: 'Noodles & Pasta', p: 7000, op: 8500, u: '200 g', desc: 'Indo-Chinese hakka noodles' },
  { name: 'Sunfeast Yippee Noodles', cat: 'Noodles & Pasta', p: 5000, op: 5500, u: '140 g (2-pack)', desc: 'Long slurpy noodles' },
  { name: 'Barilla Penne Pasta', cat: 'Noodles & Pasta', p: 18000, op: 22000, u: '500 g', desc: 'Italian bronze-die penne' },
  { name: 'Barilla Spaghetti', cat: 'Noodles & Pasta', p: 18000, op: 22000, u: '500 g', desc: 'Authentic Italian spaghetti' },
  { name: 'Fusilli Pasta', cat: 'Noodles & Pasta', p: 15000, op: 18000, u: '500 g', desc: 'Spiral fusilli pasta' },
  { name: 'Rice Noodles', cat: 'Noodles & Pasta', p: 9000, op: 11000, u: '200 g', desc: 'Thai-style rice noodles' },

  // ── Ready to Eat ───────────────────────────────────────────────────────────
  { name: 'MTR Palak Paneer (250 g)', cat: 'Ready to Eat', p: 10500, op: 13000, u: '250 g', desc: 'Microwave-ready palak paneer' },
  { name: 'MTR Dal Makhani', cat: 'Ready to Eat', p: 10500, op: 13000, u: '250 g', desc: 'Creamy ready dal makhani' },
  { name: 'Haldirams Pouch Shahi Paneer', cat: 'Ready to Eat', p: 9500, op: 12000, u: '250 g', desc: 'Heat-and-eat shahi paneer' },
  { name: 'ITC Kitchens of India Dal', cat: 'Ready to Eat', p: 11000, op: 14000, u: '250 g', desc: 'Dum cooked lentil curry' },
  { name: 'Tasty Bite Channa Masala', cat: 'Ready to Eat', p: 12000, op: 15000, u: '285 g', desc: 'Spiced chickpea ready meal' },
  { name: 'Gits Rava Idli Mix', cat: 'Ready to Eat', p: 8000, op: 10000, u: '200 g', desc: 'Instant soft idli mix' },
  { name: 'MDH Biryani Paste', cat: 'Ready to Eat', p: 6500, op: 8000, u: '100 g', desc: 'Ready biryani paste' },

  // ── Canned & Tinned Food ───────────────────────────────────────────────────
  { name: 'Del Monte Corn (Cream Style)', cat: 'Canned & Tinned Food', p: 12000, op: 15000, u: '418 g', desc: 'Creamy canned sweet corn' },
  { name: 'Del Monte Whole Mushrooms', cat: 'Canned & Tinned Food', p: 10000, op: 12500, u: '400 g', desc: 'Canned button mushrooms' },
  { name: 'Heinz Baked Beans', cat: 'Canned & Tinned Food', p: 11000, op: 13500, u: '415 g', desc: 'Classic baked beans in sauce' },
  { name: 'Tuna in Olive Oil', cat: 'Canned & Tinned Food', p: 15000, op: 18000, u: '185 g', desc: 'Premium tuna in EVOO' },
  { name: 'Tomato Puree (Tetra)', cat: 'Canned & Tinned Food', p: 5500, op: 7000, u: '200 g', desc: 'Thick tomato puree' },

  // ── Tea ────────────────────────────────────────────────────────────────────
  { name: 'Tata Chai Classic (250 g)', cat: 'Tea', p: 12000, op: 14500, u: '250 g', desc: 'Blended CTC chai' },
  { name: 'Red Label Natural Care Tea', cat: 'Tea', p: 14000, op: 17000, u: '250 g', desc: 'Brahmi & Ashwagandha blend' },
  { name: 'Lipton Green Tea', cat: 'Tea', p: 12500, op: 15000, u: '25 bags', desc: 'Antioxidant green tea bags' },
  { name: 'Darjeeling First Flush Tea', cat: 'Tea', p: 35000, op: 42000, u: '100 g', desc: 'Premium first flush Darjeeling' },
  { name: 'Chamomile Herbal Tea', cat: 'Tea', p: 18000, op: 22000, u: '20 bags', desc: 'Soothing chamomile blend' },
  { name: 'Masala Chai Premix', cat: 'Tea', p: 15000, op: 18000, u: '200 g', desc: 'Spiced chai premix powder' },
  { name: 'Tulsi Green Tea', cat: 'Tea', p: 14000, op: 17000, u: '25 bags', desc: 'Holy basil green tea' },

  // ── Coffee ─────────────────────────────────────────────────────────────────
  { name: 'Nescafe Classic (100 g)', cat: 'Coffee', p: 25000, op: 30000, u: '100 g', desc: 'Iconic instant coffee' },
  { name: 'Bru Gold Instant Coffee', cat: 'Coffee', p: 22000, op: 27000, u: '100 g', desc: 'Chicory-blend instant coffee' },
  { name: 'Blue Tokai Vienna Roast', cat: 'Coffee', p: 55000, op: 65000, u: '250 g', desc: 'Craft medium-dark roast beans' },
  { name: 'Sleepy Owl Cold Brew', cat: 'Coffee', p: 25000, op: 30000, u: '3 bottles', desc: 'Ready-to-drink cold brew' },
  { name: 'Davidoff Rich Aroma', cat: 'Coffee', p: 45000, op: 55000, u: '100 g', desc: 'Premium dark instant coffee' },
  { name: 'Third Wave Ground Coffee', cat: 'Coffee', p: 48000, op: 58000, u: '250 g', desc: 'Specialty micro-lot pour-over' },
  { name: 'Nescafe 3-in-1 Sachets', cat: 'Coffee', p: 18000, op: 22000, u: '20 sachets', desc: 'Coffee + creamer + sugar sachets' },

  // ── Carbonated Drinks ──────────────────────────────────────────────────────
  { name: 'Coca Cola (750 ml)', cat: 'Carbonated Drinks', p: 4000, op: 4000, u: '750 ml', desc: 'Iconic cola beverage' },
  { name: 'Pepsi (750 ml)', cat: 'Carbonated Drinks', p: 4000, op: 4000, u: '750 ml', desc: 'Refreshing pepsi cola' },
  { name: 'Sprite (750 ml)', cat: 'Carbonated Drinks', p: 4000, op: 4000, u: '750 ml', desc: 'Lemon-lime clear soda' },
  { name: 'Thums Up (750 ml)', cat: 'Carbonated Drinks', p: 4000, op: 4000, u: '750 ml', desc: 'Strong thunder cola' },
  { name: 'Limca (750 ml)', cat: 'Carbonated Drinks', p: 4000, op: 4000, u: '750 ml', desc: 'Lemony sparkling drink' },
  { name: 'Mountain Dew (600 ml)', cat: 'Carbonated Drinks', p: 4000, op: 4000, u: '600 ml', desc: 'Citrusy neon soda' },
  { name: 'Fanta Orange (750 ml)', cat: 'Carbonated Drinks', p: 4000, op: 4000, u: '750 ml', desc: 'Fizzy orange soda' },
  { name: 'Boro Plus Soda Water', cat: 'Carbonated Drinks', p: 2500, op: 2500, u: '500 ml', desc: 'Plain sparkling water' },
  { name: 'Tonic Water', cat: 'Carbonated Drinks', p: 9000, op: 11000, u: '300 ml', desc: 'Schweppes tonic water' },

  // ── Fruit Juices & Nectars ─────────────────────────────────────────────────
  { name: 'Tropicana Orange (1 L)', cat: 'Fruit Juices & Nectars', p: 14500, op: 17000, u: '1 L', desc: 'No-pulp orange juice' },
  { name: 'Real Fruit Power (1 L)', cat: 'Fruit Juices & Nectars', p: 13500, op: 16000, u: '1 L', desc: 'Mixed fruit juice' },
  { name: 'Paper Boat Aam Panna', cat: 'Fruit Juices & Nectars', p: 3500, op: 3500, u: '200 ml', desc: 'Raw mango drink' },
  { name: 'Paper Boat Jaljeera', cat: 'Fruit Juices & Nectars', p: 3500, op: 3500, u: '200 ml', desc: 'Cooling jaljeera drink' },
  { name: 'Maaza Mango (250 ml)', cat: 'Fruit Juices & Nectars', p: 2000, op: 2000, u: '250 ml', desc: 'Thick mango drink' },
  { name: 'Slice Mango (200 ml)', cat: 'Fruit Juices & Nectars', p: 1800, op: 1800, u: '200 ml', desc: 'Aam Ras slice drink' },
  { name: 'Minute Maid Pulpy Orange', cat: 'Fruit Juices & Nectars', p: 2000, op: 2000, u: '400 ml', desc: 'Pulpy cold pressed OJ' },
  { name: 'Cranberry Juice (Ocean Spray)', cat: 'Fruit Juices & Nectars', p: 25000, op: 30000, u: '1 L', desc: 'Antioxidant cranberry juice' },
  { name: 'Coconut Water (Tender 250 ml)', cat: 'Fruit Juices & Nectars', p: 5500, op: 7000, u: '250 ml', desc: 'Packaged tender coconut water' },

  // ── Energy & Sports Drinks ─────────────────────────────────────────────────
  { name: 'Red Bull (250 ml)', cat: 'Energy & Sports Drinks', p: 12500, op: 12500, u: '250 ml', desc: 'Wings energy drink' },
  { name: 'Monster Energy (355 ml)', cat: 'Energy & Sports Drinks', p: 12000, op: 12000, u: '355 ml', desc: 'Green monster energy' },
  { name: 'Sting Berry (250 ml)', cat: 'Energy & Sports Drinks', p: 3000, op: 3000, u: '250 ml', desc: 'Berry flavour energy' },
  { name: 'Gatorade Lemon Lime', cat: 'Energy & Sports Drinks', p: 9500, op: 12000, u: '500 ml', desc: 'Electrolyte sports drink' },
  { name: 'Glucon-D Nimbu Pani', cat: 'Energy & Sports Drinks', p: 6500, op: 8000, u: '200 g', desc: 'Glucose energy powder' },
  { name: 'ORS (Electral) Oral Sachets', cat: 'Energy & Sports Drinks', p: 8500, op: 10000, u: '5 sachets', desc: 'Orange oral rehydration salts' },

  // ── Water & Coconut Water ──────────────────────────────────────────────────
  { name: 'Bisleri 1 L', cat: 'Water & Coconut Water', p: 2000, op: 2000, u: '1 L', desc: 'Packaged drinking water' },
  { name: 'Bisleri 2 L', cat: 'Water & Coconut Water', p: 3500, op: 3500, u: '2 L', desc: 'Large packaged water' },
  { name: 'Evian Mineral Water', cat: 'Water & Coconut Water', p: 22000, op: 25000, u: '750 ml', desc: 'Natural French mineral water' },
  { name: 'Sparkle Sparkling Water', cat: 'Water & Coconut Water', p: 8000, op: 10000, u: '500 ml', desc: 'Flavoured sparkling water' },
  { name: 'Raw Pressery Coconut Water', cat: 'Water & Coconut Water', p: 9000, op: 11000, u: '200 ml', desc: 'Pure tender coconut water' },
  { name: 'Coco SOUL Coconut Water', cat: 'Water & Coconut Water', p: 7500, op: 9000, u: '200 ml', desc: 'Chilled coconut water' },

  // ── Chips & Crisps ─────────────────────────────────────────────────────────
  { name: 'Lays Classic Salted (50 g)', cat: 'Chips & Crisps', p: 2000, op: 2000, u: '50 g', desc: 'Thin salted potato chips' },
  { name: 'Lays American Cream Onion', cat: 'Chips & Crisps', p: 2000, op: 2000, u: '50 g', desc: 'Cream & onion wafers' },
  { name: 'Bingo Tedhe Medhe (50 g)', cat: 'Chips & Crisps', p: 2000, op: 2000, u: '50 g', desc: 'Twisted spicy corn chips' },
  { name: 'Kettle Studio Sea Salt', cat: 'Chips & Crisps', p: 9500, op: 12000, u: '140 g', desc: 'Thick-cut kettle crisps' },
  { name: 'Doritos Nacho Cheese', cat: 'Chips & Crisps', p: 9500, op: 11500, u: '100 g', desc: 'Cheesy tortilla triangles' },
  { name: 'Pringles Original (110 g)', cat: 'Chips & Crisps', p: 15000, op: 18000, u: '110 g', desc: 'Stacked potato crisps' },
  { name: 'Too Yumm Multigrain Chips', cat: 'Chips & Crisps', p: 3500, op: 4000, u: '55 g', desc: '50% less fat multigrain' },
  { name: 'Baked Tostadas (Corn Chips)', cat: 'Chips & Crisps', p: 7500, op: 9000, u: '120 g', desc: 'Baked crispy corn chips' },

  // ── Namkeen & Bhujia ───────────────────────────────────────────────────────
  { name: 'Haldirams Bhujia Sev (200 g)', cat: 'Namkeen & Bhujia', p: 5500, op: 6500, u: '200 g', desc: 'Classic bhujia sev' },
  { name: 'Haldirams Aloo Bhujia', cat: 'Namkeen & Bhujia', p: 5500, op: 6500, u: '200 g', desc: 'Potato-flavoured bhujia' },
  { name: 'Kurkure Masala Munch', cat: 'Namkeen & Bhujia', p: 2000, op: 2000, u: '90 g', desc: 'Corn puff masala crunch' },
  { name: 'Bikano Chana Chur Garam', cat: 'Namkeen & Bhujia', p: 6000, op: 7500, u: '200 g', desc: 'Crispy roasted chana namkeen' },
  { name: 'Garlic Moong Fry', cat: 'Namkeen & Bhujia', p: 7000, op: 8500, u: '200 g', desc: 'Garlicky fried moong dal' },
  { name: 'Raj Kachori Mix', cat: 'Namkeen & Bhujia', p: 8000, op: 10000, u: '200 g', desc: 'Tangy kachori street mix' },
  { name: 'Roasted Chana (Phalia)', cat: 'Namkeen & Bhujia', p: 5500, op: 7000, u: '200 g', desc: 'Roasted peanut-chana blend' },

  // ── Munchies (general snacks) ──────────────────────────────────────────────
  { name: 'Popcorn (Salted)', cat: 'Munchies', p: 3500, op: 4500, u: '80 g', desc: 'Microwave ready salted popcorn' },
  { name: 'Popcorn (Butter)', cat: 'Munchies', p: 3500, op: 4500, u: '80 g', desc: 'Butter popcorn pack' },
  { name: 'Cheeto\'s Masala Balls', cat: 'Munchies', p: 2000, op: 2000, u: '50 g', desc: 'Puffy cheese corn balls' },
  { name: 'Ruffles Extra Crunch', cat: 'Munchies', p: 2500, op: 3000, u: '55 g', desc: 'Ridged potato crisps' },
  { name: 'Cornitos Nachos (50 g)', cat: 'Munchies', p: 3000, op: 3500, u: '50 g', desc: 'Party-size nacho chips' },

  // ── Biscuits & Cookies ─────────────────────────────────────────────────────
  { name: 'Parle-G Glucose Biscuits', cat: 'Biscuits & Cookies', p: 1500, op: 1500, u: '100 g', desc: 'India\'s favourite glucose biscuit' },
  { name: 'Britannia Marie Gold', cat: 'Biscuits & Cookies', p: 3500, op: 4000, u: '250 g', desc: 'Light tea time biscuit' },
  { name: 'Britannia Good Day Cashew', cat: 'Biscuits & Cookies', p: 3000, op: 3500, u: '218 g', desc: 'Buttery cashew cookies' },
  { name: 'Dark Fantasy Choco Fills', cat: 'Biscuits & Cookies', p: 5500, op: 6500, u: '300 g', desc: 'Chocolate filled cookies' },
  { name: 'Oreo Original Cream (120 g)', cat: 'Biscuits & Cookies', p: 4000, op: 4500, u: '120 g', desc: 'Classic sandwich cookies' },
  { name: 'Oreo Double Stuff', cat: 'Biscuits & Cookies', p: 5500, op: 6500, u: '157 g', desc: '2x cream Oreo cookies' },
  { name: 'McVitie\'s Digestive Biscuits', cat: 'Biscuits & Cookies', p: 9500, op: 11500, u: '250 g', desc: 'Wheat fibre digestive' },
  { name: 'Hide & Seek Choco Chips', cat: 'Biscuits & Cookies', p: 5500, op: 6500, u: '300 g', desc: 'Chocolate chip biscuits' },
  { name: '50-50 Sweet & Salty', cat: 'Biscuits & Cookies', p: 3000, op: 3500, u: '200 g', desc: 'Crunchy sweet salty biscuit' },
  { name: 'Nutrichoice Digestive Oats', cat: 'Biscuits & Cookies', p: 6500, op: 8000, u: '200 g', desc: 'Fibre-rich oat digestive' },

  // ── Chocolates & Sweets ────────────────────────────────────────────────────
  { name: 'Dairy Milk Silk (60 g)', cat: 'Chocolates & Sweets', p: 9500, op: 11500, u: '60 g', desc: 'Smooth milk chocolate' },
  { name: 'Dairy Milk (80 g)', cat: 'Chocolates & Sweets', p: 6500, op: 8000, u: '80 g', desc: 'Classic Cadbury milk choc' },
  { name: 'KitKat 4-finger', cat: 'Chocolates & Sweets', p: 4500, op: 5500, u: '41.5 g', desc: 'Crispy wafer in choc' },
  { name: 'Snickers Bar', cat: 'Chocolates & Sweets', p: 5000, op: 5500, u: '50 g', desc: 'Peanuts, caramel & nougat' },
  { name: 'Bournville Dark 70%', cat: 'Chocolates & Sweets', p: 9500, op: 12000, u: '80 g', desc: '70% dark chocolate bar' },
  { name: 'Toblerone (100 g)', cat: 'Chocolates & Sweets', p: 15000, op: 18000, u: '100 g', desc: 'Swiss triangle chocolate' },
  { name: 'Ferrero Rocher (3 pcs)', cat: 'Chocolates & Sweets', p: 12000, op: 14500, u: '37.5 g', desc: 'Golden hazelnut pralines' },
  { name: 'Lindt Lindor Milk Truffles', cat: 'Chocolates & Sweets', p: 30000, op: 36000, u: '200 g', desc: 'Swiss smooth truffles' },
  { name: 'Lotte Choco Pie (6 pcs)', cat: 'Chocolates & Sweets', p: 8000, op: 10000, u: '168 g', desc: 'Soft marshmallow choco pies' },

  // ── Sweet Cravings ─────────────────────────────────────────────────────────
  { name: 'Gulab Jamun Mix (200 g)', cat: 'Sweet Cravings', p: 7000, op: 8500, u: '200 g', desc: 'Easy gulab jamun mix' },
  { name: 'Haldirams Kaju Katli (250 g)', cat: 'Sweet Cravings', p: 45000, op: 55000, u: '250 g', desc: 'Cashew diamond sweets' },
  { name: 'MTR Kesari Bath Mix', cat: 'Sweet Cravings', p: 8000, op: 10000, u: '200 g', desc: 'Saffron rava sweet mix' },
  { name: 'Rasgulla (1 kg tin)', cat: 'Sweet Cravings', p: 22000, op: 27000, u: '1 kg', desc: 'Spongy Bengal rasgulla' },
  { name: 'Jalebi (Fresh)', cat: 'Sweet Cravings', p: 18000, op: 22000, u: '500 g', desc: 'Crispy syrup-soaked jalebi' },
  { name: 'Ladoo Motichoor (500 g)', cat: 'Sweet Cravings', p: 25000, op: 30000, u: '500 g', desc: 'Gram flour besan ladoo' },

  // ── Ice Creams & More ──────────────────────────────────────────────────────
  { name: 'Amul Vanilla Ice Cream', cat: 'Ice Creams & More', p: 13000, op: 15000, u: '500 ml', desc: 'Classic vanilla tub' },
  { name: 'Amul Chocolate Ice Cream', cat: 'Ice Creams & More', p: 14000, op: 17000, u: '500 ml', desc: 'Rich chocolate ice cream' },
  { name: 'Kwality Walls Cornetto', cat: 'Ice Creams & More', p: 5500, op: 6500, u: '1 pc × 90 ml', desc: 'Cone with chocolate crunch' },
  { name: 'Magnum Mini Almond (3 pcs)', cat: 'Ice Creams & More', p: 18000, op: 22000, u: '3 pcs × 60 ml', desc: 'Belgian choco almond bars' },
  { name: 'Naturals Alphonso Mango', cat: 'Ice Creams & More', p: 16000, op: 19000, u: '125 ml', desc: 'Real fruit Alphonso scoop' },
  { name: 'Creambell Butterscotch', cat: 'Ice Creams & More', p: 12000, op: 14500, u: '500 ml', desc: 'Nutty butterscotch ice cream' },
  { name: 'Kulfi (Matka Stick)', cat: 'Ice Creams & More', p: 4500, op: 5500, u: '1 pc × 60 ml', desc: 'Desi style matka kulfi' },

  // ── Frozen Food ────────────────────────────────────────────────────────────
  { name: 'McCain French Fries (600 g)', cat: 'Frozen Food', p: 19000, op: 24000, u: '600 g', desc: 'Crispy straight-cut fries' },
  { name: 'ITC Master Chef Aaloo Tikki', cat: 'Frozen Food', p: 12000, op: 15000, u: '300 g', desc: 'Ready-to-fry aloo tikkis' },
  { name: 'Godrej Yummiez Burger Patty', cat: 'Frozen Food', p: 14000, op: 17000, u: '250 g', desc: 'Veggie cheese burger patties' },
  { name: 'Haldirams Paneer Samosa', cat: 'Frozen Food', p: 11000, op: 14000, u: '6 pcs (~300g)', desc: 'Frozen paneer samosas' },
  { name: 'Frozen Mixed Vegetables', cat: 'Frozen Food', p: 7500, op: 9000, u: '500 g', desc: 'Peas, corn, beans frozen mix' },
  { name: 'Amul Frozen Paratha (5 pcs)', cat: 'Frozen Food', p: 13000, op: 15500, u: '5 pcs', desc: 'Laccha frozen parathas' },
  { name: 'Chicken Nuggets (Godrej)', cat: 'Frozen Food', p: 18000, op: 22000, u: '250 g', desc: 'Crispy chicken nuggets' },
  { name: 'Frozen Onion Rings', cat: 'Frozen Food', p: 9500, op: 12000, u: '300 g', desc: 'Battered crispy onion rings' },

  // ── Cleaning Essentials ────────────────────────────────────────────────────
  { name: 'Surf Excel Easy Wash (1.5 kg)', cat: 'Cleaning Essentials', p: 16500, op: 19500, u: '1.5 kg', desc: 'Top-load washing powder' },
  { name: 'Ariel Matic Front Load (1 kg)', cat: 'Cleaning Essentials', p: 22000, op: 27000, u: '1 kg', desc: 'Front-load detergent' },
  { name: 'Vim Dishwash Bar', cat: 'Cleaning Essentials', p: 4000, op: 5000, u: '155 g × 2', desc: 'Lemon dishwash bar' },
  { name: 'Vim Dishwash Gel (500 ml)', cat: 'Cleaning Essentials', p: 11000, op: 13000, u: '500 ml', desc: 'Concentrated dish gel' },
  { name: 'Lizol Floor Cleaner (500 ml)', cat: 'Cleaning Essentials', p: 14000, op: 17000, u: '500 ml', desc: 'Multi-surface floor cleaner' },
  { name: 'Colin Glass Cleaner', cat: 'Cleaning Essentials', p: 9500, op: 11500, u: '250 ml', desc: 'Streak-free glass spray' },
  { name: 'Scotch-Brite Scrub Pad (2 pc)', cat: 'Cleaning Essentials', p: 4500, op: 5500, u: '2 pcs', desc: 'Non-scratch scrub sponge' },
  { name: 'HIT Cockroach Spray', cat: 'Cleaning Essentials', p: 14500, op: 17500, u: '200 ml', desc: 'Instant cockroach killer' },
  { name: 'Good Knight Liquid Mosquito (45N)', cat: 'Cleaning Essentials', p: 18000, op: 22000, u: '45 nts', desc: 'Liquid mosquito repellent refill' },

  // ── Laundry ────────────────────────────────────────────────────────────────
  { name: 'Rin Detergent Powder (1 kg)', cat: 'Laundry', p: 9500, op: 12000, u: '1 kg', desc: 'Whitening detergent powder' },
  { name: 'Tide Plus Extra Power (2 kg)', cat: 'Laundry', p: 25000, op: 30000, u: '2 kg', desc: 'Power whitening powder' },
  { name: 'Ezi (Stain Remover)', cat: 'Laundry', p: 7500, op: 9000, u: '200 g', desc: 'Fabric stain remover powder' },
  { name: 'Comfort Fabric Softener', cat: 'Laundry', p: 12500, op: 15000, u: '800 ml', desc: 'Rose scent softener' },
  { name: 'Vanish Stain Remover (Oxi Action)', cat: 'Laundry', p: 22000, op: 27000, u: '450 g', desc: 'Oxygen-powered stain lift' },
  { name: 'Liquid Detergent (Pril)', cat: 'Laundry', p: 14000, op: 17000, u: '500 ml', desc: 'Colour-safe liquid detergent' },

  // ── Toilet & Floor Cleaners ────────────────────────────────────────────────
  { name: 'Harpic Power Plus (500 ml)', cat: 'Toilet & Floor Cleaners', p: 14500, op: 17500, u: '500 ml', desc: '10x toilet cleaner' },
  { name: 'Domex Toilet Cleaner (500 ml)', cat: 'Toilet & Floor Cleaners', p: 13000, op: 15500, u: '500 ml', desc: 'Thick bleach toilet cleaner' },
  { name: 'Dettol Multi-purpose Cleaner', cat: 'Toilet & Floor Cleaners', p: 12000, op: 15000, u: '500 ml', desc: 'Anti-bacterial surface cleaner' },
  { name: 'Toilet Brush & Holder', cat: 'Toilet & Floor Cleaners', p: 18000, op: 22000, u: '1 set', desc: 'Flexible bristle toilet brush' },
  { name: 'Phenyl Concentrate (Floor)', cat: 'Toilet & Floor Cleaners', p: 8000, op: 10000, u: '500 ml', desc: 'Disinfectant floor cleaner' },

  // ── Personal Care ──────────────────────────────────────────────────────────
  { name: 'Dettol Original Soap (75 g)', cat: 'Personal Care', p: 4500, op: 5500, u: '75 g', desc: 'Antibacterial protection soap' },
  { name: 'Lux Soft Touch Soap (150 g)', cat: 'Personal Care', p: 5500, op: 6500, u: '150 g', desc: 'Petal-soft beauty bar' },
  { name: 'Dove Beauty Bar (100 g)', cat: 'Personal Care', p: 6500, op: 8000, u: '100 g', desc: 'Moisturizing beauty bar' },
  { name: 'Colgate Strong Teeth (200 g)', cat: 'Personal Care', p: 9500, op: 11000, u: '200 g', desc: 'Cavity protection paste' },
  { name: 'Sensodyne Sensitive Toothpaste', cat: 'Personal Care', p: 18000, op: 22000, u: '100 g', desc: 'Sensitivity relief paste' },
  { name: 'Oral-B Toothbrush (Soft)', cat: 'Personal Care', p: 8000, op: 10000, u: '1 pc', desc: 'Soft bristle toothbrush' },
  { name: 'Gillette Guard Razor', cat: 'Personal Care', p: 6500, op: 8000, u: '1 pc', desc: 'Single blade safety razor' },
  { name: 'Gillette Foam (200 g)', cat: 'Personal Care', p: 13500, op: 16000, u: '200 g', desc: 'Regular sensitive foam' },
  { name: 'Whisper Ultra Thin (7s)', cat: 'Personal Care', p: 7000, op: 8500, u: '7 pcs', desc: 'Ultra-thin panty liners' },
  { name: 'Stayfree Secure Pads (7s)', cat: 'Personal Care', p: 7500, op: 9000, u: '7 pcs', desc: 'Dry cover secure pads' },

  // ── Skincare ───────────────────────────────────────────────────────────────
  { name: 'Cetaphil Moisturising Lotion', cat: 'Skincare', p: 55000, op: 65000, u: '250 ml', desc: 'Gentle non-greasy lotion' },
  { name: 'Lakme Sun Expert SPF 50', cat: 'Skincare', p: 32000, op: 38000, u: '50 ml', desc: 'Ultra-light sunscreen' },
  { name: 'Minimalist Niacinamide 10%', cat: 'Skincare', p: 45000, op: 55000, u: '30 ml', desc: 'Pore-reducing serum' },
  { name: 'Plum Vitamin C Serum', cat: 'Skincare', p: 60000, op: 72000, u: '30 ml', desc: 'Brightening Vit C serum' },
  { name: 'Himalaya Neem Face Wash', cat: 'Skincare', p: 14500, op: 17500, u: '150 ml', desc: 'Purifying neem cleanser' },
  { name: 'Fair & Lovely Cream (25 g)', cat: 'Skincare', p: 4500, op: 5500, u: '25 g', desc: 'Glow cream with Vit B3' },
  { name: 'Pond\'s Moisturiser (50 ml)', cat: 'Skincare', p: 8500, op: 10500, u: '50 ml', desc: 'Daily moisturizer' },
  { name: 'Neutrogena Hydro Boost Gel', cat: 'Skincare', p: 85000, op: 100000, u: '47 ml', desc: 'Hyaluronic acid gel-cream' },

  // ── Haircare ───────────────────────────────────────────────────────────────
  { name: 'Pantene Smooth & Silky Shampoo', cat: 'Haircare', p: 22000, op: 27000, u: '340 ml', desc: 'Antidamage smooth shampoo' },
  { name: 'Head & Shoulders Anti-dandruff', cat: 'Haircare', p: 22000, op: 27000, u: '340 ml', desc: 'Dandruff control shampoo' },
  { name: 'Dove Intense Repair Conditioner', cat: 'Haircare', p: 25000, op: 30000, u: '175 ml', desc: 'Keratin repair conditioner' },
  { name: 'Vatika Hair Oil (300 ml)', cat: 'Haircare', p: 22000, op: 27000, u: '300 ml', desc: 'Enriched Vatika coconut oil' },
  { name: 'Indulekha Bringha Oil (100 ml)', cat: 'Haircare', p: 48000, op: 58000, u: '100 ml', desc: 'Vedic hair fall control oil' },
  { name: 'Streax Hair Vitamin Serum', cat: 'Haircare', p: 18000, op: 22000, u: '45 ml', desc: 'Anti-frizz vitamin serum' },
  { name: 'Livon Silky Potion Serum', cat: 'Haircare', p: 8500, op: 10500, u: '2 pcs × 20 ml', desc: 'Instant smooth serum sachet' },

  // ── Bath & Body ────────────────────────────────────────────────────────────
  { name: 'Fiama Shower Gel Peach (250 ml)', cat: 'Bath & Body', p: 20000, op: 24000, u: '250 ml', desc: 'Moisturizing shower gel' },
  { name: 'Dettol Cool Shower Gel', cat: 'Bath & Body', p: 22000, op: 27000, u: '200 ml', desc: 'Menthol cool shower gel' },
  { name: 'Park Avenue Cologne Spray', cat: 'Bath & Body', p: 22000, op: 27000, u: '150 ml', desc: 'Long-lasting body cologne' },
  { name: 'Nycil Cool Talc Powder', cat: 'Bath & Body', p: 9500, op: 11500, u: '150 g', desc: 'Prickly heat talc' },
  { name: 'Parachute Body Lotion', cat: 'Bath & Body', p: 18000, op: 22000, u: '250 ml', desc: 'Coconut milk lotion' },
  { name: 'Forest Essentials Scrub', cat: 'Bath & Body', p: 180000, op: 210000, u: '100 g', desc: 'Luxury Ayurvedic body scrub' },
  { name: 'Gillette Body Wash Men', cat: 'Bath & Body', p: 30000, op: 36000, u: '250 ml', desc: 'Arctic ice body wash' },

  // ── Baby Care ──────────────────────────────────────────────────────────────
  { name: 'Pampers Active Baby (M) 56s', cat: 'Baby Care', p: 55000, op: 65000, u: '56 pcs', desc: 'Medium baby diapers' },
  { name: 'Johnson\'s Baby Shampoo', cat: 'Baby Care', p: 18000, op: 22000, u: '200 ml', desc: 'Tear-free baby shampoo' },
  { name: 'Johnson\'s Baby Powder (200 g)', cat: 'Baby Care', p: 15000, op: 18000, u: '200 g', desc: 'Soft gentle baby powder' },
  { name: 'Himalaya Baby Lotion (200 ml)', cat: 'Baby Care', p: 22000, op: 27000, u: '200 ml', desc: 'Extra moisturising baby lotion' },
  { name: 'Huggies Newborn Diapers (24s)', cat: 'Baby Care', p: 45000, op: 55000, u: '24 pcs', desc: 'Soft newborn diapers' },
  { name: 'Cerelac Wheat (Stage 1)', cat: 'Baby Care', p: 28000, op: 33000, u: '300 g', desc: 'Nestlé baby cereal wheat' },
  { name: 'Farex Baby Food (300 g)', cat: 'Baby Care', p: 22000, op: 27000, u: '300 g', desc: 'Fortified baby cereal' },
  { name: 'Baby Wipes (Mee Mee) 72s', cat: 'Baby Care', p: 22000, op: 27000, u: '72 wipes', desc: 'Gentle water-based wipes' },
  { name: 'Pigeon Baby Bottle (240 ml)', cat: 'Baby Care', p: 32000, op: 38000, u: '1 pc', desc: 'Anti-colic bottle' },

  // ── Pet Care ───────────────────────────────────────────────────────────────
  { name: 'Pedigree Adult Dog Food (1.2 kg)', cat: 'Pet Care', p: 45000, op: 55000, u: '1.2 kg', desc: 'Chicken & veg dog kibble' },
  { name: 'Drools Dog Biscuits', cat: 'Pet Care', p: 18000, op: 22000, u: '400 g', desc: 'Fun-shaped dog biscuits' },
  { name: 'Whiskas Cat Food (Adult)', cat: 'Pet Care', p: 22000, op: 27000, u: '480 g', desc: 'Ocean fish cat kibble' },
  { name: 'Royal Canin Kitten Food', cat: 'Pet Care', p: 65000, op: 78000, u: '400 g', desc: 'Premium kitten dry food' },
  { name: 'Pet-Sure Shampoo (200 ml)', cat: 'Pet Care', p: 22000, op: 27000, u: '200 ml', desc: 'Anti-tick pet shampoo' },
  { name: 'Pet Cooling Mat', cat: 'Pet Care', p: 55000, op: 65000, u: '1 pc', desc: 'Self-cooling gel mat XL' },
  { name: 'Dog Collar (adjustable)', cat: 'Pet Care', p: 18000, op: 22000, u: '1 pc', desc: 'Nylon adjustable collar' },

  // ── Paan Corner ────────────────────────────────────────────────────────────
  { name: 'Pan Masala Rajnigandha (Tin)', cat: 'Paan Corner', p: 8000, op: 10000, u: '100 g', desc: 'Premium silver cardamom pan' },
  { name: 'Meetha Paan Leaves (5 pcs)', cat: 'Paan Corner', p: 5000, op: 6500, u: '5 pcs', desc: 'Fresh betel leaves' },
  { name: 'Saunf (Fennel Seeds)', cat: 'Paan Corner', p: 4500, op: 5500, u: '200 g', desc: 'Mouth freshener fennel seeds' },
  { name: 'Mukhwas Gulkand Mix', cat: 'Paan Corner', p: 7000, op: 8500, u: '200 g', desc: 'Rose petal mukhwas blend' },
  { name: 'Pan Candy Sticks', cat: 'Paan Corner', p: 3500, op: 4500, u: '20 sticks', desc: 'Candy paan flavoured sticks' },
];

// ─── 3 Store IDs from the DB ──────────────────────────────────────────────────
const STORE_IDS = ['st_zepto_central', 'st_fresh_market', 'st_gourmet_corner'];

async function getStoreIds() {
  const res = await db.query('SELECT id FROM stores LIMIT 10');
  return res.rows.map(r => r.id);
}

async function seed() {
  console.log('🚀  Mega-seed starting…');

  let storeIds;
  try {
    storeIds = await getStoreIds();
    if (!storeIds.length) {
      // Use hardcoded fallback
      storeIds = STORE_IDS;
    }
  } catch (e) {
    storeIds = STORE_IDS;
  }

  const primaryStore = storeIds[0];
  const secondStore  = storeIds[1] || storeIds[0];
  const thirdStore   = storeIds[2] || storeIds[0];

  console.log(`🏪  Stores: ${storeIds.join(', ')}`);
  console.log(`📦  Seeding ${PRODUCTS.length} unique lines × up to 3 stores…`);

  // Clear existing products
  for (const sid of storeIds) {
    try { await db.query('DELETE FROM products WHERE store_id = $1', [sid]); } catch (e) {}
  }

  let inserted = 0;

  for (const p of PRODUCTS) {
    const pid = 'p_mg_' + Math.random().toString(36).substr(2, 9);
    const desc = p.desc || `Premium ${p.name}`;
    const img  = `https://source.unsplash.com/400x300/?${encodeURIComponent(p.name + ' grocery food')}`;

    try {
      await db.query(
        `INSERT INTO products (id, store_id, name, description, price, original_price, unit, category, image_url, stock)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,99)`,
        [pid, primaryStore, p.name, desc, p.p, p.op, p.u, p.cat, img]
      );
      inserted++;
    } catch (e) {
      // Might fail if columns differ — log and continue
      console.warn(`  ⚠  ${p.name}: ${e.message}`);
    }

    // Distribute ~40% to second store, ~25% to third store
    if (secondStore !== primaryStore && Math.random() < 0.4) {
      const pid2 = 'p_mg_' + Math.random().toString(36).substr(2, 9);
      try {
        await db.query(
          `INSERT INTO products (id, store_id, name, description, price, original_price, unit, category, image_url, stock)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,99)`,
          [pid2, secondStore, p.name, desc, Math.round(p.p * 1.05), Math.round(p.op * 1.05), p.u, p.cat, img]
        );
        inserted++;
      } catch (e) {}
    }

    if (thirdStore !== primaryStore && Math.random() < 0.25) {
      const pid3 = 'p_mg_' + Math.random().toString(36).substr(2, 9);
      try {
        await db.query(
          `INSERT INTO products (id, store_id, name, description, price, original_price, unit, category, image_url, stock)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,99)`,
          [pid3, thirdStore, p.name, desc, Math.round(p.p * 1.1), Math.round(p.op * 1.1), p.u, p.cat, img]
        );
        inserted++;
      } catch (e) {}
    }
  }

  // Verify count
  try {
    const r = await db.query('SELECT COUNT(*) FROM products');
    console.log(`\n✅  DONE — ${inserted} rows written, ${r.rows[0].count} total in DB`);
  } catch (e) {
    console.log(`\n✅  DONE — ${inserted} rows written`);
  }

  process.exit(0);
}

seed().catch(e => { console.error('❌', e); process.exit(1); });
