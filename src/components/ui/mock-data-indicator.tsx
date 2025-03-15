"use client";

import React from "react";
import { AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MockDataIndicatorProps {
  isVisible: boolean;
  message?: string;
  className?: string;
  variant?: "badge" | "banner" | "toast";
  showToast?: boolean;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

/**
 * A component that indicates when mock data is being used
 * Can be displayed as a badge, banner, or toast notification
 */
export function MockDataIndicator({
  isVisible = true,
  message = "Using mock data",
  className,
  variant = "badge",
  showToast = false,
  position = "bottom-right"
}: MockDataIndicatorProps) {
  // Show toast notification if enabled
  React.useEffect(() => {
    if (isVisible && showToast) {
      toast.info(message, {
        id: "mock-data-toast",
        duration: 4000,
        icon: <Info className="h-4 w-4" />
      });
    }
  }, [isVisible, message, showToast]);

  // Don't render anything if not visible
  if (!isVisible) return null;

  // Position classes
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4"
  };

  // Render badge variant
  if (variant === "badge") {
    return (
      <div 
        className={cn(
          "fixed z-50 flex items-center gap-1.5 rounded-full bg-yellow-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-md",
          positionClasses[position],
          className
        )}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {message}
      </div>
    );
  }

  // Render banner variant
  if (variant === "banner") {
    return (
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-yellow-500/90 p-2 text-sm font-medium text-white shadow-md",
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        {message}
      </div>
    );
  }

  // Default to null for toast-only variant
  return null;
}

/**
 * A hook to manage mock data state and notifications
 */
export function useMockDataIndicator() {
  const [usingMockData, setUsingMockData] = React.useState<boolean>(false);
  const [mockDataSource, setMockDataSource] = React.useState<string>("");

  // Function to notify that mock data is being used
  const notifyMockDataUsed = React.useCallback((source: string) => {
    setUsingMockData(true);
    setMockDataSource(source);
    
    // Show a toast notification
    toast.info(`Using mock data for ${source}`, {
      id: `mock-data-${source}`,
      duration: 4000,
      icon: <Info className="h-4 w-4" />
    });
  }, []);

  // Function to reset mock data state
  const resetMockDataState = React.useCallback(() => {
    setUsingMockData(false);
    setMockDataSource("");
  }, []);

  return {
    usingMockData,
    mockDataSource,
    notifyMockDataUsed,
    resetMockDataState
  };
}

/**
 * Context provider for mock data state
 */
const MockDataContext = React.createContext<{
  usingMockData: boolean;
  mockDataSource: string;
  notifyMockDataUsed: (source: string) => void;
  resetMockDataState: () => void;
}>({
  usingMockData: false,
  mockDataSource: "",
  notifyMockDataUsed: () => {},
  resetMockDataState: () => {}
});

/**
 * Provider component for mock data state
 */
export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const mockDataState = useMockDataIndicator();
  
  return (
    <MockDataContext.Provider value={mockDataState}>
      {children}
      {mockDataState.usingMockData && (
        <MockDataIndicator 
          isVisible={true}
          message={`Using mock data for ${mockDataState.mockDataSource}`}
          variant="badge"
          position="bottom-right"
        />
      )}
    </MockDataContext.Provider>
  );
}

/**
 * Hook to use the mock data context
 */
export function useMockData() {
  return React.useContext(MockDataContext);
} 