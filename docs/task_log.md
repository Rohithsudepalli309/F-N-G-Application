# Frontend UI/UX Overhaul Tasks

## Admin Dashboard
- [x] `index.css` — Google Fonts import, custom scrollbar, keyframe animations
- [x] `Layout.tsx` — Orange active nav accent, live status pill in header
- [x] `Dashboard.tsx` — KPI card color accents, brand chart color, staggered fade-in

## Customer App (UI/UX)
- [x] `HomeScreen.tsx` — Remove duplicate fetch, skeleton loader, animated mode switcher
- [x] `StoreScreen.tsx` — Fix top-level require() hook, fix cart overlap padding, price flash animation
- [x] `LoginScreen.tsx` — Orange gradient branding background, animated button

## Backend Auth & Admin Setup
- [x] `auth.service.js` — Update schemas and login logic for email/admin (Switched to `bcryptjs`)
- [x] `init_db.js` — Create schema initialization script
- [x] `seed_admin.js` — Create admin seeding script
- [x] `app.js` — Initialize DB on startup
- [x] Seeding — Successfully seeded `admin1@gmail.com`

## Customer App Native Reconstruction
- [x] Entry Points (`index.js`, `App.tsx`, `app.json`)
- [x] Native Android Folder Regeneration
- [x] Connect Native to existing Source Code
- [x] Debugging Gradle SSL/PKIX Error
- [x] Configure Android SDK Path (local.properties)
- [x] Revert to SDK 34 & Force core-ktx 1.12.0 (Global allprojects)
- [x] Downgrade react-native-maps to 1.10.0
- [x] Launch Customer App on Android
- [x] GitHub Repository Setup

## Visual Documentation
- [x] `app_preview.md` — High-fidelity design spec for F&G mobile screens
- [x] `walkthrough.md` — Final project summary
- [x] `development_log.md` — Detailed project building history
- [x] `developer_playbook.md` — Technical guide for future builds
