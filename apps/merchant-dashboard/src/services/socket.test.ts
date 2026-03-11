// Tests for getSocket() and disconnectSocket() in socket.ts

const mockSocketObj = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocketObj),
}));

import { io } from 'socket.io-client';
import { getSocket, disconnectSocket } from './socket';

const mockIo = io as ReturnType<typeof vi.fn>;

describe('socket service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module-level socket to null between tests
    disconnectSocket();
    vi.clearAllMocks();
    mockSocketObj.connected = false;
  });

  // ─── getSocket ────────────────────────────────────────────────────────────
  it('calls io() with auth token on first call', () => {
    getSocket('test-token');
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: 'test-token' } })
    );
  });

  it('returns the created socket instance', () => {
    const socket = getSocket('tok');
    expect(socket).toBe(mockSocketObj);
  });

  it('passes websocket transport option', () => {
    getSocket('tok');
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ transports: ['websocket'] })
    );
  });

  it('uses cached socket when already connected (does not call io again)', () => {
    mockSocketObj.connected = true;
    // Simulate existing socket by calling once first
    getSocket('first-token');
    const callsAfterFirst = mockIo.mock.calls.length;

    getSocket('second-token');
    expect(mockIo.mock.calls.length).toBe(callsAfterFirst); // no new io() call
  });

  it('creates new socket if previous was disconnected', () => {
    mockSocketObj.connected = false;
    getSocket('token-1');
    const firstCallCount = mockIo.mock.calls.length;

    // disconnected, so next call should create again
    getSocket('token-2');
    expect(mockIo.mock.calls.length).toBeGreaterThan(firstCallCount);
  });

  // ─── disconnectSocket ────────────────────────────────────────────────────
  it('calls disconnect() on the socket', () => {
    getSocket('tok');
    disconnectSocket();
    expect(mockSocketObj.disconnect).toHaveBeenCalled();
  });

  it('does not throw when disconnectSocket is called with no active socket', () => {
    // No socket created yet (reset in beforeEach)
    expect(() => disconnectSocket()).not.toThrow();
  });

  it('creates a fresh socket after disconnect', () => {
    getSocket('tok');
    disconnectSocket();
    vi.clearAllMocks();
    mockSocketObj.connected = false;

    getSocket('new-token');
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: 'new-token' } })
    );
  });
});
