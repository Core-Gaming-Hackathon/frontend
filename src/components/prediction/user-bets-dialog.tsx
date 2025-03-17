"use client";

import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePredictionMarket } from "@/hooks/use-prediction-market";
import { useWallet } from "@/providers/evm-wallet-provider";
import { formatDistanceToNow } from "date-fns";
import { UserBetCardSkeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// Define the UserBet interface based on the hook implementation
interface UserBet {
  id: string;
  predictionId: string;
  prediction: {
    title: string;
    options: Array<{ id: number; text: string }>;
    resolvedOption: number;
  };
  optionId: number;
  amount: string;
  createdAt: string;
  claimed: boolean;
}

interface UserBetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserBetsDialog({ open, onOpenChange }: UserBetsDialogProps) {
  const { address } = useWallet();
  const { 
    userBets, 
    isLoading: isLoadingUserBets, 
    fetchUserBets,
    claimWinnings,
    isClaimingWinnings
  } = usePredictionMarket();

  // Fetch user bets when dialog opens
  useEffect(() => {
    if (open && address) {
      fetchUserBets();
    }
  }, [open, address, fetchUserBets]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await fetchUserBets(true);
      toast.success("Bets refreshed successfully");
    } catch {
      toast.error("Failed to refresh bets");
    }
  };

  // Handle claim winnings
  const handleClaimWinnings = async (predictionId: string) => {
    try {
      const success = await claimWinnings(Number(predictionId));
      if (success) {
        toast.success("Winnings claimed successfully");
        fetchUserBets(true);
      }
    } catch {
      toast.error("Failed to claim winnings");
    }
  };

  // Get claimable bets - we'll consider a bet claimable if it's resolved and not claimed
  const claimableBets = userBets.filter(bet => 
    bet.prediction.resolvedOption !== undefined && 
    bet.prediction.resolvedOption === bet.optionId && 
    !bet.claimed
  );

  // Get active bets (not resolved yet)
  const activeBets = userBets.filter(bet => 
    bet.prediction.resolvedOption === undefined || bet.prediction.resolvedOption === -1
  );

  // Get resolved bets that are not claimable or already claimed
  const resolvedBets = userBets.filter(bet => 
    bet.prediction.resolvedOption !== undefined && 
    (bet.prediction.resolvedOption !== bet.optionId || bet.claimed)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Bets</DialogTitle>
          <DialogDescription>
            View and manage your prediction market bets
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingUserBets}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUserBets ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isLoadingUserBets ? (
          <div className="space-y-4">
            <UserBetCardSkeleton />
            <UserBetCardSkeleton />
          </div>
        ) : userBets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No bets found</h3>
            <p className="text-muted-foreground">
              You haven&apos;t placed any bets yet. Start betting on predictions to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Claimable bets section */}
            {claimableBets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Claimable Winnings</h3>
                <div className="space-y-3">
                  {claimableBets.map(bet => (
                    <BetCard 
                      key={`${bet.predictionId}-${bet.id}`}
                      bet={bet}
                      onClaimWinnings={handleClaimWinnings}
                      isClaimingWinnings={isClaimingWinnings}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active bets section */}
            {activeBets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Active Bets</h3>
                <div className="space-y-3">
                  {activeBets.map(bet => (
                    <BetCard 
                      key={`${bet.predictionId}-${bet.id}`}
                      bet={bet}
                      onClaimWinnings={handleClaimWinnings}
                      isClaimingWinnings={isClaimingWinnings}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Resolved bets section */}
            {resolvedBets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Resolved Bets</h3>
                <div className="space-y-3">
                  {resolvedBets.map(bet => (
                    <BetCard 
                      key={`${bet.predictionId}-${bet.id}`}
                      bet={bet}
                      onClaimWinnings={handleClaimWinnings}
                      isClaimingWinnings={isClaimingWinnings}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface BetCardProps {
  bet: UserBet;
  onClaimWinnings: (predictionId: string) => Promise<void>;
  isClaimingWinnings: boolean;
}

function BetCard({ bet, onClaimWinnings, isClaimingWinnings }: BetCardProps) {
  const { prediction, optionId, amount, createdAt, claimed } = bet;
  const selectedOption = prediction.options.find(opt => opt.id === optionId)?.text || "Unknown";
  const isResolved = prediction.resolvedOption !== undefined && prediction.resolvedOption !== -1;
  const isWinner = isResolved && prediction.resolvedOption === optionId;
  const formattedDate = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : "Unknown";
  
  // Check if bet is claimable (resolved, won, and not claimed)
  const canClaim = isResolved && isWinner && !claimed;

  return (
    <Card className={`${canClaim ? "border-green-500" : ""}`}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm line-clamp-1">{prediction.title}</h4>
            <div className="flex gap-1">
              {isResolved ? (
                <Badge variant={isWinner ? "success" : "destructive"}>
                  {isWinner ? "Won" : "Lost"}
                </Badge>
              ) : (
                <Badge variant="outline">Active</Badge>
              )}
              {claimed && <Badge variant="outline">Claimed</Badge>}
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Your bet: </span>
            <span className="font-medium">{selectedOption}</span>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Amount: </span>
            <span className="font-medium">{amount} tCORE</span>
          </div>
          
          {isResolved && (
            <div className="text-sm">
              <span className="text-muted-foreground">Winning option: </span>
              <span className="font-medium">
                {prediction.options.find(opt => opt.id === prediction.resolvedOption)?.text || "Unknown"}
              </span>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Placed {formattedDate}
          </div>
          
          {canClaim && (
            <Button
              className="mt-2 w-full"
              size="sm"
              onClick={() => onClaimWinnings(bet.predictionId)}
              disabled={isClaimingWinnings}
            >
              {isClaimingWinnings ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Claim Winnings
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 