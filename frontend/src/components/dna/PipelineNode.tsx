import { cn } from "@/lib/utils";

interface PipelineNodeProps {
  value: string | number;
  label: string;
  critical?: boolean;
  dark?: boolean;
  className?: string;
}

/**
 * MATCHES: reference `.diag-node` from erp-dreamlab-dashboard-fix.netlify.app
 * Pipeline stage node used in production/bussdev workflows.
 * - border-radius: 20px
 * - padding: 1.75rem
 * - flex: 1
 */
export function PipelineNode({ value, label, critical, dark, className }: PipelineNodeProps) {
  return (
    <div
      className={cn(
        "border rounded-[20px] flex-1 p-[1.75rem] shadow-[0_2px_4px_rgba(0,0,0,0.03)]",
        dark
          ? "bg-[var(--dark-accent)] text-white border-none"
          : critical
            ? "border-[var(--status-critical)] bg-white"
            : "border-[var(--border-color)] bg-white",
        className
      )}
    >
      <p className="text-[1.75rem] font-black leading-tight tabular">
        {value}
      </p>
      <span
        className={cn(
          "block mt-2 text-[9px] font-extrabold uppercase",
          dark ? "text-[#94A3B8]" : "text-[var(--gray-500)]"
        )}
      >
        {label}
      </span>
    </div>
  );
}

interface PipelineRowProps {
  children: React.ReactNode;
  className?: string;
}

export function PipelineRow({ children, className }: PipelineRowProps) {
  return (
    <div className={cn("flex gap-6 mb-16", className)}>
      {children}
    </div>
  );
}
