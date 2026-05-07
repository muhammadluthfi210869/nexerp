import React from "react";
import { ModuleHeader } from "./ModuleHeader";
import { PageTransition } from "./PageTransition";

interface DashboardShellProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shell template for ALL dashboard/analytics pages.
 * Enforces consistent vertical rhythm via section-gap.
 * Pages fill content slots — they NEVER control their own spacing.
 */
export function DashboardShell({ title, titleAccent, subtitle, actions, children }: DashboardShellProps) {
  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-var(--page-py)-var(--page-pb))]">
        <ModuleHeader
          title={title}
          titleAccent={titleAccent}
          subtitle={subtitle}
          actions={actions}
        />
        <div className="flex flex-col" style={{ gap: 'var(--section-gap)' }}>
          {children}
        </div>
      </div>
    </PageTransition>
  );
}

