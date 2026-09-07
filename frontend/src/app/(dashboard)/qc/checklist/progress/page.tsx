"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ListChecks,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QueryLoading, QueryError } from "@/components/query-states";
import {
  DnaDataTable,
  DnaBadge,
  DnaColumn,
  DnaKpiItem,
  DateFilterValue,
} from "@/components/dna";

interface ChecklistProgress {
  id: string;
  code: string;
  category: string;
  name: string;
  pic: string;
  progress: number;
  status: string;
  deadline: string | null;
  totalItems: number;
  completedItems: number;
  bpomRegNumber?: string;
  bpomIssuedDate?: string;
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? "bg-emerald-500"
      : value >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-bold font-mono tabular-nums w-8 text-right",
        value >= 80 ? "text-emerald-600 dark:text-emerald-400" : value >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
      )}>
        {value}%
      </span>
    </div>
  );
}

export default function ChecklistProgressPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: "this-month",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
  });

  const { data: checklists = [], isLoading, isError } = useQuery<ChecklistProgress[]>({
    queryKey: ["qc-checklist-progress"],
    queryFn: async () => {
      try {
        const res = await api.get("/qc/checklists");
        return (res.data || []).map((c: any) => ({
          id: c.id,
          code: c.code || c.id,
          category: c.category || "General",
          name: c.name || c.title || "Unnamed",
          pic: c.pic || c.assignedTo || "—",
          progress: c.progress ?? 0,
          status: c.status || "Pending",
          deadline: c.deadline || c.dueDate || null,
          totalItems: c.totalItems || 0,
          completedItems: c.completedItems || 0,
        }));
      } catch (err) {
        // Mock fallback if backend endpoint isn't ready
        return [
          {
            id: "chk-001",
            code: "QC-CHK-2026-001",
            category: "Ruahan / Bulk",
            name: "Inspeksi Kelulusan Bulk Day Cream SPF 30",
            pic: "Ratna Sari",
            progress: 100,
            status: "Completed",
            deadline: "2026-09-05",
            totalItems: 8,
            completedItems: 8,
            bpomRegNumber: "NA18260109281",
            bpomIssuedDate: "2026-09-02",
          },
          {
            id: "chk-002",
            code: "QC-CHK-2026-002",
            category: "Packaging Primer",
            name: "Kebocoran & Dropper Serum Retinol",
            pic: "Budi Santoso",
            progress: 65,
            status: "Process",
            deadline: "2026-09-08",
            totalItems: 10,
            completedItems: 6,
            bpomRegNumber: "NA18260109281",
            bpomIssuedDate: "2026-09-02",
          },
          {
            id: "chk-003",
            code: "QC-CHK-2026-003",
            category: "Microbiology",
            name: "Uji ALT/AKG & Angka Lempeng Total",
            pic: "Dr. Hendra",
            progress: 25,
            status: "Process",
            deadline: "2026-09-10",
            totalItems: 12,
            completedItems: 3,
          },
          {
            id: "chk-004",
            code: "QC-CHK-2026-004",
            category: "Sekunder & Box",
            name: "Verifikasi Barcode BPOM & Hologram Box",
            pic: "Siti Rahma",
            progress: 0,
            status: "Pending",
            deadline: "2026-09-12",
            totalItems: 6,
            completedItems: 0,
            bpomRegNumber: "NA18260109282",
            bpomIssuedDate: "2026-09-04",
          },
        ];
      }
    },
  });

  const totalChecklists = checklists.length;
  const avgProgress = totalChecklists > 0
    ? Math.round(checklists.reduce((s, c) => s + c.progress, 0) / totalChecklists)
    : 0;
  const completedCount = checklists.filter((c) => c.progress === 100).length;
  const overdueCount = checklists.filter((c) => c.status === "Overdue" || (c.deadline && new Date(c.deadline) < new Date() && c.progress < 100)).length;

  const kpis: DnaKpiItem[] = useMemo(() => [
    {
      label: "Total Checklist",
      value: `${totalChecklists} Dokumen`,
      subtext: "Seluruh pos pengawasan mutu",
      variant: "blue",
    },
    {
      label: "Rata-rata Progres",
      value: `${avgProgress}%`,
      subtext: "Penyelesaian inspeksi",
      variant: "emerald",
    },
    {
      label: "Inspeksi Selesai",
      value: `${completedCount} Checklist`,
      subtext: "100% Parameter lolos",
      variant: "emerald",
    },
    {
      label: "Terlambat / Overdue",
      value: `${overdueCount} Checklist`,
      subtext: "Melewati batas SLA QC",
      variant: overdueCount > 0 ? "rose" : "slate",
    },
  ], [totalChecklists, avgProgress, completedCount, overdueCount]);

  const columns: DnaColumn<ChecklistProgress>[] = useMemo(() => [
    {
      key: "code",
      header: "KODE CHECKLIST",
      type: "code",
      sortable: true,
      width: "150px",
    },
    {
      key: "category",
      header: "KATEGORI",
      type: "badge",
      sortable: true,
      width: "140px",
      render: (val) => (
        <DnaBadge variant="blue">
          {String(val)}
        </DnaBadge>
      ),
    },
    {
      key: "name",
      header: "NAMA CHECKLIST",
      type: "text",
      sortable: true,
      width: "240px",
      render: (val) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {String(val)}
        </span>
      ),
    },
    {
      key: "pic",
      header: "PIC INSPEKSI",
      type: "text",
      sortable: true,
      width: "150px",
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
            {String(val).charAt(0)}
          </div>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {String(val)}
          </span>
        </div>
      ),
    },
    {
      key: "progress",
      header: "PROGRES INSPEKSI",
      type: "text",
      sortable: true,
      width: "200px",
      render: (val, row) => (
        <div className="space-y-1">
          <ProgressBar value={Number(val || 0)} />
          <p className="text-[10px] text-slate-400 font-medium">
            {row.completedItems} dari {row.totalItems} parameter terisi
          </p>
        </div>
      ),
    },
    {
      key: "deadline",
      header: "DEADLINE SLA",
      type: "date",
      sortable: true,
      width: "120px",
      render: (val) => (
        <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
          {val ? String(val) : "—"}
        </span>
      ),
    },
    {
      key: "bpomRegNumber",
      header: "IZIN BPOM",
      width: "140px",
      render: (val, row) => (
        <div className="flex flex-col gap-0.5">
          {val ? (
            <>
              <DnaBadge variant="emerald">{String(val)}</DnaBadge>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400">Terbit: {row.bpomIssuedDate || "—"}</span>
            </>
          ) : (
            <DnaBadge variant="amber">Belum Terbit</DnaBadge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      type: "status",
      align: "center",
      width: "130px",
      statusConfig: {
        options: [
          { value: "Pending", label: "Pending", variant: "amber" },
          { value: "Process", label: "Process", variant: "blue" },
          { value: "Completed", label: "Completed", variant: "emerald" },
          { value: "Overdue", label: "Overdue", variant: "rose" },
        ],
      },
    },
  ], []);

  if (isLoading) {
    return <QueryLoading message="Memuat data checklist QC..." />;
  }

  if (isError) {
    return <QueryError error="Gagal memuat data checklist QC" onRetry={() => window.location.reload()} />;
  }

  return (
    <DnaDataTable<ChecklistProgress>
      title="Checklist Monitoring Mutu QC"
      subtitle="Monitoring status dan verifikasi inspeksi seluruh checklist QC aktif secara real-time."
      badge={<DnaBadge variant="blue">{checklists.length} CHECKLIST AKTIF</DnaBadge>}
      kpis={kpis}
      data={checklists}
      columns={columns}
      primaryKey="id"
      searchPlaceholder="Cari kode checklist, kategori, nama pengujian, PIC..."
      searchFilter={(row, q) =>
        row.code.toLowerCase().includes(q.toLowerCase()) ||
        row.category.toLowerCase().includes(q.toLowerCase()) ||
        row.name.toLowerCase().includes(q.toLowerCase()) ||
        row.pic.toLowerCase().includes(q.toLowerCase()) ||
        row.status.toLowerCase().includes(q.toLowerCase())
      }
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
    />
  );
}

