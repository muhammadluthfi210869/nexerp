"use client";

import React from "react";
import {
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Sparkles,
  BarChart3,
  User,
} from "lucide-react";
import {
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { ProjectChecklistTrackingItem } from "../_types/checklist-tracking.types";

interface TimelineChecklistGanttProps {
  project: ProjectChecklistTrackingItem | null;
  onBack: () => void;
}

export function TimelineChecklistGantt({
  project,
  onBack,
}: TimelineChecklistGanttProps) {
  if (!project) return null;

  const totalWorkingDays = project.milestones.reduce((acc, m) => acc + m.days, 0);

  return (
    <div className="space-y-5">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Timeline & Gantt Checklist Projek: {project.soCode}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer: <strong className="text-slate-800">{project.customerName}</strong> ({project.brandName}) • Produk: <strong className="text-slate-800">{project.productName}</strong>
          </p>
        </div>
        <DnaButton
          variant="outline"
          size="sm"
          onClick={onBack}
          className="text-[11px] h-8 px-3 font-semibold normal-case text-slate-700 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Kembali ke Tabel Checklist
        </DnaButton>
      </div>

      {/* Ringkasan Hari Kerja Box (Matches Screenshot 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5 text-xs">
          <div className="font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-[10px]">
              i
            </span>
            <span>Informasi Projek & SO</span>
          </div>
          <div className="grid grid-cols-[110px_10px_1fr] gap-y-1.5 items-center">
            <span className="text-slate-500">Sales Code</span>
            <span>:</span>
            <span className="font-mono font-bold text-blue-600">{project.soCode}</span>

            <span className="text-slate-500">Customer</span>
            <span>:</span>
            <span className="font-bold text-slate-900">{project.customerName}</span>

            <span className="text-slate-500">Brand / Produk</span>
            <span>:</span>
            <span className="font-bold text-slate-900">{project.brandName} ({project.productName})</span>

            <span className="text-slate-500">Kategori Projek</span>
            <span>:</span>
            <span className="font-semibold text-slate-700">Produk Baru Maklon</span>

            <span className="text-slate-500">Tanggal Mulai</span>
            <span>:</span>
            <span className="tabular-nums font-semibold text-slate-800">{project.orderDate}</span>

            <span className="text-slate-500">Tanggal Selesai</span>
            <span>:</span>
            <span className="tabular-nums font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">
              {project.deadlineFinal}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5 text-xs">
          <div className="font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ringkasan Hari Kerja (SLA Engine)</span>
          </div>
          <div className="grid grid-cols-[140px_10px_1fr] gap-y-2 items-center">
            <span className="text-slate-500">Total Hari Kerja SLA</span>
            <span>:</span>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 tabular-nums">
                {totalWorkingDays} hari kerja
              </span>
            </div>

            <span className="text-slate-500">Tanggal Mulai Proyek</span>
            <span>:</span>
            <span className="tabular-nums font-semibold text-slate-800">{project.orderDate}</span>

            <span className="text-slate-500">Target Tanggal Selesai</span>
            <span>:</span>
            <span className="tabular-nums font-semibold text-slate-800">{project.deadlineFinal}</span>

            <span className="text-slate-500">Hari Kerja (Senin-Jumat)</span>
            <span>:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
              {totalWorkingDays} hari
            </span>

            <span className="text-slate-500">Weekend Dilewati</span>
            <span>:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 w-fit">
              {Math.floor(totalWorkingDays / 5) * 2} hari
            </span>
          </div>
        </div>
      </div>

      {/* Visualisasi Timeline Gantt (Horizontal Bar Chart) */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Visualisasi Timeline Gantt ({project.milestones.length} Tahapan)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" /> Selesai (Done)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500" /> In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" /> Pending (SLA)
            </span>
          </div>
        </div>

        {/* Gantt Bar Chart Grid */}
        <div className="space-y-2 text-xs overflow-x-auto">
          {project.milestones.map((m, idx) => {
            const widthPct = Math.max(5, Math.min(100, (m.days / totalWorkingDays) * 100));
            const leftOffset = Math.min(95, (idx / project.milestones.length) * 80);

            return (
              <div key={m.id} className="grid grid-cols-[180px_1fr] items-center gap-3 py-1 hover:bg-slate-50/80 rounded-lg px-2">
                <div className="truncate font-semibold text-slate-800 text-[11.5px] flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px] w-4">{idx + 1}.</span>
                  <span className="truncate">{m.category}</span>
                </div>
                <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-lg transition-all duration-300 flex items-center justify-between px-2 text-[10.5px] font-bold text-white shadow-xs ${
                      m.status === "DONE"
                        ? "bg-emerald-500"
                        : m.status === "IN_PROGRESS"
                        ? "bg-blue-600"
                        : m.status === "DELAYED"
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${widthPct * 2}%`,
                      marginLeft: `${leftOffset * 0.4}%`,
                    }}
                  >
                    <span className="truncate">{m.days} hr</span>
                    <span className="text-[9.5px] opacity-90 truncate hidden sm:inline">{m.pic}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Urutan Timeline (Matches Screenshot 3) */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-600" />
          Tabel Urutan Timeline & Tanggal Eksekusi
        </h3>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-100/80 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="p-2.5 w-[40px] text-center text-slate-400">#</DnaTh>
                <DnaTh className="p-2.5 min-w-[200px]">Nama Timeline / Milestone</DnaTh>
                <DnaTh className="p-2.5 min-w-[150px]">PIC Departemen</DnaTh>
                <DnaTh className="p-2.5 text-center min-w-[110px]">Tanggal Mulai</DnaTh>
                <DnaTh className="p-2.5 text-center min-w-[110px]">Tanggal Selesai</DnaTh>
                <DnaTh className="p-2.5 text-center w-[90px]">Durasi SLA</DnaTh>
                <DnaTh className="p-2.5 text-center w-[120px]">Status</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {project.milestones.map((m, idx) => (
                <DnaTableRow key={m.id} className="hover:bg-slate-50/60 text-xs">
                  <DnaTd className="p-2.5 text-center font-bold text-slate-400 tabular-nums">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="p-2.5 font-bold text-slate-900">
                    {m.category}
                  </DnaTd>
                  <DnaTd className="p-2.5 font-semibold text-slate-700">
                    {m.pic}
                  </DnaTd>
                  <DnaTd className="p-2.5 text-center font-mono text-emerald-700 bg-emerald-50/40 font-semibold">
                    {m.startDate}
                  </DnaTd>
                  <DnaTd className="p-2.5 text-center font-mono text-rose-700 bg-rose-50/40 font-semibold">
                    {m.endDate}
                  </DnaTd>
                  <DnaTd className="p-2.5 text-center font-bold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                      {m.days} hari
                    </span>
                  </DnaTd>
                  <DnaTd className="p-2.5 text-center">
                    <DnaBadge
                      variant={
                        m.status === "DONE"
                          ? "emerald"
                          : m.status === "IN_PROGRESS"
                          ? "blue"
                          : m.status === "DELAYED"
                          ? "rose"
                          : "amber"
                      }
                    >
                      {m.status}
                    </DnaBadge>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        </div>
      </div>
    </div>
  );
}
