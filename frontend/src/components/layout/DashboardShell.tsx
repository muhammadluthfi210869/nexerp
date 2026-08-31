import React from "react";
import { ModuleHeader } from "./ModuleHeader";

interface DashboardShellProps {
  title: string;
  /** Optional legacy visual accent (kept for non-representative pages). */
  titleAccent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Canonical PageShell — single source of truth for page composition.
 *
 * Contract:
 *   - transparent container, no white sheet, no max-width
 *   - width: 100%
 *   - padding-inline: 24px, padding-block: 24px
 *   - vertical rhythm: 24px between sections
 *   - PageHeader always rendered with title/subtitle/actions.
 *
 * Representative pages (Batch 1 evidence) MUST render with title only —
 * titleAccent is intentionally omitted so all five titles share the same
 * 30px/36px/700 typography. Non-representative pages may still pass it.
 */
export function DashboardShell({ title, titleAccent, subtitle, actions, children }: DashboardShellProps) {
  const headerTitle = titleAccent ? `${title} ${titleAccent}` : title;
  return (
    <div
      className="w-full"
      style={{ paddingInline: 24, paddingBlock: 24 }}
    >
      <ModuleHeader title={headerTitle} subtitle={subtitle} actions={actions} />
      <div className="flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}