# API & Real-Time Contracts (Step 3 SSOT)

> [!IMPORTANT]
> - **Base URL**: `https://api.antigravity.food/api/v1`
> - **Auth**: `Authorization: Bearer <JWT>`
> - **Format**: JSON, Stateless

---

## 🌐 Part 3: REST API Contracts

### 🔐 Auth (`/auth`)

#### `POST /auth/otp`
- **Request**: `{ "phone": "+919876543210", "role": "customer" }`
- **Response**: `{ "message": "OTP sent", "requestId": "..." }`

#### `POST /auth/login`
- **Request**: `{ "phone": "...", "otp": "123456" }`
- **Response**: `{ "token": "jwt...", "user": { "id": "...", "role": "..." } }`

---

### 🏪 Catalog (`/stores`, `/products`)

#### `GET /stores`
- **Query**: `lat=12.9&lng=77.5&radius=5000`
- **Response**: `[ { "id": "...", "name": "...", "distance": 1.2 } ]`

#### `GET /products?storeId=...`
- **Response**: `[ { "id": "...", "name": "...", "price": 1000, "available": true } ]`

---

### 🛒 Cart (`/cart`)

#### `POST /cart` (Add/Update Item)
- **Request**: `{ "storeId": "...", "items": [{ "productId": "...", "quantity": 2 }] }`
- **Response**: `{ "cartId": "...", "total": 2000, "items": [...] }`

#### `GET /cart`
- **Response**: `{ "store": {...}, "items": [...], "billDetails": {...} }`

---

### 📦 Order (`/orders`)

#### `POST /orders` (Checkout)
- **Request**: `{ "address": { "lat":..., "lng":..., "text":"..." } }`
- **Response**: 
  ```json
  { 
    "orderId": "uuid", 
    "status": "pending",
    "payment": {
      "razorpayOrderId": "order_rzp...",
      "amount": 50000,
      "currency": "INR",
      "keyId": "rzp_test_..." 
    }
  }
  ```

#### `GET /orders/{id}`
- **Response**: `{ "id": "...", "status": "preparing", "driver": { "lat":..., "lng":... } }`

---

### 💳 Payment (`/payments`)

#### `POST /payments/razorpay/webhook` (Public)
- **Headers**: `X-Razorpay-Signature: ...`
- **Body**: Razorpay Event JSON
- **Action**: Verifies signature, updates Order -> `placed`.

---

### 🛵 Driver (`/driver`)

#### `POST /driver/location`
- **Request**: `{ "lat": 12.97, "lng": 77.59, "bearing": 180 }`
- **Response**: `{ "success": true }`

#### `POST /driver/accept`
- **Request**: `{ "orderId": "..." }`
- **Response**: `{ "success": true }`

---

## ⚡ Part 4: Real-Time Event Contracts (Socket.IO)

### Events (Server -> Client)

#### `order.status`
- **Room**: `order_{orderId}`
- **Payload**: `{ "orderId": "...", "status": "picked_up", "timestamp": "..." }`

#### `driver.location`
- **Room**: `order_{orderId}`
- **Payload**: `{ "lat": 12.971, "lng": 77.594, "bearing": 90 }`

#### `market.new_order`
- **Room**: `store_{storeId}`
- **Payload**: `{ "orderId": "...", "items": [...], "revenue": 500 }`
- **Action**: UI plays ringtone.

#### `delivery.request`
- **Room**: `driver_{driverId}`
- **Payload**: `{ "orderId": "...", "pickup": {...}, "drop": {...}, "earnings": 40 }`

### Events (Client -> Server)

#### `join_room`
- **Payload**: `{ "room": "order_123" }`
- **Validation**: Server checks if User owns Order.

---

## 🛑 Data Safety Rules
1. **API Versioning**: All routes prefixed `/api/v1/`.
2. **Idempotency**: Payment webhooks must handle duplicate events safely.
3. **Validation**: All inputs validated with Zod/Joi in middleware.
4. **Rate Limit**: 429 Too Many Requests returned if thresholds exceeded.
