"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Clock, 
  Wallet, 
  RefreshCw,
  AlertCircle,
  Info,
  ChevronDown,
  Receipt
} from "lucide-react";
import { PredictionCardSkeleton, UserBetCardSkeleton } from "@/components/ui/skeleton";
import { usePredictionMarket } from "@/hooks/use-prediction-market";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { isResolved } from "@/utils/prediction-utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { clearCacheEntry } from "@/utils/data-fetching-utils";
import { isMockModeEnabled } from "@/utils/mock-data";
import { Prediction } from "@/types/prediction";
import { PredictionCard } from "@/components/prediction/prediction-card";
import { useWallet } from "@/providers/evm-wallet-provider";

// Constants
const MAX_VISIBLE_PREDICTIONS = 10;
const LOAD_MORE_INCREMENT = 10;

// Import the CreatePredictionDialog component directly
import { CreatePredictionDialog } from "@/components/prediction/create-prediction-dialog";
// Import the UserBetsDialog component
import { UserBetsDialog } from "@/components/prediction/user-bets-dialog";

// Define the extended prediction type
interface ExtendedPrediction extends Prediction {
  id: string;
}

export default function PredictionsPage() {
  const { isConnected, signIn, address } = useWallet();
  const { 
    predictions, 
    isLoading, 
    error,
    fetchPredictions,
    fetchUserBets,
    clearError
  } = usePredictionMarket();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUserBetsDialogOpen, setIsUserBetsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE_PREDICTIONS);

  // Check if mock mode is enabled
  const mockModeEnabled = isMockModeEnabled();

  // Set up auto-refresh for predictions and user bets with debounce
  const refreshData = useCallback(async (isManual = false) => {
    try {
      // Only show loading state for manual refreshes
      if (isManual) {
        setIsManualRefreshing(true);
      }
      
      // Clear cache entries to force fresh data only for manual refreshes
      if (isManual) {
        clearCacheEntry("predictions");
        if (isConnected) {
          clearCacheEntry(`userBets-${address}`);
        }
      }
      
      // Fetch fresh data - the hook will handle debouncing internally
      await fetchPredictions(isManual);
      if (isConnected) {
        await fetchUserBets(isManual);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
      // Only show error toast for manual refreshes
      if (isManual) {
        toast.error("Failed to refresh data. Please try again.");
      }
    } finally {
      if (isManual) {
        setIsManualRefreshing(false);
      }
    }
  }, [fetchPredictions, fetchUserBets, isConnected, address]);

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    refreshData(true);
  }, [refreshData]);

  // Use a more conservative auto-refresh strategy
  const { 
    isRefreshing, 
    lastRefreshed,
    isEnabled,
    startAutoRefresh,
    stopAutoRefresh
  } = useAutoRefresh(
    // Wrap the refresh function to avoid force refresh on auto-refresh
    () => refreshData(false), 
    {
      interval: 300000, // Refresh every 5 minutes instead of every 2 minutes
      refreshOnMount: false, // Don't refresh on mount
      startImmediately: false, // Don't start auto-refresh immediately
      refreshOnFocus: false, // Don't refresh on focus to reduce API calls
      refreshOnReconnect: false // Don't refresh on network reconnect
    }
  );

  // Handle auto-refresh toggle with toast notification
  const handleAutoRefreshToggle = useCallback(() => {
    if (isEnabled) {
      stopAutoRefresh();
      toast.info("Auto-refresh disabled");
    } else {
      // Show warning about network usage
      toast.warning(
        "Auto-refresh enabled - updating every 5 minutes. This may cause high network usage.",
        { duration: 5000 }
      );
      startAutoRefresh();
    }
  }, [isEnabled, startAutoRefresh, stopAutoRefresh]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Initial data load when component mounts
  useEffect(() => {
    // Load data once on mount
    refreshData(false);
    
    // Auto-refresh is disabled by default to reduce network requests
    
    return () => {
      stopAutoRefresh();
    };
  }, [refreshData, stopAutoRefresh]);

  // Memoize filtered and sorted predictions to prevent unnecessary recalculations
  const filteredAndSortedPredictions = useMemo(() => {
    // Filter predictions based on active tab
    const filtered = predictions.filter(prediction => {
      if (activeTab === "active") {
        return !isResolved(prediction);
      } else if (activeTab === "resolved") {
        return isResolved(prediction);
      }
      return true;
    });

    // Sort predictions by creation date (newest first)
    return [...filtered].sort((a, b) => {
      // Use predictionId as a fallback if createdAt is not available
      const dateA = (a as ExtendedPrediction).createdAt ? new Date((a as ExtendedPrediction).createdAt).getTime() : a.predictionId;
      const dateB = (b as ExtendedPrediction).createdAt ? new Date((b as ExtendedPrediction).createdAt).getTime() : b.predictionId;
      return dateB - dateA;
    });
  }, [predictions, activeTab]);

  // Get the limited set of predictions to display
  const visiblePredictions = useMemo(() => {
    return filteredAndSortedPredictions.slice(0, visibleCount);
  }, [filteredAndSortedPredictions, visibleCount]);

  // Load more predictions
  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + LOAD_MORE_INCREMENT);
  }, []);

  // Format the last refreshed time
  const formattedLastRefreshed = lastRefreshed
    ? formatDistanceToNow(lastRefreshed, { addSuffix: true })
    : "never";

  // Handle bet placed callback
  const handleBetPlaced = useCallback(() => {
    refreshData(true);
  }, [refreshData]);

  // Show error message if there's an error
  const renderErrorMessage = () => {
    if (!error) return null;
    
    return (
      <Card className="mb-6 border-destructive">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Error</h3>
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearError}
                >
                  Dismiss
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => refreshData(true)}
                  disabled={isManualRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isManualRefreshing ? "animate-spin" : ""}`} />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prediction Market</h1>
          <p className="text-muted-foreground mt-1">
            Create predictions and place bets on future events
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mockModeEnabled && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium">
              Mock Data Mode
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isManualRefreshing || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isManualRefreshing || isRefreshing) ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant={isEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleAutoRefreshToggle}
          >
            <Clock className="h-4 w-4 mr-2" />
            {isEnabled ? "Auto-refresh On" : "Auto-refresh Off"}
          </Button>
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUserBetsDialogOpen(true)}
            >
              <Receipt className="h-4 w-4 mr-2" />
              My Bets
            </Button>
          )}
          <Button
            variant="default"
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={!isConnected}
            id="create-prediction-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Prediction
          </Button>
        </div>
      </div>

      {/* Last refreshed info */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>Last refreshed: {formattedLastRefreshed}</span>
      </div>

      {/* Show error message if there's an error */}
      {renderErrorMessage()}

      {/* Show connect wallet button if not connected */}
      {!isConnected && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-4 py-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Connect your wallet</h3>
              <p className="text-center text-muted-foreground mb-4">
                Connect your wallet to create predictions, place bets, and claim winnings.
              </p>
              <Button onClick={signIn} className="w-full md:w-auto">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for active and resolved predictions */}
      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Predictions</TabsTrigger>
          <TabsTrigger value="resolved">Resolved Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {renderPredictionsList(
            "active",
            visiblePredictions,
            filteredAndSortedPredictions.length,
            isLoading,
            handleBetPlaced,
            handleLoadMore
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {renderPredictionsList(
            "resolved",
            visiblePredictions,
            filteredAndSortedPredictions.length,
            isLoading,
            handleBetPlaced,
            handleLoadMore
          )}
        </TabsContent>
      </Tabs>

      {/* Create prediction dialog */}
      {isCreateDialogOpen && (
        <CreatePredictionDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onPredictionCreated={handleBetPlaced}
        />
      )}

      {/* User bets dialog */}
      {isUserBetsDialogOpen && (
        <UserBetsDialog
          open={isUserBetsDialogOpen}
          onOpenChange={setIsUserBetsDialogOpen}
        />
      )}
    </div>
  );
}

function renderPredictionsList(
  tabValue: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predictions: any[], // Use any[] to avoid type conflicts
  totalCount: number,
  isLoading: boolean,
  onBetPlaced: () => void,
  onLoadMore: () => void
) {
  if (isLoading && predictions.length === 0) {
    return renderSkeletons(3, 'prediction');
  }

  if (predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No predictions found</h3>
        <p className="text-muted-foreground mb-6">
          {tabValue === "active"
            ? "There are no active predictions at the moment."
            : "There are no resolved predictions yet."}
        </p>
        {tabValue === "active" && (
          <Button variant="outline" onClick={() => document.getElementById("create-prediction-button")?.click()}>
            <Plus className="h-4 w-4 mr-2" />
            Create a Prediction
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.map((prediction) => (
          <PredictionCard
            key={prediction.predictionId}
            prediction={prediction}
            onBetPlaced={onBetPlaced}
          />
        ))}
      </div>

      {/* Loading more skeletons */}
      {isLoading && predictions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {renderSkeletons(3, 'prediction')}
        </div>
      )}

      {/* Load more button */}
      {predictions.length < totalCount && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="flex items-center gap-2"
          >
            Load More
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}

function renderSkeletons(count: number, type: 'prediction' | 'bet') {
  return Array(count)
    .fill(0)
    .map((_, i) => (
      <div key={`skeleton-${type}-${i}`}>
        {type === 'prediction' ? <PredictionCardSkeleton /> : <UserBetCardSkeleton />}
      </div>
    ));
}