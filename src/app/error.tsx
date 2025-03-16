'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Global error handling component for Next.js
 * This component will catch any errors that occur in the app
 * and display a user-friendly error message
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console in development
    console.error('Application error:', error);
    
    // In production, you would send this to an error tracking service
    // like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorTrackingService(error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground">
              We apologize for the inconvenience. Our team has been notified of this issue.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button 
                onClick={() => {
                  reset();
                  toast.success('Application has been reset');
                }}
                variant="default"
              >
                Try again
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Go to homepage
              </Button>
            </div>
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-6 rounded-lg bg-slate-950 p-4 text-left">
                <p className="text-sm text-slate-400">Error details (only visible in development):</p>
                <pre className="mt-2 max-h-[300px] overflow-auto rounded bg-slate-900 p-2 text-xs text-slate-50">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}