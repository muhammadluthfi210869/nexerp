import { BaseShell, ShellContent, type BaseShellProps, type ReactNode } from "./BaseShell";

export interface TableShellProps extends Omit<BaseShellProps, "children"> {
  filters?: ReactNode;
  pagination?: ReactNode;
  children: ReactNode;
}

/**
 * Shell template for ALL list/registry/pipeline pages.
 * Provides standardized filter bar, full-width table area, and pagination slot.
 */
export function TableShell({ filters, pagination, children, ...tableProps }: TableShellProps) {
  return (
    <BaseShell {...tableProps}>
      {filters && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {filters}
        </div>
      )}
      <ShellContent>
        {children}
      </ShellContent>
      {pagination && (
        <div className="mt-4 flex justify-between items-center">
          {pagination}
        </div>
      )}
    </BaseShell>
  );
}
