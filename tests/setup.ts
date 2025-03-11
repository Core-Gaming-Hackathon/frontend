// Global setup for tests
import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock window.fs.readFile
global.window = {
  ...global.window,
  fs: {
    readFile: async () => {
      return new Uint8Array([]);
    }
  }
};

// Mock fetch API
global.fetch = async () => {
  return {
    ok: true,
    json: async () => ({ response: 'Mock response' }),
  } as Response;
};
