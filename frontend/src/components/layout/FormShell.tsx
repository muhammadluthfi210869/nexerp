import React from "react";
import { ModuleHeader } from "./ModuleHeader";

interface FormShellProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shell template for ALL input/form pages.
 * Enforces a 2/3 + 1/3 split layout with consistent spacing.
 * Right sidebar is sticky for action panels.
 */
export function FormShell({ title, titleAccent, subtitle, actions, sidebar, children }: FormShellProps) {
  return (
    <div className="min-h-[calc(100vh-var(--page-py)-var(--page-pb))]">
      <ModuleHeader
        title={title}
        titleAccent={titleAccent}
        subtitle={subtitle}
        actions={actions}
      />
      {sidebar ? (
        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 'var(--section-gap)' }}>
          <div className="lg:col-span-2 flex flex-col" style={{ gap: 'var(--section-gap)' }}>
            {children}
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[var(--page-py)] flex flex-col" style={{ gap: 'var(--subsection-gap)' }}>
              {sidebar}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl flex flex-col" style={{ gap: 'var(--section-gap)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

