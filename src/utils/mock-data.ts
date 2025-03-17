/**
 * Mock Data Provider
 * 
 * Provides mock data for development and testing purposes
 * to avoid excessive network requests.
 */

import { Prediction } from "@/types/prediction";

/**
 * Generate mock predictions
 * @param count Number of predictions to generate
 * @returns Array of mock predictions
 */
export function generateMockPredictions(count = 10): Prediction[] {
  const predictions: Prediction[] = [];
  
  for (let i = 0; i < count; i++) {
    const id = i + 1;
    const isResolved = Math.random() > 0.6;
    const optionCount = Math.floor(Math.random() * 3) + 2; // 2-4 options
    
    const options = Array.from({ length: optionCount }).map((_, idx) => ({
      id: idx,
      text: getRandomOption(idx)
    }));
    
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days
    
    let resolvedAt;
    if (isResolved) {
      resolvedAt = new Date(createdAt);
      resolvedAt.setDate(resolvedAt.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days after creation
    }
    
    predictions.push({
      predictionId: id,
      title: getRandomTitle(),
      description: getRandomDescription(),
      options,
      creator: getRandomAddress(),
      stake: (Math.random() * 10).toFixed(2),
      totalBets: (Math.random() * 100).toFixed(2),
      resolvedOption: isResolved ? Math.floor(Math.random() * optionCount) : -1,
      chainId: 1114,
      txHash: `0x${Array.from({ length: 64 }).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      createdAt: createdAt.toISOString(),
      resolvedAt: resolvedAt?.toISOString()
    });
  }
  
  return predictions;
}

/**
 * Check if mock mode is enabled
 * @returns True if mock mode is enabled
 */
export function isMockModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE === 'true';
}

// Helper functions for generating random data
function getRandomTitle(): string {
  const titles = [
    "Will Bitcoin reach $100k by end of year?",
    "Will Ethereum 2.0 launch on schedule?",
    "Will the next US president be a Democrat?",
    "Will Apple release a foldable iPhone?",
    "Will SpaceX reach Mars by 2025?",
    "Will Tesla stock outperform the S&P 500?",
    "Will the next James Bond be female?",
    "Will the Olympics be postponed again?",
    "Will NFTs still be popular next year?",
    "Will Web3 adoption exceed 100M users?",
    "Will Core DAO reach top 10 by market cap?",
    "Will AI replace 30% of jobs by 2030?",
    "Will global temperatures rise by 2°C?",
    "Will remote work become the new normal?",
    "Will quantum computing break blockchain?",
  ];
  
  return titles[Math.floor(Math.random() * titles.length)];
}

function getRandomDescription(): string {
  const descriptions = [
    "This prediction is about the future price of Bitcoin.",
    "This prediction is about the launch of Ethereum 2.0.",
    "This prediction is about the outcome of the US presidential election.",
    "This prediction is about Apple's product roadmap.",
    "This prediction is about SpaceX's Mars mission.",
    "This prediction is about Tesla's stock performance.",
    "This prediction is about the casting of the next James Bond.",
    "This prediction is about the scheduling of the Olympics.",
    "This prediction is about the future popularity of NFTs.",
    "This prediction is about the adoption of Web3 technologies.",
    "This prediction is about Core DAO's market position.",
    "This prediction is about the impact of AI on employment.",
    "This prediction is about climate change.",
    "This prediction is about the future of work.",
    "This prediction is about the impact of quantum computing on blockchain.",
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function getRandomOption(index: number): string {
  const yesNoOptions = ["Yes", "No"];
  const multiOptions = [
    ["Less than $50k", "$50k-$75k", "$75k-$100k", "More than $100k"],
    ["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023"],
    ["Democrat", "Republican", "Independent"],
    ["2023", "2024", "2025", "Never"],
    ["0-25%", "26-50%", "51-75%", "76-100%"],
  ];
  
  // 50% chance of yes/no options
  if (Math.random() > 0.5) {
    return yesNoOptions[index % yesNoOptions.length];
  } else {
    const optionSet = multiOptions[Math.floor(Math.random() * multiOptions.length)];
    return optionSet[index % optionSet.length];
  }
}

function getRandomAddress(): string {
  return `0x${Array.from({ length: 40 }).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
} 