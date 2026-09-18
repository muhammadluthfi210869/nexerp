import { BaseShell, type BaseShellProps } from "./BaseShell";
import { PageTransition } from "./PageTransition";

export interface DashboardShellProps extends BaseShellProps {
  variant?: string;
  padding?: string;
}

/**
 * Shell template for ALL dashboard/analytics pages.
 * Enforces consistent vertical rhythm via section-gap.
 * Pages fill content slots — they NEVER control their own spacing.
 */
export function DashboardShell({ children, ...shellProps }: DashboardShellProps) {
  return (
    <PageTransition>
      <BaseShell {...shellProps}>
        <div className="flex flex-col gap-6">
          {children}
        </div>
      </BaseShell>
    </PageTransition>
  );
}
