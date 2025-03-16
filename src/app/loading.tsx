import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Global loading component for Next.js
 * This component will be displayed during page transitions and data fetching
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Loading...</h2>
        <p className="text-muted-foreground">
          Please wait while we prepare your content
        </p>
      </div>
    </div>
  );
}