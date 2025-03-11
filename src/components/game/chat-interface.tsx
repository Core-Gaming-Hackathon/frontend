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

// Import chain configuration to get contract addresses
import { chainSelector } from "@/config/chain-selector";

// Define transaction result type that includes optional errorMessage
interface TransactionResult {
  hash: string;
  status: string;
  success: boolean;
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
}

export function ChatInterface({
  gameType,
  difficultyLevel,
  aiProvider = AIProviderType.ZEREPY,
  personalityId,
  onGameEnd,
  timeLimit = 300, // 5 minutes default
  stakeAmount = "0.1"
}: ChatInterfaceProps) {
  const { isConnected, callMethod } = useWallet();
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
  const [matchId, setMatchId] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Get string representation of game type
  const gameTypeString = GameType[gameType];

  // Map game type to valid contract modes (battle, love, mystery)
  function mapGameTypeToContractMode(type: GameType): string {
    switch (type) {
      case GameType.BATTLE:
        return "battle";
      case GameType.LOVE:
        return "love";
      case GameType.MYSTERY:
        return "mystery";
      // Default to battle for other game types
      default:
        return "battle";
    }
  }

  // Get the contract address from the configuration
  const contractAddress = chainSelector.getActiveChain().predictionMarketContract;
  
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
        
        // Submit transaction for staking
        if (isConnected && parseFloat(stakeAmount) > 0) {
          try {
            setTransactionInProgress(true);
            
            // Call BaultroGames contract to create a match
            // Using createMatch(address opponentId, string gameMode)
            const txResult = await callMethod(
              "createMatch",
              ["0x0000000000000000000000000000000000000000", mapGameTypeToContractMode(gameType)],
              toWei(stakeAmount),
              "gameModesContract" // Use the contract name to get the correct ABI
            ) as TransactionResult;
            
            if (txResult.success) {
              // Show success toast with Sonner
              toast.success(`Successfully staked ${stakeAmount} S for this game.`);
              
              // Store the match ID for future reference (if available)
              // Note: In a production app, you'd want to get the actual match ID from the transaction events
              setMatchId(Date.now());
            } else {
              console.error("Transaction failed:", txResult.status);
              toast.error(`Transaction failed: ${txResult.status || "Unknown error"}`);
            }
          } catch (err) {
            console.error("Error staking for game:", err);
            setError("Failed to stake tokens. The game will continue but without rewards.");
            
            // Show error toast with Sonner
            toast.error("Failed to stake tokens. The game will continue but without rewards.");
          } finally {
            setTransactionInProgress(false);
          }
        }
        
      } catch (err) {
        console.error("Error initializing chat:", err);
        setError("Failed to initialize chat. Please try again.");
        
        // Show error toast with Sonner
        toast.error("Failed to initialize chat. Please try again.");
      } finally {
        setIsInitializing(false);
      }
    };
    
    initChat();
  }, [gameTypeString, personalityId, aiProvider, difficultyLevel, stakeAmount, isConnected, callMethod, gameType, gameSecretPhrase, contractAddress]);
  
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
            score: getScoreForSuccess(difficultyLevel, attempts, timeTaken),
            attempts: attempts,
            maxAttempts: maxAttempts,
            timeElapsed: timeTaken,
            feedback: getSuccessFeedback(gameType),
            reward: `${reward} S`,
            gameSessionId: gameSessionId || undefined
          });
        }
        
        // Submit transaction for claiming reward if connected
        if (isConnected && matchId !== null) {
          try {
            setTransactionInProgress(true);
            
            // Call BaultroGames contract to end the match
            // Using endMatch(uint64 matchId, address winnerId, string verificationHash)
            const txResult = await callMethod(
              "endMatch", 
              [BigInt(matchId), "0x0000000000000000000000000000000000000000", gameSessionId || "game-verification"], 
              "0",
              "gameModesContract" // Use the contract name to get the correct ABI
            ) as TransactionResult;
            
            if (txResult.success) {
              // Show reward toast with Sonner
              toast.success(`You've earned ${reward} S as a reward!`);
            } else {
              console.error("Transaction failed:", txResult.status);
              toast.error(`Transaction failed: ${txResult.status || "Unknown error"}`);
            }
          } catch (err) {
            console.error("Error claiming reward:", err);
            setError("Failed to claim reward. Please try again later.");
            
            // Show error toast with Sonner
            toast.error("Failed to claim reward. Please try again later.");
          } finally {
            setTransactionInProgress(false);
          }
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
  function getScoreForSuccess(
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
    
    // Attempts multiplier (fewer attempts = higher score)
    const maxAttemptsForDifficulty = getDifficultyAttempts(difficulty);
    const attemptsMultiplier = 1 + ((maxAttemptsForDifficulty - attemptsMade) / maxAttemptsForDifficulty);
    
    // Time multiplier (faster completion = higher score)
    const maxTimeForDifficulty = timeLimit;
    const timeMultiplier = 1 + ((maxTimeForDifficulty - timeTaken) / maxTimeForDifficulty) * 0.5;
    
    // Calculate final score
    const score = Math.round(baseScore * attemptsMultiplier * timeMultiplier);
    
    return score;
  }
  
  // Handle pressing Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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