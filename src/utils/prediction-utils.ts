import { formatDistanceToNow } from "date-fns";

// Common types for prediction market
export interface PredictionOption {
  id: number;
  text: string;
}

export interface Prediction {
  id: string;
  predictionId: number;
  creator: string;
  title: string;
  description: string;
  options: PredictionOption[];
  stake: string;
  totalBets: string;
  resolvedOption: number;
  createdAt: string;
  resolvedAt?: string;
  chainId: number;
  txHash: string;
}

export interface UserBet {
  id: string;
  predictionId: string;
  prediction: {
    title: string;
    options: PredictionOption[];
    resolvedOption: number;
  };
  optionId: number;
  amount: string;
  createdAt: string;
  claimed: boolean;
}

// Format date for display
export const formatDate = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "Unknown date";
  }
};

// Format address for display
export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Check if a prediction is resolved
export const isResolved = (prediction: Prediction | { resolvedOption: number }): boolean => {
  return prediction.resolvedOption !== -1;
};

// Check if a bet is a winner
export const isWinningBet = (bet: UserBet): boolean => {
  return isResolved(bet.prediction) && bet.prediction.resolvedOption === bet.optionId;
}; 