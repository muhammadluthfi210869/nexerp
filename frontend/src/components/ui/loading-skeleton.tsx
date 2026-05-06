import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 5, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 bg-slate-200 rounded-full w-1/4" />
          <div className="h-4 bg-slate-200 rounded-full w-1/3" />
          <div className="h-4 bg-slate-200 rounded-full w-1/5" />
          <div className="h-4 bg-slate-200 rounded-full w-1/6 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[2rem] bg-white border border-slate-100 p-8 space-y-6 animate-pulse", className)}>
      <div className="h-6 bg-slate-200 rounded-full w-1/3" />
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded-full w-full" />
        <div className="h-4 bg-slate-200 rounded-full w-4/5" />
      </div>
      <div className="h-20 bg-slate-200 rounded-2xl w-full" />
    </div>
  );
}

