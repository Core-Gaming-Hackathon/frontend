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
      // Don't show error toast for auto-refresh errors
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
    // Only refresh on mount if specified
    if (refreshOnMount) {
      // Use a small delay to prevent immediate refresh
      const timer = setTimeout(() => {
        refresh();
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [refreshOnMount]);
  
  // Set up auto-refresh interval
  useEffect(() => {
    if (startImmediately) {
      // Use a small delay to prevent immediate refresh
      const timer = setTimeout(() => {
        startAutoRefresh();
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        stopAutoRefresh();
      };
    }
    
    return () => {
      stopAutoRefresh();
    };
  }, [startImmediately, interval]);
  
  // Set up window focus listener
  useEffect(() => {
    if (!refreshOnFocus) return undefined;
    
    // Debounce the focus handler to prevent multiple refreshes
    let focusTimeout: number | null = null;
    
    const handleFocus = () => {
      // Clear any existing timeout
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
      
      // Set a new timeout to debounce the refresh
      focusTimeout = window.setTimeout(() => {
        // Only refresh if auto-refresh is enabled and it's been at least 10 seconds since the last refresh
        if (isEnabled && (!lastRefreshed || Date.now() - lastRefreshed.getTime() > 10000)) {
          refresh();
        }
        focusTimeout = null;
      }, 1000);
    };
    
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
    };
  }, [refreshOnFocus, isEnabled, lastRefreshed]);
  
  // Set up online listener
  useEffect(() => {
    if (!refreshOnReconnect) return undefined;
    
    // Debounce the online handler to prevent multiple refreshes
    let onlineTimeout: number | null = null;
    
    const handleOnline = () => {
      // Clear any existing timeout
      if (onlineTimeout) {
        clearTimeout(onlineTimeout);
      }
      
      // Set a new timeout to debounce the refresh
      onlineTimeout = window.setTimeout(() => {
        // Only refresh if auto-refresh is enabled
        if (isEnabled) {
          refresh();
        }
        onlineTimeout = null;
      }, 2000);
    };
    
    window.addEventListener("online", handleOnline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      if (onlineTimeout) {
        clearTimeout(onlineTimeout);
      }
    };
  }, [refreshOnReconnect, isEnabled]);
  
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