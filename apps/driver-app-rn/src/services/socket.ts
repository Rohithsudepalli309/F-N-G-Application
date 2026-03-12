/**
 * socket.ts — Socket.IO client with JWT auth and GPS broadcast.
 *
 * ARCHITECTURE:
 *  - Single shared socket instance (lazy-init on connect()).
 *  - GPS location is broadcast every GPS_INTERVAL_MS while the driver has an
 *    active order. Location acquisition uses react-native's Geolocation API.
 *  - The backend relays driver location to the customer via Socket.IO rooms.
 *
 * EVENTS EMITTED:
 *  driver:location   — { lat, lng }   every 3 s on active order
 *
 * EVENTS LISTENED:
 *  driver:order_assigned — { orderId, ... }
 *  driver:order_cancelled — { orderId }
 *  connect_error     — logged; reconnection handled automatically by socket.io
 */
import {io, Socket} from 'socket.io-client';
import {SOCKET_BASE} from '../config';
import {useAuthStore} from '../store/useAuthStore';
import {useOrderStore} from '../store/useOrderStore';

const GPS_INTERVAL_MS = 3_000;

let socket: Socket | null = null;
let gpsTimer: ReturnType<typeof setInterval> | null = null;

export function connectSocket(): void {
  if (socket?.connected) return;

  const token = useAuthStore.getState().accessToken;

  socket = io(SOCKET_BASE, {
    auth: {token},
    transports: ['websocket'],
    reconnectionAttempts: 10,
    reconnectionDelay:    2_000,
  });

  socket.on('connect', () => {
    console.log('[socket] Connected', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] Connection error', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] Disconnected', reason);
    stopGpsBroadcast();
  });

  // ── Incoming driver events ──────────────────────────────────────────
  socket.on(
    'driver:order_assigned',
    (data: {orderId: number; orderNumber: string; storeId: number}) => {
      useOrderStore.getState().setActiveOrderId(data.orderId);
      startGpsBroadcast();
    },
  );

  socket.on('driver:order_cancelled', () => {
    useOrderStore.getState().setActiveOrderId(null);
    stopGpsBroadcast();
  });
}

export function disconnectSocket(): void {
  stopGpsBroadcast();
  socket?.disconnect();
  socket = null;
}

// ── GPS broadcast ──────────────────────────────────────────────────────

function startGpsBroadcast(): void {
  if (gpsTimer) return; // already running
  gpsTimer = setInterval(() => {
    if (!socket?.connected) return;
    if (!useOrderStore.getState().activeOrderId) {
      stopGpsBroadcast();
      return;
    }
    broadcastLocation();
  }, GPS_INTERVAL_MS);
}

export function stopGpsBroadcast(): void {
  if (gpsTimer) {
    clearInterval(gpsTimer);
    gpsTimer = null;
  }
}

function broadcastLocation(): void {
  // React Native's built-in Geolocation (no extra lib required)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Geolocation = require('@react-native-community/geolocation');
  Geolocation.getCurrentPosition(
    (pos: {coords: {latitude: number; longitude: number}}) => {
      socket?.emit('driver:location', {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    },
    (err: unknown) => console.warn('[gps]', err),
    {enableHighAccuracy: true, timeout: 5_000, maximumAge: 2_000},
  );
}

export {socket};
