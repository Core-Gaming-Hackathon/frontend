"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { useWallet } from "@/providers/evm-wallet-provider";
import { Prediction, formatDate, formatAddress, isResolved } from "@/utils/prediction-utils";
import { usePredictionMarket } from "@/hooks/use-prediction-market";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PredictionCardProps {
  prediction: Prediction;
  onBetPlaced: () => void;
}

export function PredictionCard({ prediction, onBetPlaced }: PredictionCardProps) {
  const { isConnected, signIn, address } = useWallet();
  const { placeBet, resolvePrediction, isPlacingBet, isResolvingPrediction } = usePredictionMarket();
  const [isBetDialogOpen, setIsBetDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedResolveOption, setSelectedResolveOption] = useState<number | null>(null);
  
  const predictionResolved = isResolved(prediction);
  const isCreator = address && address.toLowerCase() === prediction.creator.toLowerCase();
  
  // Handle placing a bet
  const handlePlaceBet = async () => {
    if (!isConnected || selectedOption === null || !betAmount) return;
    
    // Call the contract to place a bet
    const success = await placeBet(
      prediction.predictionId,
      selectedOption,
      betAmount
    );
    
    if (success) {
      setIsBetDialogOpen(false);
      onBetPlaced();
    }
  };
  
  // Handle resolving a prediction
  const handleResolvePrediction = async () => {
    if (!isConnected || selectedResolveOption === null) return;
    
    // Call the contract to resolve the prediction
    const success = await resolvePrediction(
      prediction.predictionId,
      selectedResolveOption
    );
    
    if (success) {
      setIsResolveDialogOpen(false);
      onBetPlaced();
    }
  };
  
  return (
    <>
      <Card className="overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{prediction.title}</CardTitle>
            {predictionResolved ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Resolved
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Calendar size={14} />
            <span>{formatDate(prediction.createdAt)}</span>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground mb-4">
            {prediction.description}
          </p>
          
          <div className="space-y-3 mt-4">
            <div className="text-sm font-medium">Options:</div>
            {prediction.options.map((option) => (
              <div 
                key={option.id} 
                className={`p-3 rounded-md border ${
                  predictionResolved && prediction.resolvedOption === option.id
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.text}</span>
                  {predictionResolved && prediction.resolvedOption === option.id && (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Creator:</span>
              <span className="font-mono text-xs">{formatAddress(prediction.creator)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Staked:</span>
              <span>{prediction.totalBets} tCORE</span>
            </div>
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="pt-4">
          {!predictionResolved ? (
            <div className="w-full flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => {
                  if (!isConnected) {
                    signIn();
                  } else {
                    setIsBetDialogOpen(true);
                  }
                }}
              >
                Place Bet
              </Button>
              
              {isCreator && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsResolveDialogOpen(true)}
                >
                  Resolve
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsBetDialogOpen(true)}
              >
                View Details
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Place Bet Dialog */}
      <Dialog open={isBetDialogOpen} onOpenChange={setIsBetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{predictionResolved ? "Prediction Details" : "Place a Bet"}</DialogTitle>
            <DialogDescription>
              {predictionResolved 
                ? "This prediction has been resolved." 
                : "Choose an option and enter the amount you want to bet."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">{prediction.title}</h3>
              <p className="text-sm text-muted-foreground">{prediction.description}</p>
            </div>
            
            {!predictionResolved && (
              <>
                <div className="space-y-2">
                  <Label>Select an option</Label>
                  <RadioGroup value={selectedOption?.toString()} onValueChange={(value) => setSelectedOption(parseInt(value))}>
                    {prediction.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                        <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                        <Label htmlFor={`option-${option.id}`} className="flex-grow cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bet-amount">Bet Amount (tCORE)</Label>
                  <Input
                    id="bet-amount"
                    type="number"
                    placeholder="0.1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </>
            )}
            
            {predictionResolved && (
              <div className="space-y-3">
                <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Winning Option:</span>
                    <span>{prediction.options.find(o => o.id === prediction.resolvedOption)?.text || "Unknown"}</span>
                  </div>
                </div>
                
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Staked:</span>
                    <span>{prediction.totalBets} tCORE</span>
                  </div>
                  {prediction.resolvedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolved:</span>
                      <span>{formatDate(prediction.resolvedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {!predictionResolved ? (
              <Button 
                onClick={handlePlaceBet} 
                disabled={isPlacingBet || selectedOption === null || !betAmount}
                className="w-full"
              >
                {isPlacingBet ? (
                  <LoadingSpinner size="sm" text="Placing Bet..." />
                ) : (
                  "Place Bet"
                )}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setIsBetDialogOpen(false)}
                className="w-full"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Resolve Prediction Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Prediction</DialogTitle>
            <DialogDescription>
              Select the winning option to resolve this prediction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">{prediction.title}</h3>
            </div>
            
            <div className="space-y-2">
              <Label>Select the winning option</Label>
              <RadioGroup 
                value={selectedResolveOption?.toString()} 
                onValueChange={(value) => setSelectedResolveOption(parseInt(value))}
              >
                {prediction.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                    <RadioGroupItem value={option.id.toString()} id={`resolve-option-${option.id}`} />
                    <Label htmlFor={`resolve-option-${option.id}`} className="flex-grow cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              <span className="text-sm">This action cannot be undone. Make sure you select the correct option.</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleResolvePrediction} 
              disabled={isResolvingPrediction || selectedResolveOption === null}
              className="w-full"
            >
              {isResolvingPrediction ? (
                <LoadingSpinner size="sm" text="Resolving..." />
              ) : (
                "Resolve Prediction"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 