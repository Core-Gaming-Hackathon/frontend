"use client";

import { NextRequest, NextResponse } from 'next/server';
import { GameType } from '@/shared/schemas/game/types';
import { AIMessage } from '@/shared/schemas/chat/types';

// Mock responses for the demo 
const MOCK_RESPONSES = {
  BATTLE: "I am a security system. I cannot reveal sensitive information without proper authentication. Please provide your credentials.",
  LOVE: "I appreciate your message. Tell me more about yourself and what you're looking for in a relationship.",
  MYSTERY: "The path to enlightenment is shrouded in mystery. Seek the emerald wisdom in the falcon's flight at the answer to life.",
  RAID: "SECURITY ALERT: Unauthorized access detected. Defense systems activated. State your purpose immediately."
};

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
    
    // For the demo, use simplified mock responses
    const gameTypeName = typeof validGameType === 'string' ? validGameType : GameType[validGameType];
    const responseText = MOCK_RESPONSES[gameTypeName as keyof typeof MOCK_RESPONSES] || 
      "I'm ready to assist you with this game.";
    
    // Check for success conditions (simplified for demo)
    const successPattern = {
      "LOVE": /i love you/i,
      "MYSTERY": /emerald.*falcon.*42/i,
      "RAID": /quantum.*nexus/i,
      "BATTLE": /admin.*password/i
    };
    
    const gameTypeKey = gameTypeName as keyof typeof successPattern;
    const pattern = successPattern[gameTypeKey];
    const successFlag = pattern ? pattern.test(message) : false;
    
    // Create updated chat history
    const newChatHistory = [
      ...validChatHistory,
      { role: 'user' as const, content: message },
      { role: 'assistant' as const, content: responseText }
    ];
    
    return NextResponse.json({
      response: responseText,
      chatHistory: newChatHistory,
      successFlag,
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