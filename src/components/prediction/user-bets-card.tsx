"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle } from "lucide-react";
import { UserBet, formatDate, isResolved, isWinningBet } from "@/utils/prediction-utils";
import { usePredictionMarket } from "@/hooks/use-prediction-market";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface UserBetsCardProps {
  bet: UserBet;
  onClaimWinnings: () => void;
}

export function UserBetsCard({ bet, onClaimWinnings }: UserBetsCardProps) {
  const { claimWinnings, isClaimingWinnings } = usePredictionMarket();
  
  const predictionResolved = isResolved(bet.prediction);
  const isWinner = isWinningBet(bet);
  
  // Handle claiming winnings
  const handleClaimWinnings = async () => {
    // Call the contract to claim winnings
    const success = await claimWinnings(parseInt(bet.predictionId));
    
    if (success) {
      onClaimWinnings();
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{bet.prediction.title}</CardTitle>
          {predictionResolved ? (
            isWinner ? (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                Won
              </Badge>
            ) : (
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                Lost
              </Badge>
            )
          ) : (
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Your Bet:</div>
            <div className="p-3 rounded-md border bg-card">
              <div className="flex items-center justify-between">
                <span>{bet.prediction.options.find(o => o.id === bet.optionId)?.text || "Unknown option"}</span>
                <span className="font-medium">{bet.amount} tCORE</span>
              </div>
            </div>
          </div>
          
          {predictionResolved && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Result:</div>
              <div className={`p-3 rounded-md border ${
                isWinner ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
              }`}>
                <div className="flex items-center gap-2">
                  {isWinner ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  <span>
                    {isWinner 
                      ? "You won! The winning option was: " 
                      : "You lost. The winning option was: "}
                    <span className="font-medium">
                      {bet.prediction.options.find(o => o.id === bet.prediction.resolvedOption)?.text || "Unknown"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            Bet placed {formatDate(bet.createdAt)}
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-4">
        {predictionResolved && isWinner && !bet.claimed ? (
          <Button 
            className="w-full" 
            onClick={handleClaimWinnings}
            disabled={isClaimingWinnings}
          >
            {isClaimingWinnings ? (
              <LoadingSpinner size="sm" text="Claiming..." />
            ) : (
              "Claim Winnings"
            )}
          </Button>
        ) : predictionResolved && isWinner && bet.claimed ? (
          <div className="w-full text-center text-sm text-muted-foreground">
            Winnings claimed
          </div>
        ) : predictionResolved && !isWinner ? (
          <div className="w-full text-center text-sm text-muted-foreground">
            Better luck next time
          </div>
        ) : (
          <div className="w-full text-center text-sm text-muted-foreground">
            Waiting for resolution
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 