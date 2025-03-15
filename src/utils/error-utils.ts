/**
 * Error Utilities
 * 
 * Provides comprehensive error handling for the application with
 * detailed error messages, error categorization, and recovery strategies.
 */

import { toast } from "sonner";

/**
 * Error categories for better error handling
 */
export enum ErrorCategory {
  NETWORK = "network",
  CONTRACT = "contract",
  USER_REJECTED = "user_rejected",
  VALIDATION = "validation",
  PERMISSION = "permission",
  UNKNOWN = "unknown"
}

/**
 * Standard error messages for common operations
 */
export const ErrorMessages = {
  FETCH_PREDICTIONS: "Failed to fetch predictions",
  FETCH_USER_BETS: "Failed to fetch your bets",
  CREATE_PREDICTION: "Failed to create prediction",
  PLACE_BET: "Failed to place bet",
  RESOLVE_PREDICTION: "Failed to resolve prediction",
  CLAIM_WINNINGS: "Failed to claim winnings",
  CONNECT_WALLET: "Failed to connect wallet",
  NETWORK_ERROR: "Network error. Please check your connection",
  PERMISSION_DENIED: "Permission denied. You don't have access to perform this action",
  VALIDATION_ERROR: "Invalid input. Please check your data",
  USER_REJECTED: "Transaction was rejected",
  GENERIC: "An error occurred. Please try again."
};

/**
 * Success messages for common operations
 */
export const SuccessMessages = {
  CREATE_PREDICTION: "Prediction created successfully!",
  PLACE_BET: "Bet placed successfully!",
  RESOLVE_PREDICTION: "Prediction resolved successfully!",
  CLAIM_WINNINGS: "Winnings claimed successfully!",
  CONNECT_WALLET: "Wallet connected successfully!",
  DATA_REFRESHED: "Data refreshed successfully!"
};

/**
 * Interface for error handling options
 */
interface ErrorOptions {
  message?: string;
  category?: ErrorCategory;
  silent?: boolean;
  recoveryAction?: () => Promise<void>;
  recoveryMessage?: string;
}

/**
 * Categorize an error based on its message or type
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!error) return ErrorCategory.UNKNOWN;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  if (errorMessage.includes("network") || 
      errorMessage.includes("fetch") || 
      errorMessage.includes("timeout") ||
      errorMessage.includes("connection")) {
    return ErrorCategory.NETWORK;
  }
  
  if (errorMessage.includes("user rejected") || 
      errorMessage.includes("user denied") || 
      errorMessage.includes("cancelled")) {
    return ErrorCategory.USER_REJECTED;
  }
  
  if (errorMessage.includes("permission") || 
      errorMessage.includes("not creator") || 
      errorMessage.includes("not owner") ||
      errorMessage.includes("unauthorized")) {
    return ErrorCategory.PERMISSION;
  }
  
  if (errorMessage.includes("invalid") || 
      errorMessage.includes("validation") || 
      errorMessage.includes("required")) {
    return ErrorCategory.VALIDATION;
  }
  
  if (errorMessage.includes("contract") || 
      errorMessage.includes("execution") || 
      errorMessage.includes("transaction") ||
      errorMessage.includes("gas") ||
      errorMessage.includes("nonce")) {
    return ErrorCategory.CONTRACT;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Get a user-friendly error message based on the error category
 */
export function getErrorMessageByCategory(
  category: ErrorCategory, 
  defaultMessage: string
): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return ErrorMessages.NETWORK_ERROR;
    case ErrorCategory.USER_REJECTED:
      return ErrorMessages.USER_REJECTED;
    case ErrorCategory.PERMISSION:
      return ErrorMessages.PERMISSION_DENIED;
    case ErrorCategory.VALIDATION:
      return ErrorMessages.VALIDATION_ERROR;
    default:
      return defaultMessage;
  }
}

/**
 * Handle errors in a consistent way with options
 */
export function handleError(
  error: unknown, 
  options: ErrorOptions = {}
): void {
  const { 
    message = ErrorMessages.GENERIC,
    category: providedCategory,
    silent = false,
    recoveryAction,
    recoveryMessage = "Retry"
  } = options;
  
  // Determine error category if not provided
  const category = providedCategory || categorizeError(error);
  
  // Get appropriate error message based on category
  const errorMessage = getErrorMessageByCategory(category, message);
  
  // Log the error to console with category
  console.error(`[${category.toUpperCase()}] ${errorMessage}`, error);
  
  // Show toast notification if not silent
  if (!silent) {
    if (recoveryAction) {
      // Show toast with recovery action
      toast.error(errorMessage, {
        action: {
          label: recoveryMessage,
          onClick: () => {
            toast.promise(recoveryAction(), {
              loading: "Retrying...",
              success: "Retry successful",
              error: "Retry failed"
            });
          }
        }
      });
    } else {
      // Show regular error toast
      toast.error(errorMessage);
    }
  }
}

/**
 * Handle contract errors with more specific messages
 */
export function handleContractError(
  error: unknown,
  fallbackMessage = ErrorMessages.GENERIC,
  recoveryAction?: () => Promise<void>
): void {
  // Try to extract a more specific error message
  let errorMessage = fallbackMessage;
  
  if (error instanceof Error) {
    // Check for common error patterns in the message
    const msg = error.message.toLowerCase();
    
    if (msg.includes("user rejected")) {
      errorMessage = "Transaction was rejected by the user";
    } else if (msg.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for this transaction";
    } else if (msg.includes("gas")) {
      errorMessage = "Gas estimation failed. The transaction might fail";
    } else if (msg.includes("nonce")) {
      errorMessage = "Transaction nonce error. Please try again";
    } else if (msg.includes("already resolved")) {
      errorMessage = "This prediction has already been resolved";
    } else if (msg.includes("not creator")) {
      errorMessage = "Only the creator can resolve this prediction";
    } else if (msg.includes("already claimed")) {
      errorMessage = "You have already claimed your winnings";
    }
  }
  
  // Log and show toast
  console.error(`[CONTRACT] ${fallbackMessage}`, error);
  
  if (recoveryAction) {
    // Show toast with recovery action
    toast.error(errorMessage, {
      action: {
        label: "Retry",
        onClick: () => {
          toast.promise(recoveryAction(), {
            loading: "Retrying...",
            success: "Retry successful",
            error: "Retry failed"
          });
        }
      }
    });
  } else {
    // Show regular error toast
    toast.error(errorMessage);
  }
}

/**
 * Show a success message
 */
export function showSuccess(message: string): void {
  toast.success(message);
}

/**
 * Show a loading toast that will be updated with success or error
 */
export function showLoadingToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> {
  return toast.promise(promise, messages);
} 