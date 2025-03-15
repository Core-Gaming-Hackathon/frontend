# Testing Approach for Core DAO Frontend

This document outlines the testing approach for the Core DAO Frontend application, including best practices, tools, and patterns.

## Testing Stack

- **Test Runner**: Bun's built-in test runner
- **Testing Libraries**:
  - `@testing-library/react` for React component testing
  - `jsdom` for DOM simulation
  - Custom utilities for common testing tasks

## Test Types

### Unit Tests

Unit tests focus on testing individual functions and components in isolation. They are fast, reliable, and help catch issues early.

Example:
```typescript
// Testing a utility function
import { formatCurrency } from '../src/utils/format';
import { expect, test } from 'bun:test';

test('formatCurrency formats numbers correctly', () => {
  expect(formatCurrency(1000)).toBe('1,000');
  expect(formatCurrency(1000.5)).toBe('1,000.5');
  expect(formatCurrency(0)).toBe('0');
});
```

### Component Tests

Component tests verify that React components render correctly and respond to user interactions as expected.

Example:
```typescript
// Testing a React component
import { render } from '@testing-library/react';
import { Button } from '../src/components/ui/Button';
import { expect, test, mock } from 'bun:test';

test('Button renders correctly and handles clicks', () => {
  const handleClick = mock(() => {});
  const { getByText } = render(<Button onClick={handleClick}>Click Me</Button>);
  
  const button = getByText('Click Me');
  expect(button).toBeDefined();
  
  button.click();
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

Example:
```typescript
// Testing integration between components
import { render } from '@testing-library/react';
import { PredictionMarketProvider } from '../src/providers/PredictionMarketProvider';
import { PredictionCard } from '../src/components/prediction/PredictionCard';
import { expect, test } from 'bun:test';

test('PredictionCard works with PredictionMarketProvider', () => {
  const { getByText } = render(
    <PredictionMarketProvider>
      <PredictionCard id="1" />
    </PredictionMarketProvider>
  );
  
  // Verify that data flows correctly between components
  expect(getByText('Place Bet')).toBeDefined();
});
```

### E2E Tests

End-to-end tests verify complete user flows, simulating real user interactions.

Example:
```typescript
// Testing a complete user flow
import { render, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../src/App';
import { expect, test, mock } from 'bun:test';

test('User can connect wallet and place a bet', async () => {
  // Mock wallet connection
  mock.module('../src/config/evm-wallet', () => ({
    evmWallet: {
      connectWallet: mock(async () => true),
      getAddress: mock(() => '0x123...'),
      // ... other methods
    }
  }));
  
  const { getByText } = render(<App />);
  
  // Connect wallet
  fireEvent.click(getByText('Connect Wallet'));
  await waitFor(() => expect(getByText('0x123...')).toBeDefined());
  
  // Navigate to predictions
  fireEvent.click(getByText('Predictions'));
  await waitFor(() => expect(getByText('Active Predictions')).toBeDefined());
  
  // Place a bet
  fireEvent.click(getByText('Place Bet'));
  // ... complete the flow
});
```

## Mock Implementations

### Mock Services

We use mock implementations of services to isolate tests from external dependencies:

1. **MockEVMService**: Simulates blockchain wallet interactions
2. **MockGameService**: Simulates AI game service interactions
3. **MockAPIService**: Simulates API calls

Example:
```typescript
// Using a mock service in a test
import { AIServiceFactory } from '../src/services/ai-service.mock';
import { expect, test } from 'bun:test';

test('Game service handles messages correctly', async () => {
  const gameService = AIServiceFactory.createGameService('BATTLE', 'EASY');
  
  const response = await gameService.sendMessage('Hello');
  expect(response.message).toBeDefined();
  expect(response.isComplete).toBe(false);
});
```

### Mock Modules

We use `mock.module` to mock entire modules when needed:

```typescript
import { mock } from 'bun:test';

// Mock a module
mock.module('../src/config/evm-wallet', () => ({
  evmWallet: {
    connectWallet: mock(async () => true),
    // ... other methods
  }
}));
```

## Test Utilities

### DOM Testing Utilities

We provide custom matchers for DOM testing:

```typescript
// Using custom matchers
import { render } from '@testing-library/react';
import { Button } from '../src/components/ui/Button';
import { expect, test } from 'bun:test';

test('Button has correct attributes', () => {
  const { getByText } = render(<Button variant="primary">Click Me</Button>);
  const button = getByText('Click Me');
  
  expect(button).toHaveAttribute('class', expect.stringContaining('primary'));
  expect(button).toBeInTheDocument();
});
```

### Test Data Factories

We provide factories for creating test data:

```typescript
// Using test data factories
import { createMockPrediction } from '../tests/test-utils';
import { expect, test } from 'bun:test';

test('Prediction formatting works correctly', () => {
  const prediction = createMockPrediction({
    title: 'Test Prediction',
    outcome: true
  });
  
  expect(prediction.title).toBe('Test Prediction');
  expect(prediction.outcome).toBe(true);
});
```

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on state from other tests.

2. **Use Mock Data**: Avoid using real API calls or blockchain interactions in tests.

3. **Test Behavior, Not Implementation**: Focus on testing what components do, not how they do it.

4. **Keep Tests Simple**: Tests should be easy to understand and maintain.

5. **Use Descriptive Test Names**: Test names should clearly describe what is being tested.

6. **Test Edge Cases**: Include tests for error conditions and edge cases.

7. **Avoid Test Duplication**: Use test utilities and factories to avoid duplicating code.

8. **Run Tests Frequently**: Tests should be fast enough to run frequently during development.

## Running Tests

```bash
# Run all tests
bun test

# Run only working tests
bun test:working

# Run a specific test file
bun test tests/unified-prompt-api.test.ts

# Run tests with the test script
./scripts/run-tests.sh working
```

## Troubleshooting

### Common Issues

1. **DOM-related errors**: Make sure the DOM setup is properly configured in `tests/dom-setup.ts`.

2. **Module export errors**: Check that mock modules are correctly defined and exported.

3. **Test timeouts**: Increase the timeout for tests that involve async operations.

4. **React rendering errors**: Check for infinite loops in component effects.

### Solutions

1. **Use the test script**: The `run-tests.sh` script provides options for running different test subsets.

2. **Check the test logs**: Look for error messages in the test output.

3. **Isolate the issue**: Run tests individually to identify problematic tests.

4. **Update mock implementations**: Make sure mock implementations match the expected behavior.

## Contributing

When adding new tests:

1. Follow the existing patterns and conventions.
2. Use the provided test utilities and mock implementations.
3. Keep tests focused and simple.
4. Update the test documentation as needed.

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)