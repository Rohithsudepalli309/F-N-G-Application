/**
 * useSocket.ts – Customer App Socket Hook
 *
 * Rules enforced:
 *  - Customer can ONLY subscribe (listen). Emitting is blocked.
 *  - Reconnect / resume handled automatically.
 *  - Polls REST as fallback when socket is offline.
 */
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = 'http://localhost:3000'; // Optimized for adb reverse tunnel
const POLL_INTERVAL_MS = 15_000;

export type OrderStatus =
  | 'pending' | 'placed' | 'preparing' | 'ready' | 'pickup' | 'delivered' | 'cancelled';

export interface LocationPayload { lat: number; lng: number; bearing: number }
export interface StatusPayload   { status: OrderStatus }

interface UseSocketOptions {
  orderId: string;
  onStatusUpdate: (payload: StatusPayload) => void;
  onLocationUpdate: (payload: LocationPayload) => void;
  onCompleted: () => void;
  // Fallback polling function when socket is disconnected
  onFallbackPoll: () => void;
}

export function useOrderSocket({
  orderId,
  onStatusUpdate,
  onLocationUpdate,
  onCompleted,
  onFallbackPoll,
}: UseSocketOptions) {
  const token = useAuthStore((s: any) => s.token);
  const socketRef = useRef<Socket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fallback polling (used when socket is not connected) ──────────────────
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollTimerRef.current = setInterval(onFallbackPoll, POLL_INTERVAL_MS);
  }, [onFallbackPoll]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!token || !orderId) return;

    // ── Connect ───────────────────────────────────────────────────────────
    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
    });

    socketRef.current = socket;

    // ── Connection success ────────────────────────────────────────────────
    socket.on('connect', () => {
      stopPolling();
      // Subscribe to the order room
      socket.emit('subscribe_order', { orderId });
    });

    // ── Listen-only events (customer may NOT emit) ────────────────────────
    socket.on('order.paid', ({ status }: { orderId: string; status: OrderStatus }) => {
      onStatusUpdate({ status });
    });

    socket.on('order.status.updated', ({ payload }: { orderId: string; timestamp: number; payload: StatusPayload }) => {
      onStatusUpdate(payload);
    });

    socket.on('driver.location.updated', ({ payload }: { orderId: string; timestamp: number; payload: LocationPayload }) => {
      onLocationUpdate(payload);
    });

    socket.on('order.completed', () => {
      onCompleted();
      socket.disconnect(); // No need to stay connected after delivery
    });

    // ── Errors ────────────────────────────────────────────────────────────
    socket.on('error', (err: { message: string }) => {
      console.warn('[Socket] Server error:', err.message);
    });

    // ── Disconnect / reconnect handling ───────────────────────────────────
    socket.on('disconnect', (reason: string) => {
      console.warn('[Socket] Disconnected:', reason);
      startPolling(); // activate fallback while offline
    });

    socket.on('reconnect', () => {
      stopPolling();
      socket.emit('subscribe_order', { orderId }); // Re-subscribe on resume
    });

    return () => {
      socket.disconnect();
      stopPolling();
    };
  }, [token, orderId]);

  // Expose nothing to emit – customer is read-only
}
