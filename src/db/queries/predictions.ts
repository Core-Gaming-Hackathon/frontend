import { db } from '../index';
import { predictions, predictionOptions, bets } from '../schema/predictions';
import { eq, desc, and, sql } from 'drizzle-orm';

export const predictionsQueries = {
  /**
   * Get a single prediction by ID with its options and bets
   */
  async getPrediction(predictionId: string) {
    return await db.select().from(predictions)
      .where(eq(predictions.id, predictionId))
      .execute();
  },

  /**
   * Get a prediction by its on-chain ID
   */
  async getPredictionByChainId(chainPredictionId: number) {
    return await db.select().from(predictions)
      .where(eq(predictions.predictionId, chainPredictionId))
      .execute();
  },

  /**
   * Get all predictions with pagination
   */
  async getPredictions(limit: number = 10, offset: number = 0) {
    return await db.select().from(predictions)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(predictions.createdAt))
      .execute();
  },

  /**
   * Get all bets for a specific user
   */
  async getUserBets(address: string) {
    return await db.select().from(bets)
      .where(eq(bets.bettor, address.toLowerCase()))
      .orderBy(desc(bets.createdAt))
      .execute();
  },

  /**
   * Get a specific bet by prediction ID and user address
   */
  async getUserBetForPrediction(predictionId: string, address: string) {
    return await db.select().from(bets)
      .where(and(
        eq(bets.predictionId, predictionId),
        eq(bets.bettor, address.toLowerCase())
      ))
      .execute();
  },

  /**
   * Save a prediction to the database
   */
  async savePrediction(predictionData: {
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
  }) {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert the prediction
      const [prediction] = await tx.insert(predictions).values({
        predictionId: predictionData.predictionId,
        creator: predictionData.creator.toLowerCase(),
        title: predictionData.title,
        description: predictionData.description,
        stake: predictionData.stake,
        totalBets: predictionData.totalBets,
        resolvedOption: predictionData.resolvedOption,
        chainId: predictionData.chainId,
        txHash: predictionData.txHash,
      }).returning();

      // Insert the options
      if (predictionData.options.length > 0) {
        await tx.insert(predictionOptions).values(
          predictionData.options.map(option => ({
            predictionId: prediction.id,
            optionId: option.id,
            text: option.text,
          }))
        );
      }

      return prediction;
    });
  },

  /**
   * Save a bet to the database
   */
  async saveBet(betData: {
    predictionId: string;
    bettor: string;
    optionId: number;
    amount: string;
    txHash: string;
    sourceChain?: string;
  }) {
    return await db.insert(bets).values({
      predictionId: betData.predictionId,
      bettor: betData.bettor.toLowerCase(),
      optionId: betData.optionId,
      amount: betData.amount,
      txHash: betData.txHash,
      sourceChain: betData.sourceChain,
    }).returning();
  },

  /**
   * Update a prediction's resolved status
   */
  async resolvePrediction(predictionId: string, winningOptionId: number) {
    return await db.update(predictions)
      .set({
        resolvedOption: winningOptionId,
        resolvedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(predictions.id, predictionId))
      .returning();
  },

  /**
   * Mark a bet as claimed
   */
  async markBetAsClaimed(betId: string) {
    return await db.update(bets)
      .set({ claimed: true })
      .where(eq(bets.id, betId))
      .returning();
  }
};