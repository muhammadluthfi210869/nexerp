"use client";

import * as React from "react";
import { PageShell } from "@/components/canonical";

interface TableShellProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  pagination?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Canonical-aligned TableShell. Wraps canonical PageShell.
 */
export function TableShell({ title, titleAccent, subtitle, actions, filters, pagination, children }: TableShellProps) {
  const resolvedTitle = [title, titleAccent].filter(Boolean).join(" ");

  return (
    <PageShell title={resolvedTitle} subtitle={subtitle} actions={actions}>
      {filters && (
        <div className="flex flex-wrap items-center gap-3">
          {filters}
        </div>
      )}
      <div className="flex flex-col gap-6">{children}</div>
      {pagination && (
        <div className="mt-2 flex justify-between items-center">{pagination}</div>
      )}
    </PageShell>
  );
}
