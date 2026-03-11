# Code Citations

## License: unknown
https://github.com/lakwetu-tz/gps_mobile/blob/2721223b487eee42d9237a37d3b61ed4ca519de9/screens/monitor/Driver.tsx

```
# 🚀 PHASE 12: ORDER MANAGEMENT + DELIVERY TRACKING + LIVE PREVIEW

Let me build Phase 12 with complete order management, real-time delivery tracking, and show you how to see the live preview!

---

## 📱 STEP 1: START LIVE PREVIEW - QUICK SETUP

````bash
# filepath: START_LIVE_PREVIEW.sh

#!/bin/bash

echo "🚀 Starting F&G Application Live Preview..."
echo "============================================"

# Step 1: Start Backend Server
echo "📡 Starting Backend Server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:3000"

# Step 2: Start Customer Mobile App
echo "📱 Starting Mobile App..."
cd ../apps/customer-mobile
npm install
npx expo start &
EXPO_PID=$!

echo ""
echo "============================================"
echo "🎉 F&G APPLICATION IS LIVE!"
echo "============================================"
echo ""
echo "📱 MOBILE APP:"
echo "   → Scan QR code with Expo Go app"
echo "   → Or press 'w' for web preview"
echo "   → Or press 'a' for Android emulator"
echo "   → Or press 'i' for iOS simulator"
echo ""
echo "🔧 ADMIN DASHBOARD:"
echo "   → Open: http://localhost:5173"
echo ""
echo "📡 BACKEND API:"
echo "   → Running: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================"

# Wait for user interrupt
wait $BACKEND_PID $EXPO_PID
````

---

## 🗄️ STEP 2: ORDER MANAGEMENT DATABASE

````sql
-- filepath: backend/src/database/migrations/012_orders_delivery_system.sql

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order Type
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('food', 'grocery', 'fashion', 'tools', 'household')),
  
  -- Restaurant/Store Details (for food orders)
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_name VARCHAR(255),
  
  -- Amounts (in paise)
  subtotal INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  packaging_fee INTEGER DEFAULT 0,
  taxes INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Coupon
  coupon_code VARCHAR(50),
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Delivery Address
  delivery_address_id INTEGER REFERENCES addresses(id),
  delivery_address JSONB NOT NULL,
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 
    'delivered', 'cancelled', 'refunded'
  )),
  
  -- Payment
  payment_method VARCHAR(20) CHECK (payment_method IN ('cod', 'online', 'wallet')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Delivery
  delivery_partner_id INTEGER REFERENCES delivery_partners(id) ON DELETE SET NULL,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  
  -- Special Instructions
  instructions TEXT,
  
  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Details
  product_type VARCHAR(20) NOT NULL, -- 'menu_item', 'fashion', 'tools', 'household', 'grocery'
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  
  -- Pricing
  price INTEGER NOT NULL, -- price per unit in paise
  quantity INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL, -- price * quantity
  
  -- Variants/Customizations
  customizations JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  
  -- Vehicle Details
  vehicle_type VARCHAR(20), -- bike, scooter, car
  vehicle_number VARCHAR(20),
  
  -- Location
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Documents
  documents JSONB DEFAULT '{}'::jsonb, -- license, aadhar, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Tracking Table (Real-time location updates)
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  delivery_partner_id INTEGER REFERENCES delivery_partners(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Status at this point
  status VARCHAR(50),
  notes TEXT,
  
  -- Timestamp
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_partners_available ON delivery_partners(is_available, is_active);

-- Trigger to update delivery partner stats
CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE delivery_partners SET
      total_deliveries = total_deliveries + 1
    WHERE id = NEW.delivery_partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_stats
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_delivery_partner_stats();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_number := 'FNG' || LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
````

---

## 🔧 STEP 3: BACKEND ORDER API

````javascript
// filepath: backend/src/routes/orders.routes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Create Order
router.post('/', authenticate, async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const {
      order_type,
      restaurant_id,
      items,
      delivery_address,
      payment_method,
      coupon_code,
      instructions
    } = req.body;

    // Calculate amounts
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply coupon if provided
    let discount_amount = 0;
    let coupon_id = null;
    if (coupon_code) {
      const coupon = await trx('coupons')
        .where({ code: coupon_code, is_active: true })
        .first();
      
      if (coupon) {
        if (subtotal >= coupon.min_order_amount) {
          if (coupon.discount_type === 'flat') {
            discount_amount = coupon.discount_value;
          } else {
            discount_amount = Math.floor(subtotal * coupon.discount_value / 100);
            if (coupon.max_discount) {
              discount_amount = Math.min(discount_amount, coupon.max_discount);
            }
          }
          coupon_id = coupon.id;
          
          // Update coupon usage
          await trx('coupons')
            .where({ id: coupon.id })
            .increment('used_count', 1);
        }
      }
    }

    // Calculate fees
    const delivery_fee = subtotal < 19900 ? 4900 : 0; // Free delivery above ₹199
    const packaging_fee = order_type === 'food' ? 500 : 0;
    const taxes = Math.floor((subtotal - discount_amount) * 0.05); // 5% GST
    
    const total_amount = subtotal + delivery_fee + packaging_fee + taxes - discount_amount;

    // Generate order number
    const order_number = await db.raw("SELECT generate_order_number() as number");
    
    // Get restaurant name if food order
    let restaurant_name = null;
    if (restaurant_id) {
      const restaurant = await trx('restaurants').where({ id: restaurant_id }).first();
      restaurant_name = restaurant?.name;
    }

    // Create order
    const [order] = await trx('orders')
      .insert({
        order_number: order_number.rows[0].number,
        user_id: req.user.id,
        order_type,
        restaurant_id,
        restaurant_name,
        subtotal,
        delivery_fee,
        packaging_fee,
        taxes,
        discount_amount,
        total_amount,
        coupon_code,
        coupon_id,
        delivery_address: JSON.stringify(delivery_address),
        payment_method,
        instructions,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000) // 45 mins
      })
      .returning('*');

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_type: item.product_type || 'menu_item',
      product_id: item.id,
      product_name: item.name,
      product_image: item.image_url || item.images?.[0],
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      customizations: JSON.stringify(item.customizations || [])
    }));

    await trx('order_items').insert(orderItems);

    // Commit transaction
    await trx.commit();

    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get User Orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { status, order_type, page = 1, limit = 10 } = req.query;

    let query = db('orders')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    if (status) query = query.where({ status });
    if (order_type) query = query.where({ order_type });

    const offset = (page - 1) * limit;
    const orders = await query.limit(limit).offset(offset);

    // Get items for each order
    for (let order of orders) {
      order.items = await db('order_items')
        .where({ order_id: order.id });
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get Order Details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    order.items = await db('order_items')
      .where({ order_id: order.id });

    // Get delivery partner if assigned
    if (order.delivery_partner_id) {
      order.delivery_partner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'vehicle_type', 'vehicle_number', 'rating')
        .first();
    }

    // Get tracking history
    order.tracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'asc');

    // Get status history
    order.status_history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Track Order (Real-time location)
router.get('/:id/track', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get latest tracking location
    const latestTracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'desc')
      .first();

    // Get delivery partner current location
    let deliveryPartner = null;
    if (order.delivery_partner_id) {
      deliveryPartner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'current_latitude', 'current_longitude', 'vehicle_type', 'vehicle_number')
        .first();
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        estimated_delivery_time: order.estimated_delivery_time
      },
      current_location: latestTracking || deliveryPartner,
      delivery_partner: deliveryPartner,
      delivery_address: JSON.parse(order.delivery_address)
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Cancel Order
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({
        status: 'cancelled',
        cancelled_at: new Date()
      });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Rate Order
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;

    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id, status: 'delivered' })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not delivered' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({ rating, review });

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
````

---

## 📱 STEP 4: MOBILE CHECKOUT SCREEN

````typescript
// filepath: apps/customer-mobile/src/screens/Checkout/CheckoutScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFoodCart } from '../../hooks/useFoodCart';

export const CheckoutScreen = () => {
  const navigation = useNavigation();
  const cart = useFoodCart();
  
  const [selectedAddress, setSelectedAddress] = useState({
    id: 1,
    type: 'Home',
    address: '123 Main Street, Banjara Hills',
    landmark: 'Near City Mall',
    city: 'Hyderabad',
    pincode: '500034'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const applyCoupon = async () => {
    // Simulate coupon validation
    if (couponCode === 'FLAT100') {
      setAppliedCoupon({
        code: 'FLAT100',
        discount: 10000 // ₹100
      });
      Alert.alert('Success', '₹100 discount applied!');
    } else {
      Alert.alert('Invalid', 'Coupon code not valid');
    }
  };

  const placeOrder = async () => {
    try {
      const API = 'http://localhost:3000/api/v1';
      
      const orderData = {
        order_type: 'food',
        restaurant_id: cart.restaurant_id,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          product_type: 'menu_item',
          image_url: item.image_url
        })),
        delivery_address: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        instructions
      };

      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_TOKEN}` // Add auth token
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        cart.clearCart();
        navigation.navigate('OrderTracking', { orderId: data.order.id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const finalTotal = cart.total - (appliedCoupon?.discount || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a
```


## License: unknown
https://github.com/lakwetu-tz/gps_mobile/blob/2721223b487eee42d9237a37d3b61ed4ca519de9/screens/monitor/Driver.tsx

```
# 🚀 PHASE 12: ORDER MANAGEMENT + DELIVERY TRACKING + LIVE PREVIEW

Let me build Phase 12 with complete order management, real-time delivery tracking, and show you how to see the live preview!

---

## 📱 STEP 1: START LIVE PREVIEW - QUICK SETUP

````bash
# filepath: START_LIVE_PREVIEW.sh

#!/bin/bash

echo "🚀 Starting F&G Application Live Preview..."
echo "============================================"

# Step 1: Start Backend Server
echo "📡 Starting Backend Server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:3000"

# Step 2: Start Customer Mobile App
echo "📱 Starting Mobile App..."
cd ../apps/customer-mobile
npm install
npx expo start &
EXPO_PID=$!

echo ""
echo "============================================"
echo "🎉 F&G APPLICATION IS LIVE!"
echo "============================================"
echo ""
echo "📱 MOBILE APP:"
echo "   → Scan QR code with Expo Go app"
echo "   → Or press 'w' for web preview"
echo "   → Or press 'a' for Android emulator"
echo "   → Or press 'i' for iOS simulator"
echo ""
echo "🔧 ADMIN DASHBOARD:"
echo "   → Open: http://localhost:5173"
echo ""
echo "📡 BACKEND API:"
echo "   → Running: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================"

# Wait for user interrupt
wait $BACKEND_PID $EXPO_PID
````

---

## 🗄️ STEP 2: ORDER MANAGEMENT DATABASE

````sql
-- filepath: backend/src/database/migrations/012_orders_delivery_system.sql

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order Type
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('food', 'grocery', 'fashion', 'tools', 'household')),
  
  -- Restaurant/Store Details (for food orders)
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_name VARCHAR(255),
  
  -- Amounts (in paise)
  subtotal INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  packaging_fee INTEGER DEFAULT 0,
  taxes INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Coupon
  coupon_code VARCHAR(50),
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Delivery Address
  delivery_address_id INTEGER REFERENCES addresses(id),
  delivery_address JSONB NOT NULL,
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 
    'delivered', 'cancelled', 'refunded'
  )),
  
  -- Payment
  payment_method VARCHAR(20) CHECK (payment_method IN ('cod', 'online', 'wallet')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Delivery
  delivery_partner_id INTEGER REFERENCES delivery_partners(id) ON DELETE SET NULL,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  
  -- Special Instructions
  instructions TEXT,
  
  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Details
  product_type VARCHAR(20) NOT NULL, -- 'menu_item', 'fashion', 'tools', 'household', 'grocery'
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  
  -- Pricing
  price INTEGER NOT NULL, -- price per unit in paise
  quantity INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL, -- price * quantity
  
  -- Variants/Customizations
  customizations JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  
  -- Vehicle Details
  vehicle_type VARCHAR(20), -- bike, scooter, car
  vehicle_number VARCHAR(20),
  
  -- Location
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Documents
  documents JSONB DEFAULT '{}'::jsonb, -- license, aadhar, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Tracking Table (Real-time location updates)
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  delivery_partner_id INTEGER REFERENCES delivery_partners(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Status at this point
  status VARCHAR(50),
  notes TEXT,
  
  -- Timestamp
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_partners_available ON delivery_partners(is_available, is_active);

-- Trigger to update delivery partner stats
CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE delivery_partners SET
      total_deliveries = total_deliveries + 1
    WHERE id = NEW.delivery_partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_stats
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_delivery_partner_stats();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_number := 'FNG' || LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
````

---

## 🔧 STEP 3: BACKEND ORDER API

````javascript
// filepath: backend/src/routes/orders.routes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Create Order
router.post('/', authenticate, async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const {
      order_type,
      restaurant_id,
      items,
      delivery_address,
      payment_method,
      coupon_code,
      instructions
    } = req.body;

    // Calculate amounts
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply coupon if provided
    let discount_amount = 0;
    let coupon_id = null;
    if (coupon_code) {
      const coupon = await trx('coupons')
        .where({ code: coupon_code, is_active: true })
        .first();
      
      if (coupon) {
        if (subtotal >= coupon.min_order_amount) {
          if (coupon.discount_type === 'flat') {
            discount_amount = coupon.discount_value;
          } else {
            discount_amount = Math.floor(subtotal * coupon.discount_value / 100);
            if (coupon.max_discount) {
              discount_amount = Math.min(discount_amount, coupon.max_discount);
            }
          }
          coupon_id = coupon.id;
          
          // Update coupon usage
          await trx('coupons')
            .where({ id: coupon.id })
            .increment('used_count', 1);
        }
      }
    }

    // Calculate fees
    const delivery_fee = subtotal < 19900 ? 4900 : 0; // Free delivery above ₹199
    const packaging_fee = order_type === 'food' ? 500 : 0;
    const taxes = Math.floor((subtotal - discount_amount) * 0.05); // 5% GST
    
    const total_amount = subtotal + delivery_fee + packaging_fee + taxes - discount_amount;

    // Generate order number
    const order_number = await db.raw("SELECT generate_order_number() as number");
    
    // Get restaurant name if food order
    let restaurant_name = null;
    if (restaurant_id) {
      const restaurant = await trx('restaurants').where({ id: restaurant_id }).first();
      restaurant_name = restaurant?.name;
    }

    // Create order
    const [order] = await trx('orders')
      .insert({
        order_number: order_number.rows[0].number,
        user_id: req.user.id,
        order_type,
        restaurant_id,
        restaurant_name,
        subtotal,
        delivery_fee,
        packaging_fee,
        taxes,
        discount_amount,
        total_amount,
        coupon_code,
        coupon_id,
        delivery_address: JSON.stringify(delivery_address),
        payment_method,
        instructions,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000) // 45 mins
      })
      .returning('*');

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_type: item.product_type || 'menu_item',
      product_id: item.id,
      product_name: item.name,
      product_image: item.image_url || item.images?.[0],
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      customizations: JSON.stringify(item.customizations || [])
    }));

    await trx('order_items').insert(orderItems);

    // Commit transaction
    await trx.commit();

    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get User Orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { status, order_type, page = 1, limit = 10 } = req.query;

    let query = db('orders')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    if (status) query = query.where({ status });
    if (order_type) query = query.where({ order_type });

    const offset = (page - 1) * limit;
    const orders = await query.limit(limit).offset(offset);

    // Get items for each order
    for (let order of orders) {
      order.items = await db('order_items')
        .where({ order_id: order.id });
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get Order Details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    order.items = await db('order_items')
      .where({ order_id: order.id });

    // Get delivery partner if assigned
    if (order.delivery_partner_id) {
      order.delivery_partner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'vehicle_type', 'vehicle_number', 'rating')
        .first();
    }

    // Get tracking history
    order.tracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'asc');

    // Get status history
    order.status_history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Track Order (Real-time location)
