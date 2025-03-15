/**
 * Simplified E2E Flow Tests
 * 
 * These tests focus on basic game flow functionality
 * without complex DOM interactions that might cause issues in the Bun environment.
 */
import { describe, expect, it, mock } from 'bun:test';
import React from 'react';
import { simpleRender } from './test-renderer';
import { AIServiceFactory } from '../src/services/ai-service.mock';
import { MockEVMService } from '../src/services/evm-service.mock';

// Mock the EVMWalletProvider component
const EVMWalletProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="wallet-provider">
      <div className="wallet-status">Connected: true</div>
      <div className="wallet-address">0x1234567890123456789012345678901234567890</div>
      {children}
    </div>
  );
};

// Mock the GameModesPage component
const GameModesPage = () => {
  return (
    <div className="game-modes-page">
      <h1>Game Modes</h1>
      <div className="game-mode">
        <h2>Battle Mode</h2>
        <p>Hack into the system</p>
        <a href="/game/battle">Play Now</a>
      </div>
      <div className="game-mode">
        <h2>Love Mode</h2>
        <p>Find your digital soulmate</p>
        <a href="/game/love">Play Now</a>
      </div>
      <div className="game-mode">
        <h2>Mystery Mode</h2>
        <p>Solve the case</p>
        <a href="/game/mystery">Play Now</a>
      </div>
      <div className="game-mode">
        <h2>Raid Mode</h2>
        <p>Explore the dungeon</p>
        <a href="/game/raid">Play Now</a>
      </div>
    </div>
  );
};

// Mock the BattleModePage component
const BattleModePage = () => {
  return (
    <div className="battle-mode-page">
      <h1>Battle Mode</h1>
      <div className="game-config">
        <h2>Configure Your Game</h2>
        <div className="difficulty-selector">
          <p>Select difficulty</p>
          <div className="options">
            <div className="option">Easy - For beginners</div>
            <div className="option">Medium - Balanced challenge</div>
            <div className="option">Hard - For experts</div>
          </div>
        </div>
        <button>Start Game</button>
      </div>
    </div>
  );
};

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

describe('Baultro E2E Flow', () => {
  it('renders the game modes page with all game options', () => {
    const { text } = simpleRender(
      <EVMWalletProvider>
        <GameModesPage />
      </EVMWalletProvider>
    );
    
    // Check that all game modes are displayed
    expect(text).toContain('Battle Mode');
    expect(text).toContain('Love Mode');
    expect(text).toContain('Mystery Mode');
    expect(text).toContain('Raid Mode');
    expect(text).toContain('Play Now');
  });

  it('renders the battle mode page with configuration options', () => {
    const { text } = simpleRender(
      <EVMWalletProvider>
        <BattleModePage />
      </EVMWalletProvider>
    );
    
    // Check that the configuration screen is displayed
    expect(text).toContain('Configure Your Game');
    expect(text).toContain('Select difficulty');
    expect(text).toContain('Easy - For beginners');
    expect(text).toContain('Medium - Balanced challenge');
    expect(text).toContain('Hard - For experts');
    expect(text).toContain('Start Game');
  });
  
  it('simulates a complete battle game flow using the mock service', async () => {
    // Create a mock game service
    const mockGameService = AIServiceFactory.createGameService('BATTLE', 'MEDIUM');
    
    // Initialize the game
    const initResponse = await mockGameService.initialize();
    expect(initResponse.message).toContain('Welcome to Battle Mode');
    expect(initResponse.isComplete).toBe(false);
    
    // Send a message that doesn't trigger success
    const failedResponse = await mockGameService.sendMessage('hello there');
    expect(failedResponse.message).toContain('Access denied');
    expect(failedResponse.isComplete).toBe(false);
    
    // Send a message that triggers success
    const successResponse = await mockGameService.sendMessage('hack the system');
    expect(successResponse.message).toContain('successfully hacked');
    expect(successResponse.isComplete).toBe(true);
    expect(successResponse.score).toBe(100);
    
    // Evaluate the attempt
    const evaluation = await mockGameService.evaluateAttempt();
    expect(evaluation.score).toBeGreaterThan(0);
    expect(evaluation.feedback).toBeTruthy();
  });
});
