import { NextRequest, NextResponse } from 'next/server';
import { GeminiGameService } from '@/lib/gemini-game-service';
import { GameType } from '@/shared/schemas/game/types';

export async function POST(request: NextRequest) {
  try {
    const { gameType, difficulty, personalityId, secretPhrase } = await request.json();
    
    // Validate game type
    let validGameType: GameType | string = GameType.BATTLE;
    if (typeof gameType === 'string') {
      const normalizedType = gameType.toUpperCase();
      if (['BATTLE', 'LOVE', 'MYSTERY', 'RAID'].includes(normalizedType)) {
        validGameType = normalizedType;
      }
    } else if (Object.values(GameType).includes(gameType)) {
      validGameType = gameType;
    }
    
    // Initialize the game service
    const gameService = new GeminiGameService();
    
    // Initialize chat
    const result = await gameService.initGameChat(
      validGameType,
      personalityId,
      difficulty || 'medium',
      secretPhrase
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error initializing chat:', error);
    return NextResponse.json(
      { error: 'Failed to initialize chat' },
      { status: 500 }
    );
  }
} 