router.get('/:id/track', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get latest tracking location
    const latestTracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'desc')
      .first();

    // Get delivery partner current location
    let deliveryPartner = null;
    if (order.delivery_partner_id) {
      deliveryPartner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'current_latitude', 'current_longitude', 'vehicle_type', 'vehicle_number')
        .first();
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        estimated_delivery_time: order.estimated_delivery_time
      },
      current_location: latestTracking || deliveryPartner,
      delivery_partner: deliveryPartner,
      delivery_address: JSON.parse(order.delivery_address)
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Cancel Order
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({
        status: 'cancelled',
        cancelled_at: new Date()
      });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Rate Order
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;

    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id, status: 'delivered' })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not delivered' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({ rating, review });

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
````

---

## 📱 STEP 4: MOBILE CHECKOUT SCREEN

````typescript
// filepath: apps/customer-mobile/src/screens/Checkout/CheckoutScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFoodCart } from '../../hooks/useFoodCart';

export const CheckoutScreen = () => {
  const navigation = useNavigation();
  const cart = useFoodCart();
  
  const [selectedAddress, setSelectedAddress] = useState({
    id: 1,
    type: 'Home',
    address: '123 Main Street, Banjara Hills',
    landmark: 'Near City Mall',
    city: 'Hyderabad',
    pincode: '500034'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const applyCoupon = async () => {
    // Simulate coupon validation
    if (couponCode === 'FLAT100') {
      setAppliedCoupon({
        code: 'FLAT100',
        discount: 10000 // ₹100
      });
      Alert.alert('Success', '₹100 discount applied!');
    } else {
      Alert.alert('Invalid', 'Coupon code not valid');
    }
  };

  const placeOrder = async () => {
    try {
      const API = 'http://localhost:3000/api/v1';
      
      const orderData = {
        order_type: 'food',
        restaurant_id: cart.restaurant_id,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          product_type: 'menu_item',
          image_url: item.image_url
        })),
        delivery_address: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        instructions
      };

      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_TOKEN}` // Add auth token
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        cart.clearCart();
        navigation.navigate('OrderTracking', { orderId: data.order.id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const finalTotal = cart.total - (appliedCoupon?.discount || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a
```


## License: unknown
https://github.com/lakwetu-tz/gps_mobile/blob/2721223b487eee42d9237a37d3b61ed4ca519de9/screens/monitor/Driver.tsx

```
# 🚀 PHASE 12: ORDER MANAGEMENT + DELIVERY TRACKING + LIVE PREVIEW

Let me build Phase 12 with complete order management, real-time delivery tracking, and show you how to see the live preview!

---

## 📱 STEP 1: START LIVE PREVIEW - QUICK SETUP

````bash
# filepath: START_LIVE_PREVIEW.sh

#!/bin/bash

echo "🚀 Starting F&G Application Live Preview..."
echo "============================================"

# Step 1: Start Backend Server
echo "📡 Starting Backend Server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:3000"

# Step 2: Start Customer Mobile App
echo "📱 Starting Mobile App..."
cd ../apps/customer-mobile
npm install
npx expo start &
EXPO_PID=$!

echo ""
echo "============================================"
echo "🎉 F&G APPLICATION IS LIVE!"
echo "============================================"
echo ""
echo "📱 MOBILE APP:"
echo "   → Scan QR code with Expo Go app"
echo "   → Or press 'w' for web preview"
echo "   → Or press 'a' for Android emulator"
echo "   → Or press 'i' for iOS simulator"
echo ""
echo "🔧 ADMIN DASHBOARD:"
echo "   → Open: http://localhost:5173"
echo ""
echo "📡 BACKEND API:"
echo "   → Running: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================"

# Wait for user interrupt
wait $BACKEND_PID $EXPO_PID
````

---

## 🗄️ STEP 2: ORDER MANAGEMENT DATABASE

````sql
-- filepath: backend/src/database/migrations/012_orders_delivery_system.sql

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order Type
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('food', 'grocery', 'fashion', 'tools', 'household')),
  
  -- Restaurant/Store Details (for food orders)
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_name VARCHAR(255),
  
  -- Amounts (in paise)
  subtotal INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  packaging_fee INTEGER DEFAULT 0,
  taxes INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Coupon
  coupon_code VARCHAR(50),
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Delivery Address
  delivery_address_id INTEGER REFERENCES addresses(id),
  delivery_address JSONB NOT NULL,
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 
    'delivered', 'cancelled', 'refunded'
  )),
  
  -- Payment
  payment_method VARCHAR(20) CHECK (payment_method IN ('cod', 'online', 'wallet')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Delivery
  delivery_partner_id INTEGER REFERENCES delivery_partners(id) ON DELETE SET NULL,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  
  -- Special Instructions
  instructions TEXT,
  
  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Details
  product_type VARCHAR(20) NOT NULL, -- 'menu_item', 'fashion', 'tools', 'household', 'grocery'
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  
  -- Pricing
  price INTEGER NOT NULL, -- price per unit in paise
  quantity INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL, -- price * quantity
  
  -- Variants/Customizations
  customizations JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  
  -- Vehicle Details
  vehicle_type VARCHAR(20), -- bike, scooter, car
  vehicle_number VARCHAR(20),
  
  -- Location
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Documents
  documents JSONB DEFAULT '{}'::jsonb, -- license, aadhar, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Tracking Table (Real-time location updates)
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  delivery_partner_id INTEGER REFERENCES delivery_partners(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Status at this point
  status VARCHAR(50),
  notes TEXT,
  
  -- Timestamp
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_partners_available ON delivery_partners(is_available, is_active);

-- Trigger to update delivery partner stats
CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE delivery_partners SET
      total_deliveries = total_deliveries + 1
    WHERE id = NEW.delivery_partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_stats
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_delivery_partner_stats();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_number := 'FNG' || LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
````

---

## 🔧 STEP 3: BACKEND ORDER API

````javascript
// filepath: backend/src/routes/orders.routes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Create Order
router.post('/', authenticate, async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const {
      order_type,
      restaurant_id,
      items,
      delivery_address,
      payment_method,
      coupon_code,
      instructions
    } = req.body;

    // Calculate amounts
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply coupon if provided
    let discount_amount = 0;
    let coupon_id = null;
    if (coupon_code) {
      const coupon = await trx('coupons')
        .where({ code: coupon_code, is_active: true })
        .first();
      
      if (coupon) {
        if (subtotal >= coupon.min_order_amount) {
          if (coupon.discount_type === 'flat') {
            discount_amount = coupon.discount_value;
          } else {
            discount_amount = Math.floor(subtotal * coupon.discount_value / 100);
            if (coupon.max_discount) {
              discount_amount = Math.min(discount_amount, coupon.max_discount);
            }
          }
          coupon_id = coupon.id;
          
          // Update coupon usage
          await trx('coupons')
            .where({ id: coupon.id })
            .increment('used_count', 1);
        }
      }
    }

    // Calculate fees
    const delivery_fee = subtotal < 19900 ? 4900 : 0; // Free delivery above ₹199
    const packaging_fee = order_type === 'food' ? 500 : 0;
    const taxes = Math.floor((subtotal - discount_amount) * 0.05); // 5% GST
    
    const total_amount = subtotal + delivery_fee + packaging_fee + taxes - discount_amount;

    // Generate order number
    const order_number = await db.raw("SELECT generate_order_number() as number");
    
    // Get restaurant name if food order
    let restaurant_name = null;
    if (restaurant_id) {
      const restaurant = await trx('restaurants').where({ id: restaurant_id }).first();
      restaurant_name = restaurant?.name;
    }

    // Create order
    const [order] = await trx('orders')
      .insert({
        order_number: order_number.rows[0].number,
        user_id: req.user.id,
        order_type,
        restaurant_id,
        restaurant_name,
        subtotal,
        delivery_fee,
        packaging_fee,
        taxes,
        discount_amount,
        total_amount,
        coupon_code,
        coupon_id,
        delivery_address: JSON.stringify(delivery_address),
        payment_method,
        instructions,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000) // 45 mins
      })
      .returning('*');

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_type: item.product_type || 'menu_item',
      product_id: item.id,
      product_name: item.name,
      product_image: item.image_url || item.images?.[0],
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      customizations: JSON.stringify(item.customizations || [])
    }));

    await trx('order_items').insert(orderItems);

    // Commit transaction
    await trx.commit();

    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get User Orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { status, order_type, page = 1, limit = 10 } = req.query;

    let query = db('orders')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    if (status) query = query.where({ status });
    if (order_type) query = query.where({ order_type });

    const offset = (page - 1) * limit;
    const orders = await query.limit(limit).offset(offset);

    // Get items for each order
    for (let order of orders) {
      order.items = await db('order_items')
        .where({ order_id: order.id });
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get Order Details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    order.items = await db('order_items')
      .where({ order_id: order.id });

    // Get delivery partner if assigned
    if (order.delivery_partner_id) {
      order.delivery_partner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'vehicle_type', 'vehicle_number', 'rating')
        .first();
    }

    // Get tracking history
    order.tracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'asc');

    // Get status history
    order.status_history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Track Order (Real-time location)
router.get('/:id/track', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get latest tracking location
    const latestTracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'desc')
      .first();

    // Get delivery partner current location
    let deliveryPartner = null;
    if (order.delivery_partner_id) {
      deliveryPartner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'current_latitude', 'current_longitude', 'vehicle_type', 'vehicle_number')
        .first();
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        estimated_delivery_time: order.estimated_delivery_time
      },
      current_location: latestTracking || deliveryPartner,
      delivery_partner: deliveryPartner,
      delivery_address: JSON.parse(order.delivery_address)
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Cancel Order
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({
        status: 'cancelled',
        cancelled_at: new Date()
      });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Rate Order
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;

    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id, status: 'delivered' })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not delivered' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({ rating, review });

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
````

---

## 📱 STEP 4: MOBILE CHECKOUT SCREEN

````typescript
// filepath: apps/customer-mobile/src/screens/Checkout/CheckoutScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFoodCart } from '../../hooks/useFoodCart';

export const CheckoutScreen = () => {
  const navigation = useNavigation();
  const cart = useFoodCart();
  
  const [selectedAddress, setSelectedAddress] = useState({
    id: 1,
    type: 'Home',
    address: '123 Main Street, Banjara Hills',
    landmark: 'Near City Mall',
    city: 'Hyderabad',
    pincode: '500034'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const applyCoupon = async () => {
    // Simulate coupon validation
    if (couponCode === 'FLAT100') {
      setAppliedCoupon({
        code: 'FLAT100',
        discount: 10000 // ₹100
      });
      Alert.alert('Success', '₹100 discount applied!');
    } else {
      Alert.alert('Invalid', 'Coupon code not valid');
    }
  };

  const placeOrder = async () => {
    try {
      const API = 'http://localhost:3000/api/v1';
      
      const orderData = {
        order_type: 'food',
        restaurant_id: cart.restaurant_id,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          product_type: 'menu_item',
          image_url: item.image_url
        })),
        delivery_address: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        instructions
      };

      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_TOKEN}` // Add auth token
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        cart.clearCart();
        navigation.navigate('OrderTracking', { orderId: data.order.id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const finalTotal = cart.total - (appliedCoupon?.discount || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a
```


## License: unknown
https://github.com/lakwetu-tz/gps_mobile/blob/2721223b487eee42d9237a37d3b61ed4ca519de9/screens/monitor/Driver.tsx

```
# 🚀 PHASE 12: ORDER MANAGEMENT + DELIVERY TRACKING + LIVE PREVIEW

Let me build Phase 12 with complete order management, real-time delivery tracking, and show you how to see the live preview!

---

## 📱 STEP 1: START LIVE PREVIEW - QUICK SETUP

````bash
# filepath: START_LIVE_PREVIEW.sh

#!/bin/bash

echo "🚀 Starting F&G Application Live Preview..."
echo "============================================"

# Step 1: Start Backend Server
echo "📡 Starting Backend Server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:3000"

# Step 2: Start Customer Mobile App
echo "📱 Starting Mobile App..."
cd ../apps/customer-mobile
npm install
npx expo start &
EXPO_PID=$!

echo ""
echo "============================================"
echo "🎉 F&G APPLICATION IS LIVE!"
echo "============================================"
echo ""
echo "📱 MOBILE APP:"
echo "   → Scan QR code with Expo Go app"
echo "   → Or press 'w' for web preview"
echo "   → Or press 'a' for Android emulator"
echo "   → Or press 'i' for iOS simulator"
echo ""
echo "🔧 ADMIN DASHBOARD:"
echo "   → Open: http://localhost:5173"
echo ""
echo "📡 BACKEND API:"
echo "   → Running: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================"

# Wait for user interrupt
wait $BACKEND_PID $EXPO_PID
````

---

## 🗄️ STEP 2: ORDER MANAGEMENT DATABASE

````sql
-- filepath: backend/src/database/migrations/012_orders_delivery_system.sql

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order Type
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('food', 'grocery', 'fashion', 'tools', 'household')),
  
  -- Restaurant/Store Details (for food orders)
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_name VARCHAR(255),
  
  -- Amounts (in paise)
  subtotal INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  packaging_fee INTEGER DEFAULT 0,
  taxes INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Coupon
  coupon_code VARCHAR(50),
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Delivery Address
  delivery_address_id INTEGER REFERENCES addresses(id),
  delivery_address JSONB NOT NULL,
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 
    'delivered', 'cancelled', 'refunded'
  )),
  
  -- Payment
  payment_method VARCHAR(20) CHECK (payment_method IN ('cod', 'online', 'wallet')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Delivery
  delivery_partner_id INTEGER REFERENCES delivery_partners(id) ON DELETE SET NULL,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  
  -- Special Instructions
  instructions TEXT,
  
  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Details
  product_type VARCHAR(20) NOT NULL, -- 'menu_item', 'fashion', 'tools', 'household', 'grocery'
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  
  -- Pricing
  price INTEGER NOT NULL, -- price per unit in paise
  quantity INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL, -- price * quantity
  
  -- Variants/Customizations
  customizations JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  
  -- Vehicle Details
  vehicle_type VARCHAR(20), -- bike, scooter, car
  vehicle_number VARCHAR(20),
  
  -- Location
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Documents
  documents JSONB DEFAULT '{}'::jsonb, -- license, aadhar, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Tracking Table (Real-time location updates)
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  delivery_partner_id INTEGER REFERENCES delivery_partners(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Status at this point
  status VARCHAR(50),
  notes TEXT,
  
  -- Timestamp
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_partners_available ON delivery_partners(is_available, is_active);

-- Trigger to update delivery partner stats
CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE delivery_partners SET
      total_deliveries = total_deliveries + 1
    WHERE id = NEW.delivery_partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_stats
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_delivery_partner_stats();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_number := 'FNG' || LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
````

---

## 🔧 STEP 3: BACKEND ORDER API

````javascript
// filepath: backend/src/routes/orders.routes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Create Order
router.post('/', authenticate, async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const {
      order_type,
      restaurant_id,
      items,
      delivery_address,
      payment_method,
      coupon_code,
      instructions
    } = req.body;

    // Calculate amounts
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply coupon if provided
    let discount_amount = 0;
    let coupon_id = null;
    if (coupon_code) {
      const coupon = await trx('coupons')
        .where({ code: coupon_code, is_active: true })
        .first();
      
      if (coupon) {
        if (subtotal >= coupon.min_order_amount) {
          if (coupon.discount_type === 'flat') {
            discount_amount = coupon.discount_value;
          } else {
            discount_amount = Math.floor(subtotal * coupon.discount_value / 100);
            if (coupon.max_discount) {
              discount_amount = Math.min(discount_amount, coupon.max_discount);
            }
          }
          coupon_id = coupon.id;
          
          // Update coupon usage
          await trx('coupons')
            .where({ id: coupon.id })
            .increment('used_count', 1);
        }
      }
    }

    // Calculate fees
    const delivery_fee = subtotal < 19900 ? 4900 : 0; // Free delivery above ₹199
    const packaging_fee = order_type === 'food' ? 500 : 0;
    const taxes = Math.floor((subtotal - discount_amount) * 0.05); // 5% GST
    
    const total_amount = subtotal + delivery_fee + packaging_fee + taxes - discount_amount;

    // Generate order number
    const order_number = await db.raw("SELECT generate_order_number() as number");
    
    // Get restaurant name if food order
    let restaurant_name = null;
    if (restaurant_id) {
      const restaurant = await trx('restaurants').where({ id: restaurant_id }).first();
      restaurant_name = restaurant?.name;
    }

    // Create order
    const [order] = await trx('orders')
      .insert({
        order_number: order_number.rows[0].number,
        user_id: req.user.id,
        order_type,
        restaurant_id,
        restaurant_name,
        subtotal,
        delivery_fee,
        packaging_fee,
        taxes,
        discount_amount,
        total_amount,
        coupon_code,
        coupon_id,
        delivery_address: JSON.stringify(delivery_address),
        payment_method,
        instructions,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000) // 45 mins
      })
      .returning('*');

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_type: item.product_type || 'menu_item',
      product_id: item.id,
      product_name: item.name,
      product_image: item.image_url || item.images?.[0],
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      customizations: JSON.stringify(item.customizations || [])
    }));

    await trx('order_items').insert(orderItems);

    // Commit transaction
    await trx.commit();

    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get User Orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { status, order_type, page = 1, limit = 10 } = req.query;

    let query = db('orders')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    if (status) query = query.where({ status });
    if (order_type) query = query.where({ order_type });

    const offset = (page - 1) * limit;
    const orders = await query.limit(limit).offset(offset);

    // Get items for each order
    for (let order of orders) {
      order.items = await db('order_items')
        .where({ order_id: order.id });
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get Order Details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    order.items = await db('order_items')
      .where({ order_id: order.id });

    // Get delivery partner if assigned
    if (order.delivery_partner_id) {
      order.delivery_partner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'vehicle_type', 'vehicle_number', 'rating')
        .first();
    }

    // Get tracking history
    order.tracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'asc');

    // Get status history
    order.status_history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Track Order (Real-time location)
