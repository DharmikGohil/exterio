import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

export interface DataTableProps {
  /** Accessible summary of what the table holds. */
  caption: string;
  /** Tailwind min-width so wide tables scroll sideways on small screens. */
  minWidthClassName?: string;
  children: ReactNode;
}

/** A horizontally scrollable table shell shared by the estimate tables. */
export function DataTable({
  caption,
  minWidthClassName = 'min-w-[36rem]',
  children,
}: DataTableProps) {
  return (
    // `relative` keeps absolutely positioned screen-reader labels inside the scroll box,
    // so a wide table scrolls on its own instead of widening the whole page.
    <div className="relative overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', minWidthClassName)}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export interface HeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function HeaderCell({ numeric = false, className, ...rest }: HeaderCellProps) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-medium text-stone-600',
        numeric ? 'text-right' : 'text-left',
        className
      )}
      {...rest}
    />
  );
}

export interface CellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function Cell({ numeric = false, className, ...rest }: CellProps) {
  return (
    <td
      className={cn(
        'border-b border-stone-100 px-3 py-2.5 align-middle text-stone-700',
        numeric && 'whitespace-nowrap text-right tabular-nums',
        className
      )}
      {...rest}
    />
  );
}
