import { Badge } from '@/presentation/shared/atoms/Badge';
import { Button } from '@/presentation/shared/atoms/Button';
import { Card, CardContent } from '@/presentation/shared/atoms/Card';
import { SCALE_METHOD_META } from '@/presentation/features/studio/utils/scaleDefaults';
import type { EstimateScale } from '@/domain/models/estimate';

export interface ScaleSummaryCardProps {
  scale: EstimateScale;
  /** `false` when the project has no saved scale and the server is guessing. */
  isScaleSaved: boolean;
  onAdjustScale: () => void;
}

/** How pixels were turned into feet for this estimate, and how far off it may be. */
export function ScaleSummaryCard({ scale, isScaleSaved, onAdjustScale }: ScaleSummaryCardProps) {
  const meta = SCALE_METHOD_META[scale.method];

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-stone-600">Scale</p>
            <p className="text-[15px] font-medium text-stone-900">
              {isScaleSaved ? meta.title : 'Rough default, no scale saved'}
            </p>
          </div>
          <Badge tone={isScaleSaved ? meta.accuracyTone : 'warning'}>±{scale.confidencePct}%</Badge>
        </div>
        <p className="text-sm leading-relaxed text-stone-600">{scale.note}</p>
        <p className="text-xs leading-relaxed text-stone-500">
          A more precise scale narrows the range on every area and cost.
        </p>
        <Button variant="outline" size="sm" icon="ruler" onClick={onAdjustScale}>
          {isScaleSaved ? 'Adjust scale' : 'Set the scale'}
        </Button>
      </CardContent>
    </Card>
  );
}
