import React from "react";
import { cn } from "@/lib/utils";

interface HighlightProps {
  children: React.ReactNode;
  className?: string;
}

export const Highlight: React.FC<HighlightProps> = ({
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        "font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
        className
      )}
    >
      {children}
    </span>
  );
};

export const HeroHighlight: React.FC<HighlightProps> = ({
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        "relative px-2 py-1",
        className
      )}
    >
      <span className="relative z-10 text-white">{children}</span>
      <span className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-md blur-[2px] z-0"></span>
    </span>
  );
};
