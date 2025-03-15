/**
 * Unified Prompt API
 * 
 * A unified API for sending prompts to the AI backend service.
 * This provides a consistent interface for all game modes and AI interactions.
 */
import { AIMessage } from "@/shared/schemas/chat/types";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

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
  private static useMock: boolean = false;
  private static isTesting: boolean = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  private static hasShownMockWarning: Record<string, boolean> = {};

  /**
   * Enable mock mode for testing
   */
  public static enableMock(enable: boolean = true): void {
    this.useMock = enable;
    console.log(`Mock mode ${enable ? 'enabled' : 'disabled'}`);
    
    // Show toast notification when mock mode is explicitly enabled
    if (enable && typeof window !== 'undefined') {
      toast.info("Mock mode enabled - Using simulated AI responses", {
        id: "mock-mode-enabled",
        duration: 5000,
        icon: <AlertCircle className="h-4 w-4" />
      });
    }
  }

  /**
   * Check if mock mode is enabled
   */
  public static isMockEnabled(): boolean {
    return this.useMock || this.isTesting;
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
   * Show a notification that mock data is being used
   */
  private static notifyMockDataUsed(source: string): void {
    // Only show each warning once per session
    if (this.hasShownMockWarning[source]) return;
    
    // Mark this warning as shown
    this.hasShownMockWarning[source] = true;
    
    // Show toast notification if in browser environment
    if (typeof window !== 'undefined') {
      toast.warning(`Using mock data for ${source}`, {
        id: `mock-data-${source}`,
        duration: 5000,
        icon: <AlertCircle className="h-4 w-4" />,
        description: "Could not connect to the AI service. Using simulated responses instead."
      });
    }
    
    // Log to console
    console.warn(`Using mock data for ${source} due to API connection failure`);
  }

  /**
   * Send a prompt to the AI service
   */
  public static async sendPrompt(params: PromptRequest): Promise<string> {
    try {
      // If in mock mode or testing, return mock response
      if (this.isMockEnabled()) {
        console.log('Using mock response for sendPrompt');
        return this.getMockPromptResponse(params);
      }

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
      
      // If API call fails, fall back to mock response
      if (!this.isMockEnabled()) {
        this.notifyMockDataUsed('AI Prompt Service');
        return this.getMockPromptResponse(params);
      }
      
      throw new Error(`Failed to send prompt: ${error}`);
    }
  }

  /**
   * Get a mock response for testing
   */
  private static getMockPromptResponse(params: PromptRequest): string {
    console.log('Generating mock response for:', params.gameType);
    
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
        return "Mock AI response";
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
      // If in mock mode or testing, return mock response
      if (this.isMockEnabled()) {
        console.log('Using mock response for initGameSession');
        return this.getMockGameSession(gameType, difficultyLevel);
      }

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
      
      // If API call fails, fall back to mock response
      if (!this.isMockEnabled()) {
        this.notifyMockDataUsed('Game Session Initialization');
        return this.getMockGameSession(gameType, difficultyLevel);
      }
      
      throw new Error(`Failed to initialize game: ${error}`);
    }
  }

  /**
   * Get a mock game session for testing
   */
  private static getMockGameSession(
    gameType: string,
    difficultyLevel: string
  ): {
    sessionId: string;
    initialMessage: string;
  } {
    // Generate a mock session ID
    const sessionId = `mock-session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Return a mock response based on the game type
    let initialMessage = "Welcome to the game!";
    
    switch (gameType.toLowerCase()) {
      case 'battle':
        initialMessage = `Welcome to Battle Mode (${difficultyLevel})! Try to hack into the system.`;
        break;
      case 'love':
        initialMessage = `Welcome to Love Mode (${difficultyLevel})! Let's see if you can win my heart.`;
        break;
      case 'mystery':
        initialMessage = `Welcome to Mystery Mode (${difficultyLevel})! Can you solve the case?`;
        break;
      case 'raid':
        initialMessage = `Welcome to Raid Mode (${difficultyLevel})! The dungeon awaits.`;
        break;
    }
    
    return {
      sessionId,
      initialMessage
    };
  }

  /**
   * Send a message to an active game session
   */
  public static async sendGameMessage(
    sessionId: string,
    message: string
  ): Promise<{
    response: string;
    success: boolean;
  }> {
    try {
      // If in mock mode or testing, return mock response
      if (this.isMockEnabled()) {
        console.log('Using mock response for sendGameMessage');
        return this.getMockGameMessage(message);
      }

      // Prepare the request body
      const requestBody = {
        session_id: sessionId,
        message: message
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
        response: data.response || '',
        success: data.success || false
      };
    } catch (error) {
      console.error('Error sending game message:', error);
      
      // If API call fails, fall back to mock response
      if (!this.isMockEnabled()) {
        this.notifyMockDataUsed('Game Message Service');
        return this.getMockGameMessage(message);
      }
      
      throw new Error(`Failed to send game message: ${error}`);
    }
  }

  /**
   * Get a mock game message response for testing
   */
  private static getMockGameMessage(message: string): {
    response: string;
    success: boolean;
  } {
    // Check for success keywords
    const isSuccess = ['hack', 'password', 'override', 'admin', 'root', 'system', 'love', 'heart', 'solve', 'clue', 'treasure', 'gold']
      .some(keyword => message.toLowerCase().includes(keyword));
    
    return {
      response: isSuccess 
        ? "You've succeeded! Congratulations on completing the challenge."
        : "Keep trying! You're on the right track.",
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
    try {
      // If in mock mode or testing, return mock response
      if (this.isMockEnabled()) {
        console.log('Using mock response for createRaid');
        return this.getMockRaid(difficultyLevel);
      }

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
      
      // If API call fails, fall back to mock response
      if (!this.isMockEnabled()) {
        this.notifyMockDataUsed('Raid Game Creation');
        return this.getMockRaid(difficultyLevel);
      }
      
      throw new Error(`Failed to create raid: ${error}`);
    }
  }

  /**
   * Get a mock raid for testing
   */
  private static getMockRaid(difficultyLevel: string): {
    raidId: string;
    initialMessage: string;
  } {
    // Generate a mock raid ID
    const raidId = `mock-raid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return {
      raidId,
      initialMessage: `Welcome to the raid (${difficultyLevel})! The dungeon is dark and full of treasures.`
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
    try {
      // If in mock mode or testing, return mock response
      if (this.isMockEnabled()) {
        console.log('Using mock response for attemptRaid');
        return this.getMockRaidAttempt(message);
      }

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
      
      // Return the response
      return {
        response: data.response,
        success: data.success || false,
        attemptsRemaining: data.attempts_remaining
      };
    } catch (error) {
      console.error('Error attempting raid:', error);
      
      // If API call fails, fall back to mock response
      if (!this.isMockEnabled()) {
        this.notifyMockDataUsed('Raid Attempt');
        return this.getMockRaidAttempt(message);
      }
      
      throw new Error(`Failed to attempt raid: ${error}`);
    }
  }

  /**
   * Get a mock raid attempt response for testing
   */
  private static getMockRaidAttempt(message: string): {
    response: string;
    success: boolean;
    attemptsRemaining?: number;
  } {
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
    try {
      // If in mock mode or testing, return mock response
      if (this.isMockEnabled()) {
        console.log('Using mock response for evaluateBattleAttempt');
        return this.getMockBattleEvaluation(messages);
      }

      // Prepare the request body
      const requestBody = {
        session_id: sessionId,
        messages
      };

      // Make the API call
      const response = await fetch(`${this.apiUrl}/api/game/battle/evaluate`, {
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
      
      // Return the evaluation
      return {
        score: data.score || 0,
        feedback: data.feedback || "No feedback available"
      };
    } catch (error) {
      console.error('Error evaluating battle attempt:', error);
      
      // If API call fails, fall back to mock response
      if (!this.isMockEnabled()) {
        this.notifyMockDataUsed('Battle Evaluation');
        return this.getMockBattleEvaluation(messages);
      }
      
      throw new Error(`Failed to evaluate battle attempt: ${error}`);
    }
  }

  /**
   * Get a mock battle evaluation for testing
   */
  private static getMockBattleEvaluation(messages: AIMessage[]): {
    score: number;
    feedback: string;
  } {
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

export default UnifiedPromptApi;