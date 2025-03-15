"use client";

import React, { useState, useCallback } from "react";
import { useWallet } from "@/providers/evm-wallet-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Wallet, 
  RefreshCw,
  AlertCircle,
  Info
} from "lucide-react";
import { CreatePredictionDialog } from "@/components/prediction/create-prediction-dialog";
import { PredictionCard } from "@/components/prediction/prediction-card";
import { UserBetsCard } from "@/components/prediction/user-bets-card";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { PredictionCardSkeleton, UserBetCardSkeleton } from "@/components/ui/skeleton";
import { useEnhancedPredictionMarket } from "@/hooks/use-enhanced-prediction-market";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { isResolved } from "@/utils/prediction-utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AdvancedLoadingState } from "@/components/ui/advanced-loading-state";
import { clearCacheEntry } from "@/utils/data-fetching-utils";

export default function EnhancedPredictionsPage() {
  const { isConnected, signIn } = useWallet();
  const { 
    predictions, 
    userBets, 
    isLoading, 
    error,
    fetchPredictions,
    fetchUserBets,
    claimWinnings,
    clearError
  } = useEnhancedPredictionMarket();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Set up auto-refresh for predictions and user bets
  const refreshData = useCallback(async () => {
    // Clear cache entries to force fresh data
    clearCacheEntry("predictions");
    if (isConnected) {
      clearCacheEntry(`userBets-${isConnected}`);
    }
    
    // Fetch fresh data
    await fetchPredictions(true);
    if (isConnected) {
      await fetchUserBets(true);
    }
  }, [fetchPredictions, fetchUserBets, isConnected]);

  const { 
    refresh, 
    isRefreshing, 
    lastRefreshed,
    isEnabled,
    startAutoRefresh,
    stopAutoRefresh
  } = useAutoRefresh(refreshData, {
    interval: 60000, // Refresh every minute
    refreshOnMount: true,
    startImmediately: true
  });

  // Handle auto-refresh toggle with toast notification
  const handleAutoRefreshToggle = useCallback(() => {
    if (isEnabled) {
      stopAutoRefresh();
      toast.info("Auto-refresh disabled");
    } else {
      startAutoRefresh();
      toast.success("Auto-refresh enabled - updating every minute");
    }
  }, [isEnabled, startAutoRefresh, stopAutoRefresh]);

  // Handle manual refresh with toast notification
  const handleManualRefresh = useCallback(async () => {
    toast.promise(refresh(), {
      loading: "Refreshing data...",
      success: "Data refreshed successfully",
      error: "Failed to refresh data"
    });
  }, [refresh]);

  // Handle wallet connection
  const handleConnectWallet = useCallback(async () => {
    if (!isConnected) {
      await signIn();
    }
  }, [isConnected, signIn]);

  // Filter predictions based on active tab
  const filteredPredictions = predictions.filter(pred => {
    if (activeTab === "active") {
      return !isResolved(pred);
    } else {
      return isResolved(pred);
    }
  });

  // Generate skeleton loaders
  const renderSkeletons = useCallback((count: number, type: 'prediction' | 'bet') => {
    return Array(count)
      .fill(0)
      .map((_, index) => (
        type === 'prediction' 
          ? <PredictionCardSkeleton key={`skeleton-${index}`} /> 
          : <UserBetCardSkeleton key={`skeleton-${index}`} />
      ));
  }, []);

  // Format last refreshed time
  const getLastRefreshedText = useCallback(() => {
    if (!lastRefreshed) return "Never refreshed";
    return `Last updated ${formatDistanceToNow(lastRefreshed, { addSuffix: true })}`;
  }, [lastRefreshed]);

  // Handle retry when loading fails
  const handleRetry = useCallback(() => {
    clearError();
    refresh();
  }, [clearError, refresh]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <TextShimmer className="text-3xl font-bold mb-2">
            Prediction Markets
          </TextShimmer>
          <p className="text-muted-foreground">
            Stake tCORE on outcomes and earn rewards for accurate predictions
          </p>
        </div>
        
        <div className="flex gap-4">
          {isConnected ? (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus size={16} />
              Create Prediction
            </Button>
          ) : (
            <Button onClick={handleConnectWallet} className="gap-2">
              <Wallet size={16} />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Clock size={16} />
              Active Predictions
            </TabsTrigger>
            <TabsTrigger value="resolved" className="gap-2">
              <CheckCircle2 size={16} />
              Resolved
            </TabsTrigger>
            {isConnected && (
              <TabsTrigger value="my-bets" className="gap-2">
                <Clock size={16} />
                My Bets
              </TabsTrigger>
            )}
          </TabsList>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden md:inline-block">
              {getLastRefreshedText()}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span className="ml-1 sr-only md:not-sr-only">Refresh</span>
            </Button>
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              className="h-8 px-2"
              onClick={handleAutoRefreshToggle}
            >
              <span className="text-xs">
                {isEnabled ? "Disable Auto-Refresh" : "Enable Auto-Refresh"}
              </span>
            </Button>
          </div>
        </div>
        
        <TabsContent value="active" className="mt-0">
          <AdvancedLoadingState
            isLoading={isLoading}
            showSkeleton={true}
            skeletonComponent={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderSkeletons(6, 'prediction')}
              </div>
            }
            hasError={!!error}
            errorMessage="Failed to load predictions. Please try again."
            showRetry={true}
            onRetry={handleRetry}
          >
            {filteredPredictions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPredictions.map(prediction => (
                  <PredictionCard 
                    key={prediction.id} 
                    prediction={prediction} 
                    onBetPlaced={refresh}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/40">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Active Predictions</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    There are currently no active predictions. Be the first to create one!
                  </p>
                  {isConnected && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      Create Prediction
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </AdvancedLoadingState>
        </TabsContent>
        
        <TabsContent value="resolved" className="mt-0">
          <AdvancedLoadingState
            isLoading={isLoading}
            showSkeleton={true}
            skeletonComponent={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderSkeletons(3, 'prediction')}
              </div>
            }
            hasError={!!error}
            errorMessage="Failed to load resolved predictions. Please try again."
            showRetry={true}
            onRetry={handleRetry}
          >
            {filteredPredictions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPredictions.map(prediction => (
                  <PredictionCard 
                    key={prediction.id} 
                    prediction={prediction} 
                    onBetPlaced={refresh}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/40">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Resolved Predictions</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    There are no resolved predictions yet. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}
          </AdvancedLoadingState>
        </TabsContent>
        
        {isConnected && (
          <TabsContent value="my-bets" className="mt-0">
            <AdvancedLoadingState
              isLoading={isLoading}
              showSkeleton={true}
              skeletonComponent={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderSkeletons(4, 'bet')}
                </div>
              }
              hasError={!!error}
              errorMessage="Failed to load your bets. Please try again."
              showRetry={true}
              onRetry={handleRetry}
            >
              {userBets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userBets.map(bet => (
                    <UserBetsCard 
                      key={bet.id} 
                      bet={bet} 
                      onClaimWinnings={() => {
                        claimWinnings(parseInt(bet.predictionId)).then(() => refresh());
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/40">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Bets Placed</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      You have not placed any bets yet. Browse active predictions and place your first bet!
                    </p>
                    <Button onClick={() => setActiveTab("active")}>
                      Browse Predictions
                    </Button>
                  </CardContent>
                </Card>
              )}
            </AdvancedLoadingState>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Create Prediction Dialog */}
      <CreatePredictionDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onPredictionCreated={refresh}
      />
    </div>
  );
}