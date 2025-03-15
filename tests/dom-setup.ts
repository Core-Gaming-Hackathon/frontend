/**
 * DOM Setup for Bun Tests
 * 
 * This file provides a consistent DOM environment for testing React components
 * with Bun's test runner. It sets up JSDOM and necessary browser globals.
 */
import { JSDOM } from 'jsdom';
import { expect } from 'bun:test';

// Create a DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
});

// Set up global variables to simulate browser environment
global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.getComputedStyle = dom.window.getComputedStyle;

// Mock browser APIs that are not available in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch for tests that don't explicitly mock it
const originalFetch = global.fetch;
if (!global.fetch) {
  global.fetch = async (url: string | URL | Request, options?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    console.log(`Default mock fetch called with URL: ${urlString}`);
    
    // Return a mock response based on the URL
    if (urlString.includes('/game/prompt')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ text: 'Default mock AI response' }),
      } as Response;
    }
    
    // Default mock response
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response;
  };
}

// Helper to restore original fetch if needed
export const restoreOriginalFetch = () => {
  if (originalFetch) {
    global.fetch = originalFetch;
  }
};

// Export DOM for tests that need direct access
export { dom };