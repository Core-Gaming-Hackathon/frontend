/**
 * Environment configuration for Baultro
 * 
 * Configuration for connecting to external services
 */

/**
 * Get the API URL for ZerePy
 * @returns The ZerePy API URL or default localhost:8000
 */
export function getZerePyApiUrl(): string {
  // Use environment variable if defined, otherwise use default localhost URL
  return process.env.NEXT_PUBLIC_ZEREPY_API_URL || 'http://localhost:8000';
}

/**
 * Get the API key for Gemini
 * @returns The Gemini API key or empty string
 */
export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

/**
 * Get the model name for Gemini
 * @returns The Gemini model name
 */
export function getGeminiModel(): string {
  return 'gemini-2.0-flash';
}

/**
 * Check if Gemini API is configured
 * @returns true if Gemini API key is configured, false otherwise
 */
export function isGeminiConfigured(): boolean {
  const apiKey = getGeminiApiKey();
  return !!apiKey && apiKey !== 'your_gemini_api_key_here';
}

/**
 * Check if ZerePy API is configured
 * @returns true if ZerePy API URL is configured, false otherwise
 */
export function isZerePyConfigured(): boolean {
  const apiUrl = getZerePyApiUrl();
  return !!apiUrl;
}

/**
 * Get the default AI provider for the application
 * @returns The default AI provider (gemini or zerepy)
 */
export function getDefaultAIProvider(): string {
  return 'gemini';
}

/**
 * Check if we're in development mode
 */
export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}