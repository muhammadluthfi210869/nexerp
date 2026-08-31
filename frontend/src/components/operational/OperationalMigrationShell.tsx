"use client";

import * as React from "react";
import { PageShell, SectionCard, SectionCardContent } from "@/components/canonical";

interface OperationalMigrationShellProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  pagination?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Canonical-aligned migration shell.
 * Wraps canonical PageShell + SectionCard for filters.
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
    <PageShell title={resolvedTitle} subtitle={subtitle} actions={actions}>
      {filters ? (
        <SectionCard>
          <SectionCardContent>{filters}</SectionCardContent>
        </SectionCard>
      ) : null}
      <div className="flex flex-col gap-6">{children}</div>
      {pagination ? <div>{pagination}</div> : null}
    </PageShell>
  );
}
