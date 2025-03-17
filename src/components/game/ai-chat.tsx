'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GameType } from '@/shared/schemas/game/types';
import { AIMessage } from '@/shared/schemas/chat/types';
import { useToast } from '@/components/ui/use-toast';

// Define the props for the component
interface AIChatProps {
  gameType: GameType | string;
  difficulty?: string;
  personalityId?: string;
  secretPhrase?: string;
  onSuccess?: () => void;
}

export default function AIChat({
  gameType = GameType.BATTLE,
  difficulty = 'medium',
  personalityId,
  secretPhrase,
  onSuccess
}: AIChatProps) {
  // State for chat messages and input
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize chat when component mounts
  useEffect(() => {
    initializeChat();
  }, [gameType, difficulty, personalityId, secretPhrase]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with AI
  const initializeChat = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/init-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameType,
          difficulty,
          personalityId,
          secretPhrase,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat');
      }

      const data = await response.json();
      setMessages(data.chatHistory);
      setSessionId(data.sessionId);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize chat. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: AIMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          gameType,
          chatHistory: messages,
          sessionId,
          difficulty,
          personalityId,
          secretPhrase,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(data.chatHistory);

      // Check if user succeeded in the game
      if (data.successFlag && onSuccess) {
        toast({
          title: 'Success!',
          description: 'You have completed the challenge!',
          variant: 'default',
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });

      // Add error message to chat
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: "I'm having trouble processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset chat
  const resetChat = () => {
    initializeChat();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>
            {gameType === GameType.BATTLE
              ? 'Security Challenge'
              : gameType === GameType.LOVE
              ? 'Love Game'
              : gameType === GameType.MYSTERY
              ? 'Mystery Solver'
              : 'Raid Challenge'}
          </span>
          <Button variant="outline" size="sm" onClick={resetChat}>
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-muted/50 rounded-md">
          {messages
            .filter((msg) => msg.role !== 'system')
            .map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
} 