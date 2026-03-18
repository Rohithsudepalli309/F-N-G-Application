# Backend Startup Banner and Diagnostics

## Redis Mode Banner
- On backend startup, a banner prints the Redis mode:
  - `ENABLED`: Real Redis is used (production or REDIS_ENABLED=true)
  - `FALLBACK (in-memory mock)`: Redis is disabled or not present (local/dev)
- Banner appears in backend logs as:
  - `=== Backend Startup ===`
  - `Redis mode: ENABLED` or `Redis mode: FALLBACK (in-memory mock)`

## Diagnostics Script
- Location: `apps/customer-app/scripts/diagnostics.js`
- Usage:
  - Run from workspace root or customer-app folder:
    - `node apps/customer-app/scripts/diagnostics.js`
- Checks:
  - Backend health (`/health`)
  - Socket handshake (`/socket.io`)
  - Metro bundler status
  - adb reverse mapping for Metro
- Output:
  - Prints status for each subsystem

## Typical Workflow
1. Start backend and Metro as usual
2. Run diagnostics script to verify all subsystems
3. Check backend logs for Redis mode banner

## Troubleshooting
- If diagnostics show `FAIL` or `TIMEOUT`, check process status and port mapping
- If Redis mode is `FALLBACK`, enable Redis for features that require it by setting `REDIS_ENABLED=true` and running Redis
