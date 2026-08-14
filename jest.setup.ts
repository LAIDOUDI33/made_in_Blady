// Jest Setup File - AlgeriaTrade.dz
// Configuration de l'environnement de test

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock fetch globally
global.fetch = jest.fn();

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = MockResizeObserver as any;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.IntersectionObserver = MockIntersectionObserver as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
global.scrollTo = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock Notification API
class MockNotification {
  static permission = 'granted';
  static requestPermission = jest.fn().mockResolvedValue('granted');
}
global.Notification = MockNotification as any;

// Mock crypto for JWT testing
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  },
});

// Environment variables for tests
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-for-jest-tests';

// Suppress console.error in tests unless debugging
if (!process.env.DEBUG_TESTS) {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
}

// Test utilities
export const testUtils = {
  /**
   * Create a mock NextRequest
   */
  createRequest(url = '/', options?: RequestInit): NextRequest {
    return new NextRequest(new URL(url, 'https://algeriatrade.dz'), options);
  },

  /**
   * Create a mock response
   */
  createResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * Wait for async operations
   */
  async wait(ms: number = 0): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate mock user data
   */
  mockUser(overrides = {}) {
    return {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'BUYER',
      ...overrides,
    };
  },

  /**
   * Generate mock product data
   */
  mockProduct(overrides = {}) {
    return {
      id: 'product-1',
      name: 'Test Product',
      description: 'A test product',
      price: 1000,
      currency: 'DZD',
      category: 'electronics',
      slug: 'test-product',
      ...overrides,
    };
  },
};

// Extend expect matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },
});
