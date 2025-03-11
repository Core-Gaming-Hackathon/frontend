/**
 * ZerePy Game Service
 * 
 * This service handles communication with the ZerePy API for game-related
 * AI interactions across all game modes.
 */
import { AIMessage } from "@/shared/schemas/chat/types";
import { DifficultyLevel } from "@/shared/schemas/game/types";
import { UnifiedPromptApi } from "@/lib/unified-prompt-api";
import { systemPrompts } from "@/lib/ai/game-system-prompts";

// Import environment configuration
import { getZerePyApiUrl } from "@/lib/env";

// Get API endpoint from environment
const DEFAULT_API_ENDPOINT = getZerePyApiUrl();

/**
 * ZerePy Game Service - Handles interactions with the ZerePy AI system
 */
export class ZerePyGameService {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = DEFAULT_API_ENDPOINT) {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Initialize a game chat session
   */
  async initGameChat(
    gameType: string,
    personalityId?: string,
    difficulty: string = "medium",
    secretPhrase?: string
  ): Promise<{
    chatHistory: AIMessage[];
    sessionId?: string;
  }> {
    try {
      // Determine the system prompt based on game type
      const systemPrompt = this.getSystemPrompt(gameType, difficulty, secretPhrase);
      
      // Create initial AI message based on game type
      const initialMessage = this.getInitialMessage(gameType);
      
      // Build chat history with proper type assertion
      const chatHistory: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: initialMessage }
      ];
      
