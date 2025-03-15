"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  
  /**
   * Text to display next to the spinner
   */
  text?: string;
  
  /**
   * Whether to center the spinner in its container
   * @default false
   */
  centered?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Color variant of the spinner
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "muted";
}

/**
 * A reusable loading spinner component with different sizes and variants
 */
export function LoadingSpinner({
  size = "default",
  text,
  centered = false,
  className,
  variant = "primary"
}: LoadingSpinnerProps) {
  // Map size to pixel values
  const sizeMap = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  // Map variant to color classes
  const variantMap = {
    primary: "text-primary",
    secondary: "text-secondary",
    muted: "text-muted-foreground"
  };
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2",
        centered && "justify-center",
        className
      )}
    >
      <Loader2 
        className={cn(
          "animate-spin",
          sizeMap[size],
          variantMap[variant]
        )} 
      />
      {text && (
        <span className={cn(
          "font-medium",
          size === "sm" && "text-sm",
          size === "lg" && "text-lg",
          variantMap[variant]
        )}>
          {text}
        </span>
      )}
    </div>
  );
} 