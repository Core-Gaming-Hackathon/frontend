#!/bin/bash

# Install dependencies if not already installed
echo "Installing dependencies..."
bun install

# Run tests
echo "Running tests..."
bun test tests/zerepy-game-service.test.ts tests/simple-game-flow.test.ts tests/unified-prompt-api.test.ts

# If tests pass, show success message
if [ $? -eq 0 ]; then
  echo -e "\n\033[0;32mTests passed successfully! ✅\033[0m"
else
  echo -e "\n\033[0;31mSome tests failed. Check the output above for details. ❌\033[0m"
fi
