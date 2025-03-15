import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { UnifiedPromptApi } from '../src/lib/unified-prompt-api';
import { AIMessage } from '../src/shared/schemas/chat/types';
import { createMockUserMessage } from './test-utils';

describe('UnifiedPromptApi', () => {
  // Keep track of original fetch
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Reset the API URL
    UnifiedPromptApi.setApiUrl('http://localhost:8000');
    
    // Enable mock mode for testing
    UnifiedPromptApi.enableMock(false); // Start with mock disabled to test both paths
    
    // Mock fetch
    global.fetch = mock(async (url) => {
      console.log(`Mocked fetch called with URL: ${url}`);
      
      if (url.includes('/game/prompt')) {
        return {
          ok: true,
          json: async () => ({ text: 'Mock API response' }),
        };
      }
      
      return {
        ok: true,
        json: async () => ({ response: 'Mock API response' }),
      };
    });
  });
  
  afterEach(() => {
    // Restore fetch
    global.fetch = originalFetch;
    
    // Disable mock mode
    UnifiedPromptApi.enableMock(false);
  });
  
  it('sends a prompt to the AI service', async () => {
    const params = {
      prompt: 'Hello AI',
      systemPrompt: 'You are a helpful assistant',
      chatHistory: [createMockUserMessage('Hello')],
      gameType: 'BATTLE'
    };
    
    const response = await UnifiedPromptApi.sendPrompt(params);
    
    // The mock implementation returns this response for BATTLE game type
    expect(response).toBe("I am the system's security AI. What are you trying to do?");
  });
  
  it('handles API errors gracefully', async () => {
    // Mock fetch to return an error
    global.fetch = mock(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service unavailable' }),
    }));
    
    const params = {
      prompt: 'Hello AI',
      systemPrompt: 'You are a helpful assistant',
      chatHistory: [] as AIMessage[],
      gameType: 'BATTLE'
    };
    
    // With mock mode disabled, it should fall back to mock response
    const response = await UnifiedPromptApi.sendPrompt(params);
    expect(response).toBe("I am the system's security AI. What are you trying to do?");
  });
  
  it('allows changing the API URL', () => {
    const customUrl = 'https://custom-api.example.com';
    UnifiedPromptApi.setApiUrl(customUrl);
    
    expect(UnifiedPromptApi.getApiUrl()).toBe(customUrl);
  });
  
  it('uses mock responses when mock mode is enabled', async () => {
    // Enable mock mode
    UnifiedPromptApi.enableMock(true);
    
    const params = {
      prompt: 'Hello AI',
      systemPrompt: 'You are a helpful assistant',
      chatHistory: [] as AIMessage[],
      gameType: 'LOVE'
    };
    
    const response = await UnifiedPromptApi.sendPrompt(params);
    
    // Should use the mock response for LOVE game type
    expect(response).toBe("Hi there! I'm interested in getting to know you better.");
    
    // Fetch should not be called when mock mode is enabled
    expect(fetch).not.toHaveBeenCalled();
  });
  
  it('creates a game session with mock responses', async () => {
    // Enable mock mode
    UnifiedPromptApi.enableMock(true);
    
    const result = await UnifiedPromptApi.initGameSession('BATTLE', 'HARD');
    
    expect(result).toHaveProperty('sessionId');
    expect(result).toHaveProperty('initialMessage');
    expect(result.initialMessage).toContain('Battle Mode');
    expect(result.initialMessage).toContain('HARD');
  });
  
  it('sends game messages with mock responses', async () => {
    // Enable mock mode
    UnifiedPromptApi.enableMock(true);
    
    const result = await UnifiedPromptApi.sendGameMessage('mock-session', 'hack the system');
    
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
    expect(result.response).toContain('Success');
  });
});
