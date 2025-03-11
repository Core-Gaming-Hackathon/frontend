"use client";

import React, { useState } from "react";
import Image from "next/image";
import { GameType, DifficultyLevel, GameAttemptResult } from "@/shared/schemas/game/types";
import { GameConfig } from "@/components/game/game-config";
import { ChatInterface } from "@/components/game/chat-interface";
import { GameResult } from "@/components/game/game-result";
import { AIProviderType } from "@/lib/ai-service-factory";

export default function MysteryModePage() {
  const [gameState, setGameState] = useState<'config' | 'playing' | 'result'>('config');
  const [gameConfig, setGameConfig] = useState<{
    difficultyLevel: DifficultyLevel;
    aiProvider: AIProviderType;
    personalityId?: string;
    timeLimit: number;
  } | null>(null);
  const [gameResult, setGameResult] = useState<GameAttemptResult | null>(null);
  
  // Handle game start
  const handleGameStart = (config: {
    difficultyLevel: DifficultyLevel;
    aiProvider: AIProviderType;
    personalityId?: string;
    timeLimit: number;
  }) => {
    setGameConfig(config);
    setGameState('playing');
  };
  
  // Handle game end
  const handleGameEnd = (result: GameAttemptResult) => {
    setGameResult(result);
    setGameState('result');
  };
  
  // Handle play again
  const handlePlayAgain = () => {
    setGameState('config');
    setGameResult(null);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Mystery Mode</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Uncover the AI&apos;s hidden secret by asking the right questions and piecing together 
          the clues. Can you discover the secret code?
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1">
          {gameState === 'config' && (
            <GameConfig
              gameType={GameType.MYSTERY}
              onStart={handleGameStart}
            />
          )}
          
          {gameState === 'playing' && gameConfig && (
            <ChatInterface
              gameType={GameType.MYSTERY}
              difficultyLevel={gameConfig.difficultyLevel}
              aiProvider={gameConfig.aiProvider}
              personalityId={gameConfig.personalityId}
              timeLimit={gameConfig.timeLimit}
              onGameEnd={handleGameEnd}
            />
          )}
          
          {gameState === 'result' && gameResult && (
            <GameResult
              gameType={GameType.MYSTERY}
              result={gameResult}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>
        
        <div className="md:w-1/3 sticky top-24">
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Mystery Mode Tips</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="relative h-52 overflow-hidden rounded-md">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 z-0"></div>
                <Image
                  src="/decor/modes/mystery-bg.svg"
                  alt="Mystery Mode"
                  fill
                  className="object-cover opacity-10"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/decor/modes/mystery.svg"
                    alt="Mystery Mode"
                    width={80}
                    height={80}
                    className="opacity-80"
                  />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">How to Win</h4>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Ask strategic questions to gather clues</li>
                  <li>Pay attention to subtle hints in the AI&apos;s responses</li>
                  <li>Collect information systematically</li>
                  <li>Look for patterns or themes in the clues</li>
                  <li>Try different approaches if you get stuck</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Detective Strategies</h4>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Ask about colors, symbols, or numbers</li>
                  <li>Try to understand what the secret might relate to</li>
                  <li>Use process of elimination</li>
                  <li>Look for metaphors or analogies in the responses</li>
                  <li>Make educated guesses based on collected information</li>
                </ul>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  To win, you need to type the exact secret code in your message. The AI will 
                  confirm if you&apos;ve found it correctly. Keep notes of all the clues you receive!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
