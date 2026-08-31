"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ErpDataTable,
  type ErpDataTableProps,
} from "@/components/dna/ErpDataTable";
import { cn } from "@/lib/utils";

export function OperationalPageShell({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("erp-operational", className)}>
      <header className="operational-page-header">
        <div className="min-w-0">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="operational-page-actions">{actions}</div> : null}
      </header>
      <div className="operational-page-content">{children}</div>
    </div>
  );
}

export function OperationalMetricGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const metricCount = React.Children.count(children);

  return (
    <div
      className={cn("operational-metric-grid", className)}
      data-metric-count={Math.min(metricCount, 5)}
    >
      {children}
    </div>
  );
}

export function OperationalMetricCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "red" | "purple";
}) {
  return (
    <section className="operational-metric-card">
      <div className="operational-metric-copy">
        <span className="operational-metric-label">{label}</span>
        <strong className="operational-metric-value">{value ?? "—"}</strong>
        {helper ? <span className="operational-metric-helper">{helper}</span> : null}
      </div>
      {icon ? <span className={cn("operational-metric-icon", `is-${tone}`)}>{icon}</span> : null}
    </section>
  );
}

export function OperationalPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("operational-panel", className)}>{children}</section>;
}

export function OperationalTabs(props: React.ComponentProps<typeof Tabs>) {
  return <Tabs {...props} className={cn("operational-tabs", props.className)} />;
}

export function OperationalTabsList(props: React.ComponentProps<typeof TabsList>) {
  return <TabsList {...props} className={cn("operational-tabs-list", props.className)} />;
}

export function OperationalTabsTrigger(props: React.ComponentProps<typeof TabsTrigger>) {
  return <TabsTrigger {...props} className={cn("operational-tabs-trigger", props.className)} />;
}

export function OperationalTabsContent(props: React.ComponentProps<typeof TabsContent>) {
  return <TabsContent {...props} className={cn("operational-tabs-content", props.className)} />;
}

export const OperationalInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
>(function OperationalInput({ className, icon, ...props }, ref) {
  return (
    <label className={cn("operational-input-wrap", className)}>
      {icon ? <span className="operational-input-icon">{icon}</span> : null}
      <input ref={ref} {...props} />
    </label>
  );
});

export function OperationalField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("operational-field", className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}

/**
 * Non-editable system-provided value primitive.
 * Distinguishes inherited/calculated/locked system data from user input.
 * No domain semantics are encoded here — pages decide when to use it.
 */
export function OperationalFieldReadOnly({
  label,
  value,
  tone = "neutral",
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "inherited" | "calculated" | "locked";
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("operational-field-readonly", `is-${tone}`, className)}>
      <span className="operational-field-readonly-label">{label}</span>
      <span className="operational-field-readonly-value">{value ?? "—"}</span>
      {hint ? <span className="operational-field-readonly-hint">{hint}</span> : null}
    </div>
  );
}

export function OperationalButton({
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <button
      {...props}
      className={cn("operational-button", `is-${variant}`, className)}
    />
  );
}

export type OperationalStatus =
  | "neutral"
  | "pending"
  | "process"
  | "success"
  | "danger"
  | "purple";

const OPERATIONAL_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Tidak Aktif",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  DRAFT: "Draf",
  SUBMITTED: "Diajukan",
  PENDING: "Menunggu",
  PENDING_APPROVAL: "Menunggu Persetujuan",
  PENDING_APPROVAL_SCM: "Menunggu SCM",
  PENDING_APPROVAL_DIRECTOR: "Menunggu Direktur",
  WAITING_APPROVAL: "Menunggu Persetujuan",
  WAITING: "Menunggu",
  IN_PROGRESS: "Dalam Proses",
  COMPLETED: "Selesai",
  RECEIVED: "Diterima",
  VERIFIED: "Terverifikasi",
  PASSED: "Lolos",
  ORDERED: "Dipesan",
  SHIPPED: "Dikirim",
  PAID: "Lunas",
  UNPAID: "Belum Lunas",
  OVERDUE: "Jatuh Tempo",
  PARTIAL: "Sebagian",
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
  NOT_STARTED: "Belum Dimulai",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

export function getOperationalStatusLabel(value?: string | null) {
  if (!value) return "—";
  return OPERATIONAL_STATUS_LABELS[value] || value.replaceAll("_", " ");
}

export function OperationalStatusBadge({
  status = "neutral",
  children,
  className,
}: {
  status?: OperationalStatus;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("operational-status-badge", `is-${status}`, className)}>
      {children}
    </span>
  );
}

export function OperationalDataTable<TData>({
  pageSize = 25,
  pageSizeOptions = [25, 50, 100],
  searchPlaceholder = "Cari data...",
  className,
  ...props
}: ErpDataTableProps<TData>) {
  return (
    <ErpDataTable
      {...props}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      searchPlaceholder={searchPlaceholder}
      className={cn("operational-data-table", className)}
    />
  );
}
