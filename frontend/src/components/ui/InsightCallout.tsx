"use client";

import { cn } from "@/lib/utils";
import { Lightbulb, Sparkles } from "lucide-react";

interface InsightCalloutProps {
  variant?: "success" | "action" | "warning";
  label?: string;
  children: React.ReactNode;
  className?: string;
}

const CALLOUT_STYLES = {
  success: { bg: "bg-insight-success-bg border-insight-success-border text-insight-success-text" },
  action: { bg: "bg-insight-action-bg border-insight-action-border text-insight-action-text" },
  warning: { bg: "bg-insight-warning-bg border-insight-warning-border text-insight-warning-text" },
};

export function InsightCallout({
  variant = "action",
  label = "Insight",
  children,
  className,
}: InsightCalloutProps) {
  const config = CALLOUT_STYLES[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-[16px] border transition-all duration-300",
        config.bg,
        className,
      )}
    >
      <Sparkles className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
      <div>
        <span className="font-black text-[9px] uppercase tracking-[0.1em]">
          {label}:
        </span>{" "}
        <span className="text-[10px] font-bold leading-tight">{children}</span>
      </div>
    </div>
  );
}

