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
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, Content, Part } from '@google/generative-ai';

// Safe server-side initialization
let genAI: GoogleGenerativeAI | null = null;
let isConfigValid = false;

// Get API key from environment variable, checking both server and client versions
const getApiKey = () => {
  // First try server-side env var
  const serverApiKey = typeof window === 'undefined' ? process.env.GEMINI_API_KEY : null;
  // Then try client-side env var
  const clientApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  // Use whichever is available
  const apiKey = serverApiKey || clientApiKey || '';
  
  // Log the key source for debugging
  console.log(`[Gemini] Using API key from ${serverApiKey ? 'server' : clientApiKey ? 'client' : 'nowhere'}`);
  
  return apiKey;
};

// Initialize on both server and client
try {
  const apiKey = getApiKey();
  
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(apiKey);
    isConfigValid = true;
    // Only log in development to keep production logs clean
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Gemini API initialized successfully');
    }
  } else {
    console.warn('⚠️ Gemini API key not configured. Mock mode will be used instead.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini API:', error);
}

// Define generation config types
export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  candidateCount?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

// Define chat message types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: Part[];
}

/**
 * Gemini AI provider class
 */
export class GeminiProvider {
  private model: GenerativeModel | null = null;
  private generationConfig: GeminiGenerationConfig;
  private useMockMode: boolean;
  private systemInstruction: string;
  
  /**
   * Creates a new Gemini provider instance
   * 
   * @param config Custom generation configuration
   * @param systemInstruction System instruction for the model
   * @param forceMock Force mock mode even if API key is available
   */
  constructor(
    config?: GeminiGenerationConfig, 
    systemInstruction?: string,
    forceMock = false
  ) {
    // ONLY use mock mode based on env variable or forceMock parameter
    const envMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE === 'true';
    
    // Log all conditions for debugging
    console.log('[GeminiProvider Debug]', {
      envMockMode,
      forceMock,
      isConfigValid,
      'window !== undefined': typeof window !== 'undefined',
      'process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE': process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE
    });
    
    // Set mock mode based ONLY on env variable or explicit forcing
    this.useMockMode = envMockMode || forceMock;
    
    console.log(`[GeminiProvider] Mock mode ${this.useMockMode ? 'ENABLED' : 'DISABLED'}`);
    
    // Configure model parameters
    this.generationConfig = {
      temperature: config?.temperature ?? 0.7,
      topK: config?.topK ?? 40,
      topP: config?.topP ?? 0.95,
      maxOutputTokens: config?.maxOutputTokens ?? 1024,
      stopSequences: config?.stopSequences ?? [],
      candidateCount: config?.candidateCount ?? 1,
      presencePenalty: config?.presencePenalty ?? 0,
      frequencyPenalty: config?.frequencyPenalty ?? 0,
    };
    
    // Set system instruction
    this.systemInstruction = systemInstruction || 
      "You are a test user of the game Baultro. You're playing a strategic game involving predictions and AI interactions.";
    
    // Initialize the model if not in mock mode
    if (!this.useMockMode && genAI) {
      // Initialize with the model name and configuration
      this.model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: this.generationConfig as GenerationConfig,
        systemInstruction: this.systemInstruction
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🤖 Initialized Gemini AI with model: gemini-2.0-flash`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 Using mock Gemini mode (no API calls will be made)');
      }
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
   * @param systemInstruction Optional new system instruction
   */
  public updateConfig(
    config: Partial<GeminiGenerationConfig>,
    systemInstruction?: string
  ): void {
    this.generationConfig = {
      ...this.generationConfig,
      ...config,
    };
    
    if (systemInstruction) {
      this.systemInstruction = systemInstruction;
    }
    
    // Only re-initialize if not in mock mode
    if (!this.useMockMode && genAI) {
      this.model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: this.generationConfig as GenerationConfig,
        systemInstruction: this.systemInstruction
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
      
      const result = await this.model.generateContent(prompt);
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
      
      console.log("[GeminiProvider] Generating chat with messages:", messages);
      
      // Ensure first message is from user - this is required by Gemini
      if (messages.length > 0 && messages[0].role !== 'user') {
        console.log("[GeminiProvider] First message is not from user, prepending system message as user message");
        // Prepend a user message with the system instruction
        messages = [
          { role: 'user', content: this.systemInstruction },
          ...messages
        ];
      }
      
      // Convert messages to Gemini format, ensuring proper role mapping
      const chatHistory: Content[] = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Make sure the last message is from the user, as required by Gemini
      const lastMessageIndex = chatHistory.length - 1;
      if (lastMessageIndex >= 0 && chatHistory[lastMessageIndex].role !== 'user') {
        console.warn("[GeminiProvider] Last message is not from user, adding a prompt");
        // Add a user message asking for a response
        chatHistory.push({
          role: 'user',
          parts: [{ text: "Please respond to the above message." }]
        });
      }
      
      console.log("[GeminiProvider] Processed chat history:", chatHistory);
      
      // Start a chat session with all but the last message
      const chat = this.model.startChat({
        history: chatHistory.slice(0, -1),
        generationConfig: this.generationConfig as GenerationConfig,
      });
      
      // Send the last message and get the response
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage && lastMessage.role === 'user' && lastMessage.parts && lastMessage.parts[0] && typeof lastMessage.parts[0].text === 'string') {
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        return result.response.text();
      }
      
      throw new Error('Invalid message format - last message must be from user');
    } catch (error) {
      console.error('Error generating chat with Gemini:', error);
      throw new Error('Failed to generate chat response');
    }
  }
  
  /**
   * Generate content with multimodal input (text and images)
   * 
   * @param parts Array of parts (text and images)
   * @returns The generated response
   */
  async generateMultimodal(parts: Part[]): Promise<string> {
    // If in mock mode, return mock response
    if (this.useMockMode) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `[MOCK MULTIMODAL] This is a simulated response to multimodal input`;
    }
    
    try {
      if (!this.model) {
        throw new Error('Gemini model not initialized');
      }
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts }],
      });
      
      return result.response.text();
    } catch (error) {
      console.error('Error generating multimodal content with Gemini:', error);
      throw new Error('Failed to generate multimodal content');
    }
  }
}