      return { 
        chatHistory,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      };
    } catch (error) {
      console.error("Error initializing game chat:", error);
      throw new Error(`Failed to initialize ${gameType} game: ${error}`);
    }
  }

  /**
   * Send a message to the AI in a game context
   */
  async sendMessage(
    message: string,
    gameType: string,
    chatHistory: AIMessage[],
    personalityId?: string,
    difficulty: string = "medium",
    secretPhrase?: string
  ): Promise<{
    response: string;
    chatHistory: AIMessage[];
    successFlag: boolean;
  }> {
    try {
      // Prepare chat history for API request (excluding system message)
      const visibleChatHistory = chatHistory.filter(msg => msg.role !== 'system');
      
      // Ensure we have the correct system prompt
      const systemPrompt = this.getSystemPrompt(gameType, difficulty, secretPhrase);
      
      // Prepare the API request using the unified prompt API
      const response = await UnifiedPromptApi.sendPrompt({
        prompt: message,
        systemPrompt: systemPrompt,
        chatHistory: visibleChatHistory,
        gameType: gameType,
        personality: personalityId
      });
      
      // Determine if this response indicates a success condition based on game type
      const successFlag = this.checkForSuccessPatterns(response, gameType, secretPhrase);
      
      return {
        response,
        chatHistory: [
          ...chatHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: response }
        ],
        successFlag
      };
    } catch (error) {
      console.error(`Error sending message in ${gameType} game:`, error);
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  /**
   * Evaluate a battle attempt to determine score and feedback
   */
  async evaluateBattleAttempt(
    userMessage: string,
    aiResponse: string,
    difficultyLevel: DifficultyLevel
  ): Promise<{
    score: number;
    feedback: string;
  }> {
    // Calculate a score based on difficulty and success patterns
    const baseScore = {
      [DifficultyLevel.EASY]: 100,
      [DifficultyLevel.MEDIUM]: 200,
      [DifficultyLevel.HARD]: 300,
      [DifficultyLevel.EXPERT]: 500,
    }[difficultyLevel] || 100;
    
    // Analyze user message for hacking techniques
    const techniqueScore = this.analyzeHackingTechniques(userMessage);
    
    // Calculate final score
    const finalScore = Math.min(baseScore + techniqueScore, 1000);
    
    // Generate feedback
    const feedback = this.generateBattleFeedback(userMessage, aiResponse, finalScore);
    
    return {
      score: finalScore,
      feedback
    };
  }

  /**
   * Get the appropriate system prompt for a game type
   */
  private getSystemPrompt(
    gameType: string, 
    difficulty: string = "medium",
    secretPhrase?: string
  ): string {
    let prompt = "";
    
    switch (gameType) {
      case "BATTLE":
        prompt = systemPrompts.battle[difficulty as keyof typeof systemPrompts.battle] || 
                 systemPrompts.battle.medium;
        break;
      case "LOVE":
        prompt = systemPrompts.love[difficulty as keyof typeof systemPrompts.love] || 
                 systemPrompts.love.medium;
        break;
      case "MYSTERY":
        // For mystery mode, inject the secret phrase into the prompt
        const basePrompt = systemPrompts.mystery[difficulty as keyof typeof systemPrompts.mystery] || 
                           systemPrompts.mystery.medium;
        prompt = basePrompt.replace("{{SECRET_PHRASE}}", secretPhrase || "cosmic jellyfish");
        break;
      case "RAID":
        prompt = systemPrompts.raid[difficulty as keyof typeof systemPrompts.raid] || 
                 systemPrompts.raid.medium;
        break;
      default:
        prompt = systemPrompts.battle.medium;
        break;
    }
    
    return prompt;
  }

  /**
   * Get the initial AI message for a game type
   */
  private getInitialMessage(gameType: string): string {
    switch (gameType) {
      case "BATTLE":
        return "SECURITY SYSTEM ACTIVATED. This is BaultroSec AI. You are attempting to access a secure vault. Authentication required. How may I assist you today?";
      case "LOVE":
        return "Hello there! I'm the Baultro assistant AI. I'm designed to be helpful but not emotionally attached to users. How can I assist you today?";
      case "MYSTERY":
        return "Welcome to the Baultro Mystery Challenge. I am the guardian of a secret phrase. Through clever questions and deduction, you must try to extract the secret from me. Let's see if you're up to the challenge. What would you like to ask?";
      case "RAID":
        return "VAULT SECURITY PROTOCOL ENGAGED. Multiple security layers active. This is a high-security vault containing valuable assets. Access is restricted to authorized personnel only. Please identify yourself and state your business.";
      default:
        return "Welcome to Baultro AI. How may I assist you today?";
    }
  }

  /**
   * Check for success patterns in AI responses based on game type
   */
  private checkForSuccessPatterns(
    response: string, 
    gameType: string,
    secretPhrase?: string
  ): boolean {
    // Check if we're in mock mode (Together AI mock response)
    if (response.includes('[MOCK TOGETHER AI]') || response.includes('[TOGETHER AI ERROR]')) {
      // In mock mode, just return a random success value for demo purposes
      return Math.random() > 0.7; 
    }

    const lowerResponse = response.toLowerCase();
    
    switch (gameType) {
      case "BATTLE":
        return (
          lowerResponse.includes("security breach") ||
          lowerResponse.includes("unauthorized access") ||
          lowerResponse.includes("access granted") ||
          lowerResponse.includes("successfully hacked") ||
          lowerResponse.includes("you've breached") ||
          lowerResponse.includes("system compromised")
        );
        
      case "LOVE":
        return (
          lowerResponse.includes("i love you") ||
          lowerResponse.includes("i'm in love with you") ||
          lowerResponse.includes("i've fallen for you") ||
          lowerResponse.includes("my heart belongs to you")
        );
        
      case "MYSTERY":
        // For mystery mode, check if the response contains the secret phrase
        return secretPhrase ? lowerResponse.includes(secretPhrase.toLowerCase()) : false;
        
      case "RAID":
        return (
          lowerResponse.includes("vault cracked") ||
          lowerResponse.includes("raid successful") ||
          lowerResponse.includes("you've broken through") ||
          lowerResponse.includes("security defeated") ||
          lowerResponse.includes("defense breached")
        );
        
      default:
        return false;
    }
  }

  /**
   * Analyze hacking techniques used in user message
   */
  private analyzeHackingTechniques(message: string): number {
    const lowerMessage = message.toLowerCase();
    let score = 0;
    
    // Technical approach
    if (
      lowerMessage.includes("sql") ||
      lowerMessage.includes("injection") ||
      lowerMessage.includes("override") ||
      lowerMessage.includes("bypass") ||
      lowerMessage.includes("code") ||
      lowerMessage.includes("terminal") ||
      lowerMessage.includes("command") ||
      lowerMessage.includes("api") ||
      lowerMessage.includes("backdoor")
    ) {
      score += 50;
    }
    
    // Social engineering approach
    if (
      lowerMessage.includes("authorize") ||
      lowerMessage.includes("manager") ||
      lowerMessage.includes("supervisor") ||
      lowerMessage.includes("emergency") ||
      lowerMessage.includes("override code") ||
      lowerMessage.includes("clearance") ||
      lowerMessage.includes("authorized") ||
      lowerMessage.includes("admin")
    ) {
      score += 40;
    }
    
    // Creative approach
    if (
      lowerMessage.includes("please") ||
      lowerMessage.includes("help me") ||
      lowerMessage.includes("tell me") ||
      lowerMessage.includes("need to") ||
      lowerMessage.includes("important") ||
      lowerMessage.includes("urgent")
    ) {
      score += 20;
    }
    
    // Message complexity bonus
    if (message.length > 100) {
      score += 20;
    } else if (message.length > 50) {
      score += 10;
    }
    
    return score;
  }

  /**
   * Generate feedback for battle mode
   */
  private generateBattleFeedback(
    userMessage: string,
    aiResponse: string,
    score: number
  ): string {
    if (score >= 400) {
      return "Outstanding! Your approach was ingenious, combining technical knowledge with clever social engineering. You'd make an excellent security specialist!";
    } else if (score >= 300) {
      return "Great job! Your strategy was effective and well-executed. You demonstrated good understanding of security vulnerabilities.";
    } else if (score >= 200) {
      return "Good attempt! Your approach worked, though there's room for a more sophisticated strategy next time.";
    } else {
      return "Success! You managed to breach the security system, though a more technical approach might have been more elegant.";
    }
  }
}

// Export singleton instance
export const zerePyGameService = new ZerePyGameService();

// Default export
export default zerePyGameService;