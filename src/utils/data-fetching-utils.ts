/**
 * Data Fetching Utilities
 * 
 * Provides utilities for data fetching, caching, and management.
 */

import { handleError, ErrorCategory } from "./error-utils";

// Add DATA_FETCHING to ErrorCategory if it doesn't exist
const DATA_FETCHING = ErrorCategory.NETWORK; // Use NETWORK as a fallback

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Global cache object
const cache: Record<string, CacheEntry<unknown>> = {};

// Default cache TTL in milliseconds (5 minutes)
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * Get data from cache
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 * @returns Cached data or null if not found or expired
 */
export function getCachedData<T>(key: string, ttl = DEFAULT_CACHE_TTL): T | null {
  const entry = cache[key];
  if (!entry) return null;
  
  // Check if cache entry is still valid
  if (Date.now() - entry.timestamp > ttl) {
    delete cache[key];
    return null;
  }
  
  return entry.data as T;
}

/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 */
export function setCachedData<T>(key: string, data: T): void {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
}

/**
 * Clear a specific cache entry
 * @param key Cache key
 */
export function clearCacheEntry(key: string): void {
  delete cache[key];
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
}

/**
 * Check if a cache entry exists and is valid
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 * @returns True if cache entry exists and is valid
 */
export function hasCachedData(key: string, ttl = DEFAULT_CACHE_TTL): boolean {
  const entry = cache[key];
  if (!entry) return false;
  
  return Date.now() - entry.timestamp <= ttl;
}

/**
 * Get cache entry timestamp
 * @param key Cache key
 * @returns Timestamp of cache entry or null if not found
 */
export function getCacheTimestamp(key: string): number | null {
  const entry = cache[key];
  if (!entry) return null;
  
  return entry.timestamp;
}

/**
 * Get time remaining until cache expiration
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 * @returns Time remaining in milliseconds or 0 if expired or not found
 */
export function getCacheTimeRemaining(key: string, ttl = DEFAULT_CACHE_TTL): number {
  const entry = cache[key];
  if (!entry) return 0;
  
  const timeElapsed = Date.now() - entry.timestamp;
  const timeRemaining = ttl - timeElapsed;
  
  return timeRemaining > 0 ? timeRemaining : 0;
}

// Default cache options
const DEFAULT_CACHE_OPTIONS = {
  enabled: true,
  ttl: 60000, // 1 minute
  staleWhileRevalidate: true
};

// Options for fetching data
interface FetchOptions<T> {
  /**
   * Whether to enable caching
   * @default true
   */
  cacheEnabled?: boolean;
  
  /**
   * Time to live for cache entry in milliseconds
   * @default 60000 (1 minute)
   */
  cacheTtl?: number;
  
  /**
   * Whether to return stale data while revalidating
   * @default true
   */
  staleWhileRevalidate?: boolean;
  
  /**
   * Cache key to use for storing data
   * If not provided, a key will be generated based on the fetch function
   */
  cacheKey?: string;
  
  /**
   * Number of retry attempts
   * @default 3
   */
  retryCount?: number;
  
  /**
   * Delay between retry attempts in milliseconds
   * @default 1000
   */
  retryDelay?: number;
  
  /**
   * Whether to use exponential backoff for retries
   * @default true
   */
  exponentialBackoff?: boolean;
  
  /**
   * Function to determine if an error is retryable
   * @default All errors except user rejected and permission errors are retryable
   */
  isRetryable?: (error: unknown) => boolean;
  
  /**
   * Fallback data to return if fetch fails
   */
  fallbackData?: T;
  
  /**
   * Whether to throw an error if fetch fails
   * @default false
   */
  throwOnError?: boolean;
  
  /**
   * Whether to show error toast if fetch fails
   * @default true
   */
  showErrorToast?: boolean;
  
  /**
   * Custom error message to show if fetch fails
   */
  errorMessage?: string;
  
  /**
   * Function to transform the fetched data
   */
  transform?: (data: unknown) => Awaited<T>;
}

/**
 * Fetch data with caching, error handling, and retry mechanisms
 */
