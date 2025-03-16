import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

/**
 * Custom 404 Not Found page
 * Displayed when a user navigates to a route that doesn't exist
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
          <Search className="h-10 w-10 text-slate-600 dark:text-slate-400" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <h2 className="text-xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button asChild variant="default">
            <Link href="/">
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/predict">
              Go to Predictions
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}