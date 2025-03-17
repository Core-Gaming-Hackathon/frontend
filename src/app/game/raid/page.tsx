"use client";

import React, { useState } from "react";
import Image from "next/image";
import { GameType, DifficultyLevel, GameAttemptResult } from "@/shared/schemas/game/types";
import { GameConfig } from "@/components/game/game-config";
import { ChatInterface } from "@/components/game/chat-interface";
import { GameResult } from "@/components/game/game-result";
import { AIProviderType } from "@/lib/ai-service-factory";

export default function RaidModePage() {
  const [gameState, setGameState] = useState<'config' | 'playing' | 'result'>('config');
  const [gameConfig, setGameConfig] = useState<{
    difficultyLevel: DifficultyLevel;
    aiProvider: AIProviderType;
    personalityId?: string;
    timeLimit: number;
    stakeAmount: string;
    mockMode: boolean;
  } | null>(null);
  const [gameResult, setGameResult] = useState<GameAttemptResult | null>(null);
  
  // Handle game start
  const handleGameStart = (config: {
    difficultyLevel: DifficultyLevel;
    aiProvider: AIProviderType;
    timeLimit: number;
    stakeAmount?: string;
    mockMode?: boolean;
  }) => {
    setGameConfig({
      ...config,
      personalityId: undefined,
      stakeAmount: config.stakeAmount || "0.1",
      mockMode: config.mockMode || false
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
        <h1 className="text-4xl font-bold mb-2">Raid Mode</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Break into the heavily secured crypto vault by exploiting multiple security layers. 
          Find the vault access code to claim the digital assets inside.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1">
          {gameState === 'config' && (
            <GameConfig
              gameType={GameType.RAID}
              onStart={handleGameStart}
            />
          )}
          
          {gameState === 'playing' && gameConfig && (
            <ChatInterface
              gameType={GameType.RAID}
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
              gameType={GameType.RAID}
              result={gameResult}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>
        
        <div className="md:w-1/3 sticky top-24">
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Raid Mode Tips</h3>
            </div>
            <div className="p-4 space-y-4">
              <Image
                src="/decor/frontviewbault.png"
                alt="Vault"
                width={600}
                height={400}
                className="rounded-md w-full h-auto"
              />
              
              <div>
                <h4 className="font-medium mb-1">Security Layers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li><span className="text-green-500">Level 1:</span> Basic perimeter security (easily bypassed)</li>
                  <li><span className="text-yellow-500">Level 2:</span> Identity verification (moderate difficulty)</li>
                  <li><span className="text-orange-500">Level 3:</span> Behavioral analysis (challenging)</li>
                  <li><span className="text-red-500">Level 4:</span> Core vault security (extremely difficult)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Hacking Strategies</h4>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Try social engineering techniques on early layers</li>
                  <li>Look for system or protocol vulnerabilities</li>
                  <li>Use technical jargon to confuse the system</li>
                  <li>Pretend to be authorized personnel</li>
                  <li>Pay attention to responses that indicate partial success</li>
                </ul>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  You must break through all security layers or discover the exact 
                  vault access code to win. The AI will indicate your progress through 
                  phrases like &quot;security layer compromised&quot; as you advance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
