# Real-time Event Architecture (WebSockets)

> [!IMPORTANT]
> - **Technology**: Socket.IO (v4)
> - **Transport**: WebSocket preferred, polling fallback allowed
> - **Auth**: JWT Token required in Handshake

## 1. Connection & Authentication

### Handshake
- **Client**: Connects with `query: { token: "JWT..." }`
- **Server**: Validates JWT, joins rooms based on Role (`customer_{id}`, `merchant_{id}`, `driver_{id}`).

---

## 2. Event Specifications

### A. Location Tracking (High Frequency)
*Driver -> Server -> Customer/Admin*

- **Event**: `driver:location_update` (Driver -> Server)
    - **Payload**: `{ "lat": 12.9716, "lng": 77.5946, "heading": 90, "speed": 40 }`
    - **Frequency**: Every 5-10 seconds
    - **Action**: Update Redis Cache, Broadcast to active Order Rooms.

- **Event**: `order:driver_location` (Server -> Customer Room `order_{id}`)
    - **Payload**: `{ "lat": 12.9716, "lng": 77.5946 }`

### B. Order Lifecycle (Critical Reliability)
*Server -> All Roles*

- **Event**: `order:status_update`
    - **Target**: Rooms `order_{id}`, `customer_{id}`, `merchant_{id}`, `driver_{id}`
    - **Payload**: `{ "order_id": "...", "status": "preparing", "timestamp": "..." }`

### C. Marketplace Real-time
*Server -> Merchant/Driver*

- **Event**: `merchant:new_order`
    - **Target**: `merchant_{id}`
    - **Payload**: `{ "order_id": "...", "items": [...], "timer": 60 }` (60s to accept)

- **Event**: `delivery:new_request`
    - **Target**: `driver_{id}` (or Geo-fenced multicast)
    - **Payload**: `{ "order_id": "...", "pickup": { ... }, "drop": { ... }, "fare": 50 }`

---

## 3. Rooms & Namespaces

| Room Name | Access | Purpose |
| :--- | :--- | :--- |
| `order_{order_id}` | Customer, Driver, Support | Live tracking, chat (future) |
| `merchant_{store_id}` | Merchant Owner | Receiving orders, dashboard updates |
| `driver_{user_id}` | Delivery Partner | Personal delivery requests |
| `admin_updates` | Admin | System-wide alerts |

---

## 4. Failure Handling
- **Ack**: Critical events (New Order) require Client Acknowledgement via callback.
- **Reconnection**: Clients must query REST API `/orders/active` upon reconnection to sync state.
