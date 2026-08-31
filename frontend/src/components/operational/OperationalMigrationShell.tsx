import type { ReactNode } from "react";
import { OperationalPageShell, OperationalPanel } from "./OperationalUI";
import styles from "./OperationalMigrationShell.module.css";

interface OperationalMigrationShellProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  pagination?: ReactNode;
  children: ReactNode;
}

/**
 * Compatibility shell for controlled migration batches.
 * It applies the approved operational grammar without changing dashboard
 * primitives or the frozen Golden Page implementation.
 */
export function OperationalMigrationShell({
  title,
  titleAccent,
  subtitle,
  actions,
  filters,
  pagination,
  children,
}: OperationalMigrationShellProps) {
  const resolvedTitle = [title, titleAccent].filter(Boolean).join(" ");

  return (
    <OperationalPageShell
      title={resolvedTitle}
      subtitle={subtitle}
      actions={actions}
      className={styles.scope}
    >
      {filters ? (
        <OperationalPanel className={styles.filters}>{filters}</OperationalPanel>
      ) : null}
      <div className={styles.content}>{children}</div>
      {pagination ? <div className={styles.pagination}>{pagination}</div> : null}
    </OperationalPageShell>
  );
}
