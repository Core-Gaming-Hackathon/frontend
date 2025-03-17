'use server';

import { predictionsQueries } from "@/db/queries/predictions";
import { Prediction, UserBet } from "@/utils/prediction-utils";

/**
 * Server-side service for prediction market operations
 * This file contains server actions that can be called from client components
 */

// Define database prediction structure
interface DbPrediction {
  id: string;
  predictionId: number;
  creator: string;
  title: string;
  description: string;
  stake: string | number;
  totalBets: string | number;
  resolvedOption: number | null;
  createdAt: Date;
  resolvedAt: Date | null;
  chainId: number;
  txHash: string;
  options?: Array<{
    id: string;
    predictionId: string;
    optionId: number;
    text: string;
  }>;
}

// Define database bet structure
interface DbBet {
  id: string;
  predictionId: string;
  bettor: string;
  optionId: number;
  amount: string | number;
  createdAt: Date;
  claimed: boolean;
  txHash: string;
  prediction: DbPrediction;
}

/**
 * Format a database prediction to the client-side format
 */
function formatDbPrediction(dbPred: DbPrediction): Prediction {
  return {
    id: `pred-${dbPred.predictionId}`,
    predictionId: dbPred.predictionId,
    creator: dbPred.creator,
    title: dbPred.title,
    description: dbPred.description,
    options: dbPred.options?.map(opt => ({ 
      id: opt.optionId, 
      text: opt.text 
    })) || [],
    stake: dbPred.stake.toString(),
    totalBets: dbPred.totalBets.toString(),
    resolvedOption: dbPred.resolvedOption !== null ? dbPred.resolvedOption : -1,
    createdAt: dbPred.createdAt.toISOString(),
    resolvedAt: dbPred.resolvedAt ? dbPred.resolvedAt.toISOString() : undefined,
    chainId: dbPred.chainId,
    txHash: dbPred.txHash,
  };
}

/**
 * Format a database bet to the client-side format
 */
function formatDbBet(dbBet: DbBet): UserBet {
  return {
    id: `bet-${dbBet.prediction.predictionId}-${dbBet.bettor}`,
    predictionId: `pred-${dbBet.prediction.predictionId}`,
    prediction: {
      title: dbBet.prediction.title,
      options: dbBet.prediction.options?.map(opt => ({ 
        id: opt.optionId, 
        text: opt.text 
      })) || [],
      resolvedOption: dbBet.prediction.resolvedOption !== null ? dbBet.prediction.resolvedOption : -1
    },
    optionId: dbBet.optionId,
    amount: dbBet.amount.toString(),
    createdAt: dbBet.createdAt.toISOString(),
    claimed: dbBet.claimed
  };
}

/**
 * Get all predictions from the database
 */
export async function getPredictionsFromDb(limit: number = 100): Promise<Prediction[]> {
  try {
    const result = await predictionsQueries.getPredictions(limit, 0);
    const dbPredictions = result as unknown as DbPrediction[];
    return dbPredictions.map(formatDbPrediction);
  } catch (error) {
    console.error("Error fetching predictions from database:", error);
    return [];
  }
}

/**
 * Get a prediction by its on-chain ID
 */
export async function getPredictionByChainId(chainPredictionId: number): Promise<DbPrediction | null> {
  try {
    const result = await predictionsQueries.getPredictionByChainId(chainPredictionId);
    if (result && result.length > 0) {
      return result[0] as unknown as DbPrediction;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching prediction ${chainPredictionId} from database:`, error);
    return null;
  }
}

/**
 * Get all bets for a user
 */
export async function getUserBetsFromDb(address: string): Promise<UserBet[]> {
  try {
    const result = await predictionsQueries.getUserBets(address);
    const dbBets = result as unknown as DbBet[];
    return dbBets.map(formatDbBet);
  } catch (error) {
    console.error(`Error fetching bets for user ${address} from database:`, error);
    return [];
  }
}

/**
 * Save a prediction to the database
 */
export async function savePrediction(predictionData: {
  predictionId: number;
  creator: string;
  title: string;
  description: string;
  stake: string;
  totalBets: string;
  resolvedOption: number;
  chainId: number;
  txHash: string;
  options: { id: number; text: string }[];
}): Promise<boolean> {
  try {
    await predictionsQueries.savePrediction(predictionData);
    return true;
  } catch (error) {
    console.error("Error saving prediction to database:", error);
    return false;
  }
}

/**
 * Save a bet to the database
 */
export async function saveBet(betData: {
  predictionId: string;
  bettor: string;
  optionId: number;
  amount: string;
  txHash: string;
}): Promise<boolean> {
  try {
    await predictionsQueries.saveBet(betData);
    return true;
  } catch (error) {
    console.error("Error saving bet to database:", error);
    return false;
  }
}

/**
 * Resolve a prediction in the database
 */
export async function resolvePrediction(predictionId: string, winningOptionId: number): Promise<boolean> {
  try {
    await predictionsQueries.resolvePrediction(predictionId, winningOptionId);
    return true;
  } catch (error) {
    console.error("Error resolving prediction in database:", error);
    return false;
  }
}

/**
 * Mark a bet as claimed in the database
 */
export async function markBetAsClaimed(betId: string): Promise<boolean> {
  try {
    await predictionsQueries.markBetAsClaimed(betId);
    return true;
  } catch (error) {
    console.error("Error marking bet as claimed in database:", error);
    return false;
  }
} 