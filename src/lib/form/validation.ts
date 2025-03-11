/**
 * Form validation utilities using Zod
 * 
 * This file provides validation schemas for the application
 */
import { z } from 'zod';
import { AIProviderType } from '@/lib/ai-service-factory';

// Common validators
export const commonValidators = {
  walletAddress: z.string().regex(/^(0x[a-fA-F0-9]{40})$|^([a-z0-9_-]+\.near)$/, 'Invalid wallet address format'),
  positiveAmount: z.string().regex(/^[0-9]*\.?[0-9]+$/, 'Amount must be a positive number'),
  nonNegativeInteger: z.number().int().min(0, 'Must be a non-negative integer'),
};

// Base game schema with common properties
export const baseGameSchema = z.object({
  gameType: z.enum(['battle', 'love', 'mystery', 'raid']),
  stake: commonValidators.positiveAmount.default('1'),
  visibility: z.enum(['public', 'private']).default('private'),
  timeLimit: z.number().int().min(60).max(3600).default(300), // Time limit in seconds
  aiProvider: z.enum([AIProviderType.ZEREPY, AIProviderType.GEMINI, AIProviderType.CUSTOM]).default(AIProviderType.ZEREPY),
});

/**
 * Game creation validation schemas - extends base game schema
 */
// Schema for AI configuration in games
export const aiConfigSchema = z.object({
  useAIOpponent: z.boolean().default(true),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  preferredAIId: z.string().optional(),
});

// Custom AI config schema
export const yourAIConfigSchema = z.object({
  name: z.string().optional(),
  systemInstructions: z.string().optional(),
  vulnerabilities: z.array(z.string()).optional(),
});

// Game creation form schema
export const gameCreationSchema = baseGameSchema.extend({
  opponentType: z.enum(['human', 'ai']).default('ai'),
  opponentWalletAddress: z.string().optional()
    .refine(
      (val) => val === undefined || val === '' || commonValidators.walletAddress.safeParse(val).success,
      {
        message: "Must be a valid wallet address (EVM or NEAR)"
      }
    ),
  aiConfig: aiConfigSchema.optional(),
  yourAIConfig: yourAIConfigSchema.optional(),
});

// Game session schema
export const gameSessionSchema = z.object({
  gameId: z.string(),
  playerAddress: z.string(),
  opponentAddress: z.string().optional(),
  gameType: z.enum(['battle', 'love', 'mystery', 'raid']),
  status: z.enum(['created', 'active', 'completed', 'cancelled']),
  createdAt: z.number(),
  completedAt: z.number().optional(),
  stake: z.string(),
  timeLimit: z.number(),
  result: z.object({
    success: z.boolean().optional(),
    score: z.number().optional(),
    timeElapsed: z.number().optional(),
    reward: z.string().optional(),
  }).optional(),
});

export type GameCreationValues = z.infer<typeof gameCreationSchema>;
export type GameSession = z.infer<typeof gameSessionSchema>;