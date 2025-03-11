/**
 * Chat and AI related types for Baultro platform
 */

/**
 * AI message types (chat history)
 */
export interface AIMessage {
  role: 'user' | 'assistant' | 'system'; // Added 'system' as a valid role
  content: string;
}

/**
 * AI personality interface
 */
export interface AIPersonality {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
  basePrompt: string;
  defaultForGameType?: string;
  difficulty?: string;
  style?: string;
  imageUrl?: string;
  creatorAddress?: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * AI chat request interface
 */
export interface AIChatRequest {
  message: string;
  gameType: string;
  chatHistory: AIMessage[];
  personalityId?: string;
  provider?: string;
}

/**
 * AI chat response interface
 */
export interface AIChatResponse {
  response: string;
  chatHistory: AIMessage[];
  successFlag: boolean;
}

/**
 * AI battle evaluation interface
 */
export interface AIBattleEvaluation {
  success: boolean;
  score: number;
  feedback: string;
}

/**
 * AI chat initialization response interface
 */
export interface AIChatInitResponse {
  initialMessage: string;
  chatHistory: AIMessage[];
}
