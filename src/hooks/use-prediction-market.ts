/**
 * Prediction Market Hook
 * 
 * An improved version of the prediction market hook with better error handling,
 * data fetching, and state management.
 */

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/providers/evm-wallet-provider";
import { chainSelector } from "@/config/chain-selector";
import { Prediction, UserBet } from "@/utils/prediction-utils";
import { 
  ErrorMessages, 
  SuccessMessages, 
  handleContractError, 
  showLoadingToast
} from "@/utils/error-utils";
import { fetchWithCache } from "@/utils/data-fetching-utils";
import { useMockData } from "@/components/ui/mock-data-indicator";
import { simulateGetUserBets } from "@/utils/prediction-market-test-utils";

// Define return type for the hook
interface UsePredictionMarketReturn {
  predictions: Prediction[];
  userBets: UserBet[];
  isLoading: boolean;
  isCreatingPrediction: boolean;
  isPlacingBet: boolean;
  isResolvingPrediction: boolean;
  isClaimingWinnings: boolean;
  error: Error | null;
  fetchPredictions: (forceRefresh?: boolean) => Promise<void>;
  fetchUserBets: (forceRefresh?: boolean) => Promise<void>;
  createPrediction: (
    title: string,
    description: string,
    options: string[],
    stake: string
  ) => Promise<boolean>;
  placeBet: (
    predictionId: number,
    optionId: number,
    amount: string
  ) => Promise<boolean>;
  resolvePrediction: (
    predictionId: number,
    winningOptionId: number
  ) => Promise<boolean>;
  claimWinnings: (predictionId: number) => Promise<boolean>;
  clearError: () => void;
}

// Define the expected return type from callMethod
interface CallMethodResult {
  hash?: string;
  status?: string;
  success: boolean;
  data?: unknown;
}

// Define the prediction data structure from the contract
interface ContractPrediction {
  id: string | number;
  creator: string;
  title: string;
  description: string;
  options: string[];
  stake: string | number;
  totalBets: string | number;
  resolvedOption: string | number;
  createdAt: string | number;
  resolvedAt: string | number;
  txHash?: string;
}

// Define the bet data structure from the contract
interface BetData {
  optionId: string | number;
  amount: string | number;
  createdAt: string | number;
  claimed: boolean;
}

/**
 * Safely convert a timestamp to ISO string
 */
function safeTimestampToISOString(timestamp: string | number | undefined): string | undefined {
  if (!timestamp) return undefined;
  
  try {
    // For testing environments, use a fixed date
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
      return new Date().toISOString();
    }
    
    // Convert to number if it's a string
    const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    
    // Check if the timestamp is in seconds (common for blockchain) or milliseconds
    const timestampMs = timestampNum < 10000000000 ? timestampNum * 1000 : timestampNum;
    
    // Create date and validate
    const date = new Date(timestampMs);
    return !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
  } catch (error) {
    console.error("Error converting timestamp to ISO string:", error);
    return new Date().toISOString();
  }
}

/**
 * Custom hook for interacting with the prediction market contract
 */
