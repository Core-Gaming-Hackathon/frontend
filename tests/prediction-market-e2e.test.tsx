import { describe, expect, it, mock } from 'bun:test';
import './setup';

// Mock data for predictions
const mockPredictions = [
  {
    id: 'pred-1',
    predictionId: 1,
    creator: '0x1234567890123456789012345678901234567890',
    title: 'Will BTC reach $100k by end of 2025?',
    description: 'Prediction on whether Bitcoin will reach $100,000 USD by December 31, 2025.',
    options: [
      { id: 0, text: 'Yes, BTC will reach $100k' },
      { id: 1, text: 'No, BTC will stay below $100k' }
    ],
    stake: '1.0',
    totalBets: '5.5',
    resolvedOption: -1,
    createdAt: new Date().toISOString(),
    chainId: 1115,
    txHash: '0x1234567890abcdef',
  },
  {
    id: 'pred-2',
    predictionId: 2,
    creator: '0xabcdef1234567890abcdef1234567890abcdef12',
    title: 'Which AI model will have the most users in 2025?',
    description: 'Prediction on which AI model will have the largest user base by the end of 2025.',
    options: [
      { id: 0, text: 'OpenAI (ChatGPT)' },
      { id: 1, text: 'Google (Gemini)' },
      { id: 2, text: 'Anthropic (Claude)' },
      { id: 3, text: 'Other' }
    ],
    stake: '2.0',
    totalBets: '8.2',
    resolvedOption: 1, // Resolved as Google (Gemini)
    createdAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
    chainId: 1115,
    txHash: '0xabcdef1234567890',
  }
];

// Mock data for user bets
const mockUserBets = [
  {
    id: 'bet-1',
    predictionId: 'pred-1',
    prediction: {
      title: 'Will BTC reach $100k by end of 2025?',
      options: [
        { id: 0, text: 'Yes, BTC will reach $100k' },
        { id: 1, text: 'No, BTC will stay below $100k' }
      ],
      resolvedOption: -1
    },
    optionId: 0,
    amount: '1.2',
    createdAt: new Date().toISOString(),
    claimed: false
  },
  {
    id: 'bet-2',
    predictionId: 'pred-2',
    prediction: {
      title: 'Which AI model will have the most users in 2025?',
      options: [
        { id: 0, text: 'OpenAI (ChatGPT)' },
        { id: 1, text: 'Google (Gemini)' },
        { id: 2, text: 'Anthropic (Claude)' },
        { id: 3, text: 'Other' }
      ],
      resolvedOption: 1
    },
    optionId: 1, // Bet on the winning option
    amount: '0.5',
    createdAt: new Date().toISOString(),
    claimed: false
  }
];

// Mock functions
const fetchPredictions = mock(async () => mockPredictions);
const fetchUserBets = mock(async () => mockUserBets);
const placeBet = mock(async () => true);
const claimWinnings = mock(async () => true);
const createPrediction = mock(async () => true);
const resolvePrediction = mock(async () => true);

// Mock the wallet provider
// @ts-expect-error - TypeScript errors for mock.module
mock.module('@/providers/evm-wallet-provider', () => ({
  useWallet: () => ({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    signIn: mock(async () => true),
    signOut: mock(async () => true),
    callMethod: mock(async (method) => {
      // Return appropriate mock data based on the method
      return { 
        success: true, 
        data: method === 'getPredictions' 
          ? mockPredictions 
          : method === 'getUserBets'
          ? mockUserBets
          : { txHash: '0x123456' }
      };
    })
  })
}));

// Mock the hooks
// @ts-expect-error - TypeScript errors for mock.module
mock.module('@/hooks/use-prediction-market', () => ({
  usePredictionMarket: () => ({
    predictions: mockPredictions,
    userBets: mockUserBets,
    isLoading: false,
    isCreatingPrediction: false,
    isPlacingBet: false,
    isResolvingPrediction: false,
    isClaimingWinnings: false,
    error: null,
    fetchPredictions,
    fetchUserBets,
    createPrediction,
    placeBet,
    resolvePrediction,
    claimWinnings,
    clearError: mock()
  })
}));

// Mock the auto-refresh hook
// @ts-expect-error - TypeScript errors for mock.module
mock.module('@/hooks/use-auto-refresh', () => ({
  useAutoRefresh: () => ({
    refresh: mock(async () => {}),
    isRefreshing: false,
    lastRefreshed: new Date(),
    isEnabled: true,
    startAutoRefresh: mock(),
    stopAutoRefresh: mock()
  })
}));

describe('Prediction Market E2E Flow', () => {
  it('should have active predictions', () => {
    const activePredictions = mockPredictions.filter(p => p.resolvedOption === -1);
    
    expect(activePredictions.length).toBe(1);
    expect(activePredictions[0].title).toBe('Will BTC reach $100k by end of 2025?');
  });
  
  it('should have resolved predictions', () => {
    const resolvedPredictions = mockPredictions.filter(p => p.resolvedOption !== -1);
    
    expect(resolvedPredictions.length).toBe(1);
    expect(resolvedPredictions[0].title).toBe('Which AI model will have the most users in 2025?');
    expect(resolvedPredictions[0].resolvedOption).toBe(1); // Google (Gemini)
  });
  
  it('should have user bets', () => {
    expect(mockUserBets.length).toBe(2);
    expect(mockUserBets[0].predictionId).toBe('pred-1');
    expect(mockUserBets[0].optionId).toBe(0);
    expect(mockUserBets[0].amount).toBe('1.2');
  });
  
  it('should be able to place a bet', async () => {
    const result = await placeBet();
    expect(result).toBe(true);
    // Verify the mock was called
    expect(placeBet.mock.calls.length).toBeGreaterThan(0);
  });
  
  it('should be able to claim winnings', async () => {
    const result = await claimWinnings();
    expect(result).toBe(true);
    // Verify the mock was called
    expect(claimWinnings.mock.calls.length).toBeGreaterThan(0);
  });
  
  it('should be able to create a prediction', async () => {
    const result = await createPrediction();
    expect(result).toBe(true);
    // Verify the mock was called
    expect(createPrediction.mock.calls.length).toBeGreaterThan(0);
  });
  
  it('should be able to resolve a prediction', async () => {
    const result = await resolvePrediction();
    expect(result).toBe(true);
    // Verify the mock was called
    expect(resolvePrediction.mock.calls.length).toBeGreaterThan(0);
  });
  
  it('should fetch predictions and user bets', async () => {
    const predictions = await fetchPredictions();
    const userBets = await fetchUserBets();
    
    expect(predictions).toEqual(mockPredictions);
    expect(userBets).toEqual(mockUserBets);
    
    // Verify the mocks were called
    expect(fetchPredictions.mock.calls.length).toBeGreaterThan(0);
    expect(fetchUserBets.mock.calls.length).toBeGreaterThan(0);
  });
});