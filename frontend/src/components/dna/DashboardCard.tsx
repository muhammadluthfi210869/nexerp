import { cn } from "@/lib/utils";
import { SectionLabel } from "./SectionLabel";

interface DashboardCardProps {
  label?: string;
  labelClassName?: string;
  children: React.ReactNode;
  className?: string;
  inverted?: boolean;
  style?: React.CSSProperties;
}

/**
 * MATCHES: reference `.macro-card` from erp-dreamlab-dashboard-fix.netlify.app
 * The standard card container for ALL dashboard sections.
 * - border-radius: 24px
 * - padding: 2rem (p-8)
 * - hover lift: -4px + expanded shadow
 * - optional `.label` header (10px/800/uppercase)
 */
export function DashboardCard({ label, labelClassName, children, className, inverted, style }: DashboardCardProps) {
  return (
    <div
      data-dna="dashboard-card"
      data-inverted={inverted ? "true" : undefined}
      className={cn(
        "border border-[var(--border-color)] rounded-[24px] p-8 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
        inverted
          ? "bg-[var(--dark-accent)] text-white border-none"
          : "bg-white",
        "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]",
        "hover:translate-y-[-4px] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05)]",
        className
      )}
      style={style}
    >
      {label && (
        <div
          className={cn(
            "text-[10px] font-extrabold uppercase tracking-[0.1em] mb-4",
            inverted ? "text-[#94A3B8]" : "text-[var(--gray-500)]",
            labelClassName
          )}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
