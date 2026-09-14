// New DNA components for management-task upgrade (Phase 1, 2026-09-11).
// Single file to keep context lean — split into individual files later if reused widely.

"use client";

import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X, Download, Trash2, Paperclip } from "lucide-react";

// ─── DnaAlert ──────────────────────────────────────────────────────────────

export type DnaAlertVariant = "info" | "success" | "warning" | "danger";

const ALERT_STYLES: Record<DnaAlertVariant, { bg: string; icon: any; iconColor: string }> = {
  info: { bg: "bg-blue-50 border-blue-200 text-blue-800", icon: Info, iconColor: "text-blue-500" },
  success: { bg: "bg-emerald-50 border-emerald-200 text-emerald-800", icon: CheckCircle2, iconColor: "text-emerald-500" },
  warning: { bg: "bg-amber-50 border-amber-200 text-amber-800", icon: AlertTriangle, iconColor: "text-amber-500" },
  danger: { bg: "bg-rose-50 border-rose-200 text-rose-800", icon: AlertCircle, iconColor: "text-rose-500" },
};

export function DnaAlert({
  variant = "info",
  title,
  children,
  onDismiss,
  className,
}: {
  variant?: DnaAlertVariant;
  title?: string;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const style = ALERT_STYLES[variant];
  const Icon = style.icon;
  return (
    <div role="status" className={cn("flex items-start gap-3 rounded-lg border p-4", style.bg, className)}>
      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", style.iconColor)} />
      <div className="flex-1">
        {title && <div className="font-semibold text-sm">{title}</div>}
        {children && <div className="text-sm mt-1">{children}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── DnaAvatar + DnaAvatarStack ───────────────────────────────────────────

export function DnaAvatar({
  name,
  initial,
  color = "bg-blue-500",
  size = "md",
  className,
}: {
  name: string;
  initial?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const char = initial ?? name[0]?.toUpperCase() ?? "?";
  const sz = size === "sm" ? "h-7 w-7 text-xs" : size === "lg" ? "h-12 w-12 text-lg" : "h-9 w-9 text-sm";
  return (
    <div
      title={name}
      className={cn("rounded-full text-white flex items-center justify-center font-bold flex-shrink-0", color, sz, className)}
    >
      {char}
    </div>
  );
}

export function DnaAvatarStack({
  users,
  max = 4,
}: {
  users: Array<{ name: string; initial?: string; color?: string }>;
  max?: number;
}) {
  const visible = users.slice(0, max);
  const overflow = Math.max(0, users.length - max);
  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <div key={i} className="ring-2 ring-white rounded-full">
          <DnaAvatar name={u.name} initial={u.initial} color={u.color ?? "bg-slate-500"} size="sm" />
        </div>
      ))}
      {overflow > 0 && (
        <div className="ring-2 ring-white rounded-full h-7 w-7 bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ─── DnaPriorityBadge ────────────────────────────────────────────────────

export function DnaPriorityBadge({ priority }: { priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }) {
  const styles: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-700 border-slate-200",
    MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
    HIGH: "bg-amber-100 text-amber-800 border-amber-200",
    URGENT: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", styles[priority])}>{priority}</span>;
}

// ─── DnaStatusBadge ───────────────────────────────────────────────────────

export function DnaStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Planning: "bg-slate-100 text-slate-700",
    Brief: "bg-blue-100 text-blue-700",
    Draft: "bg-violet-100 text-violet-700",
    Production: "bg-amber-100 text-amber-800",
    Review: "bg-yellow-100 text-yellow-800",
    Published: "bg-emerald-100 text-emerald-700",
    Late: "bg-rose-100 text-rose-700",
    NOT_STARTED: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    IN_REVIEW: "bg-violet-100 text-violet-700",
    REVISION: "bg-amber-100 text-amber-800",
    DONE: "bg-emerald-100 text-emerald-700",
    BLOCKED: "bg-rose-100 text-rose-700",
  };
  return <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", styles[status] ?? "bg-slate-100 text-slate-700")}>{status}</span>;
}

// ─── DnaDaysLeftChip ───────────────────────────────────────────────────────

export function DnaDaysLeftChip({ dueDate }: { dueDate: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let label: string;
  let style: string;
  if (diffDays === 0) {
    label = "Hari ini";
    style = "bg-amber-100 text-amber-800 border-amber-200";
  } else if (diffDays > 0) {
    label = diffDays === 1 ? "1 hari lagi" : `${diffDays} hari lagi`;
    style = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else {
    const late = -diffDays;
    label = late === 1 ? "Telat 1 hari" : `Telat ${late} hari`;
    style = "bg-rose-100 text-rose-700 border-rose-200";
  }
  return <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", style)}>{label}</span>;
}

// ─── DnaAttachmentList ────────────────────────────────────────────────────

export interface DnaAttachmentItem {
  id: string;
  name: string;
  type?: string;
  sizeKb?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  url?: string;
}

export function DnaAttachmentList({
  attachments,
  onDelete,
  className,
}: {
  attachments: DnaAttachmentItem[];
  onDelete?: (id: string) => void;
  className?: string;
}) {
  if (attachments.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400", className)}>
        <Paperclip className="h-5 w-5 mx-auto mb-1 opacity-50" />
        Belum ada lampiran
      </div>
    );
  }
  return (
    <ul className={cn("space-y-1", className)}>
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Paperclip className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{a.name}</div>
            {a.sizeKb !== undefined && (
              <div className="text-xs text-slate-500">{a.sizeKb} KB{a.uploadedBy && ` · ${a.uploadedBy}`}</div>
            )}
          </div>
          {a.url && (
            <a href={a.url} download className="p-1.5 text-slate-500 hover:text-slate-700">
              <Download className="h-4 w-4" />
            </a>
          )}
          {onDelete && (
            <button onClick={() => onDelete(a.id)} className="p-1.5 text-rose-500 hover:text-rose-700">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── DnaKanban (minimal, status columns + drag between) ──────────────────

import { useState } from "react";

export interface KanbanItem {
  id: string;
  title: string;
  status: string;
  meta?: ReactNode;
}

const KANBAN_COLUMNS = ["Planning", "Brief", "Production", "Review", "Published"];

export function DnaKanban({
  items,
  onMove,
  onClick,
}: {
  items: KanbanItem[];
  onMove?: (itemId: string, newStatus: string) => void;
  onClick?: (itemId: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const grouped = KANBAN_COLUMNS.reduce<Record<string, KanbanItem[]>>((acc, col) => {
    acc[col] = items.filter((i) => i.status === col);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col}
          className="rounded-xl bg-slate-50 border border-slate-200 p-3 min-h-[300px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (draggedId && onMove) onMove(draggedId, col);
            setDraggedId(null);
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">{col}</h3>
            <span className="text-xs text-slate-500">{grouped[col].length}</span>
          </div>
          <div className="space-y-2">
            {grouped[col].map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDraggedId(item.id)}
                onClick={() => onClick?.(item.id)}
                className="rounded-lg border border-slate-200 bg-white p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
              >
                <div className="text-sm font-medium">{item.title}</div>
                {item.meta && <div className="text-xs text-slate-500 mt-1">{item.meta}</div>}
              </div>
            ))}
            {grouped[col].length === 0 && (
              <div className="text-xs text-slate-400 italic text-center py-4">Drop here</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DnaDateRangePicker ───────────────────────────────────────────────────

export function DnaDateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate?: string;
  endDate?: string;
  onChange: (start: string | undefined, end: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate ?? ""}
        onChange={(e) => onChange(e.target.value || undefined, endDate)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
      />
      <span className="text-xs text-slate-500">→</span>
      <input
        type="date"
        value={endDate ?? ""}
        onChange={(e) => onChange(startDate, e.target.value || undefined)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
      />
    </div>
  );
}
