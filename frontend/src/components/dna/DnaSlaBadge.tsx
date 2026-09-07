"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface DnaSlaBadgeProps {
  /**
   * Positive variance = Days delayed (Terlambat)
   * Negative variance = Days ahead of schedule (Lebih cepat)
   * Zero = Exactly on time (Tepat waktu)
   */
  varianceDays: number;
  isCompleted?: boolean;
  className?: string;
  showIcon?: boolean;
}

/**
 * World-class Enterprise SLA Variance Badge
 * Clearly differentiates on-time, ahead of schedule, and overdue delays for executive auditing.
 */
export function DnaSlaBadge({
  varianceDays,
  isCompleted = false,
  className,
  showIcon = true
}: DnaSlaBadgeProps) {
  if (varianceDays > 0) {
    // Delayed / Terlambat
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 tabular-nums",
          className
        )}
      >
        {showIcon && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />}
        <span>+{varianceDays} Hari Terlambat</span>
      </span>
    );
  }

  if (varianceDays < 0) {
    // Ahead of schedule / Lebih Cepat
    const fasterDays = Math.abs(varianceDays);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums",
          className
        )}
      >
        {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
        <span>{fasterDays} Hari Lebih Cepat</span>
      </span>
    );
  }

  // Exactly On Time / Sesuai Jadwal
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 tabular-nums",
        className
      )}
    >
      {showIcon && (isCompleted ? <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" /> : <Clock className="w-3 h-3 text-blue-600 shrink-0" />)}
      <span>{isCompleted ? "Tepat Waktu" : "On Schedule"}</span>
    </span>
  );
}
