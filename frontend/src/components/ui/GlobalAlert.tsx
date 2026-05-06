"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, X, CheckCircle2, Info } from "lucide-react";

interface GlobalAlertProps {
  variant: "critical" | "warning" | "success" | "info";
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const ALERT_STYLES = {
  critical: {
    bg: "bg-alert-critical-bg border-alert-critical-border text-status-critical",
    icon: AlertTriangle,
  },
  warning: {
    bg: "bg-alert-warning-bg border-alert-warning-border text-status-warning",
    icon: AlertTriangle,
  },
  success: {
    bg: "bg-insight-success-bg border-insight-success-border text-status-success",
    icon: CheckCircle2,
  },
  info: {
    bg: "bg-insight-action-bg border-insight-action-border text-status-action",
    icon: Info,
  },
};

export function GlobalAlert({ variant, message, onDismiss, className }: GlobalAlertProps) {
  const config = ALERT_STYLES[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-3 rounded-[20px] border shadow-sm transition-all",
        config.bg,
        variant === "critical" && "animate-pulse",
        className,
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <p className="flex-1 text-[10px] font-black uppercase tracking-tight">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-white/50 transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

