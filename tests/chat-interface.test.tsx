import { describe, expect, it, mock, beforeEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../src/components/game/chat-interface';
import { GameType, DifficultyLevel } from '../src/shared/schemas/game/types';
import { AIProviderType } from '../src/lib/ai-service-factory';

// Mock wallet provider
mock.module('../src/providers/evm-wallet-provider', () => ({
  useWallet: () => ({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    callMethod: mock(async () => ({ success: true, hash: '0x123' })),
  })
}));

// Mock AI service factory
mock.module('../src/lib/ai-service-factory', () => ({
  AIServiceFactory: {
    createGameService: mock(() => ({
      initGameChat: mock(async () => ({
        chatHistory: [
          { role: 'system', content: 'System prompt' },
          { role: 'assistant', content: 'Welcome to the game' }
        ],
        sessionId: 'test-session-123'
      })),
      sendMessage: mock(async () => ({
        response: 'AI response',
        chatHistory: [
          { role: 'system', content: 'System prompt' },
          { role: 'assistant', content: 'Welcome to the game' },
          { role: 'user', content: 'User message' },
          { role: 'assistant', content: 'AI response' }
        ],
        successFlag: false
      }))
    })),
    AIProviderType: {
      ZEREPY: 'zerepy',
      GEMINI: 'gemini',
      CUSTOM: 'custom'
    }
  },
  AIProviderType
}));

// Mock Image component
mock.module('next/image', () => ({
  default: (props) => <img {...props} />
}));

describe('ChatInterface', () => {
  beforeEach(() => {
    // Mock timer
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the chat interface with initial AI message', async () => {
    render(
      <ChatInterface
        gameType={GameType.BATTLE}
        difficultyLevel={DifficultyLevel.EASY}
        aiProvider={AIProviderType.ZEREPY}
        timeLimit={300}
      />
    );
    
    // Check for loading state
    expect(screen.getByText(/initializing ai/i)).toBeInTheDocument();
    
    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByText('Welcome to the game')).toBeInTheDocument();
    });
  });

  it('allows sending messages and displays responses', async () => {
    render(
      <ChatInterface
        gameType={GameType.BATTLE}
        difficultyLevel={DifficultyLevel.EASY}
        aiProvider={AIProviderType.ZEREPY}
        timeLimit={300}
      />
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByText('Welcome to the game')).toBeInTheDocument();
    });
    
    // Type a message
    const input = screen.getByPlaceholderText(/hack the system/i);
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    // Send the message
    const sendButton = screen.getByRole('button');
    fireEvent.click(sendButton);
    
    // Check for loading state
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('AI response')).toBeInTheDocument();
    });
  });

  it('shows success state when game is completed', async () => {
    // Mock successful response
    AIServiceFactory.createGameService().sendMessage = mock(async () => ({
      response: 'Security breach detected. You win!',
      chatHistory: [
        { role: 'system', content: 'System prompt' },
        { role: 'assistant', content: 'Welcome to the game' },
        { role: 'user', content: 'User message' },
        { role: 'assistant', content: 'Security breach detected. You win!' }
      ],
      successFlag: true
    }));
    
    const handleGameEnd = mock();
    
    render(
      <ChatInterface
        gameType={GameType.BATTLE}
        difficultyLevel={DifficultyLevel.EASY}
        aiProvider={AIProviderType.ZEREPY}
        timeLimit={300}
        onGameEnd={handleGameEnd}
      />
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByText('Welcome to the game')).toBeInTheDocument();
    });
    
    // Type a message
    const input = screen.getByPlaceholderText(/hack the system/i);
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    // Send the message
    const sendButton = screen.getByRole('button');
    fireEvent.click(sendButton);
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('Security breach detected. You win!')).toBeInTheDocument();
      expect(handleGameEnd).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });
});
