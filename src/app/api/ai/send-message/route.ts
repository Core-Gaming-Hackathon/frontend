import { NextRequest, NextResponse } from 'next/server';
import { GeminiGameService } from '@/lib/gemini-game-service';
import { GameType } from '@/shared/schemas/game/types';
import { AIMessage } from '@/shared/schemas/chat/types';

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      gameType,
      chatHistory,
      sessionId,
      difficulty,
      personalityId,
      secretPhrase
    } = await request.json();
    
    // Validate input
    if (!message || !chatHistory) {
      return NextResponse.json(
        { error: 'Message and chat history are required' },
        { status: 400 }
      );
    }
    
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
    
    // Validate chat history format
    const validChatHistory: AIMessage[] = Array.isArray(chatHistory)
      ? chatHistory.filter(msg => 
          msg && 
          typeof msg === 'object' && 
          ['user', 'assistant', 'system'].includes(msg.role) &&
          typeof msg.content === 'string'
        )
      : [];
    
    // Initialize the game service
    const gameService = new GeminiGameService();
    
    // Send message and get response
    const result = await gameService.sendMessage(
      message,
      validGameType,
      validChatHistory,
      personalityId,
      difficulty || 'medium',
      secretPhrase
    );
    
    return NextResponse.json({
      ...result,
      sessionId
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 