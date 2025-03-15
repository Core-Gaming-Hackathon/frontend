# Recommendations for Fixing Remaining Test Issues

This document provides recommendations for addressing the remaining test issues in the Core DAO Frontend application.

## 1. DOM Testing in Bun Environment

### Issues
- `ReferenceError: Can't find variable: document` in React component tests
- `Maximum update depth exceeded` errors in component tests
- Missing DOM testing utilities like `toBeInTheDocument()`

### Recommendations

#### Create a Proper DOM Setup File

Create a comprehensive setup file at `tests/dom-setup.ts`:

```typescript
import { JSDOM } from 'jsdom';
import { expect, mock } from 'bun:test';

// Create a DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
});

// Set up global variables to simulate browser environment
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.MouseEvent = dom.window.MouseEvent;

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

// Add custom matchers for DOM testing
expect.extend({
  toBeInTheDocument(received) {
    const pass = Boolean(received && received.ownerDocument && received.ownerDocument.contains(received));
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
    };
  },
  // Add other custom matchers as needed
});

// Configure Bun to use this setup file
// Add to bunfig.toml or package.json
```

#### Update Component Tests

Refactor component tests to work with the Bun environment:

1. Use simpler component rendering
2. Avoid complex state updates that might cause infinite loops
3. Use basic assertions instead of complex DOM queries

Example refactoring for `chat-interface.test.tsx`:

```typescript
import { test, expect, mock } from 'bun:test';
import { render } from '@testing-library/react';
import { ChatInterface } from '../src/components/chat/ChatInterface';

// Mock dependencies
const mockSendMessage = mock(() => Promise.resolve({
  message: 'Mock response',
  isComplete: false,
}));

// Simplified test
test('renders the chat interface', () => {
  const { container } = render(
    <ChatInterface 
      gameType="BATTLE"
      difficulty="EASY"
      onComplete={() => {}}
      timeLimit={300}
    />
  );
  
  // Simple assertions that don't rely on complex DOM queries
  expect(container.textContent).toContain('BATTLE');
  expect(container.textContent).toContain('EASY');
});
```

## 2. Module Export Issues

### Issues
- `SyntaxError: Export named 'EVMWalletProvider' not found in module`

### Recommendations

#### Fix Export in EVMWalletProvider

Check the export in `src/providers/evm-wallet-provider.tsx`:

```typescript
// Make sure the export is correct
export const EVMWalletProvider = ({ children }) => {
  // Implementation
};

// Or if using default export, update imports in tests
export default EVMWalletProvider;
```

#### Update Import in Tests

Update the import in `tests/wallet-provider.test.tsx`:

```typescript
// If using default export
import EVMWalletProvider from '../src/providers/evm-wallet-provider';

// Or if using named export
import { EVMWalletProvider } from '../src/providers/evm-wallet-provider';
```

## 3. Mock Service Implementation

### Issues
- Tests relying on external services that may be unavailable

### Recommendations

#### Extend Mock Implementation

Expand the mock implementation to cover more services:

```typescript
// Create mock for EVMService
export class MockEVMService {
  connectWallet = mock(() => Promise.resolve({ address: '0x123' }));
  disconnectWallet = mock(() => Promise.resolve());
  getBalance = mock(() => Promise.resolve('100'));
  // Add other methods as needed
}

// Create factory for getting the right implementation
export const EVMServiceFactory = {
  createService: () => {
    return new MockEVMService();
  }
};
```

#### Use Dependency Injection

Refactor components to accept service dependencies:

```typescript
// Component accepts service as prop
export const WalletComponent = ({ evmService }) => {
  // Use the provided service
};

// In tests, provide mock service
test('wallet component', () => {
  const mockService = new MockEVMService();
  render(<WalletComponent evmService={mockService} />);
});
```

## 4. General Testing Best Practices

### Recommendations

1. **Isolate Tests**: Ensure each test is independent and doesn't rely on state from other tests

2. **Simplify Components for Testing**: Create test-specific versions of components with reduced complexity

3. **Use Feature Flags**: Implement feature flags to disable complex features during testing

4. **Progressive Testing**: Start with simple tests and gradually add complexity

5. **Test in Isolation**: Test smaller units before testing integrated components

6. **Mock External Dependencies**: Always mock external services, APIs, and browser features

7. **Consistent Testing Patterns**: Use consistent patterns across all tests

## Implementation Plan

1. Fix DOM setup (1-2 days)
2. Address module export issues (0.5 day)
3. Expand mock implementations (1 day)
4. Refactor complex component tests (2-3 days)
5. Implement consistent testing patterns (1 day)

Total estimated time: 5-7 days