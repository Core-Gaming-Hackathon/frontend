/**
 * Prediction Market Test Utilities
 * 
 * Helper functions for testing prediction market functionality
 * without requiring actual blockchain interactions
 */

import { Prediction } from "@/app/predict/page";

// Mock prediction data for testing
export const mockPredictions: Prediction[] = [
  {
    id: "pred-1",
    predictionId: 1,
    creator: "0x1234567890123456789012345678901234567890",
    title: "Will BTC reach $100k by end of 2025?",
    description: "Prediction on whether Bitcoin will reach $100,000 USD by December 31, 2025.",
    options: [
      { id: 0, text: "Yes, BTC will reach $100k" },
      { id: 1, text: "No, BTC will stay below $100k" }
    ],
    stake: "1.0",
    totalBets: "5.5",
    resolvedOption: -1,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    chainId: 1115,
    txHash: "0x1234567890abcdef",
  },
  {
    id: "pred-2",
    predictionId: 2,
    creator: "0xabcd1234efgh5678ijkl9012mnop3456qrst7890",
    title: "Which AI model will have the most users in 2025?",
    description: "Prediction on which AI model will have the largest user base by the end of 2025.",
    options: [
      { id: 0, text: "OpenAI (ChatGPT)" },
      { id: 1, text: "Google (Gemini)" },
      { id: 2, text: "Anthropic (Claude)" },
      { id: 3, text: "Other" }
    ],
    stake: "2.0",
    totalBets: "8.2",
    resolvedOption: 1, // Resolved as Google (Gemini)
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    resolvedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    chainId: 1115,
    txHash: "0xabcdef1234567890",
  }
];

// Mock user bets for testing
export const mockUserBets = [
  {
    id: "bet-1",
    predictionId: "pred-1",
    prediction: {
      title: "Will BTC reach $100k by end of 2025?",
      options: [
        { id: 0, text: "Yes, BTC will reach $100k" },
        { id: 1, text: "No, BTC will stay below $100k" }
      ],
      resolvedOption: -1
    },
    optionId: 0,
    amount: "1.2",
    createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    claimed: false
  },
  {
    id: "bet-2",
    predictionId: "pred-2",
    prediction: {
      title: "Which AI model will have the most users in 2025?",
      options: [
        { id: 0, text: "OpenAI (ChatGPT)" },
        { id: 1, text: "Google (Gemini)" },
        { id: 2, text: "Anthropic (Claude)" },
        { id: 3, text: "Other" }
      ],
      resolvedOption: 1
    },
    optionId: 1, // Bet on the winning option
    amount: "0.5",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    claimed: false
  }
];

/**
 * Simulates a contract call to get predictions
 */
export function simulateGetPredictions(): Promise<Prediction[]> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve(mockPredictions);
    }, 500);
  });
}

/**
 * Simulates a contract call to create a prediction
 */
export function simulateCreatePrediction(
  _title: string,
  _description: string,
  _options: string[],
  _stake: string
): Promise<{ success: boolean; txHash: string }> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Always succeed in test environment
      resolve({
        success: true,
        txHash: "0x" + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10)
      });
    }, 1000);
  });
}

/**
 * Simulates a contract call to place a bet
 */
export function simulatePlaceBet(
  _predictionId: number,
  _optionId: number,
  _amount: string
): Promise<{ success: boolean; txHash: string }> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Always succeed in test environment
      resolve({
        success: true,
        txHash: "0x" + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10)
      });
    }, 800);
  });
}

/**
 * Simulates a contract call to resolve a prediction
 */
export function simulateResolvePrediction(
  _predictionId: number,
  _winningOptionId: number
): Promise<{ success: boolean; txHash: string }> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Always succeed in test environment
      resolve({
        success: true,
        txHash: "0x" + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10)
      });
    }, 1200);
  });
}

/**
 * Simulates a contract call to claim winnings
 */
export function simulateClaimWinnings(
  _predictionId: number
): Promise<{ success: boolean; txHash: string }> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Always succeed in test environment
      resolve({
        success: true,
        txHash: "0x" + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10)
      });
    }, 700);
  });
}

/**
 * Simulates a contract call to get user bets
 */
export function simulateGetUserBets(_address: string): Promise<typeof mockUserBets> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve(mockUserBets);
    }, 600);
  });
}