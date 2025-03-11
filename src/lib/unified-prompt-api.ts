/**
 * Unified Prompt API
 * 
 * A unified API for sending prompts to the AI backend service.
 * This provides a consistent interface for all game modes and AI interactions.
 */
import { AIMessage } from "@/shared/schemas/chat/types";

// Import environment configuration
import { getZerePyApiUrl } from "@/lib/env";

// Default API endpoint for ZerePy
const DEFAULT_API_URL = getZerePyApiUrl();

// Interface for prompt request parameters
interface PromptRequest {
  prompt: string;
  systemPrompt: string;
  chatHistory: AIMessage[];
  gameType: string;
  personality?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * The Unified Prompt API service
 */
export class UnifiedPromptApi {
  private static apiUrl: string = DEFAULT_API_URL;

  /**
   * Set the API URL
   */
  public static setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  /**
   * Get the current API URL
   */
  public static getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Send a prompt to the AI service
   */
  public static async sendPrompt(params: PromptRequest): Promise<string> {
    try {
      const { 
        prompt, 
        systemPrompt, 
        chatHistory, 
        gameType,
        personality,
        maxTokens = 1000,
        temperature = 0.7
      } = params;

      // Prepare the request body for ZerePy API with Together AI integration
      const requestBody = {
        prompt: prompt,
        system_prompt: systemPrompt,
        temperature: temperature,
        max_tokens: maxTokens,
        // Include additional context from other parameters
        context: {
          chat_history: chatHistory,
          game_type: gameType,
          personality: personality || 'default'
        }
      };

      console.log('Sending API request to:', `${this.apiUrl}/game/prompt`);
      
      // Make the API call
      const response = await fetch(`${this.apiUrl}/game/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error ${response.status}`);
      }

      // Parse the response
      const data = await response.json();
      
      // Return the AI's response
      return data.text || '';
    } catch (error) {
      console.error('Error sending prompt:', error);
      throw new Error(`Failed to send prompt: ${error}`);
    }
  }

  /**
   * Initialize a game session
   */
  public static async initGameSession(
    gameType: string,
    difficultyLevel: string,
    personalityId?: string
  ): Promise<{
    sessionId: string;
    initialMessage: string;
  }> {
    try {
      // Prepare the request body
      const requestBody = {
        game_type: gameType.toLowerCase(),
        difficulty: difficultyLevel.toLowerCase(),
        personality_id: personalityId
      };

      // Make the API call
      const response = await fetch(`${this.apiUrl}/api/game/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error ${response.status}`);
      }

      // Parse the response
      const data = await response.json();
      
      // Return the session info
      return {
        sessionId: data.session_id,
        initialMessage: data.initial_message
      };
    } catch (error) {
      console.error('Error initializing game session:', error);
      throw new Error(`Failed to initialize game: ${error}`);
    }
  }

  /**
   * Send a message in a game session
   */
  public static async sendGameMessage(
    sessionId: string,
    message: string
  ): Promise<{
    response: string;
    success: boolean;
  }> {
    try {
      // Prepare the request body
      const requestBody = {
        session_id: sessionId,
        message
      };

      // Make the API call
      const response = await fetch(`${this.apiUrl}/api/game/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error ${response.status}`);
      }

      // Parse the response
      const data = await response.json();
      
      // Return the response
      return {
        response: data.response,
        success: data.success || false
      };
    } catch (error) {
      console.error('Error sending game message:', error);
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  /**
   * Create a new raid game
   */
  public static async createRaid(
    difficultyLevel: string,
    personalityId?: string,
    timeLimit?: number,
    maxAttempts?: number
  ): Promise<{
    raidId: string;
    initialMessage: string;
  }> {
    try {
      // Prepare the request body
      const requestBody = {
        difficulty: difficultyLevel.toLowerCase(),
        personality_id: personalityId,
        time_limit: timeLimit,
        max_attempts: maxAttempts
      };

      // Make the API call
      const response = await fetch(`${this.apiUrl}/api/game/raid/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error ${response.status}`);
      }

      // Parse the response
      const data = await response.json();
      
      // Return the raid info
      return {
        raidId: data.raid_id,
        initialMessage: data.initial_message
      };
    } catch (error) {
      console.error('Error creating raid:', error);
      throw new Error(`Failed to create raid: ${error}`);
    }
  }

  /**
   * Attempt a raid
   */
  public static async attemptRaid(
    raidId: string,
    message: string
  ): Promise<{
    response: string;
    success: boolean;
    attemptsRemaining?: number;
  }> {
    try {
      // Prepare the request body
      const requestBody = {
        raid_id: raidId,
        message
      };

      // Make the API call
      const response = await fetch(`${this.apiUrl}/api/game/raid/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error ${response.status}`);
      }

      // Parse the response
      const data = await response.json();
      
      // Return the attempt result
      return {
        response: data.response,
        success: data.success || false,
        attemptsRemaining: data.attempts_remaining
      };
    } catch (error) {
      console.error('Error attempting raid:', error);
      throw new Error(`Failed to attempt raid: ${error}`);
    }
  }
}

export default UnifiedPromptApi;