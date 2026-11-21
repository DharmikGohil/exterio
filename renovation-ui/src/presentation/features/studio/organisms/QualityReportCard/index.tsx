import { Badge } from '@/presentation/shared/atoms/Badge';
import { Card, CardContent } from '@/presentation/shared/atoms/Card';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';
import { ScoreRing } from '@/presentation/features/studio/molecules/ScoreRing';
import type { QualityReport, QualitySeverity } from '@/domain/models/project';

const SEVERITY_STYLES: Record<
  QualitySeverity,
  { row: string; icon: 'error' | 'warning'; iconClass: string; label: string }
> = {
  error: {
    row: 'border-red-200 bg-red-50 text-red-900',
    icon: 'error',
    iconClass: 'text-red-600',
    label: 'Must fix',
  },
  warning: {
    row: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'warning',
    iconClass: 'text-amber-600',
    label: 'Could be better',
  },
};

function getVerdict(report: QualityReport): {
  text: string;
  tone: 'success' | 'warning' | 'danger';
} {
  if (!report.usable) {
    return { text: 'Not usable', tone: 'danger' };
  }
  if (report.issues.length === 0) {
    return { text: 'Great photo', tone: 'success' };
  }
  return { text: 'Usable, with notes', tone: 'warning' };
}

export interface QualityReportCardProps {
  report: QualityReport;
  className?: string;
}

/** The photo check: score, each issue colour-coded by severity, and tips for a better shot. */
export function QualityReportCard({ report, className }: QualityReportCardProps) {
  const verdict = getVerdict(report);

  return (
    <Card className={className}>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <ScoreRing score={report.score} />
          <div className="space-y-1">
            <p className="text-sm font-medium text-stone-500">Photo check</p>
            <Badge tone={verdict.tone}>{verdict.text}</Badge>
            <p className="text-xs text-stone-500">
              {report.metrics.width} × {report.metrics.height} px
            </p>
          </div>
        </div>

        {report.issues.length > 0 ? (
          <ul className="space-y-2">
            {report.issues.map((issue) => {
              const style = SEVERITY_STYLES[issue.severity];
              return (
                <li
                  key={`${issue.code}-${issue.message}`}
                  className={cn('flex gap-2.5 rounded-lg border px-3 py-2 text-sm', style.row)}
                >
                  <Icon name={style.icon} className={cn('mt-0.5', style.iconClass)} />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium opacity-70">{style.label}</span>
                    {issue.message}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-emerald-800">
            <Icon name="success" className="text-emerald-600" />
            No problems found. This photo works well.
          </p>
        )}

        {report.guidance.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-stone-900">Tips for a better result</h4>
            <ul className="space-y-1.5">
              {report.guidance.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm leading-relaxed text-stone-600">
                  <Icon name="tip" className="mt-0.5 text-brand-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
