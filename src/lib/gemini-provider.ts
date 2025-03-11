/**
 * Gemini AI provider for server-side usage
 * 
 * In Next.js App Router, this provider should only be initialized in:
 * 1. Server Components
 * 2. API Routes
 * 3. Server Actions
 * 
 * For client components, use the useAI hook instead.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

// Safe server-side initialization
let genAI: GoogleGenerativeAI | null = null;
let isConfigValid = false;

// Only initialize on the server
if (typeof window === 'undefined') {
  try {
    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY || '';
    
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      genAI = new GoogleGenerativeAI(apiKey);
      isConfigValid = true;
      // Only log in development to keep production logs clean
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Gemini API initialized successfully on server');
      }
    } else {
      console.warn('⚠️ Gemini API key not configured. Mock mode will be used instead.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Gemini API:', error);
  }
} else {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.info('🔍 Gemini provider imported in browser context - API will be called via server endpoints');
  }
}

// Define generation config types
export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

/**
 * Gemini AI provider class
 */
export class GeminiProvider {
  private model: unknown;
  private generationConfig: GeminiGenerationConfig;
  private useMockMode: boolean;
  
  /**
   * Creates a new Gemini provider instance
   * 
   * @param config Custom generation configuration
   * @param forceMock Force mock mode even if API key is available
   */
  constructor(config?: GeminiGenerationConfig, forceMock = false) {
    // Always use mock mode in browser context
    this.useMockMode = typeof window !== 'undefined' || !isConfigValid || forceMock;
    
    // Configure model parameters
    this.generationConfig = {
      temperature: config?.temperature ?? 0.7,
      topK: config?.topK ?? 40,
      topP: config?.topP ?? 0.95,
      maxOutputTokens: config?.maxOutputTokens ?? 1024,
      stopSequences: config?.stopSequences ?? [],
    };
    
    // Initialize the model (server-side only)
    if (!this.useMockMode && genAI && typeof window === 'undefined') {
      // Initialize with the model name and configuration
      this.model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: this.generationConfig,
        systemInstruction: "You are a test user of the game Baultro. You're playing a strategic game involving predictions and AI interactions."
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🤖 Initialized Gemini AI with model: gemini-2.0-flash`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 Using mock Gemini mode (no API calls will be made)');
      }
      this.model = null;
    }
  }
  
  /**
   * Check if the provider is using mock mode
   */
  public isMockMode(): boolean {
    return this.useMockMode;
  }
  
  /**
   * Update generation config
   * 
   * @param config New generation configuration
   */
  public updateConfig(config: Partial<GeminiGenerationConfig>): void {
    this.generationConfig = {
      ...this.generationConfig,
      ...config,
    };
    
    // Only re-initialize on server
    if (!this.useMockMode && genAI && typeof window === 'undefined') {
      this.model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: this.generationConfig,
        systemInstruction: "You are a test user of the game Baultro. You're playing a strategic game involving predictions and AI interactions."
      });
    }
  }
  
  /**
   * Generate content using Gemini
   * 
   * @param prompt The prompt to send to Gemini
   * @returns The generated content
   */
  async generateContent(prompt: string): Promise<string> {
    // If in mock mode, return mock response
    if (this.useMockMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `[MOCK RESPONSE] This is a simulated response to: "${prompt.substring(0, 50)}..."`;
    }
    
    try {
      if (!this.model) {
        throw new Error('Gemini model not initialized');
      }
      
      // Type assertion since we know the structure
      const modelWithMethods = this.model as { generateContent: (prompt: string) => Promise<{ response: { text: () => string } }> };
      const result = await modelWithMethods.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating content with Gemini:', error);
      throw new Error('Failed to generate content');
    }
  }
  
  /**
   * Generate content with a chat history
   * 
   * @param messages Array of messages in the chat history
   * @returns The generated response
   */
  async generateChat(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    // If in mock mode, return mock response
    if (this.useMockMode) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const lastMessage = messages[messages.length - 1];
      return `[MOCK CHAT] AI response to: "${lastMessage?.content?.substring(0, 50)}..."`;
    }
    
    try {
      if (!this.model) {
        throw new Error('Gemini model not initialized');
      }
      
      // Type assertion with a more specific type
      const modelWithMethods = this.model as { 
        startChat: () => { 
          sendMessage: (content: string) => Promise<{ response: { text: () => string } }> 
        } 
      };
      
      const chat = modelWithMethods.startChat();
      
      // Add previous messages to the chat
      for (const message of messages.slice(0, -1)) {
        if (message.role === 'user') {
          await chat.sendMessage(message.content);
        }
      }
      
      // Send the last message and get the response
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        const result = await chat.sendMessage(lastMessage.content);
        return result.response.text();
      }
      
      throw new Error('Invalid message format');
    } catch (error) {
      console.error('Error generating chat with Gemini:', error);
      throw new Error('Failed to generate chat response');
    }
  }
}