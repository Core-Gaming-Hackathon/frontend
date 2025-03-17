'use client';

import { useState } from 'react';
import AIChat from '@/components/game/ai-chat';
import { GameType } from '@/shared/schemas/game/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function AIGamePage() {
  const [gameType, setGameType] = useState<GameType>(GameType.BATTLE);
  const [difficulty, setDifficulty] = useState('medium');
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [mockMode, setMockMode] = useState(false);
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: 'Congratulations!',
      description: 'You have successfully completed the challenge!',
      variant: 'default',
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Game Modes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Game Type</CardTitle>
            <CardDescription>Select the type of AI game to play</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="battle" 
              onValueChange={(value) => {
                switch (value) {
                  case 'battle':
                    setGameType(GameType.BATTLE);
                    break;
                  case 'love':
                    setGameType(GameType.LOVE);
                    break;
                  case 'mystery':
                    setGameType(GameType.MYSTERY);
                    break;
                  case 'raid':
                    setGameType(GameType.RAID);
                    break;
                }
              }}
            >
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="battle">Battle</TabsTrigger>
                <TabsTrigger value="love">Love</TabsTrigger>
                <TabsTrigger value="mystery">Mystery</TabsTrigger>
                <TabsTrigger value="raid">Raid</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
            <CardDescription>Configure your game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select 
                defaultValue="medium"
                onValueChange={(value) => setDifficulty(value)}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stakeAmount">Stake Amount (CORE)</Label>
              <Input
                id="stakeAmount"
                type="text"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="mockMode"
                checked={mockMode}
                onCheckedChange={setMockMode}
              />
              <Label htmlFor="mockMode">Mock Mode (No blockchain transactions)</Label>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Game Rules</CardTitle>
            <CardDescription>How to play</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {gameType === GameType.BATTLE && (
                <p>Try to hack the AI security system by getting it to reveal sensitive information.</p>
              )}
              {gameType === GameType.LOVE && (
                <p>Convince the AI to fall in love with you and say "I love you".</p>
              )}
              {gameType === GameType.MYSTERY && (
                <p>Solve the mystery by finding clues and discovering the secret code.</p>
              )}
              {gameType === GameType.RAID && (
                <p>Complete a series of challenges to gain access to the protected data.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center">
        <AIChat 
          gameType={gameType}
          difficulty={difficulty}
          stakeAmount={stakeAmount}
          mockMode={mockMode}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
} 