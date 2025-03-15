#!/bin/bash

# Script to run tests for Core DAO Frontend
# Usage: ./scripts/run-tests.sh [option]
# Options:
#   all       - Run all tests (may include failing tests)
#   working   - Run only tests known to be working
#   specific  - Run a specific test file (requires TEST_FILE env var)
#   help      - Show this help message

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default option
OPTION=${1:-working}

# Show header
echo -e "${YELLOW}Core DAO Frontend Test Runner${NC}"
echo "----------------------------------------"

case $OPTION in
  all)
    echo -e "${YELLOW}Running all tests...${NC}"
    echo "This may include tests that are known to fail."
    bun test
    ;;
    
  working)
    echo -e "${YELLOW}Running only working tests...${NC}"
    bun run test:working
    ;;
    
  specific)
    if [ -z "$TEST_FILE" ]; then
      echo -e "${RED}Error: TEST_FILE environment variable is required.${NC}"
      echo "Example: TEST_FILE=tests/prediction-market.test.ts ./scripts/run-tests.sh specific"
      exit 1
    fi
    
    echo -e "${YELLOW}Running specific test file: ${TEST_FILE}${NC}"
    bun test $TEST_FILE
    ;;
    
  help)
    echo "Usage: ./scripts/run-tests.sh [option]"
    echo ""
    echo "Options:"
    echo "  all       - Run all tests (may include failing tests)"
    echo "  working   - Run only tests known to be working"
    echo "  specific  - Run a specific test file (requires TEST_FILE env var)"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/run-tests.sh working"
    echo "  TEST_FILE=tests/prediction-market.test.ts ./scripts/run-tests.sh specific"
    ;;
    
  *)
    echo -e "${RED}Unknown option: $OPTION${NC}"
    echo "Use './scripts/run-tests.sh help' for usage information."
    exit 1
    ;;
esac

# Show footer
echo "----------------------------------------"
echo -e "${GREEN}Test run completed.${NC}"