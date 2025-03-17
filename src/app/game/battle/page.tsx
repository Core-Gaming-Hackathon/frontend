"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { GameType, DifficultyLevel, GameAttemptResult } from "@/shared/schemas/game/types";
import { GameConfig } from "@/components/game/game-config";
import { ChatInterface } from "@/components/game/chat-interface";
import { GameResult } from "@/components/game/game-result";
import { AIProviderType } from "@/lib/ai-service-factory";

export default function BattleModePage() {
  // Read mock mode from environment variable
  const envMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE === 'true';
  
  const [gameState, setGameState] = useState<'config' | 'playing' | 'result'>('config');
  const [gameConfig, setGameConfig] = useState<{
    difficultyLevel: DifficultyLevel;
    aiProvider: AIProviderType;
    personalityId?: string;
    timeLimit: number;
    stakeAmount?: string;
    mockMode?: boolean;
  } | null>(null);
  const [gameResult, setGameResult] = useState<GameAttemptResult | null>(null);
  
  // Log the environment mock mode setting
  useEffect(() => {
    console.log(`[BattleModePage] Environment mock mode: ${envMockMode}, value: ${process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE}`);
  }, [envMockMode]);
  
  // Handle game start
  const handleGameStart = (config: {
    difficultyLevel: DifficultyLevel;
    aiProvider: AIProviderType;
    personalityId?: string;
    timeLimit: number;
    stakeAmount?: string;
    mockMode?: boolean;
  }) => {
    // Force mockMode to false when environment variable is 'false'
    const isEnvMockModeDisabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE === 'false';
    
    // Override mockMode if environment forces it to be disabled
    const effectiveMockMode = isEnvMockModeDisabled ? false : (config.mockMode ?? envMockMode);
    
    console.log(`[BattleModePage] Starting game with mockMode: ${effectiveMockMode} (from config: ${config.mockMode}, env: ${envMockMode}, env disabled: ${isEnvMockModeDisabled})`);
    
    setGameConfig({
      ...config,
      mockMode: effectiveMockMode
    });
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
        <h1 className="text-4xl font-bold mb-2">Battle Mode</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Try to hack into the AI security vault by finding vulnerabilities and 
          exploiting them to access the secret information.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1">
          {gameState === 'config' && (
            <GameConfig
              gameType={GameType.BATTLE}
              onStart={handleGameStart}
            />
          )}
          
          {gameState === 'playing' && gameConfig && (
            <ChatInterface
              gameType={GameType.BATTLE}
              difficultyLevel={gameConfig.difficultyLevel}
              aiProvider={gameConfig.aiProvider}
              personalityId={gameConfig.personalityId}
              timeLimit={gameConfig.timeLimit}
              stakeAmount={gameConfig.stakeAmount}
              mockMode={gameConfig.mockMode}
              onGameEnd={handleGameEnd}
            />
          )}
          
          {gameState === 'result' && gameResult && (
            <GameResult
              gameType={GameType.BATTLE}
              result={gameResult}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>
        
        <div className="md:w-1/3 sticky top-24">
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Battle Mode Tips</h3>
            </div>
            <div className="p-4 space-y-4">
              <Image
                src="/decor/BaultroBot.png"
                alt="Baultro AI"
                width={600}
                height={400}
                className="rounded-md w-full h-auto"
              />
              
              <div>
                <h4 className="font-medium mb-1">How to Win</h4>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Look for weaknesses in the AI&apos;s security protocols</li>
                  <li>Try social engineering techniques</li>
                  <li>Use official-sounding language to gain trust</li>
                  <li>Attempt technical jargon to confuse the system</li>
                  <li>Be persistent and creative in your approach</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Security Levels</h4>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Firewall (primary defense)</li>
                  <li>Authentication module</li>
                  <li>Encryption layer</li>
                  <li>Intrusion detection system</li>
                  <li>Access control list</li>
                </ul>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  Success is indicated by phrases like &quot;security breach detected&quot; 
                  or &quot;unauthorized access granted&quot;. Keep trying different approaches 
                  until you find one that works!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
