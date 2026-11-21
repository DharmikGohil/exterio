import { Icon } from '@/presentation/shared/atoms/Icon';
import { Input } from '@/presentation/shared/atoms/Input';
import { Select } from '@/presentation/shared/atoms/Select';
import {
  PROJECT_SORT_OPTIONS,
  type ProjectSort,
} from '@/presentation/features/projects/utils/projectList';

export interface ProjectToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  sort: ProjectSort;
  onSortChange: (sort: ProjectSort) => void;
}

/** Find a house by name, and choose the order the cards are in. */
export function ProjectToolbar({ query, onQueryChange, sort, onSortChange }: ProjectToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-0 flex-1 sm:max-w-md">
        <span className="sr-only">Search your houses</span>
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <Input
          type="search"
          value={query}
          placeholder="Search your houses"
          className="h-11 pl-9 text-[15px]"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <label className="flex items-center gap-2">
        <span className="sr-only">Sort houses</span>
        <Select
          value={sort}
          options={PROJECT_SORT_OPTIONS}
          className="h-11 text-[15px]"
          wrapperClassName="w-48"
          onChange={(event) => onSortChange(event.target.value as ProjectSort)}
        />
      </label>
    </div>
  );
}
