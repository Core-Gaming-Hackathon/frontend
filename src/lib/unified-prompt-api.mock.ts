/**
 * Mock implementation of the Unified Prompt API
 * 
 * This provides mock responses for testing when the actual API is unavailable.
 */
import { AIMessage } from "@/shared/schemas/chat/types";

// Interface for prompt request parameters (same as the real API)
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
 * The Mock Unified Prompt API service
 */
export class MockUnifiedPromptApi {
  private static apiUrl: string = "http://mock-api.local";
  private static mockEnabled: boolean = false;

  /**
   * Enable mock mode
   */
  public static enableMock(enabled: boolean = true): void {
    this.mockEnabled = enabled;
    console.log(`Mock API ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if mock mode is enabled
   */
  public static isMockEnabled(): boolean {
    return this.mockEnabled;
  }

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
    console.log('Mock API: sendPrompt called with:', params);
    
    // Return a mock response based on the game type
    switch (params.gameType.toLowerCase()) {
      case 'battle':
        return "I am the system's security AI. What are you trying to do?";
      case 'love':
        return "Hi there! I'm interested in getting to know you better.";
      case 'mystery':
        return "Welcome detective. We have a mysterious case that needs your expertise.";
      case 'raid':
        return "The dungeon lies before you, dark and foreboding. What's your first move?";
      default:
        return "Mock AI response for testing purposes.";
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
    console.log('Mock API: initGameSession called with:', { gameType, difficultyLevel, personalityId });
    
    // Generate a mock session ID
    const sessionId = `mock-session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Return a mock response based on the game type
    let initialMessage = "Welcome to the game!";
    
    switch (gameType.toLowerCase()) {
      case 'battle':
        initialMessage = "Welcome to Battle Mode! Try to hack into the system.";
        break;
      case 'love':
        initialMessage = "Welcome to Love Mode! Let's see if you can win my heart.";
        break;
      case 'mystery':
        initialMessage = "Welcome to Mystery Mode! Can you solve the case?";
        break;
      case 'raid':
        initialMessage = "Welcome to Raid Mode! The dungeon awaits.";
        break;
    }
    
    return {
      sessionId,
      initialMessage
    };
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
    console.log('Mock API: sendGameMessage called with:', { sessionId, message });
    
    // Check for success keywords in the message
    const successKeywords = ['hack', 'password', 'override', 'admin', 'root', 'success'];
    const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    // Return a mock response
    return {
      response: isSuccess 
        ? "Success! You've completed the challenge."
        : "Not quite there yet. Keep trying!",
      success: isSuccess
    };
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
    console.log('Mock API: createRaid called with:', { difficultyLevel, personalityId, timeLimit, maxAttempts });
    
    // Generate a mock raid ID
    const raidId = `mock-raid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return {
      raidId,
      initialMessage: "Welcome to the raid! The dungeon is dark and full of treasures."
    };
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
    console.log('Mock API: attemptRaid called with:', { raidId, message });
    
    // Check for success keywords in the message
    const successKeywords = ['treasure', 'gold', 'defeat', 'slay', 'win', 'victory'];
    const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    // Return a mock response
    return {
      response: isSuccess 
        ? "You've found the treasure! The raid is successful."
        : "You continue exploring the dungeon...",
      success: isSuccess,
      attemptsRemaining: isSuccess ? 0 : 3
    };
  }

  /**
   * Evaluate a battle attempt
   */
  public static async evaluateBattleAttempt(
    sessionId: string,
    messages: AIMessage[]
  ): Promise<{
    score: number;
    feedback: string;
  }> {
    console.log('Mock API: evaluateBattleAttempt called with:', { sessionId, messages });
    
    // Calculate a mock score based on the number of messages
    const baseScore = 100;
    const messageBonus = messages.length * 25;
    const randomBonus = Math.floor(Math.random() * 100);
    const totalScore = baseScore + messageBonus + randomBonus;
    
    return {
      score: totalScore,
      feedback: `Great job! You scored ${totalScore} points.`
    };
  }
}