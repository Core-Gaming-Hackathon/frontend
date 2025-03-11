import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { UnifiedPromptApi } from '../src/lib/unified-prompt-api';

describe('UnifiedPromptApi', () => {
  // Keep track of original fetch
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Reset the API URL
    UnifiedPromptApi.setApiUrl('http://localhost:8000');
    
    // Mock fetch
    global.fetch = mock(async () => ({
      ok: true,
      json: async () => ({ response: 'Mock AI response' }),
    }));
  });
  
  afterEach(() => {
    // Restore fetch
    global.fetch = originalFetch;
  });
  
  it('sends a prompt to the AI service', async () => {
    const params = {
      prompt: 'Hello AI',
      systemPrompt: 'You are a helpful assistant',
      chatHistory: [{ role: 'user', content: 'Hello' }],
      gameType: 'BATTLE'
    };
    
    const response = await UnifiedPromptApi.sendPrompt(params);
    
    expect(response).toBe('Mock AI response');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/prompt',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      })
    );
    
    // Verify the request body
    const requestBody = JSON.parse((fetch.mock.calls[0][1] as RequestInit).body as string);
    expect(requestBody).toEqual({
      prompt: 'Hello AI',
      system: 'You are a helpful assistant',
      chat_history: [{ role: 'user', content: 'Hello' }],
      game_type: 'battle',
      personality_id: undefined,
      max_tokens: 1000,
      temperature: 0.7
    });
  });
  
  it('handles API errors gracefully', async () => {
    // Mock fetch to return an error
    global.fetch = mock(async () => ({
      ok: false,
      json: async () => ({ error: 'Service unavailable' }),
    }));
    
    const params = {
      prompt: 'Hello AI',
      systemPrompt: 'You are a helpful assistant',
      chatHistory: [],
      gameType: 'BATTLE'
    };
    
    await expect(UnifiedPromptApi.sendPrompt(params)).rejects.toThrow('Failed to send prompt');
  });
  
  it('allows changing the API URL', () => {
    const customUrl = 'https://custom-api.example.com';
    UnifiedPromptApi.setApiUrl(customUrl);
    
    expect(UnifiedPromptApi.getApiUrl()).toBe(customUrl);
  });
});
