/**
 * Test setup file for Bun tests
 * 
 * This file is automatically loaded by Bun before running tests.
 * It sets up the testing environment and initializes necessary utilities.
 */

// Import DOM setup
import './dom-setup';

// Import and initialize test utilities
import { initTestEnvironment } from './test-utils';

// Initialize the test environment
initTestEnvironment();

// Log that setup is complete
console.log('Test environment setup complete');