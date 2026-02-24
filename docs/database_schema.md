# Database Schema & Data Integrity (Step 3 SSOT)

> [!IMPORTANT]
> **Database**: PostgreSQL (v16+)
> **Extensions**: `uuid-ossp`, `postgis` (for location)
> **Constraint**: NO Payment Card Data stored (PCI-DSS Compliance)

---

## 📅 Part 1: Core Schema (Normalized)

### 1. Identity & Access (`auth_service`)

#### `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `phone` | VARCHAR(20) | UNIQUE, NOT NULL | Canonical E.164 Identity |
| `email` | VARCHAR(255) | UNIQUE, NULLABLE | |
| `role` | VARCHAR(20) | NOT NULL, CHECK (role IN ('customer','merchant','driver','admin')) | |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Phone verification status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Audit |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Audit |

#### `drivers`
*1:1 with users(role='driver')*
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | PK, FK -> users.id | |
| `is_online` | BOOLEAN | DEFAULT FALSE | Availability |
| `current_lat` | DECIMAL(10,8) | NULLABLE | PostGIS Point preferred |
| `current_lng` | DECIMAL(11,8) | NULLABLE | |
| `vehicle_type` | VARCHAR(20) | DEFAULT 'bike' | |

---

### 2. Catalog (`catalog_service`)

#### `stores`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `owner_id` | UUID | FK -> users.id | Merchant Owner |
| `name` | VARCHAR(100) | NOT NULL | |
| `is_active` | BOOLEAN | DEFAULT FALSE | Open/Closed |
| `lat` | DECIMAL(10,8) | NOT NULL | |
| `lng` | DECIMAL(11,8) | NOT NULL | |
| `address` | TEXT | NOT NULL | |
| `image_url` | TEXT | | |

#### `products`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `store_id` | UUID | FK -> stores.id | |
| `name` | VARCHAR(100) | NOT NULL | |
| `price` | INTEGER | NOT NULL, CHECK (price >= 0) | Stored in cents/paisa |
| `is_available` | BOOLEAN | DEFAULT TRUE | |
| `category` | VARCHAR(50) | NOT NULL | |

---

### 3. Shopping (`cart_service`)

#### `carts`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `user_id` | UUID | FK -> users.id, UNIQUE | One active cart per user |
| `store_id` | UUID | FK -> stores.id, NULLABLE | Cart locked to one store |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

#### `cart_items`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `cart_id` | UUID | FK -> carts.id | |
| `product_id` | UUID | FK -> products.id | |
| `quantity` | INTEGER | CHECK (quantity > 0) | |

---

### 4. Ordering (`order_service`)

#### `orders`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `customer_id` | UUID | FK -> users.id | |
| `store_id` | UUID | FK -> stores.id | |
| `status` | ENUM | 'pending','placed','preparing','ready','pickup','delivered','cancelled' | |
| `total_amount` | INTEGER | NOT NULL | In cents/paisa |
| `delivery_address` | JSONB | NOT NULL | Snapshot |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

#### `order_items`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `order_id` | UUID | FK -> orders.id | |
| `product_id` | UUID | FK -> products.id | |
| `name` | VARCHAR(100) | NOT NULL | Snapshot name |
| `price` | INTEGER | NOT NULL | Snapshot price |
| `quantity` | INTEGER | NOT NULL | |

---

### 5. Fulfillment (`delivery_service`)

#### `deliveries`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `order_id` | UUID | FK -> orders.id, UNIQUE | |
| `driver_id` | UUID | FK -> drivers.user_id | |
| `status` | ENUM | 'assigned','picked_up','delivered' | |
| `pickup_time` | TIMESTAMPTZ | | |
| `delivery_time` | TIMESTAMPTZ | | |

#### `ratings`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `order_id` | UUID | FK -> orders.id | |
| `store_rating` | SMALLINT | CHECK (1-5) | |
| `driver_rating` | SMALLINT | CHECK (1-5) | |

---

### 6. Payments (`payment_service`)

#### `payments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `order_id` | UUID | FK -> orders.id | |
| `amount` | INTEGER | NOT NULL | |
| `razorpay_order_id` | VARCHAR(100)| NOT NULL, UNIQUE | |
| `razorpay_payment_id`| VARCHAR(100)| UNIQUE | |
| `status` | ENUM | 'pending','success','failed' | |

---

## 🔐 Part 2: Role & Permission Matrix

| Resource | Customer | Merchant | Driver | Admin |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | Self | Self | Self | Manage All |
| **Store** | Read | Update Own | Read | Manage All |
| **Product**| Read | Write Own | Read | Manage All |
| **Cart** | Write Own | No | No | Read API |
| **Order** | Create, Read Own | Read/Update Own | Acknowledge | Manage All |
| **Payment**| Init | Read Own | No | Read All |
| **Location**| Read Driver | No | Write Self | Read All |

---

## 🛡️ Part 5: Data Safety Rules
1.  **Strict Isolation**: `store_id` filtered queries for Merchants.
2.  **Audit Logs**: `notifications` table tracks all critical alerts.
3.  **Soft Deletes**: `deleted_at` column on `products` and `stores`.
4.  **Immutable Orders**: Once `status='delivered'`, no edits allowed.
5.  **Rate Limiting**: Write APIs capped at 100 req/min/user.
