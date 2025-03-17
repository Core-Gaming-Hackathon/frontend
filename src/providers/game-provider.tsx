"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GameType, DifficultyLevel } from '@/shared/schemas/game/types';
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
  contractId?: string; // Add contract ID for blockchain reference
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
  joinGame: (gameId: string, stake?: string) => Promise<boolean>;
  createBattle: (
    difficultyLevel: DifficultyLevel | number, 
    stake: string
  ) => Promise<GameSession | null>;
  resolveBattle: (battleId: string, success: boolean) => Promise<boolean>;
  createRaid: (
    difficultyLevel: DifficultyLevel | number, 
    stake: string
  ) => Promise<GameSession | null>;
  attemptRaid: (raidId: string, fee?: string) => Promise<boolean>;
  completeRaid: (raidId: string, attackerId: string) => Promise<boolean>;
  mintDailyNFT: () => Promise<boolean>;
  checkNFTEligibility: () => Promise<boolean>;
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

// Battle interface to match contract
export interface Battle {
  id: string | number;
  creator: string;
  difficulty: number;
  stake: string;
  completed: boolean;
  success: boolean;
  createdAt: number;
  completedAt: number;
}

// Create the context
const GameContext = createContext<GameContextType>({
  createGame: async () => null,
  joinGame: async () => false,
  createBattle: async () => null,
  resolveBattle: async () => false,
  createRaid: async () => null,
  attemptRaid: async () => false,
  completeRaid: async () => false,
  mintDailyNFT: async () => false,
  checkNFTEligibility: async () => false,
  isLoading: false,
});

