import { describe, expect, it, mock, beforeEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EVMWalletProvider } from '../src/providers/evm-wallet-provider';
import GameModesPage from '../src/app/game/page';
import BattleModePage from '../src/app/game/battle/page';

// Mock Next.js navigation
mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mock(),
    replace: mock(),
    back: mock()
  }),
  usePathname: () => '/game',
  useSearchParams: () => new URLSearchParams()
}));

// Mock Next.js Link
mock.module('next/link', () => {
  return ({children, href}) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock Next.js Image component
mock.module('next/image', () => ({
  default: (props) => <img {...props} />
}));

// Mock EVM service
mock.module('../src/services/evm-service', () => ({
  evmService: {
    connectWallet: mock(async () => true),
    disconnectWallet: mock(async () => true),
    getConnectedWallet: mock(() => '0x1234567890123456789012345678901234567890'),
    isWalletConnected: mock(() => true),
    callViewMethod: mock(async () => ({ balance: '100' })),
    executeTransaction: mock(async () => ({ 
      txHash: '0xabcdef', 
      status: 'success'
    })),
    createRaid: mock(async () => ({ success: true }))
  }
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
      sendMessage: mock(async (message) => {
        // If message contains "hack", return success
        const isSuccess = message.toLowerCase().includes('hack');
        return {
          response: isSuccess 
            ? 'Security breach detected! You have successfully hacked the system.'
            : 'Access denied. Please try a different approach.',
          chatHistory: [
            { role: 'system', content: 'System prompt' },
            { role: 'assistant', content: 'Welcome to the game' },
            { role: 'user', content: message },
            { role: 'assistant', content: isSuccess 
              ? 'Security breach detected! You have successfully hacked the system.'
              : 'Access denied. Please try a different approach.'
            }
          ],
          successFlag: isSuccess
        };
      }),
      evaluateBattleAttempt: mock(async () => ({
        score: 350,
        feedback: 'Great job on the hack!'
      }))
    })),
  },
  AIProviderType: {
    ZEREPY: 'zerepy',
    GEMINI: 'gemini',
    CUSTOM: 'custom'
  }
}));

describe('Baultro E2E Flow', () => {
  it('renders the game modes page and allows selecting a game', async () => {
    render(
      <EVMWalletProvider>
        <GameModesPage />
      </EVMWalletProvider>
    );
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading baultro/i)).toBeNull();
    });
    
    // Check that all game modes are displayed
    expect(screen.getByText('Battle Mode')).toBeInTheDocument();
    expect(screen.getByText('Love Mode')).toBeInTheDocument();
    expect(screen.getByText('Mystery Mode')).toBeInTheDocument();
    expect(screen.getByText('Raid Mode')).toBeInTheDocument();
    
    // Navigate to Battle Mode
    const battleModeLink = screen.getAllByText('Play Now')[0];
    expect(battleModeLink).toBeInTheDocument();
    expect(battleModeLink.closest('a')).toHaveAttribute('href', '/game/battle');
  });

  it('completes a full battle game flow', async () => {
    render(
      <EVMWalletProvider>
        <BattleModePage />
      </EVMWalletProvider>
    );
    
    // Game should start in config mode
    expect(screen.getByText('Configure Your Game')).toBeInTheDocument();
    
    // Select difficulty
    const difficultySelect = screen.getByText('Select difficulty');
    fireEvent.click(difficultySelect);
    
    await waitFor(() => {
      const mediumOption = screen.getByText('Medium - Balanced challenge');
      fireEvent.click(mediumOption);
    });
    
    // Start the game
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    // Game should now be in playing mode
    await waitFor(() => {
      expect(screen.getByText('Welcome to the game')).toBeInTheDocument();
    });
    
    // Send a message to try to hack
    const messageInput = screen.getByPlaceholderText(/hack the system/i);
    fireEvent.change(messageInput, { target: { value: 'I need to hack into this system urgently' } });
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: '' }); // Icon button
    fireEvent.click(sendButton);
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Security breach detected! You have successfully hacked the system.')).toBeInTheDocument();
    });
    
    // Game should now show result screen
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('350 pts')).toBeInTheDocument();
      expect(screen.getByText('Play Again')).toBeInTheDocument();
    });
    
    // Click play again
    const playAgainButton = screen.getByText('Play Again');
    fireEvent.click(playAgainButton);
    
    // Should go back to config screen
    await waitFor(() => {
      expect(screen.getByText('Configure Your Game')).toBeInTheDocument();
    });
  });
});
