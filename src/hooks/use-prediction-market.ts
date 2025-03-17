/**
 * Prediction Market Hook
 * 
 * An improved version of the prediction market hook with better error handling,
 * data fetching, and state management.
 */

import { useState, useCallback, useRef } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { evmWallet } from "@/config/evm-wallet";
import { chainSelector } from "@/config/chain-selector";
import { Prediction as PredictionType } from "@/types/prediction";
import { 
  ErrorMessages, 
  SuccessMessages, 
  showLoadingToast
} from "@/utils/error-utils";
import { clearCacheEntry } from "@/utils/data-fetching-utils";
import { parseEther, createPublicClient, http, type Abi } from "viem";
import { abi as predictionMarketAbiJson } from "@/abis/BaultroPredictionMarket.json";
import { createCorsProxyTransport } from "@/services/cors-proxy";
import { toast } from "sonner";
import { generateMockPredictions, isMockModeEnabled } from "@/utils/mock-data";

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Define CallMethodResult interface
interface CallMethodResult {
  success: boolean;
  hash: string;
  status: string;
  errorMessage?: string;
}

// Define return type for the hook
interface UsePredictionMarketReturn {
  predictions: PredictionType[];
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
    stake: number
  ) => Promise<CallMethodResult>;
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

// Define the contract prediction type
interface ContractPrediction {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  options: string[];
  stake: bigint;
  totalBets: bigint;
  resolvedOption: number;
  createdAt: bigint;
  resolvedAt: bigint;
}

// Define the UserBet interface
interface UserBet {
  id: string;
  predictionId: string;
  prediction: {
    title: string;
    options: Array<{ id: number; text: string }>;
    resolvedOption: number;
  };
  optionId: number;
  amount: string;
  createdAt: string;
  claimed: boolean;
}

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<unknown>> = {};

// Cache helper functions
function getCachedData<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;
  
  // Check if cache entry is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    delete cache[key];
    return null;
  }
  
  return entry.data as T;
}

function setCachedData<T>(key: string, data: T): void {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
}

// Create a public client singleton to avoid creating multiple instances
let publicClientInstance: ReturnType<typeof createPublicClient> | null = null;

/**
 * Custom hook for interacting with the prediction market contract
 */