export function usePredictionMarket(): UsePredictionMarketReturn {
  const { isConnected, address, callMethod } = useWallet();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingPrediction, setIsCreatingPrediction] = useState<boolean>(false);
  const [isPlacingBet, setIsPlacingBet] = useState<boolean>(false);
  const [isResolvingPrediction, setIsResolvingPrediction] = useState<boolean>(false);
  const [isClaimingWinnings, setIsClaimingWinnings] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { notifyMockDataUsed } = useMockData();

  // Helper function to determine if mock data should be used
  const shouldUseMockData = useCallback(() => {
    return process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE === 'true' || 
           process.env.NODE_ENV === 'test' ||
           typeof window === 'undefined';
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch predictions from the contract
  const fetchPredictions = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      clearError();
      
      // Use fetchWithCache to get predictions with caching
      const result = await fetchWithCache<CallMethodResult>(
        async () => {
          return await callMethod(
            "getPredictions",
            [0, 10], // start, limit
            "0",
            chainSelector.getPredictionMarketAddress()
          ) as CallMethodResult;
        },
        {
          cacheKey: "predictions",
          cacheTtl: 30000, // 30 seconds
          cacheEnabled: !forceRefresh, // Skip cache if forceRefresh is true
          errorMessage: ErrorMessages.FETCH_PREDICTIONS,
          fallbackData: { success: false, data: null },
          throwOnError: false
        }
      );
      
      if (result.success && result.data) {
        // Transform contract data to our format
        const formattedPredictions = (result.data as ContractPrediction[]).map((pred) => ({
          id: `pred-${pred.id}`,
          predictionId: Number(pred.id),
          creator: pred.creator,
          title: pred.title,
          description: pred.description,
          options: pred.options.map((opt, i) => ({ 
            id: i, 
            text: opt 
          })),
          stake: pred.stake.toString(),
          totalBets: pred.totalBets.toString(),
          resolvedOption: Number(pred.resolvedOption),
          createdAt: safeTimestampToISOString(pred.createdAt) || new Date().toISOString(),
          resolvedAt: Number(pred.resolvedAt) > 0 
            ? safeTimestampToISOString(pred.resolvedAt)
            : undefined,
          chainId: chainSelector.getActiveChainId(),
          txHash: pred.txHash || "0x",
        }));
        
        setPredictions(formattedPredictions);
      } else {
        // If contract call fails, use mock data for development
        console.warn("Failed to fetch predictions from contract, using mock data");
        
        // Notify that we're using mock data
        notifyMockDataUsed("Prediction Market");
        
        // Import mock data only when needed (for better tree-shaking)
        const { mockPredictions } = await import("@/utils/prediction-market-test-utils");
        setPredictions(mockPredictions);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Use mock data as fallback
      notifyMockDataUsed("Prediction Market");
      const { mockPredictions } = await import("@/utils/prediction-market-test-utils");
      setPredictions(mockPredictions);
    } finally {
      setIsLoading(false);
    }
  }, [callMethod, clearError, notifyMockDataUsed]);

  // Helper function to format bet data from contract
  const formatBetData = useCallback((betData: BetData, prediction: ContractPrediction): UserBet => {
    return {
      id: `bet-${prediction.id}-${address}`,
      predictionId: `pred-${prediction.id}`,
      prediction: {
        title: prediction.title,
        options: Array.isArray(prediction.options) 
          ? prediction.options.map((opt, idx) => ({ id: idx, text: opt }))
          : [],
        resolvedOption: Number(prediction.resolvedOption)
      },
      optionId: Number(betData.optionId),
      amount: betData.amount.toString(),
      createdAt: safeTimestampToISOString(betData.createdAt) || new Date().toISOString(),
      claimed: betData.claimed
    };
  }, [address]);

  // Fetch user bets
  const fetchUserBets = useCallback(async (forceRefresh = false) => {
    if (!isConnected || !address) {
      setUserBets([]);
      return;
    }
    
    try {
      clearError();
      
      // Check if we should use mock data
      if (shouldUseMockData()) {
        const mockData = await simulateGetUserBets(address);
        setUserBets(mockData);
        notifyMockDataUsed("user bets");
        return;
      }
      
      // Use fetchWithCache to get user bets with caching
      const result = await fetchWithCache<UserBet[]>(
        async () => {
          // First, get all predictions
          const predictionsResult = await callMethod(
            "getPredictions",
            [0, 1000], // Get a large number of predictions (fromIndex, limit)
            "0",
            chainSelector.getPredictionMarketAddress()
          ) as CallMethodResult;
          
          if (!predictionsResult.success || !Array.isArray(predictionsResult.data)) {
            throw new Error("Failed to fetch predictions");
          }
          
          const allPredictions = predictionsResult.data as ContractPrediction[];
          const userBetsPromises: Promise<UserBet | null>[] = [];
          
          // For each prediction, check if the user has placed a bet
          for (const prediction of allPredictions) {
            userBetsPromises.push(
              (async () => {
                try {
                  // Call getBet for each prediction to check if the user has a bet
                  const betResult = await callMethod(
                    "getBet",
                    [prediction.id, address],
                    "0",
                    chainSelector.getPredictionMarketAddress()
                  ) as CallMethodResult;
                  
                  // If the bet exists and has a non-zero amount, format it as a UserBet
                  if (betResult.success && betResult.data && 
                      typeof betResult.data === 'object' && 
                      'amount' in betResult.data && 
                      betResult.data.amount && 
                      betResult.data.amount !== '0') {
                    
                    // Properly type the bet data
                    const betData = betResult.data as BetData;
                    return formatBetData(betData, prediction);
                  }
                  
                  return null;
                } catch (error) {
                  console.error(`Error fetching bet for prediction ${prediction.id}:`, error);
                  return null;
                }
              })()
            );
          }
          
          // Wait for all bet queries to complete and filter out null results
          const bets = (await Promise.all(userBetsPromises)).filter(bet => bet !== null) as UserBet[];
          return bets;
        },
        {
          cacheKey: `userBets-${address}`,
          cacheTtl: 30000, // 30 seconds
          cacheEnabled: !forceRefresh, // Skip cache if forceRefresh is true
          errorMessage: ErrorMessages.FETCH_USER_BETS,
          fallbackData: [], // Return empty array as fallback
          throwOnError: false, // Don't throw errors
          showErrorToast: true // Show error toast
        }
      );
      
      setUserBets(result);
    } catch (error) {
      handleContractError(error, ErrorMessages.FETCH_USER_BETS);
      setError(error as Error);
      setUserBets([]);
    }
  }, [isConnected, address, callMethod, clearError, notifyMockDataUsed, shouldUseMockData, formatBetData]);

  // Create a new prediction
  const createPrediction = useCallback(async (
    title: string,
    description: string,
    options: string[],
    stake: string
  ): Promise<boolean> => {
    try {
      setIsCreatingPrediction(true);
      clearError();
      
      // Show loading toast for better UX
      const result = await showLoadingToast(
        callMethod(
          "createPrediction",
          [title, description, options],
          stake,
          chainSelector.getPredictionMarketAddress()
        ) as Promise<CallMethodResult>,
        {
          loading: "Creating prediction...",
          success: SuccessMessages.CREATE_PREDICTION,
          error: ErrorMessages.CREATE_PREDICTION
        }
      );
      
      if (result.success) {
        await fetchPredictions(true); // Force refresh predictions
        return true;
      } else {
        handleContractError(
          new Error(result.status || "Unknown error"), 
          ErrorMessages.CREATE_PREDICTION,
          async () => { await createPrediction(title, description, options, stake); }
        );
        return false;
      }
    } catch (error) {
      console.error("Error creating prediction:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      handleContractError(error, ErrorMessages.CREATE_PREDICTION);
      return false;
    } finally {
      setIsCreatingPrediction(false);
    }
  }, [callMethod, fetchPredictions, clearError]);

  // Place a bet on a prediction
  const placeBet = useCallback(async (
    predictionId: number,
    optionId: number,
    amount: string
  ): Promise<boolean> => {
    try {
      setIsPlacingBet(true);
      clearError();
      
      // Show loading toast for better UX
      const result = await showLoadingToast(
        callMethod(
          "placeBet",
          [predictionId, optionId],
          amount,
          chainSelector.getPredictionMarketAddress()
        ) as Promise<CallMethodResult>,
        {
          loading: "Placing bet...",
          success: SuccessMessages.PLACE_BET,
          error: ErrorMessages.PLACE_BET
        }
      );
      
      if (result.success) {
        await Promise.all([
          fetchPredictions(true), // Force refresh predictions
          fetchUserBets(true)     // Force refresh user bets
        ]);
        return true;
      } else {
        handleContractError(
          new Error(result.status || "Unknown error"), 
          ErrorMessages.PLACE_BET,
          async () => { await placeBet(predictionId, optionId, amount); }
        );
        return false;
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      handleContractError(error, ErrorMessages.PLACE_BET);
      return false;
    } finally {
      setIsPlacingBet(false);
    }
  }, [callMethod, fetchPredictions, fetchUserBets, clearError]);

  // Resolve a prediction
  const resolvePrediction = useCallback(async (
    predictionId: number,
    winningOptionId: number
  ): Promise<boolean> => {
    try {
      setIsResolvingPrediction(true);
      clearError();
      
      // Show loading toast for better UX
      const result = await showLoadingToast(
        callMethod(
          "resolvePrediction",
          [predictionId, winningOptionId],
          "0",
          chainSelector.getPredictionMarketAddress()
        ) as Promise<CallMethodResult>,
        {
          loading: "Resolving prediction...",
          success: SuccessMessages.RESOLVE_PREDICTION,
          error: ErrorMessages.RESOLVE_PREDICTION
        }
      );
      
      if (result.success) {
        await fetchPredictions(true); // Force refresh predictions
        return true;
      } else {
        handleContractError(
          new Error(result.status || "Unknown error"), 
          ErrorMessages.RESOLVE_PREDICTION,
          async () => { await resolvePrediction(predictionId, winningOptionId); }
        );
        return false;
      }
    } catch (error) {
      console.error("Error resolving prediction:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      handleContractError(error, ErrorMessages.RESOLVE_PREDICTION);
      return false;
    } finally {
      setIsResolvingPrediction(false);
    }
  }, [callMethod, fetchPredictions, clearError]);

  // Claim winnings from a resolved prediction
  const claimWinnings = useCallback(async (
    predictionId: number
  ): Promise<boolean> => {
    try {
      setIsClaimingWinnings(true);
      clearError();
      
      // Show loading toast for better UX
      const result = await showLoadingToast(
        callMethod(
          "claimWinnings",
          [predictionId],
          "0",
          chainSelector.getPredictionMarketAddress()
        ) as Promise<CallMethodResult>,
        {
          loading: "Claiming winnings...",
          success: SuccessMessages.CLAIM_WINNINGS,
          error: ErrorMessages.CLAIM_WINNINGS
        }
      );
      
      if (result.success) {
        await fetchUserBets(true); // Force refresh user bets
        return true;
      } else {
        handleContractError(
          new Error(result.status || "Unknown error"), 
          ErrorMessages.CLAIM_WINNINGS,
          async () => { await claimWinnings(predictionId); }
        );
        return false;
      }
    } catch (error) {
      console.error("Error claiming winnings:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      handleContractError(error, ErrorMessages.CLAIM_WINNINGS);
      return false;
    } finally {
      setIsClaimingWinnings(false);
    }
  }, [callMethod, fetchUserBets, clearError]);

  // Load initial data
  useEffect(() => {
    fetchPredictions();
    if (isConnected) {
      fetchUserBets();
    }
  }, [fetchPredictions, fetchUserBets, isConnected]);

  return {
    predictions,
    userBets,
    isLoading,
    isCreatingPrediction,
    isPlacingBet,
    isResolvingPrediction,
    isClaimingWinnings,
    error,
    fetchPredictions,
    fetchUserBets,
    createPrediction,
    placeBet,
    resolvePrediction,
    claimWinnings,
    clearError,
  };
}