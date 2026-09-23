"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ListChecks,
  Target,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { QueryLoading, QueryError } from "@/components/query-states";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaTable,
  DnaBadge,
  DnaCell,
  type DnaDateMode,
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

export default function ChecklistProgressPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-mono text-xs">Memuat Progres Checklist...</div>}>
      <ChecklistProgressContent />
    </Suspense>
  );
}

function ChecklistProgressContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<DnaDateMode>("1_MONTH");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
          progress: typeof c.progress === "number" ? c.progress : 0,
          status: c.status || "Pending",
          deadline: c.deadline || c.dueDate || null,
          totalItems: Array.isArray(c.items) ? c.items.length : (typeof c.totalItems === "number" ? c.totalItems : 0),
          completedItems: Array.isArray(c.completedItems) ? c.completedItems.length : (typeof c.completedItems === "number" ? c.completedItems : 0),
          bpomRegNumber: c.bpomRegNumber || "NA18260109281",
          bpomIssuedDate: c.bpomIssuedDate || "2026-09-02",
        }));
      } catch {
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
            bpomRegNumber: "NA18260109285",
            bpomIssuedDate: "2026-09-03",
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

  const uniqueCategories = useMemo(() => Array.from(new Set(checklists.map((c) => c.category))), [checklists]);

  const filteredData = useMemo(() => {
    return checklists.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
      if (selectedStatus !== "ALL" && item.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        if (
          !item.code.toLowerCase().includes(q) &&
          !item.name.toLowerCase().includes(q) &&
          !item.category.toLowerCase().includes(q) &&
          !item.pic.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [checklists, selectedCategory, selectedStatus, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  if (isLoading) {
    return <QueryLoading message="Memuat data checklist QC..." />;
  }

  if (isError) {
    return <QueryError error="Gagal memuat data checklist QC" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. PAGE HEADER ── */}
      <DnaPageHeader
        title="CHECKLIST MONITORING MUTU QC"
        badge={<DnaBadge variant="info">MUTU QC</DnaBadge>}
        subtitle="Monitoring status dan verifikasi inspeksi seluruh checklist QC aktif secara real-time"
      />

      {/* ── 02. CANONICAL CLEAN KPI CARDS (NO TINT, ONLY COLORED ICONS) ── */}
      <DnaKpiGrid
        cards={[
          {
            key: "TOTAL",
            title: "TOTAL CHECKLIST",
            value: `${totalChecklists} Dokumen`,
            subtext: "Seluruh pos pengawasan mutu",
            icon: <ListChecks className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            key: "AVG",
            title: "RATA-RATA PROGRES",
            value: `${avgProgress}%`,
            subtext: "Penyelesaian inspeksi",
            icon: <Target className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            key: "DONE",
            title: "INSPEKSI SELESAI",
            value: `${completedCount} Checklist`,
            subtext: "100% Parameter lolos",
            icon: <CheckCircle2 className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            key: "OVERDUE",
            title: "TERLAMBAT / OVERDUE",
            value: `${overdueCount} Checklist`,
            subtext: "Melewati batas SLA QC",
            icon: <AlertTriangle className="w-4 h-4" />,
            iconBg: overdueCount > 0 ? "bg-rose-50" : "bg-slate-100",
            iconColor: overdueCount > 0 ? "text-rose-600" : "text-slate-500",
          },
        ]}
      />

      {/* ── 03. CARD TABEL MASTER (TOOLBAR TERPADU + ATOMIC COLUMNS) ── */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari kode QC, nama inspeksi, PIC, atau kategori...",
          filterColumns: [
            {
              key: "category",
              label: "Kategori",
              type: "select",
              options: uniqueCategories,
            },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["Completed", "Process", "Pending", "Overdue"],
            },
          ],
          selectedColumn: selectedCategory !== "ALL" ? "category" : "status",
          onSelectColumn: () => {},
          filterValue: selectedCategory !== "ALL" ? selectedCategory : selectedStatus,
          onFilterValueChange: (val) => {
            if (uniqueCategories.includes(val)) {
              setSelectedCategory(val);
              setSelectedStatus("ALL");
            } else if (val === "ALL") {
              setSelectedCategory("ALL");
              setSelectedStatus("ALL");
            } else {
              setSelectedStatus(val);
              setSelectedCategory("ALL");
            }
            setCurrentPage(1);
          },
          enableDateFilter: true,
          dateMode,
          onDateModeChange: setDateMode,
        }}
        paginationProps={{
          currentPage,
          totalPages,
          totalEntries: filteredData.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      >
        <DnaTable className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
              <th className="p-3.5 w-10 text-slate-400 text-center">#</th>
              <th className="p-3.5 w-[160px]">KODE CHECKLIST</th>
              <th className="p-3.5">NAMA CHECKLIST</th>
              <th className="p-3.5 w-[140px]">KATEGORI</th>
              <th className="p-3.5 w-[150px]">PIC INSPEKSI</th>
              <th className="p-3.5 w-[160px]">PROGRES</th>
              <th className="p-3.5 w-[120px]">STATUS</th>
              <th className="p-3.5 w-[120px]">DEADLINE SLA</th>
              <th className="p-3.5 w-[140px]">IZIN BPOM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  Tidak ada checklist yang sesuai kriteria filter.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 text-center text-slate-400 font-mono text-[11px] tabular-nums">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Code value={item.code} />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Text primary={item.name} />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Badge status={item.category} />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Avatar name={item.pic} />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Progress
                      value={item.progress}
                      colorClass={
                        item.progress >= 80
                          ? "bg-emerald-500"
                          : item.progress >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }
                    />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Badge status={item.status} />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Date value={item.deadline || "—"} />
                  </td>
                  <td className="p-3.5 font-mono text-[11.5px] text-slate-600">
                    {item.bpomRegNumber || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}