router.get('/:id/track', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get latest tracking location
    const latestTracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'desc')
      .first();

    // Get delivery partner current location
    let deliveryPartner = null;
    if (order.delivery_partner_id) {
      deliveryPartner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'current_latitude', 'current_longitude', 'vehicle_type', 'vehicle_number')
        .first();
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        estimated_delivery_time: order.estimated_delivery_time
      },
      current_location: latestTracking || deliveryPartner,
      delivery_partner: deliveryPartner,
      delivery_address: JSON.parse(order.delivery_address)
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Cancel Order
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({
        status: 'cancelled',
        cancelled_at: new Date()
      });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Rate Order
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;

    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id, status: 'delivered' })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not delivered' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({ rating, review });

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
````

---

## 📱 STEP 4: MOBILE CHECKOUT SCREEN

````typescript
// filepath: apps/customer-mobile/src/screens/Checkout/CheckoutScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFoodCart } from '../../hooks/useFoodCart';

export const CheckoutScreen = () => {
  const navigation = useNavigation();
  const cart = useFoodCart();
  
  const [selectedAddress, setSelectedAddress] = useState({
    id: 1,
    type: 'Home',
    address: '123 Main Street, Banjara Hills',
    landmark: 'Near City Mall',
    city: 'Hyderabad',
    pincode: '500034'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const applyCoupon = async () => {
    // Simulate coupon validation
    if (couponCode === 'FLAT100') {
      setAppliedCoupon({
        code: 'FLAT100',
        discount: 10000 // ₹100
      });
      Alert.alert('Success', '₹100 discount applied!');
    } else {
      Alert.alert('Invalid', 'Coupon code not valid');
    }
  };

  const placeOrder = async () => {
    try {
      const API = 'http://localhost:3000/api/v1';
      
      const orderData = {
        order_type: 'food',
        restaurant_id: cart.restaurant_id,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          product_type: 'menu_item',
          image_url: item.image_url
        })),
        delivery_address: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        instructions
      };

      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_TOKEN}` // Add auth token
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        cart.clearCart();
        navigation.navigate('OrderTracking', { orderId: data.order.id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const finalTotal = cart.total - (appliedCoupon?.discount || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a
```


## License: unknown
https://github.com/lakwetu-tz/gps_mobile/blob/2721223b487eee42d9237a37d3b61ed4ca519de9/screens/monitor/Driver.tsx

```
# 🚀 PHASE 12: ORDER MANAGEMENT + DELIVERY TRACKING + LIVE PREVIEW

Let me build Phase 12 with complete order management, real-time delivery tracking, and show you how to see the live preview!

---

## 📱 STEP 1: START LIVE PREVIEW - QUICK SETUP

````bash
# filepath: START_LIVE_PREVIEW.sh

#!/bin/bash

echo "🚀 Starting F&G Application Live Preview..."
echo "============================================"

# Step 1: Start Backend Server
echo "📡 Starting Backend Server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:3000"

# Step 2: Start Customer Mobile App
echo "📱 Starting Mobile App..."
cd ../apps/customer-mobile
npm install
npx expo start &
EXPO_PID=$!

echo ""
echo "============================================"
echo "🎉 F&G APPLICATION IS LIVE!"
echo "============================================"
echo ""
echo "📱 MOBILE APP:"
echo "   → Scan QR code with Expo Go app"
echo "   → Or press 'w' for web preview"
echo "   → Or press 'a' for Android emulator"
echo "   → Or press 'i' for iOS simulator"
echo ""
echo "🔧 ADMIN DASHBOARD:"
echo "   → Open: http://localhost:5173"
echo ""
echo "📡 BACKEND API:"
echo "   → Running: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================"

# Wait for user interrupt
wait $BACKEND_PID $EXPO_PID
````

---

## 🗄️ STEP 2: ORDER MANAGEMENT DATABASE

````sql
-- filepath: backend/src/database/migrations/012_orders_delivery_system.sql

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order Type
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('food', 'grocery', 'fashion', 'tools', 'household')),
  
  -- Restaurant/Store Details (for food orders)
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_name VARCHAR(255),
  
  -- Amounts (in paise)
  subtotal INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  packaging_fee INTEGER DEFAULT 0,
  taxes INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Coupon
  coupon_code VARCHAR(50),
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Delivery Address
  delivery_address_id INTEGER REFERENCES addresses(id),
  delivery_address JSONB NOT NULL,
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 
    'delivered', 'cancelled', 'refunded'
  )),
  
  -- Payment
  payment_method VARCHAR(20) CHECK (payment_method IN ('cod', 'online', 'wallet')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Delivery
  delivery_partner_id INTEGER REFERENCES delivery_partners(id) ON DELETE SET NULL,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  
  -- Special Instructions
  instructions TEXT,
  
  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Details
  product_type VARCHAR(20) NOT NULL, -- 'menu_item', 'fashion', 'tools', 'household', 'grocery'
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  
  -- Pricing
  price INTEGER NOT NULL, -- price per unit in paise
  quantity INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL, -- price * quantity
  
  -- Variants/Customizations
  customizations JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  
  -- Vehicle Details
  vehicle_type VARCHAR(20), -- bike, scooter, car
  vehicle_number VARCHAR(20),
  
  -- Location
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Documents
  documents JSONB DEFAULT '{}'::jsonb, -- license, aadhar, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Tracking Table (Real-time location updates)
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  delivery_partner_id INTEGER REFERENCES delivery_partners(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Status at this point
  status VARCHAR(50),
  notes TEXT,
  
  -- Timestamp
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_partners_available ON delivery_partners(is_available, is_active);

-- Trigger to update delivery partner stats
CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE delivery_partners SET
      total_deliveries = total_deliveries + 1
    WHERE id = NEW.delivery_partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_stats
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_delivery_partner_stats();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_number := 'FNG' || LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
````

---

## 🔧 STEP 3: BACKEND ORDER API

````javascript
// filepath: backend/src/routes/orders.routes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Create Order
router.post('/', authenticate, async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const {
      order_type,
      restaurant_id,
      items,
      delivery_address,
      payment_method,
      coupon_code,
      instructions
    } = req.body;

    // Calculate amounts
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply coupon if provided
    let discount_amount = 0;
    let coupon_id = null;
    if (coupon_code) {
      const coupon = await trx('coupons')
        .where({ code: coupon_code, is_active: true })
        .first();
      
      if (coupon) {
        if (subtotal >= coupon.min_order_amount) {
          if (coupon.discount_type === 'flat') {
            discount_amount = coupon.discount_value;
          } else {
            discount_amount = Math.floor(subtotal * coupon.discount_value / 100);
            if (coupon.max_discount) {
              discount_amount = Math.min(discount_amount, coupon.max_discount);
            }
          }
          coupon_id = coupon.id;
          
          // Update coupon usage
          await trx('coupons')
            .where({ id: coupon.id })
            .increment('used_count', 1);
        }
      }
    }

    // Calculate fees
    const delivery_fee = subtotal < 19900 ? 4900 : 0; // Free delivery above ₹199
    const packaging_fee = order_type === 'food' ? 500 : 0;
    const taxes = Math.floor((subtotal - discount_amount) * 0.05); // 5% GST
    
    const total_amount = subtotal + delivery_fee + packaging_fee + taxes - discount_amount;

    // Generate order number
    const order_number = await db.raw("SELECT generate_order_number() as number");
    
    // Get restaurant name if food order
    let restaurant_name = null;
    if (restaurant_id) {
      const restaurant = await trx('restaurants').where({ id: restaurant_id }).first();
      restaurant_name = restaurant?.name;
    }

    // Create order
    const [order] = await trx('orders')
      .insert({
        order_number: order_number.rows[0].number,
        user_id: req.user.id,
        order_type,
        restaurant_id,
        restaurant_name,
        subtotal,
        delivery_fee,
        packaging_fee,
        taxes,
        discount_amount,
        total_amount,
        coupon_code,
        coupon_id,
        delivery_address: JSON.stringify(delivery_address),
        payment_method,
        instructions,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000) // 45 mins
      })
      .returning('*');

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_type: item.product_type || 'menu_item',
      product_id: item.id,
      product_name: item.name,
      product_image: item.image_url || item.images?.[0],
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      customizations: JSON.stringify(item.customizations || [])
    }));

    await trx('order_items').insert(orderItems);

    // Commit transaction
    await trx.commit();

    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get User Orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { status, order_type, page = 1, limit = 10 } = req.query;

    let query = db('orders')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    if (status) query = query.where({ status });
    if (order_type) query = query.where({ order_type });

    const offset = (page - 1) * limit;
    const orders = await query.limit(limit).offset(offset);

    // Get items for each order
    for (let order of orders) {
      order.items = await db('order_items')
        .where({ order_id: order.id });
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get Order Details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    order.items = await db('order_items')
      .where({ order_id: order.id });

    // Get delivery partner if assigned
    if (order.delivery_partner_id) {
      order.delivery_partner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'vehicle_type', 'vehicle_number', 'rating')
        .first();
    }

    // Get tracking history
    order.tracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'asc');

    // Get status history
    order.status_history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Track Order (Real-time location)
router.get('/:id/track', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get latest tracking location
    const latestTracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'desc')
      .first();

    // Get delivery partner current location
    let deliveryPartner = null;
    if (order.delivery_partner_id) {
      deliveryPartner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'current_latitude', 'current_longitude', 'vehicle_type', 'vehicle_number')
        .first();
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        estimated_delivery_time: order.estimated_delivery_time
      },
      current_location: latestTracking || deliveryPartner,
      delivery_partner: deliveryPartner,
      delivery_address: JSON.parse(order.delivery_address)
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Cancel Order
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({
        status: 'cancelled',
        cancelled_at: new Date()
      });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Rate Order
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;

    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id, status: 'delivered' })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not delivered' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({ rating, review });

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
````

---

## 📱 STEP 4: MOBILE CHECKOUT SCREEN

````typescript
// filepath: apps/customer-mobile/src/screens/Checkout/CheckoutScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFoodCart } from '../../hooks/useFoodCart';

export const CheckoutScreen = () => {
  const navigation = useNavigation();
  const cart = useFoodCart();
  
  const [selectedAddress, setSelectedAddress] = useState({
    id: 1,
    type: 'Home',
    address: '123 Main Street, Banjara Hills',
    landmark: 'Near City Mall',
    city: 'Hyderabad',
    pincode: '500034'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const applyCoupon = async () => {
    // Simulate coupon validation
    if (couponCode === 'FLAT100') {
      setAppliedCoupon({
        code: 'FLAT100',
        discount: 10000 // ₹100
      });
      Alert.alert('Success', '₹100 discount applied!');
    } else {
      Alert.alert('Invalid', 'Coupon code not valid');
    }
  };

  const placeOrder = async () => {
    try {
      const API = 'http://localhost:3000/api/v1';
      
      const orderData = {
        order_type: 'food',
        restaurant_id: cart.restaurant_id,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          product_type: 'menu_item',
          image_url: item.image_url
        })),
        delivery_address: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        instructions
      };

      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_TOKEN}` // Add auth token
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        cart.clearCart();
        navigation.navigate('OrderTracking', { orderId: data.order.id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const finalTotal = cart.total - (appliedCoupon?.discount || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a
```


## License: unknown
https://github.com/lakwetu-tz/gps_mobile/blob/2721223b487eee42d9237a37d3b61ed4ca519de9/screens/monitor/Driver.tsx

```
# 🚀 PHASE 12: ORDER MANAGEMENT + DELIVERY TRACKING + LIVE PREVIEW

Let me build Phase 12 with complete order management, real-time delivery tracking, and show you how to see the live preview!

---

## 📱 STEP 1: START LIVE PREVIEW - QUICK SETUP

````bash
# filepath: START_LIVE_PREVIEW.sh

#!/bin/bash

echo "🚀 Starting F&G Application Live Preview..."
echo "============================================"

# Step 1: Start Backend Server
echo "📡 Starting Backend Server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:3000"

# Step 2: Start Customer Mobile App
echo "📱 Starting Mobile App..."
cd ../apps/customer-mobile
npm install
npx expo start &
EXPO_PID=$!

echo ""
echo "============================================"
echo "🎉 F&G APPLICATION IS LIVE!"
echo "============================================"
echo ""
echo "📱 MOBILE APP:"
echo "   → Scan QR code with Expo Go app"
echo "   → Or press 'w' for web preview"
echo "   → Or press 'a' for Android emulator"
echo "   → Or press 'i' for iOS simulator"
echo ""
echo "🔧 ADMIN DASHBOARD:"
echo "   → Open: http://localhost:5173"
echo ""
echo "📡 BACKEND API:"
echo "   → Running: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================"

# Wait for user interrupt
wait $BACKEND_PID $EXPO_PID
````

---

## 🗄️ STEP 2: ORDER MANAGEMENT DATABASE

````sql
-- filepath: backend/src/database/migrations/012_orders_delivery_system.sql

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order Type
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('food', 'grocery', 'fashion', 'tools', 'household')),
  
  -- Restaurant/Store Details (for food orders)
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_name VARCHAR(255),
  
  -- Amounts (in paise)
  subtotal INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  packaging_fee INTEGER DEFAULT 0,
  taxes INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Coupon
  coupon_code VARCHAR(50),
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Delivery Address
  delivery_address_id INTEGER REFERENCES addresses(id),
  delivery_address JSONB NOT NULL,
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 
    'delivered', 'cancelled', 'refunded'
  )),
  
  -- Payment
  payment_method VARCHAR(20) CHECK (payment_method IN ('cod', 'online', 'wallet')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Delivery
  delivery_partner_id INTEGER REFERENCES delivery_partners(id) ON DELETE SET NULL,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  
  -- Special Instructions
  instructions TEXT,
  
  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Details
  product_type VARCHAR(20) NOT NULL, -- 'menu_item', 'fashion', 'tools', 'household', 'grocery'
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  
  -- Pricing
  price INTEGER NOT NULL, -- price per unit in paise
  quantity INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL, -- price * quantity
  
  -- Variants/Customizations
  customizations JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  
  -- Vehicle Details
  vehicle_type VARCHAR(20), -- bike, scooter, car
  vehicle_number VARCHAR(20),
  
  -- Location
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Documents
  documents JSONB DEFAULT '{}'::jsonb, -- license, aadhar, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Tracking Table (Real-time location updates)
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  delivery_partner_id INTEGER REFERENCES delivery_partners(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Status at this point
  status VARCHAR(50),
  notes TEXT,
  
  -- Timestamp
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_partners_available ON delivery_partners(is_available, is_active);

-- Trigger to update delivery partner stats
CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE delivery_partners SET
      total_deliveries = total_deliveries + 1
    WHERE id = NEW.delivery_partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_stats
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_delivery_partner_stats();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_number := 'FNG' || LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
````

---

## 🔧 STEP 3: BACKEND ORDER API

````javascript
// filepath: backend/src/routes/orders.routes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Create Order
router.post('/', authenticate, async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const {
      order_type,
      restaurant_id,
      items,
      delivery_address,
      payment_method,
      coupon_code,
      instructions
    } = req.body;

    // Calculate amounts
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply coupon if provided
    let discount_amount = 0;
    let coupon_id = null;
    if (coupon_code) {
      const coupon = await trx('coupons')
        .where({ code: coupon_code, is_active: true })
        .first();
      
      if (coupon) {
        if (subtotal >= coupon.min_order_amount) {
          if (coupon.discount_type === 'flat') {
            discount_amount = coupon.discount_value;
          } else {
            discount_amount = Math.floor(subtotal * coupon.discount_value / 100);
            if (coupon.max_discount) {
              discount_amount = Math.min(discount_amount, coupon.max_discount);
            }
          }
          coupon_id = coupon.id;
          
          // Update coupon usage
          await trx('coupons')
            .where({ id: coupon.id })
            .increment('used_count', 1);
        }
      }
    }

    // Calculate fees
    const delivery_fee = subtotal < 19900 ? 4900 : 0; // Free delivery above ₹199
    const packaging_fee = order_type === 'food' ? 500 : 0;
    const taxes = Math.floor((subtotal - discount_amount) * 0.05); // 5% GST
    
    const total_amount = subtotal + delivery_fee + packaging_fee + taxes - discount_amount;

    // Generate order number
    const order_number = await db.raw("SELECT generate_order_number() as number");
    
    // Get restaurant name if food order
    let restaurant_name = null;
    if (restaurant_id) {
      const restaurant = await trx('restaurants').where({ id: restaurant_id }).first();
      restaurant_name = restaurant?.name;
    }

    // Create order
    const [order] = await trx('orders')
      .insert({
        order_number: order_number.rows[0].number,
        user_id: req.user.id,
        order_type,
        restaurant_id,
        restaurant_name,
        subtotal,
        delivery_fee,
        packaging_fee,
        taxes,
        discount_amount,
        total_amount,
        coupon_code,
        coupon_id,
        delivery_address: JSON.stringify(delivery_address),
        payment_method,
        instructions,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000) // 45 mins
      })
      .returning('*');

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_type: item.product_type || 'menu_item',
      product_id: item.id,
      product_name: item.name,
      product_image: item.image_url || item.images?.[0],
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      customizations: JSON.stringify(item.customizations || [])
    }));

    await trx('order_items').insert(orderItems);

    // Commit transaction
    await trx.commit();

    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get User Orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { status, order_type, page = 1, limit = 10 } = req.query;

    let query = db('orders')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    if (status) query = query.where({ status });
    if (order_type) query = query.where({ order_type });

    const offset = (page - 1) * limit;
    const orders = await query.limit(limit).offset(offset);

    // Get items for each order
    for (let order of orders) {
      order.items = await db('order_items')
        .where({ order_id: order.id });
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get Order Details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    order.items = await db('order_items')
      .where({ order_id: order.id });

    // Get delivery partner if assigned
    if (order.delivery_partner_id) {
      order.delivery_partner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'vehicle_type', 'vehicle_number', 'rating')
        .first();
    }

    // Get tracking history
    order.tracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'asc');

    // Get status history
    order.status_history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Track Order (Real-time location)
