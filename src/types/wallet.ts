/**
 * Wallet Types
 * 
 * Type definitions for wallet interactions
 */

export interface CallMethodResult {
  hash: string;
  status: string;
  success: boolean;
  data?: unknown;
  errorMessage?: string;
} 