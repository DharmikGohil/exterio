import { Card, CardContent } from '@/presentation/shared/atoms/Card';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';

/** Placeholder with the same layout as the quality report card, shown while a photo is checked. */
export function QualityReportSkeleton() {
  return (
    <Card className="self-start" aria-hidden>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="space-y-2.5">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}
