/**
 * seed-products.js  —  run with: node seed-products.js
 * Clears and reseeds 100+ all-India available branded products.
 * All brands are nationally distributed in India.
 */
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/fng_db';
const pool = new Pool({ connectionString: DB_URL });

const GROCERY_STORE = 2;

const products = [
  // ─── Fruits & Vegetables — Vegetables ────────────────────────────────────
  { name: 'Tomato 1 kg',               category: 'Fruits & Vegetables', sub: 'Vegetables', price: 4900, orig: 6500,  image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80', unit: '1 kg',    brand: 'Daily Fresh' },
  { name: 'Onion 1 kg',                category: 'Fruits & Vegetables', sub: 'Vegetables', price: 2900, orig: 3800,  image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', unit: '1 kg',    brand: 'Daily Fresh' },
  { name: 'Potato 2 kg',               category: 'Fruits & Vegetables', sub: 'Vegetables', price: 4900, orig: 5900,  image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', unit: '2 kg',    brand: 'Daily Fresh' },
  { name: 'Green Capsicum 500 g',      category: 'Fruits & Vegetables', sub: 'Vegetables', price: 3900, orig: 4900,  image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80', unit: '500 g',   brand: 'Daily Fresh' },
  { name: 'Spinach 250 g',             category: 'Fruits & Vegetables', sub: 'Vegetables', price: 1900, orig: 2500,  image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80', unit: '250 g',   brand: 'Daily Fresh' },
  { name: 'Carrot 500 g',              category: 'Fruits & Vegetables', sub: 'Vegetables', price: 3500, orig: 4200,  image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80', unit: '500 g',   brand: 'Daily Fresh' },
  { name: 'Cauliflower 1 pc',          category: 'Fruits & Vegetables', sub: 'Vegetables', price: 3500, orig: 4500,  image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80', unit: '1 pc',    brand: 'Daily Fresh' },
  { name: 'Cucumber 3 pcs',            category: 'Fruits & Vegetables', sub: 'Vegetables', price: 2900, orig: 3500,  image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80', unit: '3 pcs',   brand: 'Daily Fresh' },
  // ─── Fruits & Vegetables — Fruits ────────────────────────────────────────
  { name: 'Banana Robusta 6 pcs',      category: 'Fruits & Vegetables', sub: 'Fruits', price: 3900, orig: 4900,  image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80', unit: '6 pcs',   brand: 'Daily Fresh' },
  { name: 'Apple Shimla 4 pcs',        category: 'Fruits & Vegetables', sub: 'Fruits', price: 14900, orig: 17900, image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80', unit: '4 pcs',   brand: 'Daily Fresh' },
  { name: 'Orange 4 pcs',              category: 'Fruits & Vegetables', sub: 'Fruits', price: 9900, orig: 11900, image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80', unit: '4 pcs',   brand: 'Daily Fresh' },
  { name: 'Green Grapes 500 g',        category: 'Fruits & Vegetables', sub: 'Fruits', price: 7900, orig: 9900,  image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80', unit: '500 g',   brand: 'Daily Fresh' },
  { name: 'Watermelon 1 pc',           category: 'Fruits & Vegetables', sub: 'Fruits', price: 6900, orig: 8900,  image: 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=400&q=80', unit: '1 pc',    brand: 'Daily Fresh' },
  { name: 'Mango Totapuri 1 kg',       category: 'Fruits & Vegetables', sub: 'Fruits', price: 9900, orig: 12900, image: 'https://images.unsplash.com/photo-1501746877-14782df58970?w=400&q=80', unit: '1 kg',    brand: 'Daily Fresh' },

  // ─── Dairy, Bread & Eggs ──────────────────────────────────────────────────
  { name: 'Amul Gold Full Cream Milk 1 L',   category: 'Dairy, Bread & Eggs', sub: 'Milk & Curd', price: 7000,  orig: 7400,  image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', unit: '1 litre', brand: 'Amul' },
  { name: 'Amul Taaza Toned Milk 500 ml',    category: 'Dairy, Bread & Eggs', sub: 'Milk & Curd', price: 2800,  orig: 3000,  image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', unit: '500 ml',  brand: 'Amul' },
  { name: 'Amul Butter 100 g',               category: 'Dairy, Bread & Eggs', sub: 'Butter & Cheese', price: 5700,  orig: 6200,  image: 'https://images.unsplash.com/photo-1589985270827-cb73e57e5a35?w=400&q=80', unit: '100 g',   brand: 'Amul' },
  { name: 'Amul Fresh Paneer 200 g',         category: 'Dairy, Bread & Eggs', sub: 'Paneer', price: 8900,  orig: 9900,  image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80', unit: '200 g',   brand: 'Amul' },
  { name: 'Amul Processed Cheese 200 g',     category: 'Dairy, Bread & Eggs', sub: 'Butter & Cheese', price: 12900, orig: 14900, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a318?w=400&q=80', unit: '200 g',   brand: 'Amul' },
  { name: 'Mother Dairy Mishti Dahi 200 g',  category: 'Dairy, Bread & Eggs', sub: 'Milk & Curd', price: 3900,  orig: 4500,  image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&q=80', unit: '200 g',   brand: 'Mother Dairy' },
  { name: 'Nestle MUNCH Curd 400 g',         category: 'Dairy, Bread & Eggs', sub: 'Milk & Curd', price: 4900,  orig: 5500,  image: 'https://images.unsplash.com/photo-1488477181228-c84ffe55871b?w=400&q=80', unit: '400 g',   brand: 'Nestle' },
  { name: "Venky's Eggs White 6 pcs",        category: 'Dairy, Bread & Eggs', sub: 'Eggs', price: 6900,  orig: 7500,  image: 'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=400&q=80', unit: '6 pcs',   brand: "Venky's" },
  { name: 'Britannia 100% Whole Wheat Bread',category: 'Dairy, Bread & Eggs', sub: 'Bread & Pav', price: 4500,  orig: 4900,  image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', unit: '400 g',   brand: 'Britannia' },
  { name: 'Harvest Gold Sandwich Bread',     category: 'Dairy, Bread & Eggs', sub: 'Bread & Pav', price: 3900,  orig: 4200,  image: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=400&q=80', unit: '400 g',   brand: 'Harvest Gold' },
  { name: 'Modern Bread Multigrain 400 g',   category: 'Dairy, Bread & Eggs', sub: 'Bread & Pav', price: 4200,  orig: 4800,  image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', unit: '400 g',   brand: 'Modern Bread' },
  { name: 'Amul Kool Café 200 ml',           category: 'Dairy, Bread & Eggs', sub: 'Milk & Curd', price: 3500,  orig: 4000,  image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', unit: '200 ml',  brand: 'Amul' },

  // ─── Munchies ─────────────────────────────────────────────────────────────
  { name: "Lay's Magic Masala 73 g",        category: 'Munchies', sub: 'Chips & Crisps', price: 2000,  orig: 2200,  image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', unit: '73 g',    brand: "Lay's" },
  { name: "Lay's American Style Cream & Onion 73 g", category: 'Munchies', sub: 'Chips & Crisps', price: 2000, orig: 2200, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', unit: '73 g', brand: "Lay's" },
  { name: 'Kurkure Masala Munch 90 g',      category: 'Munchies', sub: 'Chips & Crisps', price: 2500,  orig: 2800,  image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80', unit: '90 g',    brand: 'Kurkure' },
  { name: 'Haldiram Bhujia Sev 400 g',      category: 'Munchies', sub: 'Namkeen', price: 14900, orig: 17000, image: 'https://images.unsplash.com/photo-1519944253-ead7ef533fc0?w=400&q=80', unit: '400 g',   brand: 'Haldiram' },
  { name: 'Haldiram Aloo Bhujia 200 g',     category: 'Munchies', sub: 'Namkeen', price: 7900,  orig: 9000,  image: 'https://images.unsplash.com/photo-1519944253-ead7ef533fc0?w=400&q=80', unit: '200 g',   brand: 'Haldiram' },
  { name: 'Haldiram Moong Dal 200 g',       category: 'Munchies', sub: 'Namkeen', price: 6900,  orig: 7900,  image: 'https://images.unsplash.com/photo-1519944253-ead7ef533fc0?w=400&q=80', unit: '200 g',   brand: 'Haldiram' },
  { name: 'Parle Hide & Seek 100 g',        category: 'Munchies', sub: 'Biscuits & Cookies', price: 3500,  orig: 4000,  image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', unit: '100 g',   brand: 'Parle' },
  { name: 'Britannia Good Day Butter 120 g',category: 'Munchies', sub: 'Biscuits & Cookies', price: 3000,  orig: 3500,  image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', unit: '120 g',   brand: 'Britannia' },
  { name: 'Parle Monaco Salted 200 g',      category: 'Munchies', sub: 'Biscuits & Cookies', price: 3900,  orig: 4500,  image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', unit: '200 g',   brand: 'Parle' },
  { name: 'Oreo Original Biscuits 300 g',   category: 'Munchies', sub: 'Biscuits & Cookies', price: 6900,  orig: 7900,  image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&q=80', unit: '300 g',   brand: 'Oreo' },
  { name: 'Pringles Original 107 g',        category: 'Munchies', sub: 'Chips & Crisps', price: 9900,  orig: 11000, image: 'https://images.unsplash.com/photo-1531963232219-1c17be200325?w=400&q=80', unit: '107 g',   brand: 'Pringles' },
  { name: 'Act II Popcorn Butter 30 g',     category: 'Munchies', sub: 'Chips & Crisps', price: 2000,  orig: 2500,  image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80', unit: '30 g',    brand: 'Act II' },
  { name: 'Cadbury Dairy Milk 40 g',        category: 'Munchies', sub: 'Chocolates', price: 4000,  orig: 4500,  image: 'https://images.unsplash.com/photo-1490567674693-cd7a56a86df8?w=400&q=80', unit: '40 g',    brand: 'Cadbury' },
  { name: 'Kit Kat 4 Finger 41 g',          category: 'Munchies', sub: 'Chocolates', price: 4000,  orig: 4500,  image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80', unit: '41 g',    brand: 'Nestle' },

  // ─── Beverages ────────────────────────────────────────────────────────────
  { name: 'Coca-Cola 750 ml',               category: 'Beverages', sub: 'Cold Drinks', price: 4500,  orig: 4900,  image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80', unit: '750 ml',  brand: 'Coca-Cola' },
  { name: 'Pepsi 750 ml',                   category: 'Beverages', sub: 'Cold Drinks', price: 4500,  orig: 4900,  image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', unit: '750 ml',  brand: 'Pepsi' },
  { name: 'Sprite 750 ml',                  category: 'Beverages', sub: 'Cold Drinks', price: 4500,  orig: 4900,  image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80', unit: '750 ml',  brand: 'Sprite' },
  { name: 'Thums Up 750 ml',                category: 'Beverages', sub: 'Cold Drinks', price: 4500,  orig: 4900,  image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80', unit: '750 ml',  brand: 'Thums Up' },
  { name: 'Tropicana Orange 1 L',           category: 'Beverages', sub: 'Juices', price: 11900, orig: 13900, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80', unit: '1 litre', brand: 'Tropicana' },
  { name: 'Real Activ Orange Juice 1 L',    category: 'Beverages', sub: 'Juices', price: 10900, orig: 12500, image: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&q=80', unit: '1 litre', brand: 'Dabur Real' },
  { name: 'Bisleri Water 1 L',              category: 'Beverages', sub: 'Water', price: 1500,  orig: 2000,  image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80', unit: '1 litre', brand: 'Bisleri' },
  { name: 'Kinley Water 1 L',               category: 'Beverages', sub: 'Water', price: 1500,  orig: 2000,  image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80', unit: '1 litre', brand: 'Kinley' },
  { name: 'Red Bull Energy Drink 250 ml',   category: 'Beverages', sub: 'Energy Drinks', price: 11500, orig: 12500, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', unit: '250 ml',  brand: 'Red Bull' },
  { name: 'Amul Masti Chaas 500 ml',        category: 'Beverages', sub: 'Lassi & Chaas', price: 3900,  orig: 4500,  image: 'https://images.unsplash.com/photo-1487714234-da28d3e4bf77?w=400&q=80', unit: '500 ml',  brand: 'Amul' },
  { name: 'Limca Lemon & Lime 600 ml',      category: 'Beverages', sub: 'Cold Drinks', price: 3900,  orig: 4500,  image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80', unit: '600 ml',  brand: 'Limca' },
  { name: 'Mountain Dew 600 ml',            category: 'Beverages', sub: 'Cold Drinks', price: 3900,  orig: 4500,  image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', unit: '600 ml',  brand: 'Mountain Dew' },

  // ─── Atta, Rice, Oil & Dals ───────────────────────────────────────────────
  { name: 'Aashirvaad Whole Wheat Atta 5 kg',     category: 'Atta, Rice, Oil & Dals', sub: 'Atta & Flour', price: 26900, orig: 30000, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', unit: '5 kg',    brand: 'Aashirvaad' },
  { name: 'Pillsbury Chakki Fresh Atta 5 kg',     category: 'Atta, Rice, Oil & Dals', sub: 'Atta & Flour', price: 24900, orig: 28000, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', unit: '5 kg',    brand: 'Pillsbury' },
  { name: 'India Gate Classic Basmati Rice 5 kg', category: 'Atta, Rice, Oil & Dals', sub: 'Rice', price: 54900, orig: 64900, image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b6c7?w=400&q=80', unit: '5 kg',    brand: 'India Gate' },
  { name: 'Daawat Super Basmati Rice 5 kg',       category: 'Atta, Rice, Oil & Dals', sub: 'Rice', price: 44900, orig: 52000, image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b6c7?w=400&q=80', unit: '5 kg',    brand: 'Daawat' },
  { name: 'Saffola Gold Blended Oil 1 L',         category: 'Atta, Rice, Oil & Dals', sub: 'Oils & Ghee', price: 24900, orig: 28000, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', unit: '1 litre', brand: 'Saffola' },
  { name: 'Fortune Sunflower Oil 1 L',            category: 'Atta, Rice, Oil & Dals', sub: 'Oils & Ghee', price: 18900, orig: 21000, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', unit: '1 litre', brand: 'Fortune' },
  { name: 'Amul Pure Ghee 500 g',                 category: 'Atta, Rice, Oil & Dals', sub: 'Oils & Ghee', price: 32900, orig: 37000, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80', unit: '500 g',   brand: 'Amul' },
  { name: 'Patanjali Cowghee 500 g',              category: 'Atta, Rice, Oil & Dals', sub: 'Oils & Ghee', price: 29900, orig: 34000, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80', unit: '500 g',   brand: 'Patanjali' },
  { name: 'Tata Sampann Moong Dal 1 kg',          category: 'Atta, Rice, Oil & Dals', sub: 'Dals & Pulses', price: 14900, orig: 16900, image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80', unit: '1 kg',    brand: 'Tata Sampann' },
  { name: 'Tata Sampann Chana Dal 1 kg',          category: 'Atta, Rice, Oil & Dals', sub: 'Dals & Pulses', price: 12900, orig: 15000, image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80', unit: '1 kg',    brand: 'Tata Sampann' },
  { name: 'Rajdhani Rajma 500 g',                 category: 'Atta, Rice, Oil & Dals', sub: 'Dals & Pulses', price: 8900,  orig: 10500, image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80', unit: '500 g',   brand: 'Rajdhani' },

  // ─── Masala & Spices ──────────────────────────────────────────────────────
  { name: 'MDH Biryani Masala 50 g',        category: 'Masala & Spices', sub: 'Blend Masalas', price: 5900,  orig: 6900,  image: 'https://images.unsplash.com/photo-1506802913710-b2985dcd0c20?w=400&q=80', unit: '50 g',   brand: 'MDH' },
  { name: 'MDH Chana Masala 100 g',         category: 'Masala & Spices', sub: 'Blend Masalas', price: 7900,  orig: 9000,  image: 'https://images.unsplash.com/photo-1506802913710-b2985dcd0c20?w=400&q=80', unit: '100 g',  brand: 'MDH' },
  { name: 'Everest Garam Masala 50 g',      category: 'Masala & Spices', sub: 'Blend Masalas', price: 4900,  orig: 5900,  image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', unit: '50 g',   brand: 'Everest' },
  { name: 'Everest Sambar Masala 100 g',    category: 'Masala & Spices', sub: 'Blend Masalas', price: 7900,  orig: 9000,  image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', unit: '100 g',  brand: 'Everest' },
  { name: 'Tata Salt 1 kg',                 category: 'Masala & Spices', sub: 'Salt & Sugar', price: 2900,  orig: 3200,  image: 'https://images.unsplash.com/photo-1603988363607-e1ddee1fa9f6?w=400&q=80', unit: '1 kg',   brand: 'Tata Salt' },
  { name: 'Catch Black Pepper Powder 50 g', category: 'Masala & Spices', sub: 'Whole Spices', price: 5900,  orig: 6900,  image: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=400&q=80', unit: '50 g',   brand: 'Catch' },
  { name: 'Badshah Rajwadi Masala 50 g',    category: 'Masala & Spices', sub: 'Blend Masalas', price: 4900,  orig: 5500,  image: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=400&q=80', unit: '50 g',   brand: 'Badshah' },

  // ─── Personal Care ────────────────────────────────────────────────────────
  { name: 'Dove Moisturising Beauty Bar 100 g',   category: 'Personal Care', sub: 'Bath & Body', price: 5500,  orig: 6500,  image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80', unit: '100 g',   brand: 'Dove' },
  { name: 'Pears Soft & Fresh Soap 75 g',         category: 'Personal Care', sub: 'Bath & Body', price: 4900,  orig: 5500,  image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80', unit: '75 g',    brand: 'Pears' },
  { name: 'Colgate Maxfresh 300 g',               category: 'Personal Care', sub: 'Oral Care', price: 11900, orig: 13900, image: 'https://images.unsplash.com/photo-1559591937-abc45e5bdb43?w=400&q=80', unit: '300 g',   brand: 'Colgate' },
  { name: 'Pepsodent Germicheck 300 g',           category: 'Personal Care', sub: 'Oral Care', price: 8900,  orig: 10500, image: 'https://images.unsplash.com/photo-1559591937-abc45e5bdb43?w=400&q=80', unit: '300 g',   brand: 'Pepsodent' },
  { name: 'Head & Shoulders Anti-Dandruff 340 ml',category: 'Personal Care', sub: 'Hair Care', price: 26900, orig: 30500, image: 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=400&q=80', unit: '340 ml',  brand: 'Head & Shoulders' },
  { name: 'Parachute Coconut Oil 500 ml',         category: 'Personal Care', sub: 'Hair Care', price: 17900, orig: 20000, image: 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=400&q=80', unit: '500 ml',  brand: 'Parachute' },
  { name: 'Dettol Original Handwash 250 ml',      category: 'Personal Care', sub: 'Bath & Body', price: 7900,  orig: 9500,  image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=400&q=80', unit: '250 ml',  brand: 'Dettol' },
  { name: 'Gillette Mach3 Blades 2 pcs',          category: 'Personal Care', sub: 'Shaving', price: 19900, orig: 23000, image: 'https://images.unsplash.com/photo-1564429097461-d067e2f2e012?w=400&q=80', unit: '2 pcs',   brand: 'Gillette' },
  { name: 'Whisper Ultra Clean 7 pads',            category: 'Personal Care', sub: 'Feminine Care', price: 5900,  orig: 6900,  image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80', unit: '7 pcs',   brand: 'Whisper' },

  // ─── Breakfast & Sauces ───────────────────────────────────────────────────
  { name: 'Maggi 2 Min Masala Noodles 70 g',    category: 'Breakfast & Sauces', sub: 'Noodles & Pasta', price: 1400,  orig: 1600,  image: 'https://images.unsplash.com/photo-1569058242272-87b3ac2ea836?w=400&q=80', unit: '70 g',    brand: 'Maggi' },
  { name: 'Maggi 2 Min Noodles 4 pkt 280 g',   category: 'Breakfast & Sauces', sub: 'Noodles & Pasta', price: 5600,  orig: 6400,  image: 'https://images.unsplash.com/photo-1569058242272-87b3ac2ea836?w=400&q=80', unit: '280 g',   brand: 'Maggi' },
  { name: "Kellogg's Corn Flakes 875 g",        category: 'Breakfast & Sauces', sub: 'Cereals & Muesli', price: 34900, orig: 39500, image: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400&q=80', unit: '875 g',   brand: "Kellogg's" },
  { name: 'Quaker Oats 1 kg',                   category: 'Breakfast & Sauces', sub: 'Cereals & Muesli', price: 24900, orig: 28000, image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&q=80', unit: '1 kg',    brand: 'Quaker' },
  { name: 'Bournvita Health Drink 500 g',       category: 'Breakfast & Sauces', sub: 'Health Drinks', price: 28900, orig: 32000, image: 'https://images.unsplash.com/photo-1514362453360-8f94243c9996?w=400&q=80', unit: '500 g',   brand: 'Bournvita' },
  { name: 'Horlicks Classic Malt 500 g',        category: 'Breakfast & Sauces', sub: 'Health Drinks', price: 26900, orig: 30000, image: 'https://images.unsplash.com/photo-1514362453360-8f94243c9996?w=400&q=80', unit: '500 g',   brand: 'Horlicks' },
  { name: 'Kissan Tomato Ketchup 500 g',        category: 'Breakfast & Sauces', sub: 'Sauces & Spreads', price: 12900, orig: 14900, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', unit: '500 g',   brand: 'Kissan' },
  { name: 'Nutella Hazelnut Spread 350 g',      category: 'Breakfast & Sauces', sub: 'Sauces & Spreads', price: 39900, orig: 44900, image: 'https://images.unsplash.com/photo-1571601810983-41d4e05d2a87?w=400&q=80', unit: '350 g',   brand: 'Nutella' },
  { name: 'Borges Olive Oil Extra Virgin 500 ml',category: 'Breakfast & Sauces', sub: 'Sauces & Spreads', price: 59900, orig: 69000, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', unit: '500 ml',  brand: 'Borges' },

  // ─── Cleaning Essentials ──────────────────────────────────────────────────
  { name: 'Vim Dishwash Gel 750 ml',          category: 'Cleaning Essentials', sub: 'Dish Wash', price: 9900,  orig: 11500, image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80', unit: '750 ml',  brand: 'Vim' },
  { name: 'Pril Lime Dishwash Gel 500 ml',    category: 'Cleaning Essentials', sub: 'Dish Wash', price: 7900,  orig: 9500,  image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80', unit: '500 ml',  brand: 'Pril' },
  { name: 'Harpic Power Plus Toilet Cleaner 1 L', category: 'Cleaning Essentials', sub: 'Toilet Cleaners', price: 11900, orig: 14500, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', unit: '1 litre', brand: 'Harpic' },
  { name: 'Colin Glass & Surface Cleaner 500 ml', category: 'Cleaning Essentials', sub: 'Floor & Surface', price: 7900, orig: 9500, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', unit: '500 ml',  brand: 'Colin' },
  { name: 'Surf Excel Easy Wash 2 kg',        category: 'Cleaning Essentials', sub: 'Laundry', price: 27900, orig: 32000, image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&q=80', unit: '2 kg',    brand: 'Surf Excel' },
  { name: 'Ariel Matic Front Load 2 kg',      category: 'Cleaning Essentials', sub: 'Laundry', price: 47900, orig: 55000, image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&q=80', unit: '2 kg',    brand: 'Ariel' },
  { name: 'Domex Ultra Thick Bleach 1 L',     category: 'Cleaning Essentials', sub: 'Toilet Cleaners', price: 9900,  orig: 11500, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', unit: '1 litre', brand: 'Domex' },
  { name: 'Lizol Lavender Disinfectant 2 L',  category: 'Cleaning Essentials', sub: 'Floor & Surface', price: 27900, orig: 31000, image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80', unit: '2 litres',brand: 'Lizol' },
  { name: 'Scotch-Brite Scrub Pad 3 pcs',     category: 'Cleaning Essentials', sub: 'Dish Wash', price: 4900,  orig: 5900,  image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80', unit: '3 pcs',   brand: '3M Scotch-Brite' },
  { name: 'Dettol Antiseptic Liquid 250 ml',  category: 'Cleaning Essentials', sub: 'Floor & Surface', price: 14900, orig: 17000, image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=400&q=80', unit: '250 ml',  brand: 'Dettol' },
  { name: 'Odonil Zipper Block 75 g',         category: 'Cleaning Essentials', sub: 'Air Fresheners', price: 5900,  orig: 7000,  image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', unit: '75 g',    brand: 'Odonil' },

  // ─── Frozen & Instant Food ────────────────────────────────────────────────
  { name: 'McCain Smart Chips Crinkle 415 g',  category: 'Frozen & Instant Food', sub: 'Frozen Snacks', price: 22900, orig: 26000, image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80', unit: '415 g',  brand: 'McCain' },
  { name: 'Haldiram Frozen Samosa 400 g',      category: 'Frozen & Instant Food', sub: 'Frozen Snacks', price: 17900, orig: 20000, image: 'https://images.unsplash.com/photo-1562059390-a761a084768e?w=400&q=80', unit: '400 g',  brand: 'Haldiram' },
  { name: 'Amul Cornetto Royale Choco',        category: 'Frozen & Instant Food', sub: 'Ice Creams', price: 5500,  orig: 6200,  image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&q=80', unit: '75 ml',  brand: 'Amul' },
  { name: 'Kwality Walls Mango Tub 700 ml',    category: 'Frozen & Instant Food', sub: 'Ice Creams', price: 18900, orig: 22000, image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&q=80', unit: '700 ml', brand: 'Kwality Walls' },
  { name: 'Yippee Magic Masala 70 g',          category: 'Frozen & Instant Food', sub: 'Instant Noodles', price: 1400,  orig: 1600,  image: 'https://images.unsplash.com/photo-1569058242272-87b3ac2ea836?w=400&q=80', unit: '70 g',   brand: 'Sunfeast Yippee' },
  { name: 'Patanjali Atta Noodles 70 g',       category: 'Frozen & Instant Food', sub: 'Instant Noodles', price: 1200,  orig: 1500,  image: 'https://images.unsplash.com/photo-1569058242272-87b3ac2ea836?w=400&q=80', unit: '70 g',   brand: 'Patanjali' },
];

async function seed() {
  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    // Wipe all existing products for the grocery store and reseed fresh
    await client.query(`DELETE FROM products WHERE store_id = $1`, [GROCERY_STORE]);
    console.log('🗑️  Cleared existing grocery products');

    let inserted = 0;
    for (const p of products) {
      await client.query(
        `INSERT INTO products (name, category, sub_category, price, original_price, image_url, unit, brand, stock, is_veg, is_available, store_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 100, true, true, $9)`,
        [p.name, p.category, p.sub || null, p.price, p.orig, p.image, p.unit, p.brand, GROCERY_STORE]
      );
      inserted++;
    }
    console.log(`\n✅ Done! Inserted: ${inserted} all-India available products`);
    const countRes = await client.query('SELECT category, COUNT(*) FROM products WHERE store_id=$1 GROUP BY category ORDER BY category', [GROCERY_STORE]);
    console.log('\nProducts per category:');
    countRes.rows.forEach(r => console.log(`  ${r.category}: ${r.count}`));
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