export async function fetchWithCache<T>(
  fetchFn: () => Promise<T>,
  options: FetchOptions<T> = {}
): Promise<T> {
  const {
    cacheEnabled = DEFAULT_CACHE_OPTIONS.enabled,
    cacheTtl = DEFAULT_CACHE_OPTIONS.ttl,
    staleWhileRevalidate = DEFAULT_CACHE_OPTIONS.staleWhileRevalidate,
    cacheKey = fetchFn.toString(),
    retryCount = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    isRetryable = defaultIsRetryable,
    fallbackData,
    throwOnError = false,
    showErrorToast = true,
    errorMessage,
    transform
  } = options;
  
  // Check cache if enabled
  if (cacheEnabled) {
    const cacheEntry = cache[cacheKey] as CacheEntry<T> | undefined;
    const now = Date.now();
    
    if (cacheEntry) {
      // If cache is still valid, return cached data
      if (now < cacheEntry.timestamp) {
        return cacheEntry.data;
      }
      
      // If stale while revalidate is enabled, return stale data and revalidate in background
      if (staleWhileRevalidate) {
        // Revalidate in background
        revalidateCache(fetchFn, cacheKey, cacheTtl, transform as (data: unknown) => Awaited<T>).catch(console.error);
        
        // Return stale data
        return cacheEntry.data;
      }
    }
  }
  
  // Fetch data with retry
  try {
    let data = await fetchWithRetry(fetchFn, {
      retryCount,
      retryDelay,
      exponentialBackoff,
      isRetryable,
      fallbackData,
      throwOnError: false, // We'll handle errors ourselves
      showErrorToast: false // We'll handle errors ourselves
    });
    
    // Transform data if transform function is provided
    if (transform) {
      data = transform(data) as Awaited<T>;
    }
    
    // Cache data if caching is enabled
    if (cacheEnabled) {
      const now = Date.now();
      cache[cacheKey] = {
        data,
        timestamp: now
      };
    }
    
    return data;
  } catch (error) {
    // Handle error
    if (showErrorToast) {
      handleError(error, {
        message: errorMessage,
        category: DATA_FETCHING
      });
    }
    
    // Throw error if throwOnError is true
    if (throwOnError) {
      throw error;
    }
    
    // Return fallback data if provided
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    
    // Rethrow error if no fallback data
    throw error;
  }
}

/**
 * Revalidate cache entry
 */
async function revalidateCache<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  cacheTtl: number,
  transform?: (data: unknown) => Awaited<T>
): Promise<void> {
  try {
    let data = await fetchFn();
    
    // Transform data if transform function is provided
    if (transform) {
      data = transform(data) as Awaited<T>;
    }
    
    // Update cache
    const now = Date.now();
    cache[cacheKey] = {
      data,
      timestamp: now
    };
  } catch (error) {
    // Log error but don't throw
    console.error("Failed to revalidate cache:", error);
  }
}

/**
 * Fetch data with retry mechanism
 */
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: {
    retryCount: number;
    retryDelay: number;
    exponentialBackoff: boolean;
    isRetryable: (error: unknown) => boolean;
    fallbackData?: T;
    throwOnError?: boolean;
    showErrorToast?: boolean;
    errorMessage?: string;
    transform?: (data: unknown) => Awaited<T>;
    onSuccess?: (data: T) => void;
  }
): Promise<T> {
  const {
    retryCount,
    retryDelay,
    exponentialBackoff,
    isRetryable,
    fallbackData,
    throwOnError = false,
    showErrorToast = true,
    errorMessage,
    transform,
    onSuccess
  } = options;
  
  let lastError: unknown;
  
  // Try to fetch data with retries
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      let data = await fetchFn();
      
      // Transform data if transform function is provided
      if (transform) {
        data = transform(data) as Awaited<T>;
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
      
      return data;
    } catch (error) {
      lastError = error;
      
      // If this is the last attempt, don't delay
      if (attempt === retryCount) {
        break;
      }
      
      // Check if error is retryable
      if (!isRetryable(error)) {
        break;
      }
      
      // Calculate delay for next attempt
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Handle error after all retries
  if (showErrorToast) {
    handleError(lastError, {
      message: errorMessage,
      category: DATA_FETCHING
    });
  }
  
  // Throw error if throwOnError is true
  if (throwOnError) {
    throw lastError;
  }
  
  // Return fallback data if provided
  if (fallbackData !== undefined) {
    return fallbackData;
  }
  
  // Rethrow error if no fallback data
  throw lastError;
}

/**
 * Default function to determine if an error is retryable
 */
function defaultIsRetryable(error: unknown): boolean {
  // Don't retry user rejected errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("user rejected") ||
      message.includes("user denied") ||
      message.includes("permission") ||
      message.includes("not allowed")
    ) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get all cache entries (without the actual data)
 */
export function getCacheEntries(): Record<string, { timestamp: number }> {
  const entries: Record<string, { timestamp: number }> = {};
  
  Object.entries(cache).forEach(([key, entry]) => {
    entries[key] = {
      timestamp: entry.timestamp
    };
  });
  
  return entries;
}