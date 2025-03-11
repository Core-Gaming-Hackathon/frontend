/**
 * Base Schemas
 * 
 * Foundation schemas that can be extended by domain-specific schemas.
 * This promotes DRY principles by centralizing common validation patterns.
 */
import { z } from 'zod';

// Common validation patterns
export const commonValidators = {
  // String validators
  nonEmptyString: z.string().min(1, "This field cannot be empty"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, and _.-"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  url: z.string().url("Please enter a valid URL"),
  
  // Number validators
  positiveNumber: z.number().positive("Value must be positive"),
  nonNegativeNumber: z.number().min(0, "Value cannot be negative"),
  integerNumber: z.number().int("Value must be a whole number"),
  percentage: z.number().min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100"),
  
  // Date validators
  pastDate: z.date().max(new Date(), "Date must be in the past"),
  futureDate: z.date().min(new Date(), "Date must be in the future"),
  
  // NEAR/Blockchain specific validators
  nearWalletAddress: z.string()
    .regex(/^[a-z0-9_-]+(\.[a-z0-9_-]+)*(\.(testnet|near))$/, "Invalid NEAR wallet address format"),
  evmWalletAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address format"),
  walletAddress: z.string()
    .regex(/^(0x[a-fA-F0-9]{40}|[a-z0-9_-]+(\.[a-z0-9_-]+)*(\.(testnet|near)))$/, "Invalid wallet address format"),
  nearAmount: z.string()
    .regex(/^\d+(\.\d+)?$/, "Amount must be a valid number")
};

/**
 * Base user schema - contains fields common across all user-related schemas
 */
export const baseUserSchema = z.object({
  username: commonValidators.username,
  email: commonValidators.email.optional(),
  walletAddress: commonValidators.walletAddress.optional(),
});

/**
 * Base game schema - contains fields common across all game-related schemas
 */
export const baseGameSchema = z.object({
  gameType: z.enum(['battle', 'love', 'mystery', 'raid']),
  stake: commonValidators.nearAmount,
  visibility: z.enum(['public', 'private']).default('public'),
});

/**
 * Base prediction schema - contains fields common across prediction-related schemas
 */
export const basePredictionSchema = z.object({
  title: commonValidators.nonEmptyString,
  description: z.string().max(500, "Description cannot exceed 500 characters"),
  resolvesAt: commonValidators.futureDate,
});

/**
 * Base transaction schema - common blockchain transaction fields
 */
export const baseTransactionSchema = z.object({
  amount: commonValidators.nearAmount,
  walletAddress: commonValidators.nearWalletAddress,
  chainId: z.string().optional(),
});

// Export validation error handler for use with all schemas
export function handleZodError(error: z.ZodError) {
  const formattedErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    if (err.path.length > 0) {
      formattedErrors[err.path.join('.')] = err.message;
    }
  });
  
  return formattedErrors;
}

// Generic form validation function
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { 
    success: false, 
    errors: handleZodError(result.error)
  };
} 