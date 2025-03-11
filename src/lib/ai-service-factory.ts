/**
 * AI Service Factory
 * 
 * This factory provides a centralized way to create and access
 * various AI service implementations.
 */
import { ZerePyGameService } from './zerepy-game-service';
import { GeminiGameService } from './gemini-game-service';
import { getDefaultAIProvider } from './env';

/**
 * Enum defining the available AI provider types
 */
export enum AIProviderType {
  ZEREPY = "zerepy",
  GEMINI = "gemini",
  CUSTOM = "custom"
}

/**
 * Interface for AI Game Service
 */
export interface AIGameService {
  initGameChat(
    gameType: string,
    personalityId?: string,
    difficulty?: string,
    secretPhrase?: string
  ): Promise<{
    chatHistory: Array<{role: string, content: string}>;
    sessionId?: string;
  }>;
  
  sendMessage(
    message: string,
    gameType: string,
    chatHistory: Array<{role: string, content: string}>,
    personalityId?: string,
    difficulty?: string,
    secretPhrase?: string
  ): Promise<{
    response: string;
    chatHistory: Array<{role: string, content: string}>;
    successFlag: boolean;
  }>;
}

/**
 * Interface for AI Chat Provider
 */
export interface AIChatProvider {
  sendPrompt(prompt: string, systemPrompt: string): Promise<string>;
  getPersonality(personalityId: string): Promise<Record<string, unknown>>;
}

/**
 * The AI Service Factory - provides access to different AI service implementations
 */
export class AIServiceFactory {
  /**
   * Create a game service instance for the specified AI provider
   */
  public static createGameService(providerType: AIProviderType): AIGameService {
    switch (providerType) {
      case AIProviderType.ZEREPY:
        return new ZerePyGameService();
      
      case AIProviderType.GEMINI:
        return new GeminiGameService();
      
      case AIProviderType.CUSTOM:
        // In a full implementation, you would return a custom service
        console.warn("Custom service not implemented, falling back to Gemini");
        return new GeminiGameService();
      
      default:
        console.warn(`Unknown provider type: ${providerType}, falling back to Gemini`);
        return new GeminiGameService();
    }
  }
  
  /**
   * Get the default game service based on configuration
   */
  public static getDefaultGameService(): AIGameService {
    const defaultProvider = getDefaultAIProvider();
    
    if (defaultProvider === 'gemini') {
      return this.createGameService(AIProviderType.GEMINI);
    } else if (defaultProvider === 'zerepy') {
      return this.createGameService(AIProviderType.ZEREPY);
    } else {
      // Default to Gemini if not specified
      return this.createGameService(AIProviderType.GEMINI);
    }
  }
}

export default AIServiceFactory;