"use client";

import { useState, useMemo } from "react";
import { Wallet, FileText, DollarSign, Eye, Plus, ShieldCheck } from "lucide-react";
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalStatusBadge,
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
  getOperationalStatusLabel,
} from "@/components/operational";

type PayrollStatus = "DRAFT" | "AUTHORIZED" | "PAID";

interface Payroll {
  id: string;
  period: string;
  status: PayrollStatus;
  totalDisbursement: number;
  authorizedBy: string;
  authorizedAt: string;
  employeeCount: number;
}

const PAYROLL_DATA: Payroll[] = [
  { id: "PR-001", period: "Januari 2026", status: "PAID", totalDisbursement: 485_000_000, authorizedBy: "Rina Wijaya", authorizedAt: "2026-02-01", employeeCount: 142 },
  { id: "PR-002", period: "Februari 2026", status: "PAID", totalDisbursement: 492_000_000, authorizedBy: "Rina Wijaya", authorizedAt: "2026-03-01", employeeCount: 144 },
  { id: "PR-003", period: "Maret 2026", status: "AUTHORIZED", totalDisbursement: 478_000_000, authorizedBy: "Rina Wijaya", authorizedAt: "2026-04-01", employeeCount: 140 },
  { id: "PR-004", period: "April 2026", status: "AUTHORIZED", totalDisbursement: 501_000_000, authorizedBy: "Rina Wijaya", authorizedAt: "2026-05-01", employeeCount: 146 },
  { id: "PR-005", period: "Mei 2026", status: "DRAFT", totalDisbursement: 0, authorizedBy: "", authorizedAt: "", employeeCount: 145 },
];

const STATUS_LABEL: Record<PayrollStatus, string> = {
  DRAFT: "Draf",
  AUTHORIZED: "Disetujui",
  PAID: "Lunas",
};

const STATUS_TONE: Record<PayrollStatus, "pending" | "purple" | "success"> = {
  DRAFT: "pending",
  AUTHORIZED: "purple",
  PAID: "success",
};

const TAB_VALUES = ["all", "draft", "authorized", "paid"] as const;

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<(typeof TAB_VALUES)[number]>("all");

  const filteredPayroll = useMemo(() => {
    if (activeTab === "all") return PAYROLL_DATA;
    return PAYROLL_DATA.filter((p) => p.status.toLowerCase() === activeTab);
  }, [activeTab]);

  const totalMTD = "Rp 478 Jt";
  const draftCount = PAYROLL_DATA.filter((p) => p.status === "DRAFT").length;
  const authorizedCount = PAYROLL_DATA.filter((p) => p.status === "AUTHORIZED").length;
  const paidCount = PAYROLL_DATA.filter((p) => p.status === "PAID").length;

  const columns = useMemo(
    () => [
      {
        accessorKey: "period",
        header: "Periode",
        cell: ({ row }: { row: { original: Payroll } }) => (
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-slate-900">{row.original.period}</span>
            <span className="text-[11px] text-slate-500">{row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }: { row: { original: Payroll } }) => {
          const s = row.original.status;
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status={STATUS_TONE[s]}>
                {STATUS_LABEL[s] ?? getOperationalStatusLabel(s)}
              </OperationalStatusBadge>
            </div>
          );
        },
      },
      {
        accessorKey: "totalDisbursement",
        header: () => <div className="text-right">Total Pencairan</div>,
        cell: ({ getValue }: { getValue: () => number }) => (
          <div className="text-right text-[13px] font-medium tabular-nums text-slate-900">
            {getValue() > 0 ? `Rp ${(Number(getValue()) / 1_000_000).toFixed(0)} Jt` : "—"}
          </div>
        ),
      },
      {
        accessorKey: "employeeCount",
        header: () => <div className="text-right">Karyawan</div>,
        cell: ({ getValue }: { getValue: () => number }) => (
          <div className="text-right text-[13px] tabular-nums text-slate-700">
            {Number(getValue()).toLocaleString("id-ID")}
          </div>
        ),
      },
      {
        accessorKey: "authorizedBy",
        header: "Disetujui Oleh",
        cell: ({ getValue }: { getValue: () => string }) => (
          <span className="text-[13px] text-slate-700">{getValue() || "—"}</span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }: { row: { original: Payroll } }) => (
          <div className="flex justify-center gap-2">
            <button type="button" className="operational-button is-secondary h-8 px-3 text-[11px]">
              <Eye className="h-3.5 w-3.5" />
              <span>Detail</span>
            </button>
            {row.original.status === "DRAFT" && (
              <button type="button" className="operational-button is-primary h-8 px-3 text-[11px]">
                Authorize
              </button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalPageShell
      title="Payroll"
      subtitle="Monthly Payroll Processing & Disbursement Control"
      actions={
        <button type="button" className="operational-button is-primary">
          <Plus className="h-4 w-4" />
          <span>Generate Draft</span>
        </button>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total Payroll (MTD)"
            value={totalMTD}
            icon={<Wallet className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Draft Payrolls"
            value={draftCount}
            icon={<FileText className="h-4 w-4" />}
            tone="amber"
          />
          <OperationalMetricCard
            label="Authorized"
            value={authorizedCount}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="purple"
          />
          <OperationalMetricCard
            label="Paid"
            value={paidCount}
            icon={<DollarSign className="h-4 w-4" />}
            tone="green"
          />
        </OperationalMetricGrid>

        <OperationalTabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as typeof activeTab)}>
          <OperationalTabsList>
            <OperationalTabsTrigger value="all">Semua</OperationalTabsTrigger>
            <OperationalTabsTrigger value="draft">Draft</OperationalTabsTrigger>
            <OperationalTabsTrigger value="authorized">Authorized</OperationalTabsTrigger>
            <OperationalTabsTrigger value="paid">Paid</OperationalTabsTrigger>
          </OperationalTabsList>

          {TAB_VALUES.map((tab) => (
            <OperationalTabsContent key={tab} value={tab}>
              <OperationalDataTable
                data={filteredPayroll}
                columns={columns as any}
                getRowId={(row: Payroll) => row.id}
                searchPlaceholder="Cari periode, status, atau penyetuju..."
                emptyMessage="Tidak ada data payroll ditemukan"
              />
            </OperationalTabsContent>
          ))}
        </OperationalTabs>
      </div>
    </OperationalPageShell>
  );
}
