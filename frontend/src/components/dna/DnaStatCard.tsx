import React from "react";
import { cn } from "@/lib/utils";

/**
 * DnaStatCard — KPI/Stat Card with Subtle Semantic Tint
 *
 * @scope OPERATIONAL PAGES (and dashboards that want subtle accent)
 * @see /VISUAL_DNA.md
 * @see /dna-visual/golden-reference (canonical usage example)
 *
 * Pattern (locked):
 * - Subtle bg tint (e.g., `bg-emerald-50/30`) — NOT full color
 * - Subtle border tint (e.g., `border-emerald-100/80`) — matches bg
 * - Colored icon badge (e.g., `bg-emerald-100/70 text-emerald-700`)
 * - BLACK value text (`text-slate-900 font-bold`)
 * - GREY label/subtext (`text-slate-500`)
 * - Fixed height `h-[104px]` for grid alignment
 * - 3-layer structure: label + icon (top), value (middle), subtext (bottom)
 *
 * Font choice:
 * - This component keeps `font-bold` + `tabular-nums` for value (golden reference style)
 * - For table cells (not cards), use uniform font per /finance/faktur-pembelian pattern
 */

export type DnaStatCardVariant =
  | "neutral"      // white bg, slate icon — for plain counts
  | "blue"         // subtle blue — for total / aggregate metrics
  | "emerald"      // subtle green — for success / paid / positive
  | "rose"         // subtle red — for warning / overdue / critical
  | "amber"        // subtle amber — for pending / attention needed
  | "sky"          // subtle sky — for neutral-positive (efficiency)
  | "slate"        // subtle slate — for generic
  | "primary"      // alias for blue
  | "secondary"    // alias for slate
  | "success"      // alias for emerald
  | "warning"      // alias for amber
  | "danger"       // alias for rose
  | "critical"     // alias for rose
  | "info"         // alias for sky
  | "purple"       // subtle purple
  | "default";     // alias for neutral

export interface DnaStatCardProps {
  /** Card label (small uppercase-ish text above value) */
  label?: string;
  /** Title alias for label */
  title?: string;
  /** Main KPI value (number or formatted string) */
  value: string | number | React.ReactNode;
  /** Optional supporting text below value */
  subtext?: string | React.ReactNode;
  /** Description alias for subtext */
  description?: string | React.ReactNode;
  /** subValue alias for subtext */
  subValue?: string | React.ReactNode;
  /** Optional trend delta (e.g. +12.5% vs target) */
  delta?: { value: string; isPositive?: boolean } | string;
  /** Optional icon — Lucide React component or element */
  icon?: any;
  /** Visual variant — determines subtle bg/border/icon color */
  variant?: DnaStatCardVariant;
  /** Optional click handler — makes card interactive */
  onClick?: () => void;
  /** Optional override — render as selected state */
  isSelected?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const VARIANT_STYLES: Record<string, {
  container: string;
  iconBadge: string;
}> = {
  neutral: {
    container: "border-slate-200 bg-white",
    iconBadge: "bg-slate-100 text-slate-600",
  },
  default: {
    container: "border-slate-200 bg-white",
    iconBadge: "bg-slate-100 text-slate-600",
  },
  blue: {
    container: "border-blue-100/80 bg-blue-50/20",
    iconBadge: "bg-blue-50 text-blue-600",
  },
  primary: {
    container: "border-blue-100/80 bg-blue-50/20",
    iconBadge: "bg-blue-50 text-blue-600",
  },
  emerald: {
    container: "border-emerald-100/80 bg-emerald-50/30",
    iconBadge: "bg-emerald-100/70 text-emerald-700",
  },
  success: {
    container: "border-emerald-100/80 bg-emerald-50/30",
    iconBadge: "bg-emerald-100/70 text-emerald-700",
  },
  rose: {
    container: "border-rose-100/80 bg-rose-50/30",
    iconBadge: "bg-rose-100/70 text-rose-700",
  },
  danger: {
    container: "border-rose-100/80 bg-rose-50/30",
    iconBadge: "bg-rose-100/70 text-rose-700",
  },
  critical: {
    container: "border-rose-100/80 bg-rose-50/30",
    iconBadge: "bg-rose-100/70 text-rose-700",
  },
  amber: {
    container: "border-amber-100/80 bg-amber-50/30",
    iconBadge: "bg-amber-100/70 text-amber-700",
  },
  warning: {
    container: "border-amber-100/80 bg-amber-50/30",
    iconBadge: "bg-amber-100/70 text-amber-700",
  },
  sky: {
    container: "border-sky-100/80 bg-sky-50/30",
    iconBadge: "bg-sky-100/70 text-sky-700",
  },
  info: {
    container: "border-sky-100/80 bg-sky-50/30",
    iconBadge: "bg-sky-100/70 text-sky-700",
  },
  slate: {
    container: "border-slate-200 bg-slate-50/30",
    iconBadge: "bg-slate-100 text-slate-600",
  },
  secondary: {
    container: "border-slate-200 bg-slate-50/30",
    iconBadge: "bg-slate-100 text-slate-600",
  },
  purple: {
    container: "border-purple-100/80 bg-purple-50/30",
    iconBadge: "bg-purple-100/70 text-purple-700",
  },
};

/**
 * Renders the icon at standard badge sizing.
 * Accepts Lucide-style icon components (already have className) or elements.
 */
function renderIcon(icon: any): React.ReactNode {
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
      className: cn("w-3.5 h-3.5", (icon.props as any)?.className),
    });
  }
  // If a component function or forwardRef object was passed (e.g. icon={Package})
  if (typeof icon === "function" || (typeof icon === "object" && "$$typeof" in icon)) {
    const IconComp = icon;
    return <IconComp className="w-3.5 h-3.5" />;
  }
  return null;
}

export function DnaStatCard({
  label,
  title,
  value,
  subtext,
  description,
  subValue,
  delta,
  icon,
  variant = "neutral",
  onClick,
  isSelected,
  className,
}: DnaStatCardProps) {
  const styles = (variant && VARIANT_STYLES[variant]) || VARIANT_STYLES.neutral;
  const isInteractive = !!onClick;
  const displayLabel = label || title || "";
  const displaySubtext = subtext || description || subValue;

  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-xl p-3.5 shadow-2xs flex flex-col justify-between h-[104px] transition-all",
        styles.container,
        isInteractive && "cursor-pointer hover:shadow-sm",
        isSelected && "ring-2 ring-blue-500 ring-offset-1",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-normal text-slate-500">{displayLabel}</span>
        {icon && (
          <div
            className={cn(
              "w-6.5 h-6.5 rounded-full flex items-center justify-center",
              styles.iconBadge
            )}
          >
            {renderIcon(icon)}
          </div>
        )}
      </div>
      <div>
        {typeof value === "string" || typeof value === "number" ? (
          <p className="text-[24px] leading-[32px] font-bold text-slate-900 tabular-nums">
            {value}
          </p>
        ) : (
          <div className="text-[24px] leading-[32px] font-bold text-slate-900">
            {value}
          </div>
        )}
        {(displaySubtext || delta) && (
          <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-500 mt-0.5">
            {delta && (
              <span
                className={cn(
                  "font-medium",
                  typeof delta === "object"
                    ? delta.isPositive
                      ? "text-emerald-600"
                      : "text-rose-600"
                    : "text-slate-600"
                )}
              >
                {typeof delta === "object" ? delta.value : delta}
              </span>
            )}
            {displaySubtext && <span>{displaySubtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
