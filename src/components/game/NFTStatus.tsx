"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@/providers/evm-wallet-provider';
import { useGame } from '@/providers/game-provider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// Array of animal SVGs for daily NFTs
const DAILY_ANIMALS = [
  'panda.svg',      // Sunday
  'tiger.svg',      // Monday
  'elephant.svg',   // Tuesday
  'lion.svg',       // Wednesday
  'frog.svg',       // Thursday
  'giraffe.svg',    // Friday
  'penguin.svg'     // Saturday
];

export function NFTStatus() {
  const { isConnected } = useWallet();
  const { checkNFTEligibility, mintDailyNFT } = useGame();
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // Get today's animal
  const getTodayAnimal = () => {
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    return DAILY_ANIMALS[dayOfWeek];
  };
  
  const todayAnimal = getTodayAnimal();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[new Date().getDay()];

  // Check eligibility on load if connected
  useEffect(() => {
    if (isConnected) {
      checkEligibility();
    }
  }, [isConnected]);

  // Function to check NFT eligibility
  const checkEligibility = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to check NFT eligibility");
      return;
    }
    
    try {
      setIsChecking(true);
      const eligible = await checkNFTEligibility();
      setIsEligible(eligible);
    } catch (error) {
      console.error("Error checking NFT eligibility:", error);
      toast.error("Failed to check NFT eligibility");
    } finally {
      setIsChecking(false);
    }
  };

  // Function to mint daily NFT
  const handleMintNFT = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to mint NFT");
      return;
    }
    
    try {
      setIsMinting(true);
      const success = await mintDailyNFT();
      
      if (success) {
        toast.success(`${todayName}&apos;s Animal NFT minted successfully!`);
        // Update eligibility after minting
        setIsEligible(false);
      } else {
        toast.error("Failed to mint NFT");
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast.error("Error minting NFT");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Image 
            src={`/animals/${todayAnimal}`}
            alt="Daily Animal NFT" 
            width={28} 
            height={28}
            className="opacity-80"
          />
          Daily Animal NFT
        </CardTitle>
        <CardDescription>
          Mint today&apos;s &quot;{todayName}&quot; animal NFT by participating in Baultro games
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Today&apos;s NFT:</span>
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 mb-1 bg-muted/20 rounded-md p-2 flex items-center justify-center">
                  <Image 
                    src={`/animals/${todayAnimal}`}
                    alt={`${todayName}&apos;s Animal`}
                    width={48}
                    height={48}
                    className={isEligible === false ? "opacity-40 grayscale" : ""}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{todayName}&apos;s Animal</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span>Mint Status:</span>
              {isChecking ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> 
                  Checking...
                </Badge>
              ) : isEligible === null ? (
                <Badge variant="outline">Unknown</Badge>
              ) : isEligible ? (
                <Badge variant="success" className="bg-green-500 text-white flex items-center gap-1">
                  <Check className="h-3 w-3" /> 
                  Available to Mint
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <X className="h-3 w-3" /> 
                  Already Claimed Today
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded-md flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>Each day you can mint one special animal NFT on Core blockchain.</p>
                <p className="mt-1">Collect them all for exclusive access to future rewards!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((offset) => {
                  const dayIndex = (new Date().getDay() + offset) % 7;
                  return (
                    <div key={offset} className="w-16 h-16 bg-muted/20 rounded-md p-2 flex items-center justify-center">
                      <Image 
                        src={`/animals/${DAILY_ANIMALS[dayIndex]}`}
                        alt={`${dayNames[dayIndex]}&apos;s Animal`}
                        width={40}
                        height={40}
                        className={offset === 0 ? "" : "opacity-40"}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-muted-foreground">
              Connect your wallet to check eligibility and mint today&apos;s animal NFT
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        {isConnected && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkEligibility}
              disabled={isChecking}
            >
              {isChecking && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Refresh Status
            </Button>
            
            <Button 
              size="sm"
              onClick={handleMintNFT}
              disabled={isMinting || !isEligible}
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Minting...
                </>
              ) : (
                "Mint Today's NFT"
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
} 