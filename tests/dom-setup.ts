// DOM environment setup for Bun tests
import { beforeEach, afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';

// Set up document if it doesn't exist (for Bun environment)
if (typeof document === 'undefined') {
  // @ts-ignore
  global.document = {
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
    createElement: () => ({
      setAttribute: () => {},
      appendChild: () => {},
    }),
    createTextNode: () => ({}),
  };
}

// Set up window if it doesn't exist
if (typeof window === 'undefined') {
  // @ts-ignore
  global.window = {
    document,
    fs: {
      readFile: async () => {
        return new Uint8Array([]);
      }
    }
  };
}

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock fetch API
global.fetch = async () => {
  return {
    ok: true,
    json: async () => ({ response: 'Mock response' }),
  } as Response;
};
