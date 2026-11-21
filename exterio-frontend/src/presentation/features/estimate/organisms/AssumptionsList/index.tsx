import { Icon } from '@/presentation/shared/atoms/Icon';
import { SectionCard } from '@/presentation/features/estimate/molecules/SectionCard';

export interface AssumptionsListProps {
  assumptions: string[];
}

export function AssumptionsList({ assumptions }: AssumptionsListProps) {
  if (assumptions.length === 0) {
    return null;
  }
  return (
    <SectionCard
      title="What this estimate assumes"
      description="Share these with your contractor so you are comparing like with like."
    >
      <ul className="space-y-2">
        {assumptions.map((assumption) => (
          <li key={assumption} className="flex gap-2 text-sm leading-relaxed text-stone-700">
            <Icon name="info" className="mt-0.5 text-stone-400" />
            {assumption}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
