/**
 * Test Utilities
 * 
 * Common utilities and helpers for testing React components and services.
 * Provides custom matchers and mock implementations.
 */
import { expect, mock } from 'bun:test';
import { AIMessage } from '../src/shared/schemas/chat/types';

/**
 * Custom matchers for DOM testing
 */
export const setupCustomMatchers = () => {
  // Add custom matchers to expect
  const originalExpect = global.expect;
  
  // @ts-ignore - Extending expect
  global.expect = (actual: any) => {
    const expectResult = originalExpect(actual);
    
    // Add DOM-specific matchers
    const customMatchers = {
      toBeInTheDocument() {
        const pass = Boolean(
          actual && 
          actual.ownerDocument && 
          actual.ownerDocument.contains(actual)
        );
        return {
          pass,
          message: () => `expected ${actual} ${pass ? 'not ' : ''}to be in the document`,
        };
      },
      
      toHaveTextContent(expected: string) {
        const pass = actual && 
          typeof actual.textContent === 'string' && 
          actual.textContent.includes(expected);
        return {
          pass,
          message: () => `expected ${actual} ${pass ? 'not ' : ''}to have text content "${expected}"`,
        };
      },
      
      toHaveAttribute(attr: string, value?: string) {
        const hasAttr = actual && actual.hasAttribute && actual.hasAttribute(attr);
        const attrValue = hasAttr && actual.getAttribute(attr);
        
        const pass = value !== undefined 
          ? hasAttr && attrValue === value
          : hasAttr;
          
        return {
          pass,
          message: () => {
            if (value !== undefined) {
              return `expected ${actual} ${pass ? 'not ' : ''}to have attribute "${attr}" with value "${value}"`;
            }
            return `expected ${actual} ${pass ? 'not ' : ''}to have attribute "${attr}"`;
          },
        };
      }
    };
    
    // Add custom matchers to the result
    Object.assign(expectResult, customMatchers);
    
    return expectResult;
  };
  
  // Copy all properties from the original expect
  Object.assign(global.expect, originalExpect);
};

/**
 * Mock implementations for services
 */

// Mock AI Message Factory
export const createMockAIMessage = (content: string): AIMessage => ({
  role: 'assistant',
  content
});

// Mock User Message Factory
export const createMockUserMessage = (content: string) => ({
  role: 'user' as const,
  content
});

// Mock EVMService
export class MockEVMService {
  connectWallet = mock(() => Promise.resolve({ address: '0x123' }));
  disconnectWallet = mock(() => Promise.resolve());
  getBalance = mock(() => Promise.resolve('100'));
  signMessage = mock(() => Promise.resolve('0xsignature'));
  sendTransaction = mock(() => Promise.resolve('0xtxhash'));
}

/**
 * Wait for a condition to be true
 */
export const waitFor = async (
  condition: () => boolean, 
  timeout = 1000, 
  interval = 50
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

/**
 * Initialize the test environment
 */
export const initTestEnvironment = () => {
  setupCustomMatchers();
};