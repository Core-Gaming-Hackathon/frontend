# Core DAO Frontend

A modern frontend for the Core DAO prediction market application.

## Features

- **Prediction Markets**: Create and participate in prediction markets
- **Betting System**: Place bets on different outcomes
- **Wallet Integration**: Connect your wallet to interact with the blockchain
- **Auto-refresh**: Real-time updates of prediction markets and bets
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+
- Bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/core-dao-frontend.git
cd core-dao-frontend

# Install dependencies
bun install
```

### Development

```bash
# Start the development server
bun dev
```

### Build

```bash
# Build for production
bun run build
```

### Testing

```bash
# Run all tests
bun test

# Run only working tests
bun test:working
```

### Test Coverage

- **Unit Tests**: Core utility functions and services
- **Component Tests**: UI components and their interactions
- **Integration Tests**: Interactions between multiple components
- **E2E Tests**: Complete user flows like prediction market interactions

### Testing Strategy

- **Mock Implementations**: For testing without external dependencies
  - Mock API responses for AI services
  - Mock blockchain interactions
- **Test Environment**: Uses Bun's built-in test runner
- **Test Utilities**: Custom helpers for testing React components

For a detailed overview of the test status, see [TEST_SUMMARY.md](./TEST_SUMMARY.md).

## Project Structure

```
core-dao-frontend/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── ui/              # UI components
│   │   └── prediction/      # Prediction-specific components
│   ├── hooks/               # Custom React hooks
│   ├── providers/           # Context providers
│   ├── utils/               # Utility functions
│   ├── abis/                # Contract ABIs
│   └── config/              # Configuration files
├── public/                  # Static assets
├── tests/                   # Test files
└── ...
```

## Key Components

### Prediction Market

The prediction market functionality is implemented with the following components:

- `PredictionCard`: Displays a prediction and allows users to place bets
- `UserBetsCard`: Shows user's bets and allows claiming winnings
- `CreatePredictionDialog`: Dialog for creating new predictions

### Hooks

- `usePredictionMarket`: Hook for interacting with the prediction market contract
- `useEnhancedPredictionMarket`: Enhanced version with better error handling and caching
- `useAutoRefresh`: Hook for automatically refreshing data

### UI Components

- `LoadingSpinner`: Reusable loading spinner with different sizes and variants
- `Skeleton`: Loading skeleton for content that's being fetched
- `AdvancedLoadingState`: Component for handling various loading states

## Error Handling

The application uses a comprehensive error handling system:

- Error categorization for different types of errors
- User-friendly error messages
- Recovery strategies for common errors
- Toast notifications for feedback

## Data Fetching

Data fetching is implemented with:

- Caching for better performance
- Retry mechanisms for failed requests
- Fallback to mock data when needed
- Auto-refresh for real-time updates

## License

MIT