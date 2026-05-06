import React from "react";
import { ModuleHeader } from "./ModuleHeader";

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
 * Shell template for ALL list/registry/pipeline pages.
 * Provides standardized filter bar, full-width table area, and pagination slot.
 */
export function TableShell({ title, titleAccent, subtitle, actions, filters, pagination, children }: TableShellProps) {
  return (
    <div className="min-h-[calc(100vh-var(--page-py)-var(--page-pb))]">
      <ModuleHeader
        title={title}
        titleAccent={titleAccent}
        subtitle={subtitle}
        actions={actions}
      />
      {filters && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {filters}
        </div>
      )}
      <div className="flex flex-col" style={{ gap: 'var(--section-gap)' }}>
        {children}
      </div>
      {pagination && (
        <div className="mt-4 flex justify-between items-center">
          {pagination}
        </div>
      )}
    </div>
  );
}

