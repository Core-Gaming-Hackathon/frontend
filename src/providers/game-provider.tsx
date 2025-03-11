"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GameType } from '@/shared/schemas/game/types';
import { useWallet } from '@/providers/evm-wallet-provider';
import { chainSelector } from '@/config/chain-selector';
import { toast } from 'sonner';

// Define the structure of a game session
export interface GameSession {
  id: string;
  gameType: GameType | string;
  opponentId: string;
  stake: string;
  timestamp?: number;
  status?: 'created' | 'active' | 'completed';
  visibility?: string;
  aiConfig?: Record<string, unknown>;
  yourAIConfig?: Record<string, unknown>;
  chain?: string;
  [key: string]: unknown; // Allow additional properties
}

// Game context interface
export interface GameContextType {
  createGame: (
    gameType: GameType,
    opponentId: string,
    stake: string,
    config?: Record<string, unknown>
  ) => Promise<GameSession | null>; // Updated return type
  joinGame: (gameId: string) => Promise<boolean>;
  isLoading: boolean;
}

// Game creation config interface
export interface GameCreationConfig {
  gameType: GameType;
  opponentId: string;
  stake: string;
  visibility?: string;
  aiConfig?: {
    useAIOpponent?: boolean;
    difficulty?: string;
    preferredAIId?: string;
  };
  yourAIConfig?: {
    name?: string;
    systemInstructions?: string;
    vulnerabilities?: string[];
  };
  chain?: string;
}

// Create the context
const GameContext = createContext<GameContextType>({
  createGame: async () => null,
  joinGame: async () => false,
  isLoading: false,
});

// Provider component
export function GameProvider({ children }: { children: React.ReactNode }) {
  const { callMethod, isConnected, signIn } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Create a new game session
   */
  const createGame = useCallback(async (
    gameType: GameType,
    opponentId: string,
    stake: string,
    config: Record<string, unknown> = {}
  ): Promise<GameSession | null> => {
    if (!isConnected) {
      const connected = await signIn();
      if (!connected) {
        toast.error("Please connect your wallet to create a game");
        return null;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Call contract to create game
      const result = await callMethod(
        "createMatch",
        [opponentId, gameType.toString()],
        stake,
        chainSelector.getGameModesAddress()
      );
      
      if (result.success) {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        toast.success("Game created successfully!");
        
        // Return a properly typed GameSession object
        return {
          id: gameId,
          gameType,
          opponentId,
          stake,
          timestamp: Date.now(),
          status: 'created',
          ...config
        };
      } else {
        toast.error("Failed to create game");
        return null;
      }
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Error creating game");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [callMethod, isConnected, signIn]);
  
  /**
   * Join an existing game
   */
  const joinGame = useCallback(async (gameId: string): Promise<boolean> => {
    if (!isConnected) {
      const connected = await signIn();
      if (!connected) {
        toast.error("Please connect your wallet to join a game");
        return false;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Call contract to join game
      const result = await callMethod(
        "joinMatch",
        [gameId],
        "0.01", // Default stake amount
        chainSelector.getGameModesAddress()
      );
      
      if (result.success) {
        toast.success("Joined game successfully!");
        return true;
      } else {
        toast.error("Failed to join game");
        return false;
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Error joining game");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callMethod, isConnected, signIn]);
  
  return (
    <GameContext.Provider 
      value={{
        createGame,
        joinGame,
        isLoading,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// Custom hook for using the game context
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
