import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton that mimics the shape of a TodoCard.
 * Renders 4 cards by default so the layout doesn't jump on first load.
 */
export function TodoSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-xl border bg-card p-4"
        >
          {/* Checkbox placeholder */}
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />

          <div className="flex-1 space-y-2.5">
            {/* Title */}
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            {/* Description */}
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-14 rounded-md" />
                <Skeleton className="h-7 w-14 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
