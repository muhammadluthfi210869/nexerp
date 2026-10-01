"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  DnaModal,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type {
  ProjectChecklistTrackingItem,
  ProjectMilestone,
  MilestoneStatus,
} from "../_types/checklist-tracking.types";

interface DetailChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectChecklistTrackingItem | null;
  onUpdateMilestoneStatus: (
    projectId: string,
    milestoneId: string,
    newStatus: MilestoneStatus,
    notes?: string
  ) => void;
}

export function DetailChecklistModal({
  isOpen,
  onClose,
  project,
  onUpdateMilestoneStatus,
}: DetailChecklistModalProps) {
  if (!project) return null;

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Checklist Tracking"
      size="xl"
    >
      <div className="space-y-5 text-xs text-slate-800">
        {/* 2 Top Hero Cards (Matches Screenshot 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Informasi Projek */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 font-bold text-slate-700 text-xs">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-[10px]">
                i
              </span>
              <span>Informasi Projek</span>
            </div>
            <div className="grid grid-cols-[100px_10px_1fr] gap-y-1.5 items-center">
              <span className="text-slate-500 font-medium">Customer</span>
              <span>:</span>
              <span className="font-bold text-slate-900">{project.customerName}</span>

              <span className="text-slate-500 font-medium">No. Sales</span>
              <span>:</span>
              <span className="font-mono font-bold text-blue-600 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {project.soCode}
              </span>

              <span className="text-slate-500 font-medium">Brand</span>
              <span>:</span>
              <span className="font-bold text-slate-900">{project.brandName}</span>

              <span className="text-slate-500 font-medium">Produk</span>
              <span>:</span>
              <span className="font-bold text-slate-900">{project.productName}</span>
            </div>
          </div>

          {/* Card 2: Status & Jadwal */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 font-bold text-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status & Jadwal</span>
            </div>
            <div className="grid grid-cols-[100px_10px_1fr] gap-y-1.5 items-center">
              <span className="text-slate-500 font-medium">Status</span>
              <span>:</span>
              <div>
                <DnaBadge
                  variant={
                    project.overallStatus === "COMPLETED"
                      ? "emerald"
                      : project.overallStatus === "ON_TRACK"
                      ? "blue"
                      : project.overallStatus === "DELAYED"
                      ? "rose"
                      : "amber"
                  }
                >
                  {project.overallStatus === "ON_TRACK"
                    ? "On Track"
                    : project.overallStatus === "COMPLETED"
                    ? "Selesai"
                    : project.overallStatus === "DELAYED"
                    ? "Tertunda"
                    : "Pending"}
                </DnaBadge>
              </div>

              <span className="text-slate-500 font-medium">Periode</span>
              <span>:</span>
              <span className="text-slate-700 flex items-center gap-1 tabular-nums font-medium">
                <Calendar className="w-3 h-3 text-slate-400" />
                {project.orderDate} ➔ {project.deadlineFinal}
              </span>

              <span className="text-slate-500 font-medium">Deadline</span>
              <span>:</span>
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    project.daysRemaining > 14
                      ? "bg-emerald-100 text-emerald-800"
                      : project.daysRemaining > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {project.daysRemaining > 0 ? `Kurang ${project.daysRemaining} hari` : "Overdue"}
                </span>
              </div>

              <span className="text-slate-500 font-medium">Dibuat Oleh</span>
              <span>:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                {project.busdevPic} (Busdev)
              </span>
            </div>
          </div>
        </div>

        {/* Detail Per Kategori (Matches Screenshot 1 & 4) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Detail Per Kategori ({project.milestones.length} Milestone Alur)
            </span>
            <span className="text-slate-500 text-[11px]">
              Progres: <strong className="text-blue-600">{project.progressPct}%</strong> ({project.completedCount}/{project.totalCount} Selesai)
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-[10.5px] font-bold uppercase tracking-wider">
                  <DnaTh className="p-2.5 w-[35px] text-center text-slate-400">#</DnaTh>
                  <DnaTh className="p-2.5 min-w-[140px]">Kategori</DnaTh>
                  <DnaTh className="p-2.5 min-w-[150px]">PIC</DnaTh>
                  <DnaTh className="p-2.5 text-center w-[90px]">Lama Hari</DnaTh>
                  <DnaTh className="p-2.5 min-w-[130px]">Setelah</DnaTh>
                  <DnaTh className="p-2.5 text-center min-w-[140px]">Status</DnaTh>
                  <DnaTh className="p-2.5 min-w-[140px]">Catatan</DnaTh>
                  <DnaTh className="p-2.5 min-w-[130px]">Terakhir Update</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {project.milestones.map((m, idx) => (
                  <DnaTableRow key={m.id} className="hover:bg-slate-50/60">
                    <DnaTd className="p-2.5 text-center text-slate-400 tabular-nums font-semibold">
                      {idx + 1}
                    </DnaTd>
                    <DnaTd className="p-2.5 font-bold text-slate-900">
                      {m.category}
                    </DnaTd>
                    <DnaTd className="p-2.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] shrink-0">
                          <User className="w-3 h-3" />
                        </span>
                        <span>{m.pic}</span>
                      </div>
                    </DnaTd>
                    <DnaTd className="p-2.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                        {m.days} hari
                      </span>
                    </DnaTd>
                    <DnaTd className="p-2.5 text-slate-500 text-[11px]">
                      {m.dependsOn}
                    </DnaTd>
                    <DnaTd className="p-2.5 text-center">
                      {/* Interactive Dropdown for Milestone Status */}
                      <select
                        value={m.status}
                        onChange={(e) =>
                          onUpdateMilestoneStatus(
                            project.id,
                            m.id,
                            e.target.value as MilestoneStatus
                          )
                        }
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-2 cursor-pointer transition-all ${
                          m.status === "DONE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-400"
                            : m.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 border-blue-300 focus:ring-blue-400"
                            : m.status === "DELAYED"
                            ? "bg-rose-50 text-rose-700 border-rose-300 focus:ring-rose-400"
                            : m.status === "HOLD"
                            ? "bg-purple-50 text-purple-700 border-purple-300 focus:ring-purple-400"
                            : "bg-amber-50 text-amber-700 border-amber-300 focus:ring-amber-400"
                        }`}
                      >
                        <option value="PENDING">⏱️ Pending</option>
                        <option value="IN_PROGRESS">⚡ In Progress</option>
                        <option value="DONE">✅ Done</option>
                        <option value="DELAYED">⚠️ Delayed</option>
                        <option value="HOLD">⏸️ Hold</option>
                      </select>
                    </DnaTd>
                    <DnaTd className="p-2.5 text-slate-600">
                      {m.notes || "-"}
                    </DnaTd>
                    <DnaTd className="p-2.5 text-slate-400 text-[11px] tabular-nums">
                      {m.updatedAt}
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