router.get('/:id/track', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get latest tracking location
    const latestTracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'desc')
      .first();

    // Get delivery partner current location
    let deliveryPartner = null;
    if (order.delivery_partner_id) {
      deliveryPartner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'current_latitude', 'current_longitude', 'vehicle_type', 'vehicle_number')
        .first();
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        estimated_delivery_time: order.estimated_delivery_time
      },
      current_location: latestTracking || deliveryPartner,
      delivery_partner: deliveryPartner,
      delivery_address: JSON.parse(order.delivery_address)
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Cancel Order
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({
        status: 'cancelled',
        cancelled_at: new Date()
      });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Rate Order
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;

    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id, status: 'delivered' })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not delivered' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({ rating, review });

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
````

---

## 📱 STEP 4: MOBILE CHECKOUT SCREEN

````typescript
// filepath: apps/customer-mobile/src/screens/Checkout/CheckoutScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFoodCart } from '../../hooks/useFoodCart';

export const CheckoutScreen = () => {
  const navigation = useNavigation();
  const cart = useFoodCart();
  
  const [selectedAddress, setSelectedAddress] = useState({
    id: 1,
    type: 'Home',
    address: '123 Main Street, Banjara Hills',
    landmark: 'Near City Mall',
    city: 'Hyderabad',
    pincode: '500034'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const applyCoupon = async () => {
    // Simulate coupon validation
    if (couponCode === 'FLAT100') {
      setAppliedCoupon({
        code: 'FLAT100',
        discount: 10000 // ₹100
      });
      Alert.alert('Success', '₹100 discount applied!');
    } else {
      Alert.alert('Invalid', 'Coupon code not valid');
    }
  };

  const placeOrder = async () => {
    try {
      const API = 'http://localhost:3000/api/v1';
      
      const orderData = {
        order_type: 'food',
        restaurant_id: cart.restaurant_id,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          product_type: 'menu_item',
          image_url: item.image_url
        })),
        delivery_address: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        instructions
      };

      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_TOKEN}` // Add auth token
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        cart.clearCart();
        navigation.navigate('OrderTracking', { orderId: data.order.id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const finalTotal = cart.total - (appliedCoupon?.discount || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a
```


## License: unknown
https://github.com/lakwetu-tz/gps_mobile/blob/2721223b487eee42d9237a37d3b61ed4ca519de9/screens/monitor/Driver.tsx

```
# 🚀 PHASE 12: ORDER MANAGEMENT + DELIVERY TRACKING + LIVE PREVIEW

Let me build Phase 12 with complete order management, real-time delivery tracking, and show you how to see the live preview!

---

## 📱 STEP 1: START LIVE PREVIEW - QUICK SETUP

````bash
# filepath: START_LIVE_PREVIEW.sh

#!/bin/bash

echo "🚀 Starting F&G Application Live Preview..."
echo "============================================"

# Step 1: Start Backend Server
echo "📡 Starting Backend Server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:3000"

# Step 2: Start Customer Mobile App
echo "📱 Starting Mobile App..."
cd ../apps/customer-mobile
npm install
npx expo start &
EXPO_PID=$!

echo ""
echo "============================================"
echo "🎉 F&G APPLICATION IS LIVE!"
echo "============================================"
echo ""
echo "📱 MOBILE APP:"
echo "   → Scan QR code with Expo Go app"
echo "   → Or press 'w' for web preview"
echo "   → Or press 'a' for Android emulator"
echo "   → Or press 'i' for iOS simulator"
echo ""
echo "🔧 ADMIN DASHBOARD:"
echo "   → Open: http://localhost:5173"
echo ""
echo "📡 BACKEND API:"
echo "   → Running: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================"

# Wait for user interrupt
wait $BACKEND_PID $EXPO_PID
````

---

## 🗄️ STEP 2: ORDER MANAGEMENT DATABASE

````sql
-- filepath: backend/src/database/migrations/012_orders_delivery_system.sql

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order Type
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('food', 'grocery', 'fashion', 'tools', 'household')),
  
  -- Restaurant/Store Details (for food orders)
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_name VARCHAR(255),
  
  -- Amounts (in paise)
  subtotal INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  packaging_fee INTEGER DEFAULT 0,
  taxes INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Coupon
  coupon_code VARCHAR(50),
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Delivery Address
  delivery_address_id INTEGER REFERENCES addresses(id),
  delivery_address JSONB NOT NULL,
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 
    'delivered', 'cancelled', 'refunded'
  )),
  
  -- Payment
  payment_method VARCHAR(20) CHECK (payment_method IN ('cod', 'online', 'wallet')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Delivery
  delivery_partner_id INTEGER REFERENCES delivery_partners(id) ON DELETE SET NULL,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  
  -- Special Instructions
  instructions TEXT,
  
  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Details
  product_type VARCHAR(20) NOT NULL, -- 'menu_item', 'fashion', 'tools', 'household', 'grocery'
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  
  -- Pricing
  price INTEGER NOT NULL, -- price per unit in paise
  quantity INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL, -- price * quantity
  
  -- Variants/Customizations
  customizations JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  
  -- Vehicle Details
  vehicle_type VARCHAR(20), -- bike, scooter, car
  vehicle_number VARCHAR(20),
  
  -- Location
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Documents
  documents JSONB DEFAULT '{}'::jsonb, -- license, aadhar, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Tracking Table (Real-time location updates)
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  delivery_partner_id INTEGER REFERENCES delivery_partners(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Status at this point
  status VARCHAR(50),
  notes TEXT,
  
  -- Timestamp
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_partners_available ON delivery_partners(is_available, is_active);

-- Trigger to update delivery partner stats
CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE delivery_partners SET
      total_deliveries = total_deliveries + 1
    WHERE id = NEW.delivery_partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_stats
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_delivery_partner_stats();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_number := 'FNG' || LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
````

---

## 🔧 STEP 3: BACKEND ORDER API

````javascript
// filepath: backend/src/routes/orders.routes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Create Order
router.post('/', authenticate, async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const {
      order_type,
      restaurant_id,
      items,
      delivery_address,
      payment_method,
      coupon_code,
      instructions
    } = req.body;

    // Calculate amounts
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply coupon if provided
    let discount_amount = 0;
    let coupon_id = null;
    if (coupon_code) {
      const coupon = await trx('coupons')
        .where({ code: coupon_code, is_active: true })
        .first();
      
      if (coupon) {
        if (subtotal >= coupon.min_order_amount) {
          if (coupon.discount_type === 'flat') {
            discount_amount = coupon.discount_value;
          } else {
            discount_amount = Math.floor(subtotal * coupon.discount_value / 100);
            if (coupon.max_discount) {
              discount_amount = Math.min(discount_amount, coupon.max_discount);
            }
          }
          coupon_id = coupon.id;
          
          // Update coupon usage
          await trx('coupons')
            .where({ id: coupon.id })
            .increment('used_count', 1);
        }
      }
    }

    // Calculate fees
    const delivery_fee = subtotal < 19900 ? 4900 : 0; // Free delivery above ₹199
    const packaging_fee = order_type === 'food' ? 500 : 0;
    const taxes = Math.floor((subtotal - discount_amount) * 0.05); // 5% GST
    
    const total_amount = subtotal + delivery_fee + packaging_fee + taxes - discount_amount;

    // Generate order number
    const order_number = await db.raw("SELECT generate_order_number() as number");
    
    // Get restaurant name if food order
    let restaurant_name = null;
    if (restaurant_id) {
      const restaurant = await trx('restaurants').where({ id: restaurant_id }).first();
      restaurant_name = restaurant?.name;
    }

    // Create order
    const [order] = await trx('orders')
      .insert({
        order_number: order_number.rows[0].number,
        user_id: req.user.id,
        order_type,
        restaurant_id,
        restaurant_name,
        subtotal,
        delivery_fee,
        packaging_fee,
        taxes,
        discount_amount,
        total_amount,
        coupon_code,
        coupon_id,
        delivery_address: JSON.stringify(delivery_address),
        payment_method,
        instructions,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000) // 45 mins
      })
      .returning('*');

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_type: item.product_type || 'menu_item',
      product_id: item.id,
      product_name: item.name,
      product_image: item.image_url || item.images?.[0],
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      customizations: JSON.stringify(item.customizations || [])
    }));

    await trx('order_items').insert(orderItems);

    // Commit transaction
    await trx.commit();

    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get User Orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { status, order_type, page = 1, limit = 10 } = req.query;

    let query = db('orders')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    if (status) query = query.where({ status });
    if (order_type) query = query.where({ order_type });

    const offset = (page - 1) * limit;
    const orders = await query.limit(limit).offset(offset);

    // Get items for each order
    for (let order of orders) {
      order.items = await db('order_items')
        .where({ order_id: order.id });
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get Order Details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    order.items = await db('order_items')
      .where({ order_id: order.id });

    // Get delivery partner if assigned
    if (order.delivery_partner_id) {
      order.delivery_partner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'vehicle_type', 'vehicle_number', 'rating')
        .first();
    }

    // Get tracking history
    order.tracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'asc');

    // Get status history
    order.status_history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Track Order (Real-time location)
router.get('/:id/track', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get latest tracking location
    const latestTracking = await db('delivery_tracking')
      .where({ order_id: order.id })
      .orderBy('recorded_at', 'desc')
      .first();

    // Get delivery partner current location
    let deliveryPartner = null;
    if (order.delivery_partner_id) {
      deliveryPartner = await db('delivery_partners')
        .where({ id: order.delivery_partner_id })
        .select('id', 'name', 'phone', 'current_latitude', 'current_longitude', 'vehicle_type', 'vehicle_number')
        .first();
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        estimated_delivery_time: order.estimated_delivery_time
      },
      current_location: latestTracking || deliveryPartner,
      delivery_partner: deliveryPartner,
      delivery_address: JSON.parse(order.delivery_address)
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Cancel Order
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({
        status: 'cancelled',
        cancelled_at: new Date()
      });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Rate Order
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;

    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id, status: 'delivered' })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not delivered' });
    }

    await db('orders')
      .where({ id: order.id })
      .update({ rating, review });

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
````

---

## 📱 STEP 4: MOBILE CHECKOUT SCREEN

````typescript
// filepath: apps/customer-mobile/src/screens/Checkout/CheckoutScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFoodCart } from '../../hooks/useFoodCart';

export const CheckoutScreen = () => {
  const navigation = useNavigation();
  const cart = useFoodCart();
  
  const [selectedAddress, setSelectedAddress] = useState({
    id: 1,
    type: 'Home',
    address: '123 Main Street, Banjara Hills',
    landmark: 'Near City Mall',
    city: 'Hyderabad',
    pincode: '500034'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const applyCoupon = async () => {
    // Simulate coupon validation
    if (couponCode === 'FLAT100') {
      setAppliedCoupon({
        code: 'FLAT100',
        discount: 10000 // ₹100
      });
      Alert.alert('Success', '₹100 discount applied!');
    } else {
      Alert.alert('Invalid', 'Coupon code not valid');
    }
  };

  const placeOrder = async () => {
    try {
      const API = 'http://localhost:3000/api/v1';
      
      const orderData = {
        order_type: 'food',
        restaurant_id: cart.restaurant_id,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          product_type: 'menu_item',
          image_url: item.image_url
        })),
        delivery_address: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        instructions
      };

      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_TOKEN}` // Add auth token
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        cart.clearCart();
        navigation.navigate('OrderTracking', { orderId: data.order.id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const finalTotal = cart.total - (appliedCoupon?.discount || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a
```

