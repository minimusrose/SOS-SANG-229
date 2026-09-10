/**
 * Grey placeholder block with a light sweep, sized to match the content it
 * stands in for so the swap to real content causes no layout shift
 * (plan lot 2, #8).
 */
export default function Skeleton({ className = "h-4 w-full", rounded = "rounded-2xl" }) {
  return (
    <span
      className={`relative block overflow-hidden bg-light ${rounded} ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </span>
  );
}

/** A card-shaped skeleton for list grids. */
export function SkeletonCard() {
  return (
    <div className="card space-y-4" aria-hidden="true">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-28" rounded="rounded-full" />
        <Skeleton className="h-5 w-20" rounded="rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
      <Skeleton className="h-3 w-32" rounded="rounded-full" />
    </div>
  );
}
