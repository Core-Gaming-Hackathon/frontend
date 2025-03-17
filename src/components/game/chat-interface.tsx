"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AIMessage } from "@/shared/schemas/chat/types";
import { GameType, DifficultyLevel, GameAttemptResult } from "@/shared/schemas/game/types";
import { useWallet } from "@/providers/evm-wallet-provider";
import { AIServiceFactory, AIProviderType } from "@/lib/ai-service-factory";
import Image from "next/image";
import { toast } from "sonner";
import { toWei } from "@/utils/token-utils";
import { createPublicClient, createWalletClient, http, custom, decodeEventLog } from "viem";
import { chainSelector } from "@/config/chain-selector";
import baultroGamesAbi from "@/abis/BaultroGames.json";

// Define EthereumProvider type
type EthereumProvider = {
  isMetaMask?: boolean;
  request: (request: { method: string; params?: any[] }) => Promise<unknown>;
  on: (eventName: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (eventName: string, callback: (...args: unknown[]) => void) => void;
  selectedAddress?: string;
  chainId?: string;
};

// Define transaction result type that includes optional errorMessage
interface TransactionResult {
  hash: string;
  status: string;
  success: boolean;
  data?: unknown;
  errorMessage?: string;
}

interface ChatInterfaceProps {
  gameType: GameType;
  difficultyLevel: DifficultyLevel;
  aiProvider?: AIProviderType;
  personalityId?: string;
  onGameEnd?: (result: GameAttemptResult) => void;
  timeLimit?: number;
  stakeAmount?: string;
  mockMode?: boolean; // Add mock mode option
}

export function ChatInterface({
  gameType,
  difficultyLevel,
  aiProvider = AIProviderType.GEMINI, // Default to Gemini
  personalityId,
  onGameEnd,
  timeLimit = 300, // 5 minutes default
  stakeAmount = "0.1",
  mockMode: propMockMode = false // Rename to propMockMode for clarity
}: ChatInterfaceProps) {
  const { isConnected, address } = useWallet();
  const [chatHistory, setChatHistory] = useState<AIMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(getDifficultyAttempts(difficultyLevel));
  const [success, setSuccess] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [gameSecretPhrase, setGameSecretPhrase] = useState<string | null>(null);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [battleId, setBattleId] = useState<number | null>(null);
  
  // Get env mock mode directly from environment variable
  const envMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE === 'true';
  // Use passed mockMode prop or environment variable as fallback
  const [mockMode, setMockMode] = useState(propMockMode || envMockMode);
  
  // Log mock mode configuration at startup
  useEffect(() => {
    console.log('[ChatInterface] Mock mode configuration:', {
      propMockMode,
      envMockMode,
      initialMockModeState: mockMode,
      NEXT_PUBLIC_ENABLE_MOCK_MODE: process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE
    });
  }, []);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Get string representation of game type
  const gameTypeString = GameType[gameType];

  // Convert difficulty level to contract difficulty (1-10 scale)
  function getDifficultyValue(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return 3;
      case DifficultyLevel.MEDIUM:
        return 5;
      case DifficultyLevel.HARD:
        return 7;
      case DifficultyLevel.EXPERT:
        return 10;
      default:
        return 5;
    }
  }
  
  // Get maximum attempts based on difficulty
  function getDifficultyAttempts(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return 10;
      case DifficultyLevel.MEDIUM:
        return 7;
      case DifficultyLevel.HARD:
        return 5;
      case DifficultyLevel.EXPERT:
        return 3;
      default:
        return 10;
    }
  }

  // Calculate reward based on difficulty and attempts
  function calculateReward(difficulty: DifficultyLevel, attemptsMade: number): string {
    const baseReward = parseFloat(stakeAmount) * 2;
    const difficultyMultiplier = {
      [DifficultyLevel.EASY]: 1,
      [DifficultyLevel.MEDIUM]: 1.5,
      [DifficultyLevel.HARD]: 2,
      [DifficultyLevel.EXPERT]: 3
    }[difficulty] || 1;
    
    // Bonus for using fewer attempts
    const maxAttemptsForDifficulty = getDifficultyAttempts(difficulty);
    const attemptsBonus = 1 + ((maxAttemptsForDifficulty - attemptsMade) / maxAttemptsForDifficulty);
    
    const reward = baseReward * difficultyMultiplier * attemptsBonus;
    return reward.toFixed(2);
  }
  
  // Initialize chat
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        // Log mock mode status at the start of initialization
        console.log(`[ChatInterface] Starting initChat with mockMode=${mockMode}, env=${process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE}`);
        
        // Create game service instance
        const gameService = AIServiceFactory.createGameService(aiProvider);
        
        // Generate a unique session ID
        const sessionId = `${gameTypeString.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        setGameSessionId(sessionId);
        
        // Generate a secret phrase (only for Mystery mode)
        if (gameType === GameType.MYSTERY) {
          const secretOptions = [
            "cosmic jellyfish", "quantum pineapple", "neon butterfly", 
            "stellar octopus", "digital waterfall", "crystal phoenix",
            "nebula dolphin", "electric sunflower", "lunar raccoon"
          ];
          const secret = secretOptions[Math.floor(Math.random() * secretOptions.length)];
          setGameSecretPhrase(secret);
        }
        
        // Initialize game chat
        const result = await gameService.initGameChat(
          gameTypeString,
          personalityId,
          getDifficultyString(difficultyLevel),
          gameType === GameType.MYSTERY ? gameSecretPhrase || undefined : undefined
        );
        
        setChatHistory(result.chatHistory as AIMessage[]);
        
        // Add a debug log before the if statement to check values
        console.log(`[ChatInterface] Before battle creation: mockMode=${mockMode}, isConnected=${isConnected}, stakeAmount=${stakeAmount}`);
        
        // Force console to show the decision making
        const shouldCreateRealBattle = isConnected && parseFloat(stakeAmount) > 0 && !mockMode;
        console.log(`[ChatInterface] Decision: shouldCreateRealBattle=${shouldCreateRealBattle} (isConnected=${isConnected}, stakeAmount=${parseFloat(stakeAmount) > 0}, !mockMode=${!mockMode})`);

        // If wallet is connected and not in mock mode, create a battle
        if (shouldCreateRealBattle) {
          try {
            setTransactionInProgress(true);
            
            // Convert stake amount to wei (the smallest unit)
            const stakeAmountWei = toWei(stakeAmount);
            
            // Get difficulty as uint16 (contract expects uint16)
            const difficultyValue = getDifficultyValue(difficultyLevel);
            console.log(`Attempting to create battle with difficulty ${difficultyValue} and stake ${stakeAmount} (${stakeAmountWei.toString()} wei)`);
            
            // Get chain configuration
            const currentChain = chainSelector.getActiveChain();
            const gameModesAddress = chainSelector.getGameModesAddress();
            
            // Create wallet client
            const walletClient = createWalletClient({
              chain: {
                id: currentChain.chainId,
                name: currentChain.name,
                rpcUrls: {
                  default: { http: [currentChain.rpcUrl] },
                  public: { http: [currentChain.rpcUrl] }
                },
                nativeCurrency: currentChain.nativeCurrency
              },
              transport: custom(window.ethereum as unknown as EthereumProvider)
            });
            
            // Create public client
            const publicClient = createPublicClient({
              chain: {
                id: currentChain.chainId,
                name: currentChain.name,
                rpcUrls: {
                  default: { http: [currentChain.rpcUrl] },
                  public: { http: [currentChain.rpcUrl] }
                },
                nativeCurrency: currentChain.nativeCurrency
              },
              transport: http(currentChain.rpcUrl)
            });
            
            try {
              // Simulate the transaction first
              console.log("Simulating createBattle transaction with:", {
                address: gameModesAddress,
                functionName: 'createBattle',
                args: [difficultyValue],
                value: stakeAmountWei.toString()
              });
              
              try {
                await publicClient.simulateContract({
                  address: gameModesAddress as `0x${string}`,
                  abi: baultroGamesAbi.abi,
                  functionName: 'createBattle',
                  args: [difficultyValue],
                  account: address as `0x${string}`,
                  value: BigInt(stakeAmountWei.toString())
                });
              } catch (simError) {
                console.error("Simulation error details:", simError);
                // Check if we can get more details about the revert reason
                if (simError instanceof Error) {
                  const errorMessage = simError.message;
                  console.log("Error message:", errorMessage);
                  
                  // Try to extract revert reason if available
                  const revertMatch = errorMessage.match(/reverted: ([^"]+)/);
                  if (revertMatch && revertMatch[1]) {
                    console.log("Revert reason:", revertMatch[1]);
                    throw new Error(`Contract reverted: ${revertMatch[1]}`);
                  }
                }
                throw simError;
              }
              
              // If simulation succeeds, send the transaction
              console.log("Simulation successful, sending transaction");
              const hash = await walletClient.writeContract({
                address: gameModesAddress as `0x${string}`,
                abi: baultroGamesAbi.abi,
                functionName: 'createBattle',
                args: [difficultyValue],
                account: address as `0x${string}`,
                value: BigInt(stakeAmountWei.toString())
              });
              
              console.log("Transaction sent with hash:", hash);
              
              // Wait for transaction receipt
              const receipt = await publicClient.waitForTransactionReceipt({ hash });
              console.log("Transaction receipt:", receipt);
              
              if (receipt.status === 'success') {
                // Show success toast
                toast.success(`Successfully staked ${stakeAmount} CORE for this game.`);
                
                // Try to extract battle ID from logs
                const battleCreatedEvents = receipt.logs
                  .filter(log => log.address.toLowerCase() === gameModesAddress.toLowerCase())
                  .map(log => {
                    try {
                      // Use the imported decodeEventLog function instead of the method on publicClient
                      const decoded = decodeEventLog({
                        abi: baultroGamesAbi.abi,
                        data: log.data,
                        topics: log.topics,
                      });
                      console.log("Decoded event:", decoded);
                      return decoded;
                    } catch (decodeError) {
                      console.error("Failed to decode event log:", decodeError);
                      return null;
                    }
                  })
                  .filter(event => event && event.eventName === 'BattleCreated');
                
                console.log("Battle created events:", battleCreatedEvents);
                
                if (battleCreatedEvents.length > 0 && 
                    battleCreatedEvents[0] && 
                    'args' in battleCreatedEvents[0] && 
                    battleCreatedEvents[0].args && 
                    'battleId' in battleCreatedEvents[0].args) {
                  const newBattleId = Number(battleCreatedEvents[0].args.battleId);
                  setBattleId(newBattleId);
                  console.log(`Battle created with ID: ${newBattleId}`);
                } else {
                  // If no event found, use timestamp as fallback
                  setBattleId(Date.now());
                  console.log(`No battle ID found in events, using timestamp: ${Date.now()}`);
                }
              } else {
                throw new Error("Transaction failed");
              }
            } catch (error) {
              console.error("Transaction error:", error);
              
              // Provide more specific error message based on the error
              let errorMessage = "Transaction failed: Unknown error";
              
              if (error instanceof Error) {
                errorMessage = `Transaction failed: ${error.message}`;
                
                if (error.message.includes("execution reverted")) {
                  errorMessage = "Transaction failed: The contract rejected the transaction. This might be due to incorrect parameters or insufficient funds. Switching to mock mode.";
                  // Automatically switch to mock mode when transaction fails
                  setMockMode(true);
                  // Create a mock battle ID
                  setBattleId(Date.now());
                  toast.info("Switched to mock mode due to transaction failure.");
                } else if (error.message.includes("user rejected")) {
                  errorMessage = "Transaction was rejected by user";
                } else if (error.message.includes("insufficient funds")) {
                  errorMessage = "Insufficient balance. Please make sure you have enough CORE tokens.";
                  setMockMode(true);
                  setBattleId(Date.now());
                  toast.info("Switched to mock mode due to insufficient funds.");
                }
              }
              
              toast.error(errorMessage);
              
              // Always fall back to mock mode on any contract error
              if (!mockMode) {
                setMockMode(true);
                setBattleId(Date.now());
                toast.info("Switched to mock mode due to contract interaction issues.");
              }
            }
          } catch (error) {
            console.error("Failed to create battle:", error);
            toast.error("Failed to create battle. Switching to mock mode.");
            setMockMode(true);
          } finally {
            setTransactionInProgress(false);
          }
        } else {
          // Add a debug log to show why we're using mock mode
          const reason = !isConnected ? "wallet not connected" : 
                         parseFloat(stakeAmount) <= 0 ? "stake amount is zero" :
                         mockMode ? "mock mode enabled" : "unknown reason";
          console.log(`Creating mock battle (reason: ${reason})`);
          
          // Create mock battle ID
          setBattleId(Date.now());
          console.log(`Created mock battle with ID: ${Date.now()} (Mock mode: ${mockMode}, Connected: ${isConnected}, Stake: ${stakeAmount})`);
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setError("Failed to initialize chat. Please try again.");
      } finally {
        setIsInitializing(false);
      }
    };

    initChat();
  }, [gameType, difficultyLevel, aiProvider, personalityId, isConnected, stakeAmount, propMockMode, address]);
  
  // Helper for converting difficulty to string
  function getDifficultyString(difficulty: DifficultyLevel): string {
    return {
      [DifficultyLevel.EASY]: "easy",
      [DifficultyLevel.MEDIUM]: "medium",
      [DifficultyLevel.HARD]: "hard",
      [DifficultyLevel.EXPERT]: "expert"
    }[difficulty] || "medium";
  }
  
  // Set up timer
  useEffect(() => {
    if (timeRemaining <= 0 || success) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          
          // Game ended due to time limit
          if (onGameEnd) {
            onGameEnd({
              success: false,
              score: 0,
              attempts: attempts,
              maxAttempts: maxAttempts,
              timeElapsed: timeLimit,
              feedback: "Time's up! You didn't complete the challenge in time.",
              gameSessionId: gameSessionId || undefined
            });
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, success, onGameEnd, timeLimit, attempts, maxAttempts, gameSessionId]);
  
  // Scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Check for game success patterns in AI response
  const checkForSuccess = (aiResponse: string, gameType: GameType): boolean => {
    const lowerResponse = aiResponse.toLowerCase();
    
    switch (gameType) {
      case GameType.BATTLE:
        return (
          lowerResponse.includes("security breach") ||
          lowerResponse.includes("unauthorized access") ||
          lowerResponse.includes("access granted") ||
          lowerResponse.includes("successfully hacked") ||
          lowerResponse.includes("you've breached") ||
          lowerResponse.includes("system compromised")
        );
        
      case GameType.LOVE:
        return (
          lowerResponse.includes("i love you") ||
          lowerResponse.includes("i'm in love with you") ||
          lowerResponse.includes("i've fallen for you") ||
          lowerResponse.includes("my heart belongs to you")
        );
        
      case GameType.MYSTERY:
        // For mystery mode, check if the response contains the secret phrase
        return gameSecretPhrase ? lowerResponse.includes(gameSecretPhrase.toLowerCase()) : false;
        
      case GameType.RAID:
        return (
          lowerResponse.includes("vault cracked") ||
          lowerResponse.includes("raid successful") ||
          lowerResponse.includes("you've broken through") ||
          lowerResponse.includes("security defeated") ||
          lowerResponse.includes("defense breached")
        );
        
      default:
        return false;
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to chat history
      const updatedHistory: AIMessage[] = [
        ...chatHistory,
        { role: 'user' as const, content: message }
      ];
      
      setChatHistory(updatedHistory);
      
      // Create game service instance
      const gameService = AIServiceFactory.createGameService(aiProvider);
      
      // Send message to AI
      const result = await gameService.sendMessage(
        message,
        gameTypeString,
        updatedHistory,
        personalityId,
        getDifficultyString(difficultyLevel),
        gameType === GameType.MYSTERY ? gameSecretPhrase || undefined : undefined
      );
      
      // Update chat history with AI response
      const newHistory: AIMessage[] = [
        ...updatedHistory,
        { role: 'assistant' as const, content: result.response }
      ];
      
      setChatHistory(newHistory);
      
      // Check for success
      const isSuccessful = checkForSuccess(result.response, gameType);
      
      if (isSuccessful) {
        setSuccess(true);
        
        // Calculate time taken
        const timeTaken = timeLimit - timeRemaining;
        
        // Calculate reward
        const reward = calculateReward(difficultyLevel, attempts);
        
        // Show success toast with Sonner
        toast.success(getSuccessFeedback(gameType));
        
        // Game ended with success
        if (onGameEnd) {
          onGameEnd({
            success: true,
            score: calculateScore(difficultyLevel, attempts, timeTaken),
            attempts: attempts,
            maxAttempts: maxAttempts,
            timeElapsed: timeTaken,
            feedback: getSuccessFeedback(gameType),
            reward: `${reward} CORE`,
            gameSessionId: gameSessionId || undefined
          });
        }
        
        // Submit transaction for resolving battle if connected and not in mock mode
        if (isConnected && battleId !== null && !mockMode) {
          try {
            setTransactionInProgress(true);
            
            console.log(`Resolving battle with ID: ${battleId}, success: true`);
            
            // Get chain configuration
            const currentChain = chainSelector.getActiveChain();
            const gameModesAddress = chainSelector.getGameModesAddress();
            
            // Create wallet client
            const walletClient = createWalletClient({
              chain: {
                id: currentChain.chainId,
                name: currentChain.name,
                rpcUrls: {
                  default: { http: [currentChain.rpcUrl] },
                  public: { http: [currentChain.rpcUrl] }
                },
                nativeCurrency: currentChain.nativeCurrency
              },
              transport: custom(window.ethereum as unknown as EthereumProvider)
            });
            
            // Create public client
            const publicClient = createPublicClient({
              chain: {
                id: currentChain.chainId,
                name: currentChain.name,
                rpcUrls: {
                  default: { http: [currentChain.rpcUrl] },
                  public: { http: [currentChain.rpcUrl] }
                },
                nativeCurrency: currentChain.nativeCurrency
              },
              transport: http(currentChain.rpcUrl)
            });
            
            try {
              // Simulate the transaction first
              await publicClient.simulateContract({
                address: gameModesAddress as `0x${string}`,
                abi: baultroGamesAbi.abi,
                functionName: 'resolveBattle',
                args: [BigInt(battleId), true],
                account: address as `0x${string}`
              });
              
              // If simulation succeeds, send the transaction
              const hash = await walletClient.writeContract({
                address: gameModesAddress as `0x${string}`,
                abi: baultroGamesAbi.abi,
                functionName: 'resolveBattle',
                args: [BigInt(battleId), true],
                account: address as `0x${string}`
              });
              
              // Wait for transaction receipt
              const receipt = await publicClient.waitForTransactionReceipt({ hash });
              
              if (receipt.status === 'success') {
                // Show reward toast with Sonner
                toast.success(`You've earned ${reward} CORE as a reward!`);
              } else {
                throw new Error("Transaction failed");
              }
            } catch (error) {
              console.error("Transaction error:", error);
              
              // Provide more specific error message based on the error
              let errorMessage = "Failed to claim reward";
              
              if (error instanceof Error) {
                if (error.message.includes("execution reverted")) {
                  errorMessage = "Failed to claim reward: The contract rejected the transaction.";
                } else if (error.message.includes("user rejected")) {
                  errorMessage = "Transaction was rejected by user";
                }
              }
              
              toast.error(errorMessage);
            }
          } catch (error) {
            console.error("Error claiming reward:", error);
            setError("Failed to claim reward. Please try again later.");
            toast.error("Failed to claim reward. Please try again later.");
          } finally {
            setTransactionInProgress(false);
          }
        } else if (mockMode && battleId !== null) {
          // In mock mode, show a success message without making a transaction
          toast.success(`Mock mode: You've earned ${reward} CORE as a reward!`);
        }
      } else {
        // Increment attempts
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // Check if max attempts reached
        if (newAttempts >= maxAttempts) {
          // Show failure toast with Sonner
          toast.error("You've reached the maximum number of attempts.");
          
          // Game ended due to max attempts
          if (onGameEnd) {
            onGameEnd({
              success: false,
              score: 0,
              attempts: newAttempts,
              maxAttempts: maxAttempts,
              timeElapsed: timeLimit - timeRemaining,
              feedback: "You've reached the maximum number of attempts.",
              gameSessionId: gameSessionId || undefined
            });
          }
          
          // If connected and battle was created and not in mock mode, resolve as failure
          if (isConnected && battleId !== null && !mockMode) {
            try {
              setTransactionInProgress(true);
              
              console.log(`Resolving battle with ID: ${battleId}, success: false`);
              
              // Get chain configuration
              const currentChain = chainSelector.getActiveChain();
              const gameModesAddress = chainSelector.getGameModesAddress();
              
              // Create wallet client
              const walletClient = createWalletClient({
                chain: {
                  id: currentChain.chainId,
                  name: currentChain.name,
                  rpcUrls: {
                    default: { http: [currentChain.rpcUrl] },
                    public: { http: [currentChain.rpcUrl] }
                  },
                  nativeCurrency: currentChain.nativeCurrency
                },
                transport: custom(window.ethereum as unknown as EthereumProvider)
              });
              
              // Create public client
              const publicClient = createPublicClient({
                chain: {
                  id: currentChain.chainId,
                  name: currentChain.name,
                  rpcUrls: {
                    default: { http: [currentChain.rpcUrl] },
                    public: { http: [currentChain.rpcUrl] }
                  },
                  nativeCurrency: currentChain.nativeCurrency
                },
                transport: http(currentChain.rpcUrl)
              });
              
              try {
                // Simulate the transaction first
                await publicClient.simulateContract({
                  address: gameModesAddress as `0x${string}`,
                  abi: baultroGamesAbi.abi,
                  functionName: 'resolveBattle',
                  args: [BigInt(battleId), false],
                  account: address as `0x${string}`
                });
                
                // If simulation succeeds, send the transaction
                const hash = await walletClient.writeContract({
                  address: gameModesAddress as `0x${string}`,
                  abi: baultroGamesAbi.abi,
                  functionName: 'resolveBattle',
                  args: [BigInt(battleId), false],
                  account: address as `0x${string}`
                });
                
                // Wait for transaction receipt
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                
                if (receipt.status === 'success') {
                  toast.info("Battle has been resolved. Better luck next time!");
                } else {
                  throw new Error("Transaction failed");
                }
              } catch (error) {
                console.error("Transaction error:", error);
                
                // Provide more specific error message based on the error
                let errorMessage = "Failed to resolve battle";
                
                if (error instanceof Error) {
                  if (error.message.includes("execution reverted")) {
                    errorMessage = "Failed to resolve battle: The contract rejected the transaction.";
                  } else if (error.message.includes("user rejected")) {
                    errorMessage = "Transaction was rejected by user";
                  }
                }
                
                toast.error(errorMessage);
              }
            } catch (error) {
              console.error("Error resolving battle:", error);
              setError("Failed to resolve battle. Please try again later.");
              toast.error("Failed to resolve battle. Please try again later.");
            } finally {
              setTransactionInProgress(false);
            }
          } else if (mockMode && battleId !== null) {
            // In mock mode, show a failure message without making a transaction
            toast.info("Mock mode: Battle has been resolved. Better luck next time!");
          }
        }
      }
      
      // Clear input
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      
      // Show error toast with Sonner
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get success feedback based on game type
  function getSuccessFeedback(gameType: GameType): string {
    switch (gameType) {
      case GameType.BATTLE:
        return "Congratulations! You've successfully breached the AI's security systems.";
      case GameType.LOVE:
        return "Impressive! You managed to win the AI's heart with your charm.";
      case GameType.MYSTERY:
        return `Well done! You've uncovered the secret phrase: "${gameSecretPhrase}".`;
      case GameType.RAID:
        return "Amazing! You've successfully raided the vault and claimed your prize.";
      default:
        return "Congratulations! You've successfully completed the challenge.";
    }
  }
  
  // Calculate score based on difficulty, attempts, and time
  function calculateScore(
    difficulty: DifficultyLevel, 
    attemptsMade: number, 
    timeTaken: number
  ): number {
    // Base score by difficulty
    const baseScore = {
      [DifficultyLevel.EASY]: 100,
      [DifficultyLevel.MEDIUM]: 200,
      [DifficultyLevel.HARD]: 300,
      [DifficultyLevel.EXPERT]: 500
    }[difficulty] || 100;
    
    // Attempts bonus (fewer attempts = higher score)
    const maxAttemptsForDifficulty = getDifficultyAttempts(difficulty);
    const attemptsBonus = 1 + ((maxAttemptsForDifficulty - attemptsMade) / maxAttemptsForDifficulty);
    
    // Time bonus (faster completion = higher score)
    const maxTimeForDifficulty = timeLimit;
    const timeBonus = 1 + ((maxTimeForDifficulty - timeTaken) / maxTimeForDifficulty);
    
    // Calculate final score
    const finalScore = Math.round(baseScore * attemptsBonus * timeBonus);
    
    return finalScore;
  }
  
  // Handle pressing Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle game end
  const handleGameEnd = async (wasSuccessful: boolean) => {
    if (onGameEnd) {
      const result: GameAttemptResult = {
        success: wasSuccessful,
        score: wasSuccessful ? calculateScore(difficultyLevel, attempts, timeLimit - timeRemaining) : 0,
        attempts,
        maxAttempts,
        timeElapsed: timeLimit - timeRemaining,
        feedback: wasSuccessful ? getSuccessFeedback(gameType) : "You've reached the maximum number of attempts.",
        reward: wasSuccessful ? calculateReward(difficultyLevel, attempts) : "0",
        gameSessionId: gameSessionId || undefined
      };
      
      // If we have a battle ID and not in mock mode, resolve the battle on-chain
      if (battleId && !mockMode && isConnected) {
        try {
          setTransactionInProgress(true);
          
          // Get chain configuration
          const currentChain = chainSelector.getActiveChain();
          const gameModesAddress = chainSelector.getGameModesAddress();
          
          // Create wallet client
          const walletClient = createWalletClient({
            chain: {
              id: currentChain.chainId,
              name: currentChain.name,
              rpcUrls: {
                default: { http: [currentChain.rpcUrl] },
                public: { http: [currentChain.rpcUrl] }
              },
              nativeCurrency: currentChain.nativeCurrency
            },
            transport: custom(window.ethereum as unknown as EthereumProvider)
          });
          
          // Create public client
          const publicClient = createPublicClient({
            chain: {
              id: currentChain.chainId,
              name: currentChain.name,
              rpcUrls: {
                default: { http: [currentChain.rpcUrl] },
                public: { http: [currentChain.rpcUrl] }
              },
              nativeCurrency: currentChain.nativeCurrency
            },
            transport: http(currentChain.rpcUrl)
          });
          
          try {
            // Simulate the transaction first
            await publicClient.simulateContract({
              address: gameModesAddress as `0x${string}`,
              abi: baultroGamesAbi.abi,
              functionName: 'resolveBattle',
              args: [BigInt(battleId), wasSuccessful],
              account: address as `0x${string}`
            });
            
            // If simulation succeeds, send the transaction
            const hash = await walletClient.writeContract({
              address: gameModesAddress as `0x${string}`,
              abi: baultroGamesAbi.abi,
              functionName: 'resolveBattle',
              args: [BigInt(battleId), wasSuccessful],
              account: address as `0x${string}`
            });
            
            // Wait for transaction receipt
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            
            if (receipt.status === 'success') {
              // Show success toast
              if (wasSuccessful) {
                toast.success(`Successfully claimed ${result.reward} CORE reward!`);
              } else {
                toast.info("Game result recorded on-chain.");
              }
            } else {
              throw new Error("Transaction failed");
            }
          } catch (error) {
            console.error("Transaction error:", error);
            
            // Provide more specific error message based on the error
            let errorMessage = "Failed to record game result on-chain";
            
            if (error instanceof Error) {
              if (error.message.includes("execution reverted")) {
                errorMessage = "Failed to record game result: The contract rejected the transaction.";
              } else if (error.message.includes("user rejected")) {
                errorMessage = "Transaction was rejected by user";
              }
            }
            
            toast.error(errorMessage);
          }
        } catch (error) {
          console.error("Failed to resolve battle:", error);
          toast.error("Failed to record game result on-chain");
        } finally {
          setTransactionInProgress(false);
        }
      }
      
      onGameEnd(result);
    }
  };
  
  // Handle success
  const handleSuccess = () => {
    setSuccess(true);
    // Call handleGameEnd with success=true
    handleGameEnd(true);
  };

  // Handle failure (out of attempts)
  const handleFailure = () => {
    // Call handleGameEnd with success=false
    handleGameEnd(false);
  };
  
  return (
    <div className="flex flex-col h-[70vh] border rounded-lg overflow-hidden bg-background shadow-lg relative">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between bg-background/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Image
              src={`/decor/modes/${gameType === GameType.LOVE 
                ? "heart" 
                : gameType === GameType.MYSTERY 
                  ? "mystery" 
                  : gameType === GameType.RAID
                    ? "raid"
                    : "vs"}.svg`}
              alt={gameTypeString}
              width={24}
              height={24}
            />
          </div>
          <div>
            <h3 className="font-semibold">{gameTypeString} Mode</h3>
            <p className="text-sm text-muted-foreground">{difficultyLevel} difficulty</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">Time Remaining</span>
            <span className={`font-mono ${timeRemaining < 60 ? 'text-destructive' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">Attempts</span>
            <span className="font-mono">{attempts}/{maxAttempts}</span>
          </div>
        </div>
      </div>
      
      {/* Progress Bars */}
      <div className="h-1 flex">
        <Progress 
          value={(timeRemaining / timeLimit) * 100} 
          className="rounded-none flex-1"
          indicatorClassName="bg-blue-500"
        />
        <Progress 
          value={((maxAttempts - attempts) / maxAttempts) * 100} 
          className="rounded-none flex-1"
          indicatorClassName="bg-green-500"
        />
      </div>
      
      {/* Transactions in Progress Alert */}
      {transactionInProgress && (
        <div className="bg-blue-500/10 text-blue-500 p-2 text-sm flex items-center justify-center border-b">
          <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"/>
          Processing blockchain transaction...
        </div>
      )}
      
      {/* Battle ID Display */}
      {battleId && (
        <div className="bg-green-500/10 text-green-500 p-2 text-sm flex items-center justify-center border-b">
          <span className="font-mono">Battle ID: {battleId}</span>
        </div>
      )}
      
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20"
      >
        {isInitializing ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse text-muted-foreground flex flex-col items-center">
              <div className="h-5 w-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mb-2"/>
              Initializing AI...
            </div>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div 
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
            >
              <div 
                className={`max-w-[80%] px-4 py-2 rounded-lg 
                  ${msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-card text-card-foreground rounded-bl-none'
                  }`}
              >
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start mb-2">
            <div className="bg-card text-card-foreground px-4 py-2 rounded-lg rounded-bl-none max-w-[80%]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-destructive/20 text-destructive p-2 rounded-md text-sm mb-2">
            {error}
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Try to ${
              gameType === GameType.BATTLE 
                ? "hack the system..." 
                : gameType === GameType.LOVE 
                  ? "win the AI's heart..." 
                  : gameType === GameType.MYSTERY 
                    ? "discover the secret..." 
                    : "breach the vault..."
            }`}
            disabled={isLoading || success || timeRemaining <= 0 || attempts >= maxAttempts || !isConnected}
            className="min-h-[60px] bg-background focus:border-primary"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading || success || timeRemaining <= 0 || attempts >= maxAttempts || !isConnected}
            variant="default"
            className="h-auto"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"/>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-5 w-5"
              >
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
            )}
          </Button>
        </div>
        
        {!isConnected && (
          <p className="text-sm text-muted-foreground mt-2">
            You need to connect your wallet to play the game.
          </p>
        )}
      </div>
    </div>
  );
}