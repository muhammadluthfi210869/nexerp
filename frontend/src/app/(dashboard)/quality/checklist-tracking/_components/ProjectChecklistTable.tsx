"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  User,
  Layers,
  Edit2,
  FileText,
  Sparkles,
  Info,
} from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaCell,
} from "@/components/dna";
import type {
  ProjectChecklistTrackingItem,
  MilestoneStatus,
  ProjectMilestone,
} from "../_types/checklist-tracking.types";

interface ProjectChecklistTableProps {
  projects: ProjectChecklistTrackingItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatusFilter?: string;
  onSelectStatusFilter?: (status: string) => void;
  selectedMilestoneFilter: string;
  onSelectMilestoneFilter: (filter: string) => void;
  selectedDepartmentFilter: string;
  onSelectDepartmentFilter: (dept: string) => void;
  onUpdateMilestoneStatus: (
    projectId: string,
    milestoneId: string,
    newStatus: MilestoneStatus,
    estimationDate?: string,
    notes?: string
  ) => void;
  onViewTimeline: (project: ProjectChecklistTrackingItem) => void;
}

export function ProjectChecklistTable({
  projects,
  searchQuery,
  onSearchChange,
  selectedStatusFilter = "ALL",
  onSelectStatusFilter,
  selectedMilestoneFilter,
  onSelectMilestoneFilter,
  selectedDepartmentFilter,
  onSelectDepartmentFilter,
  onUpdateMilestoneStatus,
  onViewTimeline,
}: ProjectChecklistTableProps) {
  // State for expanded project rows (dropdown accordion ke bawah)
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(
    new Set() // Bersih dan rapi secara default (1 baris per projek, identik Client Produksi)
  );

  // State for quick edit modal (Estimasi Tanggal & Catatan Pending)
  const [editingMilestone, setEditingMilestone] = useState<{
    projectId: string;
    milestone: ProjectMilestone;
  } | null>(null);

  const [inputEstimation, setInputEstimation] = useState("");
  const [inputNotes, setInputNotes] = useState("");
  const [inputStatus, setInputStatus] = useState<MilestoneStatus>("PENDING");

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedRowIds(new Set(projects.map((p) => p.id)));
  };

  const collapseAll = () => {
    setExpandedRowIds(new Set());
  };

  const handleOpenEdit = (projectId: string, m: ProjectMilestone) => {
    setEditingMilestone({ projectId, milestone: m });
    setInputEstimation(m.estimationDate || m.deadlineDate);
    setInputNotes(m.notes || "");
    setInputStatus(m.status);
  };

  const handleSaveEdit = () => {
    if (!editingMilestone) return;
    onUpdateMilestoneStatus(
      editingMilestone.projectId,
      editingMilestone.milestone.id,
      inputStatus,
      inputEstimation,
      inputNotes
    );
    setEditingMilestone(null);
  };

  return (
    <DnaDataTableCard
      count={projects.length}
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari SO, pelanggan, brand, produk, busdev...",
        statusOptions: [
          { label: "Semua Status", value: "ALL" },
          { label: "On Track", value: "ON_TRACK" },
          { label: "Delayed / Terlambat", value: "DELAYED" },
          { label: "Pending", value: "PENDING" },
          { label: "Selesai Penuh", value: "COMPLETED" },
        ],
        selectedStatus: selectedStatusFilter || "ALL",
        onSelectStatus: onSelectStatusFilter,
        statusPlaceholder: "Filter Status SLA",
        filterColumns: [
          {
            key: "department",
            label: "Filter Departemen (PIC)",
            options: [
              "ALL",
              "Busdev",
              "Design",
              "R&D",
              "Legalitas",
              "SCM",
              "Produksi",
              "QC",
              "Finance",
            ],
          },
          {
            key: "milestone",
            label: "Filter Status Milestone",
            options: [
              "ALL",
              "Bahan Baku: PENDING",
              "Mixing: PENDING",
              "BPOM NA: PENDING",
              "Delivery: PENDING",
            ],
          },
        ],
        selectedColumn:
          selectedDepartmentFilter !== "ALL"
            ? "department"
            : selectedMilestoneFilter !== "ALL"
            ? "milestone"
            : undefined,
        onSelectColumn: (col) => {
          if (!col) {
            onSelectDepartmentFilter("ALL");
            onSelectMilestoneFilter("ALL");
          }
        },
        filterValue:
          selectedDepartmentFilter !== "ALL"
            ? selectedDepartmentFilter
            : selectedMilestoneFilter,
        onFilterValueChange: (val) => {
          if (
            ["Busdev", "Design", "R&D", "Legalitas", "SCM", "Produksi", "QC", "Finance"].includes(
              val
            )
          ) {
            onSelectDepartmentFilter(val);
          } else {
            onSelectMilestoneFilter(val || "ALL");
          }
        },
        onResetAll: () => {
          onSearchChange("");
          onSelectStatusFilter?.("ALL");
          onSelectDepartmentFilter("ALL");
          onSelectMilestoneFilter("ALL");
        },
      }}
    >
      {/* Quick Helper Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/70 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-800">
            Daftar Overview Projek ({projects.length} Sales Order)
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 text-[11px]">
            Klik baris atau tombol ▾ untuk membuka 20 milestone per baris tanpa scroll horizontal
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
          >
            Buka Semua (Expand)
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-xs">
              <DnaTh className="p-2.5 text-center w-10 text-slate-400 border-r border-slate-200">#</DnaTh>
              <DnaTh className="p-2.5 w-60 border-r border-slate-200">PROJEK & PELANGGAN</DnaTh>
              <DnaTh className="p-2.5 w-28 border-r border-slate-200">TARGET & SLA</DnaTh>
              <DnaTh className="p-2.5 min-w-[460px] border-r border-slate-200">
                CHECKLIST MILESTONE DEPARTEMEN
              </DnaTh>
              <DnaTh className="p-2.5 w-32 text-center border-r border-slate-200">STATUS & PROGRESS</DnaTh>
              <DnaTh className="p-2.5 w-16 text-center">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {projects.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada projek checklist tracking yang sesuai kriteria pencarian & filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              projects.map((proj, idx) => {
                const isExpanded = expandedRowIds.has(proj.id);
                const filteredMilestones =
                  selectedDepartmentFilter !== "ALL"
                    ? proj.milestones.filter((m) => m.department === selectedDepartmentFilter)
                    : proj.milestones;

                return (
                  <React.Fragment key={proj.id}>
                    {/* PRIMARY ROW (6 KOLOM RAMPING & LAPANG BEBAS SESAK) */}
                    <DnaTableRow
                      onClick={() => toggleRowExpand(proj.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* 1: # */}
                      <DnaTd className="p-2.5 text-center text-slate-400 tabular-nums border-r border-slate-100">
                        {idx + 1}
                      </DnaTd>

                      {/* 2: Projek & Pelanggan (Penggabungan SO, Pelanggan, Brand & Produk) */}
                      <DnaTd className="p-2.5 border-r border-slate-100">
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span className="tabular-nums font-bold text-blue-600 text-xs font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                            {proj.soCode}
                          </span>
                          <span
                            className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]"
                            title={proj.customerName}
                          >
                            {proj.customerName}
                          </span>
                        </div>
                        <div
                          className="text-[10.5px] text-slate-500 truncate mt-1"
                          title={`${proj.brandName} — ${proj.productName}`}
                        >
                          <span className="font-semibold text-slate-800">{proj.brandName}</span>
                          <span className="text-slate-400 mx-1">•</span>
                          <span className="text-blue-700 font-medium">{proj.productName}</span>
                        </div>
                      </DnaTd>

                      {/* 3: Target & SLA */}
                      <DnaTd className="p-2.5 font-mono text-xs tabular-nums whitespace-nowrap border-r border-slate-100">
                        <div className="font-bold text-slate-900 text-[11px]">
                          {proj.deadlineFinal}
                        </div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                              proj.daysRemaining > 14
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : proj.daysRemaining > 0
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {proj.daysRemaining > 0 ? `Sisa ${proj.daysRemaining} hr` : "Overdue"}
                          </span>
                        </div>
                      </DnaTd>

                      {/* 4: Checklist Tracking Projek Multi-Departemen (Non-Sequential 2 Baris) */}
                      <DnaTd className="p-2.5 border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const row1Stages = [
                            { key: "Busdev", label: "Busdev", dept: "Busdev", desc: "Busdev & Kontrak" },
                            { key: "Design", label: "Desain", dept: "Design", desc: "Desain Kemasan" },
                            { key: "R&D", label: "R&D Lab", dept: "R&D", desc: "Formulasi & Lab R&D" },
                            { key: "Legalitas", label: "BPOM & HKI", dept: "Legalitas", desc: "Legalitas BPOM & HKI" },
                            { key: "SCM", label: "SCM Bahan", dept: "SCM", desc: "Bahan Baku SCM" },
                          ];

                          const row2Stages = [
                            { key: "Produksi", label: "Produksi", dept: "Produksi", desc: "Pabrikasi Mixing-Filling" },
                            { key: "QC", label: "QC Lab", dept: "QC", desc: "QC Lab & Uji Mutu" },
                            { key: "Finance", label: "Finance", dept: "Finance", desc: "Pelunasan Faktur" },
                            { key: "Logistik", label: "Logistik", dept: "Logistik", desc: "Pengiriman & Surat Jalan" },
                          ];

                          const getDeptStatus = (dept: string) => {
                            const mList = proj.milestones.filter((m) => m.department === dept);
                            if (mList.length === 0) return { isDone: false, isActive: false, isDelayed: false };
                            const isDone = mList.every((m) => m.status === "DONE");
                            const isDelayed = mList.some((m) => m.status === "DELAYED");
                            const isActive = mList.some((m) => m.status === "IN_PROGRESS");
                            return { isDone, isActive, isDelayed };
                          };

                          const renderChip = (stg: { key: string; label: string; desc: string; dept: string }) => {
                            const st = getDeptStatus(stg.dept);
                            return (
                              <div
                                key={stg.key}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                                  st.isDone
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold hover:bg-emerald-100"
                                    : st.isActive
                                    ? "bg-blue-600 text-white font-bold animate-pulse shadow-2xs hover:bg-blue-700"
                                    : st.isDelayed
                                    ? "bg-rose-50 text-rose-800 border border-rose-300 font-semibold hover:bg-rose-100"
                                    : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-50"
                                }`}
                                title={`${stg.desc} - Status: ${
                                  st.isDone ? "Selesai" : st.isActive ? "Sedang Berjalan" : st.isDelayed ? "Terlambat" : "Belum Dikerjakan"
                                }`}
                                onClick={() => toggleRowExpand(proj.id)}
                              >
                                <span className="font-mono text-[9px] font-bold">
                                  {st.isDone ? "✓" : st.isActive ? "●" : st.isDelayed ? "!" : "-"}
                                </span>
                                <span>{stg.label}</span>
                              </div>
                            );
                          };

                          return (
                            <div className="flex flex-col gap-1.5 w-full max-w-[500px]">
                              {/* Header Non-Sequential: Indikator Kemajuan Multi-Departemen */}
                              <div className="flex items-center justify-between text-[10.5px]">
                                <span className="text-[10px] font-semibold text-slate-700 flex items-center gap-1.5">
                                  <Layers className="w-3 h-3 text-blue-600" />
                                  Checklist Departemen
                                </span>
                                <span className="text-[9.5px] text-slate-500 font-mono font-medium">
                                  {proj.completedCount} dari {proj.totalCount} Selesai
                                </span>
                              </div>

                              {/* Baris 1: Pra-Produksi, Legalitas & Pengadaan */}
                              <div className="flex items-center gap-1.5 overflow-x-hidden">
                                {row1Stages.map((stg) => renderChip(stg))}
                              </div>

                              {/* Baris 2: Pabrikasi, Mutu, Finance & Pengiriman */}
                              <div className="flex items-center gap-1.5 overflow-x-hidden">
                                {row2Stages.map((stg) => renderChip(stg))}
                              </div>
                            </div>
                          );
                        })()}
                      </DnaTd>

                      {/* 5: Status & Progress (Penggabungan Status Badge dan Progress Bar) */}
                      <DnaTd className="p-2.5 text-center border-r border-slate-100">
                        <DnaBadge
                          variant={
                            proj.overallStatus === "COMPLETED"
                              ? "emerald"
                              : proj.overallStatus === "ON_TRACK"
                              ? "blue"
                              : proj.overallStatus === "DELAYED"
                              ? "rose"
                              : "amber"
                          }
                        >
                          {proj.overallStatus === "COMPLETED"
                            ? "Selesai"
                            : proj.overallStatus === "ON_TRACK"
                            ? "On Track"
                            : proj.overallStatus === "DELAYED"
                            ? "Delayed"
                            : "Pending"}
                        </DnaBadge>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          <span className="font-bold text-[10.5px] text-slate-700 font-mono">
                            {proj.progressPct}%
                          </span>
                          <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${proj.progressPct}%` }}
                            />
                          </div>
                        </div>
                      </DnaTd>

                      {/* 6: Aksi (Icon-Only Visual DNA) */}
                      <DnaTd className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewTimeline(proj)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                            title="Buka Visualisasi Timeline Gantt"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleRowExpand(proj.id)}
                            className={`p-1.5 rounded-lg transition-colors border ${
                              isExpanded
                                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-2xs"
                                : "text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-transparent hover:border-blue-200"
                            }`}
                            title={isExpanded ? "Tutup Detail Milestone" : "Buka Detail Milestone"}
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-blue-600" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </DnaTd>
                    </DnaTableRow>

                    {/* EXPANDED SECTION (DROPDOWN KE BAWAH: 1 BARIS PER MILESTONE) */}
                    {isExpanded && (
                      <DnaTableRow className="bg-slate-50/80 hover:bg-slate-50/90 border-b-2 border-slate-200">
                        <DnaTd colSpan={6} className="p-4 sm:p-5">
                          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                            {/* Sub-header Banner */}
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-bold text-[11px] border border-blue-200">
                                  {proj.soCode}
                                </span>
                                <span className="font-bold text-slate-800">
                                  Checklist Milestone: {proj.customerName} — {proj.productName}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-[11px] text-slate-600">
                                <span>
                                  Target Selesai:{" "}
                                  <strong className="text-slate-900 font-mono font-bold">
                                    {proj.deadlineFinal}
                                  </strong>
                                </span>
                                <span>
                                  Selesai:{" "}
                                  <strong className="text-emerald-700 font-bold">
                                    {proj.completedCount} / {proj.totalCount} Tahapan ({proj.progressPct}%)
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Milestone Sub-Table (1 ROW PER MILESTONE VERTICALLY) */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-2.5 px-3 w-[40px] text-center text-slate-500">#</th>
                                    <th className="py-2.5 px-3 min-w-[200px]">Tahapan / Milestone</th>
                                    <th className="py-2.5 px-3 min-w-[110px]">Departemen</th>
                                    <th className="py-2.5 px-3 min-w-[150px]">PIC Bertanggung Jawab</th>
                                    <th className="py-2.5 px-3 text-center w-[80px]">Durasi</th>
                                    <th className="py-2.5 px-3 text-center min-w-[110px]">Deadline PIC</th>
                                    <th className="py-2.5 px-3 min-w-[180px]">Estimasi Selesai</th>
                                    <th className="py-2.5 px-3 text-center min-w-[160px]">Status Dropdown</th>
                                    <th className="py-2.5 px-3 min-w-[200px]">Catatan / Alasan Pending</th>
                                    <th className="py-2.5 px-3 text-right w-[80px]">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filteredMilestones.map((m, mIdx) => {
                                    return (
                                      <tr
                                        key={m.id}
                                        className={`hover:bg-slate-50/80 transition-colors ${
                                          m.status === "DONE"
                                            ? "bg-emerald-50/20"
                                            : m.status === "IN_PROGRESS"
                                            ? "bg-blue-50/20"
                                            : m.status === "DELAYED"
                                            ? "bg-rose-50/30"
                                            : ""
                                        }`}
                                      >
                                        {/* 1: Number */}
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-400 tabular-nums">
                                          {mIdx + 1}
                                        </td>

                                        {/* 2: Milestone Name & Dependency */}
                                        <td className="py-2.5 px-3">
                                          <div className="font-bold text-slate-900">{m.category}</div>
                                          <div className="text-[10px] text-slate-400">
                                            Ketergantungan: {m.dependsOn}
                                          </div>
                                        </td>

                                        {/* 3: Department Badge */}
                                        <td className="py-2.5 px-3">
                                          <span
                                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                              m.department === "Busdev"
                                                ? "bg-purple-100 text-purple-800"
                                                : m.department === "Design"
                                                ? "bg-indigo-100 text-indigo-800"
                                                : m.department === "R&D"
                                                ? "bg-cyan-100 text-cyan-800"
                                                : m.department === "Legalitas"
                                                ? "bg-amber-100 text-amber-800"
                                                : m.department === "SCM"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : m.department === "Produksi"
                                                ? "bg-orange-100 text-orange-800"
                                                : m.department === "QC"
                                                ? "bg-teal-100 text-teal-800"
                                                : m.department === "Finance"
                                                ? "bg-rose-100 text-rose-800"
                                                : "bg-slate-100 text-slate-800"
                                            }`}
                                          >
                                            {m.department}
                                          </span>
                                        </td>

                                        {/* 4: PIC */}
                                        <td className="py-2.5 px-3">
                                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                            <User className="w-3 h-3 text-slate-400" />
                                            <span>{m.pic}</span>
                                          </div>
                                        </td>

                                        {/* 5: SLA Days */}
                                        <td className="py-2.5 px-3 text-center">
                                          <span className="font-bold text-slate-700 tabular-nums">
                                            {m.days} hr
                                          </span>
                                        </td>

                                        {/* 6: Deadline Date per PIC (Poin 96 & 97) */}
                                        <td className="py-2.5 px-3 text-center font-mono text-[11px] font-semibold text-slate-700">
                                          {m.deadlineDate}
                                        </td>

                                        {/* 7: Estimasi Tanggal Selesai (Poin 98 & 160) */}
                                        <td className="py-2.5 px-3">
                                          <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span
                                              className={`font-semibold ${
                                                m.status === "DONE"
                                                  ? "text-emerald-700"
                                                  : "text-slate-800"
                                              }`}
                                            >
                                              {m.estimationDate}
                                            </span>
                                          </div>
                                        </td>

                                        {/* 8: Interactive Dropdown Status (Poin 161) */}
                                        <td className="py-2.5 px-3 text-center">
                                          <select
                                            value={m.status}
                                            onChange={(e) => {
                                              const newSt = e.target.value as MilestoneStatus;
                                              if (newSt === "PENDING" || newSt === "DELAYED") {
                                                handleOpenEdit(proj.id, { ...m, status: newSt });
                                              } else {
                                                onUpdateMilestoneStatus(
                                                  proj.id,
                                                  m.id,
                                                  newSt,
                                                  newSt === "DONE" ? "Selesai saat input" : m.estimationDate,
                                                  m.notes
                                                );
                                              }
                                            }}
                                            className={`w-full text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer transition-all ${
                                              m.status === "DONE"
                                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                                : m.status === "IN_PROGRESS"
                                                ? "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100"
                                                : m.status === "DELAYED"
                                                ? "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                                                : m.status === "HOLD"
                                                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                                            }`}
                                          >
                                            <option value="PENDING">⏱️ PENDING</option>
                                            <option value="IN_PROGRESS">⚡ IN PROGRESS</option>
                                            <option value="DONE">✅ DONE</option>
                                            <option value="DELAYED">⚠️ DELAYED</option>
                                            <option value="HOLD">⏸️ HOLD</option>
                                          </select>
                                        </td>

                                        {/* 9: Catatan / Alasan Pending (Poin 123 & 161) */}
                                        <td className="py-2.5 px-3">
                                          <div
                                            className={`text-[11px] truncate max-w-[220px] ${
                                              m.notes && m.notes !== "-"
                                                ? "text-slate-800 font-medium"
                                                : "text-slate-400 italic"
                                            }`}
                                            title={m.notes}
                                          >
                                            {m.notes || "-"}
                                          </div>
                                        </td>

                                        {/* 10: Edit Action Popover */}
                                        <td className="py-2.5 px-3 text-right">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEdit(proj.id, m)}
                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200 inline-flex items-center justify-center"
                                            title="Edit Estimasi Tanggal & Catatan"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </div>

      {/* Popover / Mini Modal for Estimasi & Catatan (Poin 123 & 161) */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800">
                Update Milestone: {editingMilestone.milestone.category}
              </h4>
              <button
                type="button"
                onClick={() => setEditingMilestone(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">Status Milestone</span>
              <select
                value={inputStatus}
                onChange={(e) => setInputStatus(e.target.value as MilestoneStatus)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white font-semibold"
              >
                <option value="PENDING">⏱️ PENDING</option>
                <option value="IN_PROGRESS">⚡ IN PROGRESS</option>
                <option value="DONE">✅ DONE</option>
                <option value="DELAYED">⚠️ DELAYED</option>
                <option value="HOLD">⏸️ HOLD</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">
                Estimasi Tanggal Selesai (Poin 160)
              </span>
              <input
                type="text"
                placeholder="Contoh: Estimasi 16 Oktober 2026"
                value={inputEstimation}
                onChange={(e) => setInputEstimation(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">
                Catatan Transaksi / Alasan Pending (Poin 123 & 161)
              </span>
              <textarea
                rows={2}
                placeholder="Wajib diisi jika pending atau ada kendala..."
                value={inputNotes}
                onChange={(e) => setInputNotes(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={() => setEditingMilestone(null)}
              >
                Batal
              </DnaButton>
              <DnaButton variant="primary" size="sm" onClick={handleSaveEdit}>
                Simpan Perubahan
              </DnaButton>
            </div>
          </div>
        </div>
      )}
    </DnaDataTableCard>
  );
}
