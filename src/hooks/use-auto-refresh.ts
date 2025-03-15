import { useEffect, useRef, useState } from "react";

interface UseAutoRefreshOptions {
  /**
   * Interval in milliseconds between refreshes
   * @default 30000 (30 seconds)
   */
  interval?: number;
  
  /**
   * Whether to start refreshing immediately
   * @default true
   */
  startImmediately?: boolean;
  
  /**
   * Whether to refresh immediately on mount
   * @default true
   */
  refreshOnMount?: boolean;
  
  /**
   * Whether to refresh when the window regains focus
   * @default true
   */
  refreshOnFocus?: boolean;
  
  /**
   * Whether to refresh when the network reconnects
   * @default true
   */
  refreshOnReconnect?: boolean;
}

/**
 * Custom hook for auto-refreshing data at regular intervals
 * @param refreshFunction The function to call to refresh data
 * @param options Configuration options
 * @returns Object with refresh control functions
 */
export function useAutoRefresh(
  refreshFunction: () => Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const {
    interval = 30000,
    startImmediately = true,
    refreshOnMount = true,
    refreshOnFocus = true,
    refreshOnReconnect = true,
  } = options;
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEnabled, setIsEnabled] = useState(startImmediately);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  // Function to refresh data
  const refresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      await refreshFunction();
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Start auto-refresh
  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsEnabled(true);
    intervalRef.current = window.setInterval(refresh, interval);
  };
  
  // Stop auto-refresh
  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsEnabled(false);
  };
  
  // Set up auto-refresh on mount
  useEffect(() => {
    if (refreshOnMount) {
      refresh();
    }
    
    if (startImmediately) {
      startAutoRefresh();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Set up refresh on window focus
  useEffect(() => {
    if (!refreshOnFocus) return;
    
    const handleFocus = () => {
      if (isEnabled) {
        refresh();
      }
    };
    
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isEnabled, refreshOnFocus]);
  
  // Set up refresh on network reconnect
  useEffect(() => {
    if (!refreshOnReconnect) return;
    
    const handleOnline = () => {
      if (isEnabled) {
        refresh();
      }
    };
    
    window.addEventListener("online", handleOnline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [isEnabled, refreshOnReconnect]);
  
  return {
    refresh,
    isRefreshing,
    isEnabled,
    lastRefreshed,
    startAutoRefresh,
    stopAutoRefresh,
    setInterval: (newInterval: number) => {
      if (isEnabled && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(refresh, newInterval);
      }
    },
  };
} 