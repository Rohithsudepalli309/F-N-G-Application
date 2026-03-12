import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import pool from './db';
import { redis, DRIVER_GEO_KEY } from './redis';

interface TokenPayload {
  id: number;
  role: string;
  storeId?: number;
}

// ── Speed sanity: reject GPS reports above 130 km/h (≈0.036°/s) ────────────
const MAX_SPEED_DEG_PER_SEC = 0.036;
interface LocCache { lat: number; lng: number; ts: number }

// Stored in Redis so all backend instances share the same speed state.
async function withinSpeedLimit(driverId: number, lat: number, lng: number): Promise<boolean> {
  const key = `driver:loc:${driverId}`;
  const now  = Date.now();
  const raw  = await redis.get(key).catch(() => null);
  await redis.set(key, JSON.stringify({ lat, lng, ts: now }), 'EX', 30).catch(() => null);
  if (!raw) return true;
  const prev: LocCache = JSON.parse(raw);
  const dtSec = (now - prev.ts) / 1000;
  if (dtSec < 1) return true;
  const dist = Math.sqrt((lat - prev.lat) ** 2 + (lng - prev.lng) ** 2);
  return dist / dtSec <= MAX_SPEED_DEG_PER_SEC;
}

export function initSocket(httpServer: HttpServer): SocketServer {
  // HIGH-5: never allow wildcard CORS; fall back to localhost dev origins, fail in prod
  const rawOrigins = process.env.ALLOWED_ORIGINS;
  let corsOrigin: string | string[];
  if (rawOrigins) {
    corsOrigin = rawOrigins.split(',').map((s) => s.trim());
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('ALLOWED_ORIGINS must be set in production');
  } else {
    corsOrigin = ['http://localhost:5173', 'http://localhost:5174'];
  }

  const io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Wire Redis pub/sub adapter so all backend replicas share rooms.
  // In development (NODE_ENV !== 'production') Redis is optional — skip the
  // adapter and rely on Socket.IO's built-in single-process memory adapter.
  if (process.env.NODE_ENV === 'production') {
    const subClient = redis.duplicate();
    subClient.on('error', (err) => console.error('[Redis/Sub]', err.message));
    io.adapter(createAdapter(redis, subClient));
  }

  // ── JWT Auth Middleware ────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      socket.data.id      = payload.id;
      socket.data.role    = payload.role;
      socket.data.storeId = payload.storeId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId: number = socket.data.id;
    const role: string   = socket.data.role;

    // Lookup drivers.id once at connection for FK correctness in delivery_tracking
    let driverId: number | null = null;
    if (role === 'driver') {
      const dr = await pool.query(`SELECT id FROM drivers WHERE user_id=$1 LIMIT 1`, [userId])
        .catch(() => ({ rows: [] as { id: number }[] }));
      driverId = dr.rows[0]?.id ?? null;
    }

    if (role === 'admin') socket.join('admin');

    // ── Driver: join personal room for push notifications ─────────────────
    if (role === 'driver') socket.join(`driver:${userId}`);

    // ── Customer: join order room (ownership verified) ──────────────────────
    socket.on('join:order', async (orderId: string) => {
      if (!orderId) return;
      // HIGH-2: verify the caller owns or is assigned to this order
      try {
        const check = await pool.query(
          `SELECT 1 FROM orders o
           WHERE o.id = $1 AND (
             o.customer_id = $2 OR
             (o.driver_id IS NOT NULL AND o.driver_id = (
               SELECT id FROM drivers WHERE user_id = $2 LIMIT 1
             )) OR
             $3 = 'admin'
           ) LIMIT 1`,
          [orderId, userId, role]
        );
        if (check.rows.length > 0) socket.join(`order:${orderId}`);
      } catch {/* non-critical: deny join on error */}
    });
    // Legacy event name used by customer app
    socket.on('subscribe_order', async ({ orderId }: { orderId: string }) => {
      if (!orderId) return;
      try {
        const check = await pool.query(
          `SELECT 1 FROM orders o
           WHERE o.id = $1 AND (
             o.customer_id = $2 OR
             (o.driver_id IS NOT NULL AND o.driver_id = (
               SELECT id FROM drivers WHERE user_id = $2 LIMIT 1
             )) OR
             $3 = 'admin'
           ) LIMIT 1`,
          [orderId, userId, role]
        );
        if (check.rows.length > 0) socket.join(`order:${orderId}`);
      } catch {/* non-critical */}
    });

    // ── Merchant: join store room ─────────────────────────────────────────
    socket.on('join:merchant', ({ storeId }: { storeId: number }) => {
      if (role === 'merchant' || role === 'admin') {
        socket.join(`merchant:${storeId}`);
      }
    });

    // ── Driver: toggle availability ───────────────────────────────────────
    socket.on('driver:available', async (payload: { lat: number; lng: number }) => {
      if (role !== 'driver' || typeof payload?.lat !== 'number') return;
      try {
        await redis.geoadd(DRIVER_GEO_KEY, payload.lng, payload.lat, String(userId));
        await pool.query(
          `UPDATE drivers SET is_available=TRUE, current_lat=$1, current_lng=$2 WHERE user_id=$3`,
          [payload.lat, payload.lng, userId]
        );
        socket.emit('driver:available_ack', { ok: true });
      } catch {/* non-critical */}
    });

    socket.on('driver:offline', async () => {
      if (role !== 'driver') return;
      redis.zrem(DRIVER_GEO_KEY, String(userId)).catch(() => {/* non-critical */});
      pool.query(`UPDATE drivers SET is_available=FALSE WHERE user_id=$1`, [userId])
        .catch(() => {/* non-critical */});
    });

    // ── Driver: broadcast location (every ~3 s) ───────────────────────────
    socket.on(
      'driver:location',
      async (payload: { orderId: string; lat: number; lng: number; bearing?: number }) => {
        if (role !== 'driver') return;
        if (!payload?.orderId || typeof payload.lat !== 'number') return;
        if (!await withinSpeedLimit(userId, payload.lat, payload.lng)) return;

        const bearing = payload.bearing ?? 0;

        io.to(`order:${payload.orderId}`).emit('order:location', {
          lat: payload.lat, lng: payload.lng, bearing,
        });

        // Keep GEO index fresh while driver is active
        redis.geoadd(DRIVER_GEO_KEY, payload.lng, payload.lat, String(userId))
          .catch(() => {/* non-critical */});

        pool.query(
          `INSERT INTO delivery_tracking (order_id, driver_id, lat, lng, bearing)
           VALUES ($1, $2, $3, $4, $5)`,
          [payload.orderId, driverId, payload.lat, payload.lng, bearing]
        ).catch(() => {/* non-critical */});

        pool.query(
          `UPDATE drivers SET current_lat=$1, current_lng=$2, last_seen_at=NOW() WHERE user_id=$3`,
          [payload.lat, payload.lng, userId]
        ).catch(() => {/* non-critical */});
      }
    );

    // ── Driver: status milestone ──────────────────────────────────────────
    socket.on('driver:status', (payload: { orderId: string; status: string }) => {
      if (role !== 'driver' || !payload?.orderId) return;
      io.to(`order:${payload.orderId}`).emit('order:status', { status: payload.status });
    });

    // ── Driver: accept assigned order ─────────────────────────────────────
    socket.on('driver:accept_order', async (payload: { orderId: number }) => {
      if (role !== 'driver' || !payload?.orderId) return;
      try {
        const res = await pool.query(
          `UPDATE driver_assignments
           SET status='accepted', responded_at=NOW()
           WHERE order_id=$1
             AND driver_id=(SELECT id FROM drivers WHERE user_id=$2 LIMIT 1)
             AND status='pending'
           RETURNING *`,
          [payload.orderId, userId]
        );
        if (res.rows.length === 0) {
          socket.emit('driver:accept_ack', { ok: false, reason: 'Assignment expired.' });
          return;
        }
        await pool.query(
          `UPDATE orders SET driver_id=(SELECT id FROM drivers WHERE user_id=$1 LIMIT 1) WHERE id=$2`,
          [userId, payload.orderId]
        );
        const driverInfo = await pool.query(
          `SELECT d.id, d.name, d.phone, d.vehicle_type, d.vehicle_number,
                  d.current_lat, d.current_lng, d.rating
           FROM drivers d WHERE d.user_id=$1`,
          [userId]
        );
        io.to(`order:${payload.orderId}`).emit('order:driver_assigned', {
          driver: driverInfo.rows[0] ?? {},
        });
        socket.emit('driver:accept_ack', { ok: true });
      } catch (e) {
        console.error('[Socket] driver:accept_order error:', e);
      }
    });

    socket.on('driver:reject_order', (payload: { orderId: number }) => {
      if (role !== 'driver' || !payload?.orderId) return;
      pool.query(
        `UPDATE driver_assignments
         SET status='rejected', responded_at=NOW()
         WHERE order_id=$1
           AND driver_id=(SELECT id FROM drivers WHERE user_id=$2 LIMIT 1)
           AND status='pending'`,
        [payload.orderId, userId]
      ).catch(() => {/* non-critical */});
    });

    socket.on('disconnect', () => {
      if (role === 'driver') {
        redis.zrem(DRIVER_GEO_KEY, String(userId)).catch(() => {/* non-critical */});
        pool.query(`UPDATE drivers SET is_available=FALSE WHERE user_id=$1`, [userId])
          .catch(() => {/* non-critical */});
        // driver:loc:<id> has a 30s TTL in Redis — no explicit cleanup needed.
      }
    });
  });

  return io;
}

export type { TokenPayload };
