"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DataTable as CanonicalDataTable, type DataTableProps } from "@/components/canonical/DataTable";
import {
  SectionCard as CanonicalSectionCard,
  SectionCardContent,
  StatusBadge as CanonicalStatusBadge,
  MetricCard as CanonicalMetricCard,
  PageShell as CanonicalPageShell,
} from "@/components/canonical";
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
    <CanonicalPageShell
      title={title}
      subtitle={subtitle}
      actions={actions}
    >
      <div className={cn("flex flex-col gap-6", className)}>{children}</div>
    </CanonicalPageShell>
  );
}

export function OperationalMetricGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
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
  const variantMap = {
    neutral: "neutral",
    blue: "info",
    green: "success",
    amber: "warning",
    red: "danger",
    purple: "info",
  } as const;

  return (
    <CanonicalMetricCard
      label={label}
      value={value}
      helper={helper}
      icon={icon}
      variant={variantMap[tone]}
    />
  );
}

export function OperationalPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CanonicalSectionCard className={className}>
      <SectionCardContent>{children}</SectionCardContent>
    </CanonicalSectionCard>
  );
}

export function OperationalTabs(props: React.ComponentProps<typeof Tabs>) {
  return <Tabs {...props} />;
}

export function OperationalTabsList(props: React.ComponentProps<typeof TabsList>) {
  return <TabsList {...props} />;
}

export function OperationalTabsTrigger(props: React.ComponentProps<typeof TabsTrigger>) {
  return <TabsTrigger {...props} />;
}

export function OperationalTabsContent(props: React.ComponentProps<typeof TabsContent>) {
  return <TabsContent {...props} />;
}

export const OperationalInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
>(function OperationalInput({ className, icon, ...props }, ref) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 [&>svg]:w-3.5 [&>svg]:h-3.5 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        {...props}
        className={cn(
          "h-10 w-full bg-white border border-[#E2E8F0] rounded-lg text-[12px] font-medium text-slate-700 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50",
          "transition-all",
          icon ? "pl-10 pr-3" : "px-3",
          className,
        )}
      />
    </div>
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
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-[11px] font-medium text-slate-700">{label}</span>
      )}
      {children}
    </label>
  );
}

export function OperationalFieldReadOnly({
  label,
  value,
  tone: _tone = "neutral",
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
    <div
      className={cn(
        "flex flex-col gap-1 px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-lg",
        className,
      )}
    >
      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[13px] font-medium text-slate-900">{value ?? "—"}</span>
      {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
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
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
    secondary: "bg-white text-slate-700 border-[#E2E8F0] hover:bg-slate-50",
    danger: "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white",
    ghost: "bg-transparent text-slate-500 border-transparent hover:bg-slate-100",
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[12px] font-medium transition-colors",
        variantClasses[variant],
        className,
      )}
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

const STATUS_TO_VARIANT: Record<OperationalStatus, "default" | "success" | "info" | "warning" | "destructive"> = {
  neutral: "default",
  pending: "warning",
  process: "info",
  success: "success",
  danger: "destructive",
  purple: "info",
};

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
    <CanonicalStatusBadge variant={STATUS_TO_VARIANT[status]} className={className}>
      {children}
    </CanonicalStatusBadge>
  );
}

export function OperationalDataTable<TData>({
  pageSize = 25,
  searchPlaceholder = "Cari data...",
  className,
  ...props
}: DataTableProps<TData>) {
  return (
    <CanonicalDataTable
      {...props}
      pageSize={pageSize}
      searchPlaceholder={searchPlaceholder}
      className={className}
    />
  );
}
