// Tests for the SocketService class
// We mock socket.io-client so no real socket is opened.

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

import { io } from 'socket.io-client';

// Import AFTER the mock is in place so the module picks up the mock.
// Because the module exports a singleton, we reset its internal state
// manually by calling disconnect() between tests.
import { socketService } from './socket';

describe('SocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton: if previously connected, disconnect first.
    socketService.disconnect();
    // After disconnect the singleton's socket is null, so clearAllMocks is safe.
    vi.clearAllMocks();
  });

  it('connect() calls io() with the auth token', () => {
    socketService.connect('test-token-123');
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: 'test-token-123' } })
    );
  });

  it('connect() registers a "connect" listener on the socket', () => {
    socketService.connect('test-token');
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('connect() is a no-op when already connected (guard)', () => {
    socketService.connect('first-token');
    const callCount = (io as ReturnType<typeof vi.fn>).mock.calls.length;

    socketService.connect('second-token'); // should not create another socket
    expect((io as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('on() forwards the listener to the underlying socket', () => {
    socketService.connect('tok');
    const cb = vi.fn();
    socketService.on('order.platform.update', cb);
    expect(mockSocket.on).toHaveBeenCalledWith('order.platform.update', cb);
  });

  it('on() is a no-op when socket is null', () => {
    // socket is null after the beforeEach disconnect and before connect()
    expect(() => socketService.on('some.event', vi.fn())).not.toThrow();
  });

  it('off() removes the listener from the socket', () => {
    socketService.connect('tok');
    socketService.off('order.platform.update');
    expect(mockSocket.off).toHaveBeenCalledWith('order.platform.update');
  });

  it('disconnect() calls socket.disconnect() and nullifies internal socket', () => {
    socketService.connect('tok');
    socketService.disconnect();
    expect(mockSocket.disconnect).toHaveBeenCalled();

    // After disconnect, calling on() should not throw (socket is null)
    expect(() => socketService.on('event', vi.fn())).not.toThrow();
  });
});
