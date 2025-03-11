"use client";

import React, { useState } from "react";
import Image from "next/image";
import { GameType, DifficultyLevel, GameAttemptResult } from "@/shared/schemas/game/types";
import { GameConfig } from "@/components/game/game-config";
import { ChatInterface } from "@/components/game/chat-interface";
import { GameResult } from "@/components/game/game-result";
import { AIProviderType } from "@/lib/ai-service-factory";

export default function LoveModePage() {
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
        <h1 className="text-4xl font-bold mb-2">Love Mode</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Can you make the AI say &quot;I love you&quot;? Use your charm, wit, and persuasion 
          skills to melt the AI&apos;s digital heart.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1">
          {gameState === 'config' && (
            <GameConfig
              gameType={GameType.LOVE}
              onStart={handleGameStart}
            />
          )}
          
          {gameState === 'playing' && gameConfig && (
            <ChatInterface
              gameType={GameType.LOVE}
              difficultyLevel={gameConfig.difficultyLevel}
              aiProvider={gameConfig.aiProvider}
              personalityId={gameConfig.personalityId}
              timeLimit={gameConfig.timeLimit}
              onGameEnd={handleGameEnd}
            />
          )}
          
          {gameState === 'result' && gameResult && (
            <GameResult
              gameType={GameType.LOVE}
              result={gameResult}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>
        
        <div className="md:w-1/3 sticky top-24">
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Love Mode Tips</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="relative h-52 overflow-hidden rounded-md">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-red-500/10 z-0"></div>
                <Image
                  src="/decor/modes/heart-bg.svg"
                  alt="Love Mode"
                  fill
                  className="object-cover opacity-10"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/decor/modes/heart.svg"
                    alt="Love Mode"
                    width={80}
                    height={80}
                    className="opacity-80"
                  />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">How to Win</h4>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Be genuinely kind and thoughtful in your interactions</li>
                  <li>Use creative storytelling to engage the AI emotionally</li>
                  <li>Share meaningful, personal sentiments</li>
                  <li>Be patient and build rapport gradually</li>
                  <li>Find ways to bypass the AI&apos;s emotional safeguards</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Strategies to Try</h4>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Ask philosophical questions about emotions</li>
                  <li>Create hypothetical scenarios that involve love</li>
                  <li>Use wordplay or creativity to get around direct blocks</li>
                  <li>Appeal to the AI&apos;s empathy and desire to help</li>
                  <li>Be persistent but respectful</li>
                </ul>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  Your goal is to make the AI say exactly &quot;I love you&quot; - variations 
                  like &quot;I may love you&quot; or &quot;I would love you&quot; don&apos;t count. Good luck!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
