import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string) {
    if (this.socket?.connected) return;

    this.socket = io(API_URL.replace('/api/v1', ''), {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket Connected');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket Connection Error:', err.message);
    });
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
