import React from "react"
import { cn } from "@/lib/utils"

/**
 * DnaBadge — Standalone status badge
 *
 * @scope OPERATIONAL + DASHBOARD (cross-DNA compatible)
 * @see /VISUAL_DNA.md (both Operational & Dashboard DNA contracts)
 *
 * @deprecated — use `DnaCell.Badge` from `@/components/dna/cells/DnaCell.tsx` for
 *   all badge use cases (standalone AND table cells). DnaCell.Badge is the canonical
 *   badge component per the Golden Reference. DnaBadge will be removed in Sprint 9.
 *
 * @example
 * ```tsx
 * <DnaBadge status="success">APPROVED</DnaBadge>
 * <DnaBadge status="critical">REJECTED</DnaBadge>
 * <DnaBadge status="warning">PENDING</DnaBadge>
 * ```
 */
type BadgeStatus = "success" | "info" | "warning" | "critical" | "purple" | "default"

interface DnaBadgeProps {
  /** Predefined status style. Default: "default" */
  status?: BadgeStatus
  /** Alias for `status` — kept for backwards compat */
  variant?: BadgeStatus | string
  /** Badge content (text or element) */
  children: React.ReactNode
  /** Additional CSS classes to merge */
  className?: string
  /** Optional click handler — makes badge interactive */
  onClick?: () => void
}

/**
 * Status color mapping per VISUAL_DNA.md (Operational DNA badge palette):
 * - success  → emerald-50 bg, emerald-600 text, emerald-100 border
 * - info     → blue-50 bg, blue-600 text, blue-100 border
 * - warning  → amber-50 bg, amber-600 text, amber-100 border
 * - critical → rose-50 bg, rose-600 text, rose-100 border
 * - purple   → purple-50 bg, purple-600 text, purple-100 border
 * - default  → slate-50 bg, slate-600 text, slate-100 border
 */
const statusClasses: Record<string, string> = {
  success: "bg-[#ECFDF5] text-[#059669] border-[#DCFCE7]",
  info: "bg-blue-50 text-blue-600 border-blue-100",
  warning: "bg-amber-50 text-amber-600 border-amber-100",
  critical: "bg-[#FEF2F2] text-[#DC2626] border-[#FECDD3]",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
  default: "bg-slate-50 text-slate-600 border-slate-100",
}

export function DnaBadge({ status, variant, children, className, onClick }: DnaBadgeProps) {
  const key = (status || variant || "default") as string;
  const badgeStyle = statusClasses[key] || statusClasses.default;
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-black uppercase rounded-lg px-3 py-1 border shadow-sm",
        badgeStyle,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
    >
      {children}
    </span>
  )
}
