import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-shimmer rounded-md", className)} {...props} />;
}

function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="app-card mt-6 overflow-hidden">
      <div className="border-b border-outline-variant bg-surface-container-low/45 p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-outline-variant/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="section-panel p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="mb-1 h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          <Skeleton className="mb-2 h-2 w-full" />
          <Skeleton className="mb-4 h-2 w-3/4" />
          <div className="mb-4 flex gap-2">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <Skeleton className="mb-5 h-16 w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-outline-variant">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-5">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-1 h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}

function SkeletonKPIGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="metric-card p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mb-1 h-8 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonTable, SkeletonCardGrid, SkeletonList, SkeletonKPIGrid };
