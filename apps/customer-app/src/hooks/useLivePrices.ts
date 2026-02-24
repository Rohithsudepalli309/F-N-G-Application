import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = 'http://localhost:3000';

export interface PriceUpdate {
  productId: string;
  fluctuation: string; // e.g. "-0.05", "0.02"
}

export interface PriceUpdatePayload {
  timestamp: string;
  updates: PriceUpdate[];
}

interface UseLivePricesOptions {
  onPriceUpdate: (payload: PriceUpdatePayload) => void;
}

export function useLivePrices({ onPriceUpdate }: UseLivePricesOptions) {
  const token = useAuthStore((s: any) => s.token);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[LivePrices] Connected to price engine');
    });

    socket.on('price_update', (payload: PriceUpdatePayload) => {
      onPriceUpdate(payload);
    });

    socket.on('disconnect', () => {
      console.warn('[LivePrices] Disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [token, onPriceUpdate]);
}
