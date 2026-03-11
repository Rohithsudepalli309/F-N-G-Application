// Tests for the request/response interceptors in api.ts
// We access the real interceptor handlers directly (no axios mocking needed).

import api from './api';

// Helpers to pull the actual registered interceptors out of the axios instance
function getRequestHandler() {
  return (api.interceptors.request as any).handlers?.[0]?.fulfilled as
    | ((config: any) => any)
    | undefined;
}

function getResponseHandlers() {
  const h = (api.interceptors.response as any).handlers?.[0];
  return { fulfilled: h?.fulfilled, rejected: h?.rejected };
}

// Stable reference for window.location.href testing
let originalLocation: Location;

describe('api interceptors', () => {
  beforeAll(() => {
    originalLocation = window.location;
    // Replace window.location with a writable stub so we can assert href changes
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  beforeEach(() => {
    localStorage.clear();
    (window as any).location.href = '';
  });

  // ─── Request interceptor ──────────────────────────────────────────────────
  describe('request interceptor', () => {
    it('attaches Bearer token from merchant_auth localStorage key', () => {
      const handler = getRequestHandler();
      expect(handler).toBeDefined();
      localStorage.setItem('merchant_auth', JSON.stringify({ state: { token: 'my-jwt-token' } }));
      const config: any = { headers: {} };
      const result = handler!(config);
      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('does not set Authorization when localStorage is empty', () => {
      const handler = getRequestHandler()!;
      const config: any = { headers: {} };
      const result = handler(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('does not crash on malformed JSON in localStorage', () => {
      const handler = getRequestHandler()!;
      localStorage.setItem('merchant_auth', '{ invalid json }');
      const config: any = { headers: {} };
      expect(() => handler(config)).not.toThrow();
    });

    it('does not set Authorization if token field is missing', () => {
      const handler = getRequestHandler()!;
      localStorage.setItem('merchant_auth', JSON.stringify({ state: {} }));
      const config: any = { headers: {} };
      const result = handler(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  // ─── Response interceptor ─────────────────────────────────────────────────
  describe('response interceptor', () => {
    it('passes successful responses through unchanged', () => {
      const { fulfilled } = getResponseHandlers();
      expect(fulfilled).toBeDefined();
      const response = { status: 200, data: { ok: true } };
      const result = fulfilled!(response);
      expect(result).toBe(response);
    });

    it('clears merchant_auth and redirects to /login on 401', async () => {
      const { rejected } = getResponseHandlers();
      expect(rejected).toBeDefined();
      localStorage.setItem('merchant_auth', 'some-token-data');
      const err = { response: { status: 401 } };
      try {
        await rejected!(err);
      } catch {
        // expected — interceptor re-throws after redirect
      }
      expect(localStorage.getItem('merchant_auth')).toBeNull();
      expect((window as any).location.href).toBe('/login');
    });

    it('re-throws error for non-401 responses', async () => {
      const { rejected } = getResponseHandlers();
      const err = { response: { status: 500 }, message: 'Server error' };
      await expect(rejected!(err)).rejects.toMatchObject({ response: { status: 500 } });
    });

    it('re-throws error when response is undefined (network error)', async () => {
      const { rejected } = getResponseHandlers();
      const err = { message: 'Network Error' };
      await expect(rejected!(err)).rejects.toMatchObject({ message: 'Network Error' });
    });
  });
});