export function usePredictionMarket(): UsePredictionMarketReturn {
  // State for predictions and user bets
  const [predictions, setPredictions] = useState<PredictionType[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreatingPrediction, setIsCreatingPrediction] = useState<boolean>(false);
  const [isPlacingBet, setIsPlacingBet] = useState<boolean>(false);
  const [isResolvingPrediction, setIsResolvingPrediction] = useState<boolean>(false);
  const [isClaimingWinnings, setIsClaimingWinnings] = useState<boolean>(false);
  
  // Error state
  const [error, setError] = useState<Error | null>(null);
  
  // Get wallet connection status
  const { isConnected, address } = useWallet();
  
  // Use refs to prevent multiple simultaneous calls
  const isFetchingPredictions = useRef<boolean>(false);
  const isFetchingUserBets = useRef<boolean>(false);
  
  // Track last fetch time to prevent too frequent refreshes
  const lastPredictionsFetchTime = useRef<number>(0);
  const lastUserBetsFetchTime = useRef<number>(0);
  
  // Minimum time between refreshes (in milliseconds)
  const MIN_REFRESH_INTERVAL = 30000; // 30 seconds
  
  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Get or create the public client
  const getPublicClient = useCallback(() => {
    if (publicClientInstance) return publicClientInstance;
    
    const rpcUrl = chainSelector.getRpcUrl();
    publicClientInstance = createPublicClient({
      transport: createCorsProxyTransport(rpcUrl),
    });
    
    return publicClientInstance;
  }, []);
  
  // Helper function to call contract methods
  const callMethod = useCallback(async (
    methodName: string,
    args: unknown[] = [],
    value: string = "0"
  ): Promise<CallMethodResult> => {
    try {
      clearError();
      
      if (!isConnected || !address) {
        return {
          success: false,
          hash: "",
          status: "Wallet not connected",
          errorMessage: "Wallet not connected"
        };
      }
      
      // If mock mode is enabled, return a successful mock response
      if (isMockModeEnabled()) {
        return {
          success: true,
          hash: `0x${Array.from({ length: 64 }).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          status: "success"
        };
      }
      
      const result = await evmWallet.callMethod(
        chainSelector.getPredictionMarketAddress(),
        predictionMarketAbiJson as Abi,
        methodName,
        args,
        BigInt(value)
      );
      
      if (!result.success) {
        throw new Error(result.errorMessage || `Failed to call ${methodName}`);
      }

      return {
        success: true,
        hash: result.hash,
        status: "success"
      };
    } catch (error) {
      console.error(`[CONTRACT] Error calling ${methodName}:`, error);
      setError(error instanceof Error ? error : new Error(`Failed to call ${methodName}`));
      return {
        success: false,
        hash: "",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }, [isConnected, address, clearError]);

  // Helper function to fetch prediction options
  const fetchPredictionOptions = useCallback(async (predictionId: bigint, publicClient: ReturnType<typeof createPublicClient>): Promise<string[]> => {
    try {
      // Check cache first
      const cacheKey = `prediction-options-${predictionId.toString()}`;
      const cachedOptions = getCachedData<string[]>(cacheKey);
      if (cachedOptions) {
        return cachedOptions;
      }
      
      // Fetch options from contract
      const options = await publicClient.readContract({
        address: chainSelector.getPredictionMarketAddress() as `0x${string}`,
        abi: predictionMarketAbiJson,
        functionName: 'getPrediction',
        args: [predictionId],
      }) as unknown as ContractPrediction;
      
      // Cache the result
      setCachedData(cacheKey, options.options);
      
      return options.options;
    } catch (error) {
      console.error(`Error fetching prediction options for ID ${predictionId}:`, error);
      return [];
    }
  }, []);

  // Fetch predictions from the contract
  const fetchPredictions = useCallback(async (forceRefresh = false): Promise<void> => {
    // Prevent multiple simultaneous calls
    if (isFetchingPredictions.current) return;
    
    // Check if we should use cached data
    const now = Date.now();
    if (
      !forceRefresh && 
      lastPredictionsFetchTime.current > 0 && 
      now - lastPredictionsFetchTime.current < MIN_REFRESH_INTERVAL
    ) {
      // Use cached data if available and not forcing refresh
      const cachedPredictions = getCachedData<PredictionType[]>('predictions');
      if (cachedPredictions && cachedPredictions.length > 0) {
        return;
      }
    }
    
    // Set loading state
    setIsLoading(true);
    isFetchingPredictions.current = true;
    
    try {
      // Clear any previous errors
      clearError();
      
      // Check if mock mode is enabled
      if (isMockModeEnabled()) {
        console.log('Using mock predictions data');
        const mockPredictions = generateMockPredictions(15);
        setPredictions(mockPredictions);
        setCachedData('predictions', mockPredictions);
        lastPredictionsFetchTime.current = now;
        setIsLoading(false);
        isFetchingPredictions.current = false;
        return;
      }
      
      try {
        // Create a public client
        const publicClient = getPublicClient();
        
        // Get prediction count
        const count = await publicClient.readContract({
          address: chainSelector.getPredictionMarketAddress() as `0x${string}`,
          abi: predictionMarketAbiJson as Abi,
          functionName: 'getPredictionsCount',
        }) as bigint;
        
        // If no predictions, return empty array
        if (count === BigInt(0)) {
          setPredictions([]);
          setCachedData('predictions', []);
          lastPredictionsFetchTime.current = now;
          return;
        }
        
        // Get predictions in batches to avoid timeout
        const batchSize = BigInt(5);
        const batches = Math.ceil(Number(count) / Number(batchSize));
        const allPredictions: PredictionType[] = [];
        
        for (let i = 0; i < batches; i++) {
          const fromIndex = BigInt(i) * batchSize;
          const limit = i === batches - 1 ? count - fromIndex : batchSize;
          
          if (limit <= BigInt(0)) break;
          
          try {
            const batchPredictions = await publicClient.readContract({
              address: chainSelector.getPredictionMarketAddress() as `0x${string}`,
              abi: predictionMarketAbiJson as Abi,
              functionName: 'getPredictions',
              args: [fromIndex, limit],
            }) as unknown as ContractPrediction[];
            
            // Process each prediction
            for (const prediction of batchPredictions) {
              try {
                // Fetch options for this prediction
                const options = await fetchPredictionOptions(prediction.id, publicClient);
                
                // Convert to our prediction type
                const processedPrediction: PredictionType = {
                  predictionId: Number(prediction.id),
                  title: prediction.title,
                  description: prediction.description,
                  options: options.map((text, id) => ({ id, text })),
                  creator: prediction.creator,
                  stake: prediction.stake.toString(),
                  totalBets: prediction.totalBets.toString(),
                  resolvedOption: prediction.resolvedOption,
                  chainId: chainSelector.getActiveChainId(),
                  txHash: '', // Not available from contract
                  createdAt: new Date(Number(prediction.createdAt) * 1000).toISOString(),
                  resolvedAt: prediction.resolvedAt > BigInt(0) 
                    ? new Date(Number(prediction.resolvedAt) * 1000).toISOString() 
                    : undefined
                };
                
                allPredictions.push(processedPrediction);
              } catch (error) {
                console.error(`Error processing prediction ${prediction.id}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error fetching prediction batch ${i}:`, error);
          }
        }
        
        // Update state and cache
        setPredictions(allPredictions);
        setCachedData('predictions', allPredictions);
        lastPredictionsFetchTime.current = now;
      } catch (error) {
        console.error('Error fetching predictions:', error);
        
        // If network error, fall back to mock data in development
        if (process.env.NODE_ENV === 'development' && 
            (error instanceof Error && 
             (error.message.includes('Failed to fetch') || 
              error.message.includes('ERR_NAME_NOT_RESOLVED')))) {
          console.log('Network error in development, falling back to mock data');
          const mockPredictions = generateMockPredictions(15);
          setPredictions(mockPredictions);
          setCachedData('predictions', mockPredictions);
          lastPredictionsFetchTime.current = now;
          return;
        }
        
        setError(error instanceof Error ? error : new Error('Failed to fetch predictions'));
      }
    } catch (error) {
      console.error('Error in fetchPredictions:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch predictions'));
    } finally {
      setIsLoading(false);
      isFetchingPredictions.current = false;
    }
  }, [chainSelector, fetchPredictionOptions, getPublicClient, clearError]);

  // Fetch user bets
  const fetchUserBets = useCallback(async (forceRefresh = false): Promise<void> => {
    // Skip if not connected
    if (!isConnected || !address) {
      setUserBets([]);
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (isFetchingUserBets.current) {
      return;
    }
    
    // Check if we should refresh based on time elapsed since last fetch
    const now = Date.now();
    if (!forceRefresh && now - lastUserBetsFetchTime.current < MIN_REFRESH_INTERVAL) {
      return;
    }
    
    try {
      isFetchingUserBets.current = true;
      
      // Check cache first if not forcing refresh
      const cacheKey = `userBets-${address}`;
      if (!forceRefresh) {
        const cachedBets = getCachedData<UserBet[]>(cacheKey);
        if (cachedBets) {
          setUserBets(cachedBets);
          isFetchingUserBets.current = false;
          return;
        }
      }
      
      // For now, we'll return an empty array
      // This will be replaced with actual implementation later
      setUserBets([]);
      setCachedData(cacheKey, []);
      lastUserBetsFetchTime.current = now;
    } catch (error) {
      console.error('Error fetching user bets:', error);
    } finally {
      isFetchingUserBets.current = false;
    }
  }, [isConnected, address]);

  // Create a new prediction
  const createPrediction = useCallback(async (
    title: string,
    description: string,
    options: string[],
    stake: number
  ): Promise<CallMethodResult> => {
    try {
      setIsCreatingPrediction(true);
      clearError();
      
      // Show loading toast
      const toastId = showLoadingToast('Creating prediction...');
      
      // Call contract method
      const result = await callMethod(
        'createPrediction',
        [title, description, options],
        parseEther(stake.toString()).toString()
      );
      
      // Handle result
      if (result.success) {
        // Clear cache to force refresh
        clearCacheEntry('predictions');
        
        // Show success toast
        toast.success('Prediction created successfully');
        
        // Refresh predictions
        fetchPredictions(true).catch(console.error);
      } else {
        // Show error toast
        toast.error(result.errorMessage || 'Failed to create prediction');
      }
      
      // Dismiss loading toast
      toast.dismiss(toastId);
      
      return result;
    } catch (error) {
      console.error('Error creating prediction:', error);
      setError(error instanceof Error ? error : new Error('Failed to create prediction'));
      
      // Show error toast
      toast.error('Failed to create prediction');
      
      return {
        success: false,
        hash: '',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    } finally {
      setIsCreatingPrediction(false);
    }
  }, [callMethod, clearError, fetchPredictions]);

  // Place a bet
  const placeBet = useCallback(async (
    predictionId: number,
    optionId: number,
    amount: string
  ): Promise<boolean> => {
    try {
      setIsPlacingBet(true);
      clearError();
      
      // Show loading toast
      const toastId = showLoadingToast('Placing bet...');
      
      // Call contract method
      const result = await callMethod(
        'placeBet',
        [BigInt(predictionId), optionId],
        parseEther(amount).toString()
      );
      
      // Handle result
      if (result.success) {
        // Clear cache to force refresh
        clearCacheEntry('predictions');
        clearCacheEntry(`userBets-${address}`);
        
        // Show success toast
        toast.success('Bet placed successfully');
        
        // Refresh data
        Promise.all([
          fetchPredictions(true),
          fetchUserBets(true)
        ]).catch(console.error);
        
        // Dismiss loading toast
        toast.dismiss(toastId);
        
        return true;
      } else {
        // Show error toast
        toast.error(result.errorMessage || 'Failed to place bet');
        
        // Dismiss loading toast
        toast.dismiss(toastId);
        
        return false;
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      setError(error instanceof Error ? error : new Error('Failed to place bet'));
      
      // Show error toast
      toast.error('Failed to place bet');
      
      return false;
    } finally {
      setIsPlacingBet(false);
    }
  }, [address, callMethod, clearError, fetchPredictions, fetchUserBets]);

  // Resolve a prediction
  const resolvePrediction = useCallback(async (
    predictionId: number,
    winningOptionId: number
  ): Promise<boolean> => {
    try {
      setIsResolvingPrediction(true);
      clearError();
      
      // Show loading toast
      const toastId = showLoadingToast('Resolving prediction...');
      
      // Call contract method
      const result = await callMethod(
        'resolvePrediction',
        [BigInt(predictionId), winningOptionId]
      );
      
      // Handle result
      if (result.success) {
        // Clear cache to force refresh
        clearCacheEntry('predictions');
        
        // Show success toast
        toast.success('Prediction resolved successfully');
        
        // Refresh predictions
        fetchPredictions(true).catch(console.error);
        
        // Dismiss loading toast
        toast.dismiss(toastId);
        
        return true;
      } else {
        // Show error toast
        toast.error(result.errorMessage || 'Failed to resolve prediction');
        
        // Dismiss loading toast
        toast.dismiss(toastId);
        
        return false;
      }
    } catch (error) {
      console.error('Error resolving prediction:', error);
      setError(error instanceof Error ? error : new Error('Failed to resolve prediction'));
      
      // Show error toast
      toast.error('Failed to resolve prediction');
      
      return false;
    } finally {
      setIsResolvingPrediction(false);
    }
  }, [callMethod, clearError, fetchPredictions]);

  // Claim winnings
  const claimWinnings = useCallback(async (
    predictionId: number
  ): Promise<boolean> => {
    try {
      setIsClaimingWinnings(true);
      clearError();
      
      // Show loading toast
      const toastId = showLoadingToast('Claiming winnings...');
      
      // Call contract method
      const result = await callMethod(
        'claimWinnings',
        [BigInt(predictionId)]
      );
      
      // Handle result
      if (result.success) {
        // Clear cache to force refresh
        clearCacheEntry(`userBets-${address}`);
        
        // Show success toast
        toast.success(SuccessMessages.WINNINGS_CLAIMED);
        
        // Refresh user bets
        await fetchUserBets(true);
        
        // Dismiss loading toast
        toast.dismiss(toastId);
        
        return true;
      } else {
        // Show error toast
        toast.error(result.errorMessage || ErrorMessages.WINNINGS_CLAIM_FAILED);
        
        // Dismiss loading toast
        toast.dismiss(toastId);
        
        return false;
      }
    } catch (error) {
      console.error('Error claiming winnings:', error);
      setError(error instanceof Error ? error : new Error('Failed to claim winnings'));
      
      // Show error toast
      toast.error(ErrorMessages.WINNINGS_CLAIM_FAILED);
      
      return false;
    } finally {
      setIsClaimingWinnings(false);
    }
  }, [address, callMethod, clearError, fetchUserBets]);

  // Return the hook interface
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
    clearError
  };
}