import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show a pulse animation
   * @default true
   */
  pulse?: boolean;
}

/**
 * A skeleton component for loading states
 */
export function Skeleton({
  className,
  pulse = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/60",
        pulse && "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

/**
 * A skeleton card component for loading prediction cards
 */
export function PredictionCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 pb-3 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      
      <div className="p-6 pt-0 flex-grow space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        
        <div className="space-y-3 mt-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </div>
      
      <div className="h-px bg-muted" />
      
      <div className="p-6 pt-4">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/**
 * A skeleton component for loading user bet cards
 */
export function UserBetCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="p-6 pb-3 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      
      <div className="p-6 pt-0 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-12 w-full" />
        </div>
        
        <Skeleton className="h-4 w-1/3" />
      </div>
      
      <div className="h-px bg-muted" />
      
      <div className="p-6 pt-4">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
} 