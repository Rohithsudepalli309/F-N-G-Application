# Product Definition Document (SSOT)

> [!IMPORTANT]
> This document is the Single Source of Truth (SSOT) for the Google Antigravity IDE and all AI models.
> It serves as the guardrails for Gemini 3 Pro, Gemini 3 Flash, Claude Sonnet 4.6, and Claude Opus 4.6.
> No deviations are allowed without explicit human approval.

### User Review Required
> [!IMPORTANT]
> **CRITICAL ARCHITECTURAL CONSTRAINT**: This is an **ANDROID MOBILE APPLICATION**.
> It is **NOT** a web application for customers.
> The only web component is the Admin Dashboard.

## 1. Product Definition

### App Type
**Real-time Food + Grocery Delivery Platform**
(Comparable to Swiggy, Zomato, BigBasket)

### Users (4 ACTORS)
- **Customer**
- **Merchant** (Restaurant / Grocery Store)
- **Delivery Partner**
- **Admin**

### Platforms
- **Android** (PRIMARY) - React Native
- **iOS** (SECONDARY) - Customer App (React Native), Delivery Partner App (SwiftUI)
- **Admin Web Dashboard** - React

---

## 2. Core User Flows (Locked)

### Customer Flow
1. Open App
2. Login / Sign up (OTP + Email)
3. Location Detect
4. Browse Restaurants / Grocery Stores
5. View Menu / Products
6. Add to Cart
7. Checkout
8. Razorpay Payment
9. Order Confirmed
10. Live Order Tracking
11. Delivery Completed
12. Rating & Feedback
13. Logout

### Merchant Flow
1. Login
2. Receive Order
3. Accept / Reject
4. Prepare Order
5. Mark Ready

### Delivery Partner Flow
1. Login
2. Accept Delivery
3. Pickup Order
4. Live Location Update
5. Deliver Order
6. Complete Delivery

### Admin Flow
1. Login
2. Manage Users
3. Manage Stores
4. Monitor Orders
5. Resolve Issues
6. Analytics

---

## 3. MVP Feature Lock

> [!NOTE]
> Only features listed in "INCLUDED" are allowed for the MVP. Start small, scale later.

### INCLUDED (MVP)
- [x] Login / Signup / Logout
- [x] Live Location Tracking
- [x] Cart & Checkout
- [x] Razorpay Payments
- [x] Real-time Order Status
- [x] Push Notifications
- [x] Ratings (basic)
- [x] Order History

### EXCLUDED (PHASE-2)
- [ ] Subscriptions
- [ ] Wallets
- [ ] Offers / Coupons
- [ ] AI Recommendations
- [ ] Dark Stores
- [ ] Voice Search
- [ ] Multi-language Support

> [!WARNING]
> Antigravity agents are **NOT** allowed to build excluded features.

---

## 4. Technology Lock (Final)

These choices are final and cannot be changed later.

### Frontend
- **Customer App**: React Native
- **Delivery Partner (iOS)**: SwiftUI
- **Admin Panel**: React.js (Web Dashboard)

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL
- **Caching**: Redis
- **Real-time**: WebSockets (Socket.IO)

### Integrations
- **Payments**: Razorpay (ONLY)
    - Server-side Order Creation
    - Webhook Verification Mandatory
- **Maps**: Google Maps SDK
- **Notifications**: Firebase Cloud Messaging (FCM)

---

## 5. Google Antigravity AI Model Rules

### AI Model Responsibility Matrix

| Task | Model |
| :--- | :--- |
| Architecture & Security | **Gemini 3 Pro** |
| Fast Code Generation | **Gemini 3 Flash** |
| UI Text / Copy / UX | **Claude Sonnet 4.6** |
| Legal, Privacy, Policies | **Claude Opus 4.6** |

### Restrictions
- ❌ Models cannot override each other
- ❌ No model can change tech stack
- ❌ No model can deploy without human approval

---

## 6. Non-Negotiable Rules (Enforced in Antigravity)

> [!CAUTION]
> Violation of these rules will result in immediate rollback.

1. ❌ **No direct DB access from frontend**
2. ❌ **No payment logic on client**
3. ❌ **No hard-coded API keys**
4. ❌ **No auto-deploy to production**
5. ❌ **No deletion or modification of files without approval**
6. ❌ **No feature beyond MVP scope**
7. ❌ **NO CUSTOMER WEB INTERFACE (Mobile App Only)**
