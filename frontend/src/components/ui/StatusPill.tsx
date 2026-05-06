"use client";

import { cn } from "@/lib/utils";

interface StatusPillProps {
  variant?: "stable" | "live" | "draft" | "offline";
  label?: string;
  className?: string;
}

const PILL_STYLES: Record<string, { bg: string; color: string }> = {
  stable: { bg: "bg-status-stable-bg", color: "text-status-stable-text" },
  live: { bg: "bg-status-sync-bg", color: "text-status-sync-text" },
  draft: { bg: "bg-gray-50", color: "text-gray-500" },
  offline: { bg: "bg-alert-critical-bg", color: "text-status-critical" },
};

const PILL_LABELS: Record<string, string> = {
  stable: "STABLE",
  live: "LIVE SYNC",
  draft: "DRAFT",
  offline: "OFFLINE",
};

export function StatusPill({ variant = "stable", label, className }: StatusPillProps) {
  const config = PILL_STYLES[variant];
  const displayLabel = label || PILL_LABELS[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-tight",
        config.bg,
        config.color,
        variant === "live" && "animate-pulse",
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}