// Provider component
export function GameProvider({ children }: { children: React.ReactNode }) {
  const { callMethod, callViewMethod, isConnected, signIn, address } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Check if the user is eligible for a daily NFT
   */
  const checkNFTEligibility = useCallback(async (): Promise<boolean> => {
    try {
      if (!isConnected || !address) {
        await signIn();
        if (!address) return false;
      }
      
      const eligible = await callViewMethod<boolean>(
        "isEligibleForDailyNFT",
        [address],
        chainSelector.getGameModesAddress()
      );
      
      return eligible;
    } catch (error) {
      console.error("Error checking NFT eligibility:", error);
      return false;
    }
  }, [callViewMethod, isConnected, signIn, address]);
  
  /**
   * Mint a daily participation NFT
   */
  const mintDailyNFT = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      const connected = await signIn();
      if (!connected) {
        toast.error("Please connect your wallet to mint an NFT");
        return false;
      }
    }
    
    try {
      setIsLoading(true);
      
      const result = await callMethod(
        "mintDailyParticipationNFT",
        [],
        "0",
        chainSelector.getGameModesAddress()
      );
      
      if (result.success) {
        toast.success("Daily NFT minted successfully!");
        return true;
      } else {
        toast.error("Failed to mint daily NFT");
        return false;
      }
    } catch (error) {
      console.error("Error minting daily NFT:", error);
      toast.error("Error minting daily NFT");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callMethod, isConnected, signIn]);
  
  /**
   * Create a new battle
   */
  const createBattle = useCallback(async (
    difficultyLevel: DifficultyLevel | number,
    stake: string
  ): Promise<GameSession | null> => {
    if (!isConnected) {
      const connected = await signIn();
      if (!connected) {
        toast.error("Please connect your wallet to create a battle");
        return null;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Convert difficulty level if it's an enum
      const difficulty = typeof difficultyLevel === 'number' 
        ? difficultyLevel 
        : difficultyLevelToNumber(difficultyLevel);
      
      // Call contract to create battle
      const result = await callMethod(
        "createBattle",
        [difficulty],
        stake,
        chainSelector.getGameModesAddress()
      );
      
      if (result.success) {
        // Extract battle ID from result data or event logs
        const battleId = result.data ? String(result.data) : `battle_${Date.now()}`;
        toast.success("Battle created successfully!");
        
        return {
          id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          gameType: GameType.BATTLE,
          opponentId: "0x0000000000000000000000000000000000000000", // No specific opponent
          stake,
          timestamp: Date.now(),
          status: 'created',
          contractId: battleId
        };
      } else {
        toast.error("Failed to create battle");
        return null;
      }
    } catch (error) {
      console.error("Error creating battle:", error);
      toast.error("Error creating battle");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [callMethod, isConnected, signIn]);
  
  /**
   * Resolve a battle
   */
  const resolveBattle = useCallback(async (
    battleId: string, 
    success: boolean
  ): Promise<boolean> => {
    if (!isConnected) {
      const connected = await signIn();
      if (!connected) {
        toast.error("Please connect your wallet to resolve a battle");
        return false;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Call contract to resolve battle
      const result = await callMethod(
        "resolveBattle",
        [battleId, success],
        "0",
        chainSelector.getGameModesAddress()
      );
      
      if (result.success) {
        toast.success(`Battle ${success ? 'won' : 'lost'}!`);
        return true;
      } else {
        toast.error("Failed to resolve battle");
        return false;
      }
    } catch (error) {
      console.error("Error resolving battle:", error);
      toast.error("Error resolving battle");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callMethod, isConnected, signIn]);
  
  /**
   * Create a raid pool
   */
  const createRaid = useCallback(async (
    difficultyLevel: DifficultyLevel | number,
    stake: string
  ): Promise<GameSession | null> => {
    if (!isConnected) {
      const connected = await signIn();
      if (!connected) {
        toast.error("Please connect your wallet to create a raid");
        return null;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Convert difficulty level if it's an enum
      const difficulty = typeof difficultyLevel === 'number' 
        ? difficultyLevel 
        : difficultyLevelToNumber(difficultyLevel);
      
      // Call contract to create raid
      const result = await callMethod(
        "createRaid",
        [difficulty],
        stake,
        chainSelector.getGameModesAddress()
      );
      
      if (result.success) {
        // Extract raid ID from result data or event logs
        const raidId = result.data ? String(result.data) : `raid_${Date.now()}`;
        toast.success("Raid pool created successfully!");
        
        return {
          id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          gameType: GameType.RAID,
          opponentId: "0x0000000000000000000000000000000000000000", // No specific opponent
          stake,
          timestamp: Date.now(),
          status: 'created',
          contractId: raidId
        };
      } else {
        toast.error("Failed to create raid pool");
        return null;
      }
    } catch (error) {
      console.error("Error creating raid:", error);
      toast.error("Error creating raid");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [callMethod, isConnected, signIn]);
  
  /**
   * Attempt a raid
   */
  const attemptRaid = useCallback(async (
    raidId: string,
    fee: string = "0.01"
  ): Promise<boolean> => {
    if (!isConnected) {
      const connected = await signIn();
      if (!connected) {
        toast.error("Please connect your wallet to attempt a raid");
        return false;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Call contract to attempt raid
      const result = await callMethod(
        "attemptRaid",
        [raidId],
        fee,
        chainSelector.getGameModesAddress()
      );
      
      if (result.success) {
        toast.success("Raid attempted successfully!");
        return true;
      } else {
        toast.error("Failed to attempt raid");
        return false;
      }
    } catch (error) {
      console.error("Error attempting raid:", error);
      toast.error("Error attempting raid");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callMethod, isConnected, signIn]);
  
  /**
   * Complete a raid
   */
  const completeRaid = useCallback(async (
    raidId: string,
    attackerId: string
  ): Promise<boolean> => {
    if (!isConnected) {
      const connected = await signIn();
      if (!connected) {
        toast.error("Please connect your wallet to complete a raid");
        return false;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Generate a simple verification hash (in production, this would be cryptographically secure)
      const verificationHash = `verified_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Call contract to complete raid
      const result = await callMethod(
        "completeRaid",
        [raidId, attackerId, verificationHash],
        "0",
        chainSelector.getGameModesAddress()
      );
      
      if (result.success) {
        toast.success("Raid completed successfully!");
        return true;
      } else {
        toast.error("Failed to complete raid");
        return false;
      }
    } catch (error) {
      console.error("Error completing raid:", error);
      toast.error("Error completing raid");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callMethod, isConnected, signIn]);
  
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
      
      let result;
      let gameId: string;
      
      // Different contract calls based on game type
      switch (gameType) {
        case GameType.BATTLE:
          // Use a default difficulty level of 5 (medium) if not specified
          const difficultyLevel = (config?.difficulty as number) || 5;
          
          // Call createBattle for battle mode
          result = await callMethod(
            "createBattle",
            [difficultyLevel],
            stake,
            chainSelector.getGameModesAddress()
          );
          
          gameId = result.data ? String(result.data) : `battle_${Date.now()}`;
          break;
          
        case GameType.RAID:
          // Use a default difficulty level of 5 (medium) if not specified
          const raidDifficulty = (config?.difficulty as number) || 5;
          
          // Call createRaid for raid mode
          result = await callMethod(
            "createRaid",
            [raidDifficulty],
            stake,
            chainSelector.getGameModesAddress()
          );
          
          gameId = result.data ? String(result.data) : `raid_${Date.now()}`;
          break;
          
        case GameType.LOVE:
        case GameType.MYSTERY:
        default:
          // Call createMatch for love and mystery modes
          result = await callMethod(
            "createMatch",
            [opponentId, GameType[gameType].toLowerCase()],
            stake,
            chainSelector.getGameModesAddress()
          );
          
          gameId = result.data ? String(result.data) : `match_${Date.now()}`;
          break;
      }
      
      if (result.success) {
        const sessionId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        toast.success("Game created successfully!");
        
        // Return a properly typed GameSession object
        return {
          id: sessionId,
          gameType,
          opponentId,
          stake,
          timestamp: Date.now(),
          status: 'created',
          contractId: gameId,
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
  const joinGame = useCallback(async (
    gameId: string, 
    stake: string = "0.01"
  ): Promise<boolean> => {
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
        stake,
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
  
  // Helper function to convert DifficultyLevel enum to number
  const difficultyLevelToNumber = (level: DifficultyLevel): number => {
    switch (level) {
      case DifficultyLevel.EASY:
        return 3;
      case DifficultyLevel.MEDIUM:
        return 5;
      case DifficultyLevel.HARD:
        return 8;
      case DifficultyLevel.EXPERT:
        return 10;
      default:
        return 5; // Default to medium
    }
  };
  
  return (
    <GameContext.Provider 
      value={{
        createGame,
        joinGame,
        createBattle,
        resolveBattle,
        createRaid,
        attemptRaid,
        completeRaid,
        mintDailyNFT,
        checkNFTEligibility,
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
