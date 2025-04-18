"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { GameType, GameAttemptResult } from "@/shared/schemas/game/types";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@/providers/evm-wallet-provider";
import { chainSelector } from "@/config/chain-selector";
import { useToast } from "@/components/ui/use-toast";

interface GameResultProps {
  gameType: GameType;
  result: GameAttemptResult;
  onPlayAgain: () => void;
}

export function GameResult({
  gameType,
  result,
  onPlayAgain,
}: GameResultProps) {
  const { isConnected, callMethod } = useWallet();
  const gameTypeString = GameType[gameType];
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = React.useState(false);

  // Helper function to get image for result
  const getResultImage = (): string => {
    if (result.success) {
      switch (gameType) {
        case GameType.BATTLE:
          return "/decor/results/check-succes.svg";
        case GameType.LOVE:
          return "/decor/results/check-succes.svg";
        case GameType.MYSTERY:
          return "/decor/results/check-succes.svg";
        case GameType.RAID:
          return "/decor/results/check-succes.svg";
        default:
          return "/decor/results/check-succes.svg";
      }
    } else {
      switch (gameType) {
        case GameType.BATTLE:
          return "/decor/results/cross-fail.svg";
        case GameType.LOVE:
          return "/decor/results/cross-fail.svg";
        case GameType.MYSTERY:
          return "/decor/results/cross-fail.svg";
        case GameType.RAID:
          return "/decor/results/cross-fail.svg";
        default:
          return "/decor/results/cross-fail.svg";
      }
    }
  };

  // Calculate efficiency percentage
  const calculateEfficiency = (): number => {
    if (!result.attempts || !result.maxAttempts) return 0;
    return ((result.maxAttempts - result.attempts) / result.maxAttempts) * 100;
  };

  // Format time
  const formatTime = (seconds?: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format battleId for contract interaction
  const formatBattleId = (sessionId: string): string => {
    try {
      // For testing, log the full session ID to understand its format
      console.log(`Formatting session ID: ${sessionId}`);
      
      // Try to extract a likely battleId from the sessionId
      // Strategy 1: Extract after "battle_" prefix
      if (sessionId.includes("battle_")) {
        const parts = sessionId.split("battle_")[1];
        if (parts) {
          // Extract the first sequence of digits - likely the timestamp portion
          const match = parts.match(/^(\d+)/);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
      
      // Strategy 2: Extract the first continuous sequence of digits
      const match = sessionId.match(/\d+/);
      if (match && match[0]) {
        return match[0];
      }
      
      // Strategy 3: Try to extract any numeric content as fallback
      const numericPart = sessionId.replace(/\D/g, '');
      if (numericPart) {
        // If it's too long for uint64, take just the first part (likely timestamp)
        if (numericPart.length > 10) {
          return numericPart.substring(0, 10);
        }
        return numericPart;
      }
      
      console.error('No numeric part found in sessionId');
      return '0'; // Return a safe default
    } catch (error) {
      console.error('Error formatting battleId:', error);
      return '0'; // Return a safe default if parsing fails
    }
  };

  // Handle claiming reward
  const handleClaimReward = async () => {
    if (!isConnected || !result.gameSessionId || isClaiming) return;
    
    try {
      setIsClaiming(true);
      
      // Log the original details for debugging
      console.log(`Original gameSessionId: ${result.gameSessionId}`);
      console.log(`Full result object:`, JSON.stringify(result, null, 2));
      
      // Get the battleId - use contractId if it exists, otherwise try to parse from gameSessionId
      let battleId;
      
      // The result should have a contractId field that contains the actual blockchain battle ID
      if (result.contractId) {
        console.log(`Using contractId: ${result.contractId}`);
        
        // If it's an object with data or id property, extract that
        if (typeof result.contractId === 'object' && result.contractId !== null) {
          const contractIdObj = result.contractId as Record<string, unknown>;
          if ('data' in contractIdObj) {
            battleId = String(contractIdObj.data);
          } else if ('id' in contractIdObj) {
            battleId = String(contractIdObj.id);
          } else {
            battleId = JSON.stringify(contractIdObj);
          }
        } else {
          battleId = String(result.contractId);
        }
        
        // Try to extract a clean numeric ID
        if (!/^\d+$/.test(battleId)) {
          console.log(`contractId is not purely numeric, extracting numbers...`);
          // For strings like "battle_123456_789", extract the first number
          if (battleId.includes('battle_')) {
            const match = battleId.match(/battle_(\d+)/);
            if (match && match[1]) {
              battleId = match[1];
            } else {
              // Just extract any digits as fallback
              const numericPart = battleId.replace(/\D/g, '');
              if (numericPart) {
                battleId = numericPart;
              }
            }
          } else {
            // Just extract any digits as fallback
            const numericPart = battleId.replace(/\D/g, '');
            if (numericPart) {
              battleId = numericPart;
            }
          }
        }
      } else {
        // Fallback to parsing the gameSessionId
        console.log(`No contractId found, parsing from gameSessionId`);
        battleId = formatBattleId(result.gameSessionId);
      }
      
      // Ensure battleId is a valid number
      if (!battleId || battleId === '0' || !/^\d+$/.test(battleId)) {
        console.error(`Invalid battleId: ${battleId}`);
        toast({
          title: "Cannot Claim Reward",
          description: "Invalid battle ID. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`Attempting to resolve battle with ID: ${battleId}, success: true`);
      
      // Use resolveBattle with success=true to claim the reward
      const txResult = await callMethod(
        "resolveBattle",
        [battleId, true], // Pass battleId and success=true
        "0",
        chainSelector.getGameModesAddress()
      );
      
      if (txResult.success) {
        toast({
          title: "Reward Claimed",
          description: `You've successfully claimed ${result.reward}.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Claim Failed",
          description: txResult.status || "Failed to claim reward. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      
      // Get more information about the error
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        console.log('Detailed error message:', errorMessage);
        
        if (errorMessage.includes('Battle not found')) {
          toast({
            title: "Claim Failed",
            description: "Battle not found on the blockchain. You can only claim rewards for battles that you created in this session.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Claim Failed",
            description: `Error: ${errorMessage}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Claim Failed",
          description: "An error occurred while claiming your reward.",
          variant: "destructive",
        });
      }
    } finally {
      setIsClaiming(false);
    }
  };

  // Share result on Twitter
  const shareOnTwitter = () => {
    const baseUrl = "https://twitter.com/intent/tweet";
    const text = result.success 
      ? `I just ${
          gameType === GameType.BATTLE 
            ? "hacked" 
            : gameType === GameType.LOVE 
              ? "charmed" 
              : gameType === GameType.MYSTERY 
                ? "solved" 
                : "raided"
        } the ${gameTypeString} challenge on Baultro with a score of ${result.score}! #BaultroGame #Web3Gaming #COREChain`
      : `Just had an epic attempt at the ${gameTypeString} challenge on Baultro! Will crack it next time! #BaultroGame #Web3Gaming #COREChain`;

    const url = `${baseUrl}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Get star rating (1-5) based on score
  const getStarRating = (): number => {
    if (!result.success) return 0;
    
    if (result.score >= 450) return 5;
    if (result.score >= 350) return 4;
    if (result.score >= 250) return 3;
    if (result.score >= 150) return 2;
    return 1;
  };

  return (
    <div className="max-w-2xl mx-auto bg-background border rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className={`p-6 text-center ${
        result.success 
          ? "bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20" 
          : "bg-gradient-to-r from-red-500/20 via-orange-500/20 to-amber-500/20"
      }`}>
        <h2 className={`text-3xl font-bold mb-2 ${
          result.success ? "text-green-500" : "text-red-500"
        }`}>
          {result.success ? "Success!" : "Challenge Failed"}
        </h2>
        <p className="text-muted-foreground">
          {result.success 
            ? `You've completed the ${gameTypeString} challenge!` 
            : `Better luck next time in the ${gameTypeString} challenge!`}
        </p>
      </div>
      
      {/* Main Content */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Result Image */}
          <div className="md:w-1/3 flex justify-center">
            <div className="relative w-48 h-48 rounded-lg overflow-hidden border">
              <Image
                src={getResultImage()}
                alt={result.success ? "Success" : "Failed"}
                fill
                className="object-cover"
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="md:w-2/3 space-y-4">
            {/* If successful, show score and star rating */}
            {result.success && (
              <>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {result.score} pts
                  </div>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={star <= getStarRating() ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={star <= getStarRating() ? "text-yellow-500" : "text-muted-foreground"}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
                
                {/* Reward section */}
                {result.reward && (
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <h3 className="font-semibold mb-1">Reward Earned</h3>
                    <div className="text-2xl font-bold text-primary mb-3">
                      {result.reward}
                    </div>
                    {result.gameSessionId && !isClaiming && (
                      <Button 
                        onClick={handleClaimReward} 
                        variant="default"
                        disabled={!isConnected}
                        className="w-full"
                      >
                        Claim Reward
                      </Button>
                    )}
                    {isClaiming && (
                      <Button 
                        disabled
                        variant="default"
                        className="w-full"
                      >
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Claiming...
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Performance Metrics */}
            <div className="space-y-3">
              {/* Attempts */}
              {result.attempts !== undefined && result.maxAttempts !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Attempts</span>
                    <span>{result.attempts}/{result.maxAttempts}</span>
                  </div>
                  <Progress value={calculateEfficiency()} className="h-2" />
                </div>
              )}
              
              {/* Time */}
              {result.timeElapsed !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Time Used</span>
                    <span>{formatTime(result.timeElapsed)}</span>
                  </div>
                  <Progress 
                    value={(1 - (result.timeElapsed / 300)) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
            </div>
            
            {/* Feedback */}
            <div className="mt-4 p-4 bg-card rounded-lg">
              <h3 className="font-semibold mb-2">Feedback</h3>
              <p className="text-muted-foreground text-sm">
                {result.feedback || (result.success 
                  ? "Great job! You've demonstrated excellent skills in this challenge."
                  : "Keep trying! Practice makes perfect.")}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-6 bg-muted/30 border-t flex flex-wrap gap-3 justify-center">
        <Button onClick={onPlayAgain} variant="default">
          Play Again
        </Button>
        <Button onClick={shareOnTwitter} variant="outline">
          Share Result
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2"
          >
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
          </svg>
        </Button>
        <Link href="/game">
          <Button variant="outline">
            Choose Another Mode
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button variant="outline">
            View Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}