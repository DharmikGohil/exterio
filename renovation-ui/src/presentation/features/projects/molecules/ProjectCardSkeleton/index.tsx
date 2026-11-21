import { Skeleton } from '@/presentation/shared/atoms/Skeleton';

export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
