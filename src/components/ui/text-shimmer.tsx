"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
}

export const TextShimmer: React.FC<TextShimmerProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "animate-text-shimmer bg-gradient-to-r from-primary via-purple-500 to-indigo-400 bg-[length:400%_100%] bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </div>
  );
};
