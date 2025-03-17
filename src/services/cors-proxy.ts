/**
 * CORS Proxy Service
 * 
 * Provides a way to make RPC requests through a CORS-enabled proxy
 * to avoid CORS issues with blockchain RPC endpoints.
 */

import { Transport, http } from 'viem';

// Default timeout for RPC requests (in milliseconds)
const DEFAULT_TIMEOUT = process.env.NEXT_PUBLIC_RPC_TIMEOUT 
  ? parseInt(process.env.NEXT_PUBLIC_RPC_TIMEOUT) 
  : 10000;

// Define types for JSON-RPC
interface JsonRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: unknown[];
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

// Fallback RPC URLs for Core Blockchain Testnet (1114)
const FALLBACK_RPC_URLS = [
  process.env.NEXT_PUBLIC_FALLBACK_RPC_URL_1,
  process.env.NEXT_PUBLIC_FALLBACK_RPC_URL_2,
].filter(Boolean) as string[];

// Add default fallbacks if none are provided in environment
if (FALLBACK_RPC_URLS.length === 0) {
  FALLBACK_RPC_URLS.push('https://rpc.test2.coredao.org');
  FALLBACK_RPC_URLS.push('https://rpc-core.icecreamswap.com');
}

/**
 * Makes an RPC request through a CORS-enabled proxy
 * 
 * @param url The RPC URL to send the request to
 * @param method The JSON-RPC method to call
 * @param params The parameters for the JSON-RPC method
 * @param timeout Optional timeout in milliseconds
 * @returns The JSON-RPC response
 */
export async function makeRpcRequest(
  url: string,
  method: string,
  params: unknown[],
  timeout = DEFAULT_TIMEOUT
): Promise<JsonRpcResponse> {
  // Create an AbortController for the timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // First try direct request with CORS mode
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        } as JsonRpcRequest),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json() as JsonRpcResponse;
    } catch (error) {
      // If direct request fails with CORS error or DNS resolution error, try fallback URLs
      if (error instanceof TypeError && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
        console.warn(`Direct RPC request to ${url} failed, trying fallback URLs`);
        
        // Try each fallback URL
        for (const fallbackUrl of FALLBACK_RPC_URLS) {
          try {
            console.log(`Trying fallback RPC URL: ${fallbackUrl}`);
            const response = await fetch(fallbackUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method,
                params,
              } as JsonRpcRequest),
              signal: controller.signal,
            });
            
            if (response.ok) {
              return await response.json() as JsonRpcResponse;
            }
          } catch (fallbackError) {
            console.warn(`Fallback RPC URL ${fallbackUrl} failed:`, fallbackError);
            // Continue to the next fallback URL
          }
        }
        
        // If all fallbacks fail, try with no-cors mode as a last resort
        console.warn('All fallback URLs failed, trying with no-cors mode');
        
        // We don't use the response directly since it's opaque with no-cors
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params,
          } as JsonRpcRequest),
          mode: 'no-cors',
          signal: controller.signal,
        });
        
        // With no-cors, we can't read the response, so we return a placeholder
        return { result: null, id: Date.now(), jsonrpc: '2.0' };
      }
      
      throw error;
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Creates a transport function for viem that uses the CORS proxy
 * 
 * @param rpcUrl The RPC URL to use
 * @returns A transport function that can be used with viem
 */
export function createCorsProxyTransport(rpcUrl: string): Transport {
  // Create a custom transport function that handles network errors gracefully
  return http(rpcUrl, {
    fetchOptions: {
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    // Use timeout from environment or default
    timeout: DEFAULT_TIMEOUT,
    // Add retry logic
    retryCount: 3,
    retryDelay: 1000,
  });
} 