"use client";

import React from "react";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AdvancedLoadingStateProps {
  /**
   * Whether the content is loading
   */
  isLoading: boolean;
  
  /**
   * The content to display when not loading
   */
  children: React.ReactNode;
  
  /**
   * Custom loading component to display instead of the default spinner
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Whether to show a skeleton instead of a spinner
   */
  showSkeleton?: boolean;
  
  /**
   * Skeleton component to display when loading
   */
  skeletonComponent?: React.ReactNode;
  
  /**
   * Minimum time to show loading state in milliseconds
   * @default 500
   */
  minLoadingTime?: number;
  
  /**
   * Whether to fade in the content when loading completes
   * @default true
   */
  fadeIn?: boolean;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  
  /**
   * Text to display next to the spinner
   */
  loadingText?: string;
  
  /**
   * Whether to center the loading spinner
   * @default true
   */
  centerSpinner?: boolean;
  
  /**
   * Size of the spinner
   * @default "default"
   */
  spinnerSize?: "sm" | "default" | "lg";
  
  /**
   * Whether to show a retry button when loading fails
   * @default false
   */
  showRetry?: boolean;
  
  /**
   * Whether loading has failed
   * @default false
   */
  hasError?: boolean;
  
  /**
   * Function to call when retry button is clicked
   */
  onRetry?: () => void;
  
  /**
   * Error message to display when loading fails
   */
  errorMessage?: string;
}

/**
 * Advanced loading state component that handles various loading scenarios
 * with smooth transitions and fallbacks
 */
export function AdvancedLoadingState({
  isLoading,
  children,
  loadingComponent,
  showSkeleton = false,
  skeletonComponent,
  minLoadingTime = 500,
  fadeIn = true,
  className,
  loadingText,
  centerSpinner = true,
  spinnerSize = "default",
  showRetry = false,
  hasError = false,
  onRetry,
  errorMessage = "Failed to load data"
}: AdvancedLoadingStateProps) {
  const [shouldRender, setShouldRender] = React.useState(!isLoading);
  const loadStartTime = React.useRef<number | null>(null);
  
  React.useEffect(() => {
    if (isLoading) {
      // Start loading
      loadStartTime.current = Date.now();
      setShouldRender(false);
    } else {
      // Finished loading, check if minimum time has elapsed
      const currentTime = Date.now();
      const elapsedTime = loadStartTime.current ? currentTime - loadStartTime.current : 0;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      // Wait for minimum loading time before showing content
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, remainingTime);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, minLoadingTime]);
  
  // Show error state if there's an error
  if (hasError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-6 text-center",
        className
      )}>
        <div className="text-destructive mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="mx-auto mb-2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="font-medium">{errorMessage}</p>
        </div>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }
  
  // Show loading state
  if (isLoading || !shouldRender) {
    // Custom loading component
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>;
    }
    
    // Skeleton loading
    if (showSkeleton && skeletonComponent) {
      return <div className={className}>{skeletonComponent}</div>;
    }
    
    // Default spinner
    return (
      <div className={cn(
        "flex flex-col",
        centerSpinner && "items-center justify-center",
        "p-6",
        className
      )}>
        <LoadingSpinner 
          size={spinnerSize} 
          text={loadingText} 
          centered={centerSpinner} 
        />
      </div>
    );
  }
  
  // Show content with optional fade-in animation
  if (fadeIn) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
  
  // Show content without animation
  return <div className={className}>{children}</div>;
}