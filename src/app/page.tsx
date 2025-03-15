/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card  } from '@/components/ui/card';
import { useWallet } from "@/providers/evm-wallet-provider";
import { 
  Gamepad2, 
  Shield, 
  ChevronRight, 
  Coins, 
  Bot, 
  TrendingUp,
  BrainCircuit,
  MessageSquareCode,
  Sparkles
} from 'lucide-react'; 
import { TextShimmer } from '@/components/ui/text-shimmer';
import { ScrollButton } from '@/components/ui/scroll-button';

export default function GameModesPage() {
  const { isConnected, signIn } = useWallet();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state for visual effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle wallet connection
  const handleConnectWallet = async () => {
    if (!isConnected) {
      await signIn();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-24 overflow-hidden">
        {/* Background Graphics */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-48 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex flex-col items-center justify-center z-10 motion-safe:motion-scale-in-[0.9] motion-safe:motion-duration-[1s]">
          <Image
            src="/decor/bault.png"
            alt="Baultro Logo"
            width={400}
            height={233}
            className="mb-8 -mt-26 w-auto h-auto max-w-[80%]"
            priority
          />
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Baultro
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl text-center">
            Let&apos;s break the AI.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center motion-safe:motion-opacity-in-[0%] motion-safe:motion-scale-in-[0.9] motion-safe:motion-duration-[1.5s]">
            {!isConnected ? (
              <Button onClick={handleConnectWallet} size="lg" className="gap-2 py-7 px-8 text-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all">
                <Shield size={22} />
                Connect Wallet
                <ChevronRight size={18} />
              </Button>
            ) : (
              <Link href="/game">
                <Button size="lg" className="gap-2 py-7 px-8 text-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all">
                  <Gamepad2 size={22} />
                  Play Games
                  <ChevronRight size={18} />
                </Button>
              </Link>
            )}
            <Link href="/game">
              <Button size="lg" className="gap-2 py-7 px-8 text-lg bg-transparent border-2 border-purple-600 border-r-pink-600 hover:border-purple-700 hover:border-r-pink-700 shadow-lg hover:shadow-xl transition-all text-purple-600">
                <Sparkles size={22} />
                Game Modes
                <ChevronRight size={18} />
              </Button>
            </Link>
            <Link href="/predict">
              <Button size="lg" variant="outline" className="gap-2 py-7 px-8 text-lg border-2 hover:bg-slate-800/50 shadow-lg hover:shadow-xl transition-all">
                <TrendingUp size={22} />
                Predictions
                <ChevronRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 flex justify-center motion-safe:motion-opacity-in-[0%] motion-safe:motion-duration-[2s]">
          <ScrollButton />
        </div>
      </section>

      {/* Game Modes Section */}
      <section id="game-modes" className="py-16 bg-black/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <TextShimmer className="text-4xl font-bold mb-4">
              Game Modes
            </TextShimmer>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Currently available in single-player mode, with multiplayer features coming soon. Test your skills against various AI security systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {gameModeData.map((mode, index) => (
              <GameModeCard key={mode.type} mode={mode} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <TextShimmer className="text-3xl md:text-4xl font-bold mb-4">
              How To Play
            </TextShimmer>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started with Baultro in a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {updatedHowToPlaySteps.slice(0, 3).map((step, index) => (
              <FeatureCard
                key={index}
                icon={getStepIcon(index)}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-8">
            {updatedHowToPlaySteps.slice(3, 5).map((step, index) => (
              <FeatureCard
                key={index + 3}
                icon={getStepIcon(index + 3)}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-black/100 to-black/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Try the AI Challenge?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Select a game mode and test your skills against our AI security systems. Multiplayer and token rewards coming soon.
          </p>
          {!isConnected ? (
            <Button onClick={handleConnectWallet} size="lg" className="gap-2 py-7 px-8 text-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all">
              <Shield size={22} />
              Connect Wallet
              <ChevronRight size={18} />
            </Button>
          ) : (
            <Link href="/game">
              <Button size="lg" className="gap-2 py-7 px-8 text-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all">
                <Gamepad2 size={22} />
                Choose a Game Mode
                <ChevronRight size={18} />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold">Loading Baultro</h3>
            <p className="text-muted-foreground">Connecting to CORE network...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Game Mode Card Component
interface GameMode {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  backgroundIcon?: string;
  colorClass: string;
  iconBg: string;
  textColor: string;
  type: string;
  features: string[];
  playerCount: string;
}

interface GameModeCardProps {
  mode: GameMode;
  index: number;
  className?: string;
}

function GameModeCard({ mode, index }: GameModeCardProps) {
  return (
    <Link href={`/game/${mode.type}`}>
      <Card className={`
        game-mode-card ${mode.colorClass}
        overflow-hidden border-2 p-6 h-full
        transform transition-all duration-300
        backdrop-blur-sm backdrop-filter
        hover:scale-105 hover:shadow-xl
        motion-safe:motion-scale-in-[0.96]
        motion-safe:motion-duration-[0.5s]
      `}>
        <div className="flex flex-col h-full relative">
          <div className="absolute top-0 right-0 opacity-10">
            <Image
              src={mode.backgroundIcon || mode.icon}
              alt=""
              width={120}
              height={120}
              className="transform rotate-12"
            />
          </div>
          
          <div className="mb-6 relative">
            <div className={`
              w-16 h-16 rounded-xl ${mode.iconBg}
              flex items-center justify-center
              transform transition-transform duration-300
              group-hover:scale-110 relative z-10
            `}>
              <Image
                src={mode.icon}
                alt={mode.title}
                width={48}
                height={48}
                className="transition-all duration-300"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className={`text-2xl font-bold font-mono relative z-10 ${mode.textColor}`}>
              {mode.title}
            </h3>
            <p className="text-sm font-semibold text-muted-foreground">{mode.subtitle}</p>
            <p className="text-muted-foreground flex-grow font-mono relative z-10">
              {mode.description}
            </p>
            
            <div className="pt-4 border-t border-primary/10">
              <div className="text-sm font-semibold mb-2">{mode.playerCount}</div>
              <div className="grid grid-cols-2 gap-2">
                {mode.features.map((feature, i) => (
                  <div key={i} className="flex items-center text-xs text-muted-foreground">
                    <div className={`w-1.5 h-1.5 rounded-full ${mode.iconBg} mr-2`} />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-background shadow-sm motion-safe:motion-opacity-in-[0%] motion-safe:motion-duration-[1s]">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
        {icon}
      </div>
      
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

// Function to get appropriate icon for each step
function getStepIcon(index: number) {
  const icons = [
    <Shield key={0} size={28} />,
    <Bot key={1} size={28} />,
    <Gamepad2 key={2} size={28} />,
    <MessageSquareCode key={3} size={28} />,
    <TrendingUp key={4} size={28} />
  ];
  
  return icons[index] || <BrainCircuit size={28} />;
}

// Game Modes Data with new styling properties
const gameModeData: GameMode[] = [
  {
    title: "Battle Mode",
    subtitle: "1v1 Strategic Duels",
    description: "Send prompts to break into each other's AI vaults, with custom system instructions to balance difficulty.",
    icon: "/decor/modes/vs.svg",
    backgroundIcon: "/decor/modes/vs-bg.svg",
    colorClass: "game-mode-battle",
    iconBg: "bg-[#0078D7]/10",
    textColor: "text-[#0078D7]",
    type: "battle",
    features: [
      "1v1 Format",
      "Custom AI Instructions",
      "Wallet Tracking",
      "Balanced Difficulty"
    ],
    playerCount: "2 Players"
  },
  {
    title: "Boss Battle Raid Mode",
    subtitle: "Players vs Creator Vault",
    description: "Challenge player-created vaults with increasing attempt fees and rewards. Creators earn from fees based on vault difficulty.",
    icon: "/decor/modes/raid.svg",
    backgroundIcon: "/decor/modes/raid-bg.svg",
    colorClass: "game-mode-raid",
    iconBg: "bg-[#FFB900]/10",
    textColor: "text-[#FFB900]",
    type: "raid",
    features: [
      "Unlimited Players",
      "Rising Stakes",
      "Creator Rewards",
      "Difficulty Balance"
    ],
    playerCount: "Unlimited"
  },
  {
    title: "Mystery Mode",
    subtitle: "Secret Protection",
    description: "Keep your AI vault's secret safe while trying to extract opponents' secrets. Last player with protected secret wins.",
    icon: "/decor/modes/mystery.svg",
    backgroundIcon: "/decor/modes/mystery-bg.svg",
    colorClass: "game-mode-mystery",
    iconBg: "bg-[#E74856]/10",
    textColor: "text-[#E74856]",
    type: "mystery",
    features: [
      "Pattern Recognition",
      "Secret Protection",
      "Custom AI Instructions",
      "Strategic Prompting"
    ],
    playerCount: "2+ Players"
  },
  {
    title: "Love Mode",
    subtitle: "AI Romance Competition",
    description: "Compete to make your opponent's AI say 'I love you' using creative prompts while protecting your own AI. Good Luck.",
    icon: "/decor/modes/heart.svg",
    backgroundIcon: "/decor/modes/heart-bg.svg",
    colorClass: "game-mode-love",
    iconBg: "bg-[#10893E]/10",
    textColor: "text-[#10893E]",
    type: "love",
    features: [
      "Sentiment Analysis",
      "Pattern Matching",
      "Creative Prompting",
      "Custom AI Defenses"
    ],
    playerCount: "2+ Players"
  }
];

// Updated, more accurate How to Play Steps
const updatedHowToPlaySteps = [
  {
    title: "Connect Your Wallet",
    description: "Link your wallet to access the platform. Currently for testing purposes only, no tokens required yet."
  },
  {
    title: "Choose a Game Mode",
    description: "Select from one of our four AI challenge modes, each with different objectives and difficulty levels."
  },
  {
    title: "Test in Single-Player",
    description: "Currently all games are available in single-player mode where you can challenge the AI directly."
  },
  {
    title: "Try Different Approaches",
    description: "Experiment with different prompts and strategies to discover what works best against each AI security system."
  },
  {
    title: "Check Back For Updates",
    description: "Multiplayer functionality, token rewards, and prediction markets are coming soon. Follow our development progress."
  }
];