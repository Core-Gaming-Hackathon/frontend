/**
 * ZerePy AI provider for client and server usage
 * 
 * This provider can be used in both client and server components.
 * When used in client components, it will make API calls through
 * the Next.js API routes.
 */


// Define generation config types
export interface ZerePyGenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

/**
 * ZerePy AI provider class
 */
export class ZerePyProvider {
  private apiUrl: string;
  private generationConfig: ZerePyGenerationConfig;
  private useMockMode: boolean;
  
  /**
   * Creates a new ZerePy provider instance
   * 
   * @param config Custom generation configuration
   * @param forceMock Force mock mode even if API is available
   */
  constructor(config?: ZerePyGenerationConfig, forceMock = false) {
    // Set up API URL for client
    this.apiUrl = 'http://localhost:8000';
    this.useMockMode = forceMock;
    
    // Always log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ ZerePy API initialized with URL:', this.apiUrl);
    }
    
    // Configure model parameters
    this.generationConfig = {
      temperature: config?.temperature ?? 0.7,
      maxOutputTokens: config?.maxOutputTokens ?? 1024,
      stopSequences: config?.stopSequences ?? [],
    };
    
    // Debug logs for development
    if (process.env.NODE_ENV === 'development') {
      console.log(this.useMockMode 
        ? '🤖 Using mock ZerePy mode (no API calls will be made)'
        : `🤖 Initialized ZerePy AI with endpoint: ${this.apiUrl}`);
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
  public updateConfig(config: Partial<ZerePyGenerationConfig>): void {
    this.generationConfig = {
      ...this.generationConfig,
      ...config,
    };
  }
  
  /**
   * Generate content using ZerePy
   * 
   * @param prompt The prompt to send to ZerePy
   * @returns The generated content
   */
  async generateContent(prompt: string): Promise<string> {
    // If in mock mode, return mock response
    if (this.useMockMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `[MOCK RESPONSE] This is a simulated ZerePy response to: "${prompt.substring(0, 50)}..."`;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          temperature: this.generationConfig.temperature,
          max_tokens: this.generationConfig.maxOutputTokens,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error generating content with ZerePy:', error);
      throw new Error('Failed to generate content with ZerePy');
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
      return `[MOCK CHAT] ZerePy response to: "${lastMessage?.content?.substring(0, 50)}..."`;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          temperature: this.generationConfig.temperature,
          max_tokens: this.generationConfig.maxOutputTokens,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error generating chat with ZerePy:', error);
      throw new Error('Failed to generate chat response with ZerePy');
    }
  }
}