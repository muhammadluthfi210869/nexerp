"use client";

import { DnaBadge } from "@/components/dna";
import { cn, formatNumber } from "@/lib/utils";
import type {
  MarketingTaskPriority,
  MarketingTaskStatus,
} from "./project-management-prototype-data";

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AvatarPill({
  name,
  role,
  subtle,
}: {
  name: string;
  role?: string;
  subtle?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[10px] font-black uppercase",
          subtle
            ? "border-slate-100 bg-slate-50 text-slate-600"
            : "border-blue-100 bg-blue-50 text-blue-600",
        )}
      >
        {initials(name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-black uppercase tracking-tight text-slate-900">
          {name}
        </p>
        {role ? (
          <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {role}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: MarketingTaskStatus | string }) {
  const map: Record<string, "default" | "info" | "warning" | "critical" | "success" | "purple"> = {
    Backlog: "default",
    "To Do": "info",
    "In Progress": "purple",
    "Waiting Approval": "warning",
    Revision: "critical",
    Done: "success",
    Cancelled: "default",
    "On Track": "success",
    "At Risk": "critical",
    Review: "warning",
    Completed: "info",
    Healthy: "success",
    Watch: "warning",
    Late: "critical",
    "Pending Review": "warning",
    "Needs Revision": "critical",
    Approved: "success",
    "Not Submitted": "default",
  };

  return <DnaBadge status={map[status] ?? "default"}>{status}</DnaBadge>;
}

export function PriorityBadge({ priority }: { priority: MarketingTaskPriority }) {
  const map: Record<
    MarketingTaskPriority,
    "default" | "info" | "warning" | "critical" | "purple"
  > = {
    Low: "default",
    Medium: "info",
    High: "warning",
    Urgent: "critical",
  };

  return <DnaBadge status={map[priority]}>{priority}</DnaBadge>;
}

export function ProgressBar({
  value,
  tone = "blue",
}: {
  value: number;
  tone?: "blue" | "emerald" | "amber" | "rose" | "slate";
}) {
  const toneClass: Record<string, string> = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    slate: "bg-slate-900",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", toneClass[tone])}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      <span className="tabular text-[10px] font-black text-slate-500">
        {value}%
      </span>
    </div>
  );
}

export function CompactMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className={cn("mt-2 tabular text-[20px] font-black tracking-[-0.02em] text-slate-900", accent)}>
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
    </div>
  );
}
