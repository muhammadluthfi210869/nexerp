/**
 * DnaLegacyCompat — DEPRECATED re-export shims
 *
 * ⚠️ DEPRECATED — Do not import from this file for new work.
 * All components are re-exports from their canonical sources.
 * This file exists only for backwards compatibility during migration.
 *
 * Canonical sources:
 *   - DnaPageContainer  → ./DnaPageContainer
 *   - DnaTable          → ./DnaTable
 *   - DnaTabNav         → ./DnaTabNav
 *   - DnaToolbar        → ./DnaToolbar
 *   - DnaEmptyState     → ./DnaFeedbackStates
 *   - DnaSelect         → ./DnaSelect
 *   - DnaTextarea       → ./DnaTextarea
 *   - DnaCheckbox       → ./DnaCheckbox
 *   - DnaAuditTimeline  → ./DnaAuditTimeline
 *   - DnaModal          → ./DnaModal
 *   - DnaDrawer         → ./DnaDrawer
 *   - DnaTabItem        → local shim (not in DnaTabNav.tsx)
 *
 * @deprecated Sprint 0.5 — Import from canonical sources directly.
 * @see /plan/NEX_ERP_REFACTOR_ROADMAP.md Phase 0 + Sprint 0.5
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Re-export shims (backwards compat only)
export { DnaPageContainer } from "./DnaPageContainer";
export { DnaTable } from "./DnaTable";
export { DnaTabNav } from "./DnaTabNav";
export { DnaToolbar } from "./DnaToolbar";
export { DnaEmptyState } from "./DnaFeedbackStates";
export { DnaSelect } from "./DnaSelect";
export { DnaTextarea } from "./DnaTextarea";
export { DnaCheckbox } from "./DnaCheckbox";
export { DnaAuditTimeline } from "./DnaAuditTimeline";
export { DnaModal } from "./DnaModal";
export { DnaDrawer } from "./DnaDrawer";

// DnaTabItem: locally-defined button component (not exported from DnaTabNav.tsx)
export function DnaTabItem({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border-none cursor-pointer",
        active
          ? "bg-blue-600 text-white shadow-2xs"
          : "bg-transparent text-slate-600 hover:bg-slate-100",
        className
      )}
    >
      {children}
    </button>
  );
}
