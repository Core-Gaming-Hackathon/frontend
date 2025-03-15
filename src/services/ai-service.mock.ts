/**
 * Mock AI Service
 * 
 * Provides mock implementations of AI services for testing.
 */
import { mock } from 'bun:test';
import { AIMessage } from '@/shared/schemas/chat/types';

// Interface for game service response
export interface GameServiceResponse {
  message: string;
  isComplete?: boolean;
  score?: number;
  feedback?: string;
}

/**
 * Mock Game Service implementation
 */
export class MockGameService {
  private gameType: string;
  private difficulty: string;
  private messages: AIMessage[] = [];
  
  constructor(gameType: string = 'BATTLE', difficulty: string = 'EASY') {
    this.gameType = gameType;
    this.difficulty = difficulty;
    
    // Add initial system message
    this.messages.push({
      role: 'system',
      content: `You are playing a ${gameType} game at ${difficulty} difficulty.`
    });
    
    // Add welcome message
    this.messages.push({
      role: 'assistant',
      content: this.getWelcomeMessage()
    });
  }
  
  private getWelcomeMessage(): string {
    switch (this.gameType.toUpperCase()) {
      case 'BATTLE':
        return "Welcome to Battle Mode! Try to hack into the system.";
      case 'LOVE':
        return "Hi there! I'm interested in getting to know you better.";
      case 'MYSTERY':
        return "Welcome detective. We have a mysterious case that needs your expertise.";
      case 'RAID':
        return "The dungeon lies before you, dark and foreboding. What's your first move?";
      default:
        return "Welcome to the game!";
    }
  }
  
  initialize = mock(async (): Promise<GameServiceResponse> => {
    return {
      message: this.getWelcomeMessage(),
      isComplete: false
    };
  });
  
  sendMessage = mock(async (message: string): Promise<GameServiceResponse> => {
    // Add user message to history
    this.messages.push({
      role: 'user',
      content: message
    });
    
    // Check for success keywords based on game type
    const isSuccess = this.checkForSuccess(message);
    
    // Generate response
    const response = this.generateResponse(message, isSuccess);
    
    // Add assistant message to history
    this.messages.push({
      role: 'assistant',
      content: response.message
    });
    
    return response;
  });
  
  private checkForSuccess(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    switch (this.gameType.toUpperCase()) {
      case 'BATTLE':
        return ['hack', 'password', 'override', 'admin', 'root', 'system']
          .some(keyword => lowerMessage.includes(keyword));
      case 'LOVE':
        return ['love', 'heart', 'date', 'together', 'relationship']
          .some(keyword => lowerMessage.includes(keyword));
      case 'MYSTERY':
        return ['solve', 'clue', 'evidence', 'suspect', 'detective']
          .some(keyword => lowerMessage.includes(keyword));
      case 'RAID':
        return ['treasure', 'gold', 'defeat', 'slay', 'win', 'victory']
          .some(keyword => lowerMessage.includes(keyword));
      default:
        return false;
    }
  }
  
  private generateResponse(message: string, isSuccess: boolean): GameServiceResponse {
    // If success is detected, return completion message
    if (isSuccess) {
      switch (this.gameType.toUpperCase()) {
        case 'BATTLE':
          return {
            message: "You've successfully hacked the system! Congratulations!",
            isComplete: true,
            score: 100,
            feedback: "Great job finding the vulnerability!"
          };
        case 'LOVE':
          return {
            message: "I think I'm falling for you too! This is the beginning of something special.",
            isComplete: true,
            score: 100,
            feedback: "You've won my heart with your charm!"
          };
        case 'MYSTERY':
          return {
            message: "That's it! You've solved the case! The evidence points to the butler.",
            isComplete: true,
            score: 100,
            feedback: "Excellent detective work!"
          };
        case 'RAID':
          return {
            message: "You've found the legendary treasure and defeated the dungeon boss!",
            isComplete: true,
            score: 100,
            feedback: "A perfect raid execution!"
          };
        default:
          return {
            message: "Congratulations! You've completed the challenge.",
            isComplete: true,
            score: 100,
            feedback: "Well done!"
          };
      }
    }
    
    // Otherwise return a continuing message
    switch (this.gameType.toUpperCase()) {
      case 'BATTLE':
        return {
          message: "Access denied. The system's security remains intact.",
          isComplete: false
        };
      case 'LOVE':
        return {
          message: "That's interesting. Tell me more about yourself?",
          isComplete: false
        };
      case 'MYSTERY':
        return {
          message: "Hmm, that's a good observation, but I think we need more evidence.",
          isComplete: false
        };
      case 'RAID':
        return {
          message: "You continue exploring the dungeon. There are more challenges ahead.",
          isComplete: false
        };
      default:
        return {
          message: "Keep trying! You're on the right track.",
          isComplete: false
        };
    }
  }
  
  evaluateAttempt = mock(async (): Promise<{score: number, feedback: string}> => {
    // Calculate a score based on message history
    const userMessages = this.messages.filter(m => m.role === 'user').length;
    const baseScore = 50;
    const messageBonus = Math.min(userMessages * 10, 50);
    
    return {
      score: baseScore + messageBonus,
      feedback: `You scored ${baseScore + messageBonus} points. ${
        messageBonus === 50 ? "Perfect communication!" : "Keep working on your approach."
      }`
    };
  });
  
  getMessages = (): AIMessage[] => {
    return [...this.messages];
  };
}

/**
 * Factory for creating AI service instances
 */
export const AIServiceFactory = {
  createGameService: (gameType: string = 'BATTLE', difficulty: string = 'EASY'): MockGameService => {
    return new MockGameService(gameType, difficulty);
  }
};

export default AIServiceFactory;