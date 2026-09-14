"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Layers,
  Upload,
  Eye
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

interface ClosingTaskItem {
  id: string;
  taskName: string;
  category: "Bank Reconcile" | "AP Review" | "AR Review" | "Stock Valuation" | "Deprec" | "Tax" | "GL Review" | "Statements";
  owner: string;
  dueDate: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  evidenceAttachment: string;
  approver: string;
  completedAt: string;
}

const FALLBACK_CLOSING_TASKS: ClosingTaskItem[] = [
  { id: "1", taskName: "Rekonsiliasi Seluruh Rekening Bank (BCA, Mandiri, Petty Cash)", category: "Bank Reconcile", owner: "Siti Accounting", dueDate: "2026-09-03", status: "DONE", evidenceAttachment: "Bank_Recon_BCA_Sep26.pdf", approver: "Bambang Finance Manager", completedAt: "2026-09-03 16:30" },
  { id: "2", taskName: "Review Umur Piutang & Konfirmasi Penerimaan Pelanggan (AR)", category: "AR Review", owner: "Dewi AR Staff", dueDate: "2026-09-04", status: "DONE", evidenceAttachment: "AR_Aging_Report_Sep26.xlsx", approver: "Bambang Finance Manager", completedAt: "2026-09-04 11:15" },
  { id: "3", taskName: "Review Faktur Pembelian Supplier & AP Aging Settlement", category: "AP Review", owner: "Rudi AP Staff", dueDate: "2026-09-04", status: "DONE", evidenceAttachment: "AP_Settlement_Sep26.xlsx", approver: "Bambang Finance Manager", completedAt: "2026-09-04 14:00" },
  { id: "4", taskName: "Closing Mutasi Gudang & Valuasi Stok Persediaan FIFO", category: "Stock Valuation", owner: "Ahmad Staff Gudang", dueDate: "2026-09-05", status: "DONE", evidenceAttachment: "Stock_Opname_Sep26.pdf", approver: "Bambang Finance Manager", completedAt: "2026-09-05 17:00" },
  { id: "5", taskName: "Posting Jurnal Penyusutan Aset Tetap & Amortisasi", category: "Deprec", owner: "Siti Accounting", dueDate: "2026-09-06", status: "DONE", evidenceAttachment: "Depreciation_Schedule.pdf", approver: "Bambang Finance Manager", completedAt: "2026-09-06 10:00" },
  { id: "6", taskName: "Penyusunan Laporan Keuangan (Laba Rugi, Neraca, Arus Kas)", category: "Statements", owner: "Bambang Finance Manager", dueDate: "2026-09-07", status: "DONE", evidenceAttachment: "Financial_Report_Sep26.pdf", approver: "Direktur Keuangan", completedAt: "2026-09-07 15:30" }
];

export default function ClosingPage() {
  const toast = useDnaToast();
  const [period, setPeriod] = useState("2026-08"); // Penutupan buku Agustus 2026
  const [periodStatus, setPeriodStatus] = useState<"OPEN" | "SOFT_LOCK" | "HARD_LOCK">("HARD_LOCK");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState<ClosingTaskItem | null>(null);

  const doneCount = FALLBACK_CLOSING_TASKS.filter((t) => t.status === "DONE").length;
  const totalTasks = FALLBACK_CLOSING_TASKS.length;
  const progressPct = Math.round((doneCount / totalTasks) * 100);

  const filteredTasks = FALLBACK_CLOSING_TASKS.filter((t) => {
    return categoryFilter === "ALL" || t.category === categoryFilter;
  });

  const handleApplyLock = (type: "SOFT_LOCK" | "HARD_LOCK" | "OPEN") => {
    setPeriodStatus(type);
    if (type === "HARD_LOCK") {
      toast.success(`Periode ${period} berhasil di Hard-Lock! Seluruh transaksi terkunci permanen (Read-Only).`);
    } else if (type === "SOFT_LOCK") {
      toast.success(`Periode ${period} berhasil di Soft-Lock! Sistem akan memberikan peringatan jika ada staf menginput mutasi.`);
    } else {
      toast.success(`Periode ${period} dibuka kembali (Open).`);
    }
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Closing Checklist & Period Lock (Tata Kelola Tutup Buku)"
        description="Checklist audit penutupan buku bulanan/tahunan dan penguncian periode akuntansi (Soft Lock & Hard Lock) untuk mencegah mutasi susulan backdate."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-070: Period Governance</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaInput
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shadow-sm font-bold"
            />
            {periodStatus === "HARD_LOCK" ? (
              <DnaButton variant="secondary" size="md" onClick={() => handleApplyLock("OPEN")}>
                <Unlock className="w-4 h-4 mr-1.5" />
                Buka Kunci Periode
              </DnaButton>
            ) : (
              <div className="flex gap-1.5">
                <DnaButton variant="secondary" size="md" onClick={() => handleApplyLock("SOFT_LOCK")}>
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  Soft Lock
                </DnaButton>
                <DnaButton variant="danger" size="md" onClick={() => handleApplyLock("HARD_LOCK")}>
                  <Lock className="w-4 h-4 mr-1.5" />
                  Hard Lock Period
                </DnaButton>
              </div>
            )}
          </div>
        }
      />

      {/* KPI CARDS (SCR-070) */}
      <DnaKpiGrid cols={2}>
        <DnaStatCard
          label={`Progress Checklist Closing Periode ${period}`}
          value={`${doneCount} / ${totalTasks} Tasks Completed (${progressPct}%)`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "100% Selesai", isPositive: true }}
          subtext="Seluruh Kategori Audit Lolos Sign-off"
          variant="success"
        />
        <DnaStatCard
          label="Status Kunci Periode (Period Governance)"
          value={
            periodStatus === "HARD_LOCK"
              ? "🔒 HARD LOCK (Kunci Permanen)"
              : periodStatus === "SOFT_LOCK"
              ? "⚠️ SOFT LOCK (Peringatan Aktif)"
              : "🔓 OPEN (Bisa Input Mutasi)"
          }
          icon={<Lock className="w-5 h-5 text-rose-600" />}
          delta={{ value: periodStatus === "HARD_LOCK" ? "Read-Only Mode" : "Modifiable", isPositive: periodStatus === "HARD_LOCK" }}
          subtext="Transaksi susulan wajib via Jurnal Penyesuaian"
          variant={periodStatus === "HARD_LOCK" ? "critical" : "warning"}
        />
      </DnaKpiGrid>

      {/* TABLE CHECKLIST (SCR-070) */}
      <DnaDataTableCard
        title={`Checklist Prosedur Penutupan Buku (Periode ${period})`}
        badge={<DnaBadge variant="purple">{filteredTasks.length} Prosedur Audit</DnaBadge>}
        customToolbar={
          <div className="flex items-center gap-2">
<DnaSelect 
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Kategori Checklist</option>
              <option value="Bank Reconcile">Bank Reconcile</option>
              <option value="AR Review">AR Review</option>
              <option value="AP Review">AP Review</option>
              <option value="Stock Valuation">Stock Valuation</option>
              <option value="Deprec">Depreciation</option>
              <option value="Statements">Financial Statements</option>
            </DnaSelect>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Task Name</th>
                <th className="px-3.5 py-3">Category</th>
                <th className="px-3.5 py-3">Owner (Pelaksana)</th>
                <th className="px-3.5 py-3">Due Date</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3">Evidence (Attachment)</th>
                <th className="px-3.5 py-3">Approver Sign-off</th>
                <th className="px-3.5 py-3">Completed At</th>
                <th className="px-3.5 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{t.taskName}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-medium">{t.owner}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{t.dueDate}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={t.status === "DONE" ? "success" : "warning"}>
                      {t.status}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-blue-700 font-mono text-[11px] underline cursor-pointer">
                    {t.evidenceAttachment}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-semibold">{t.approver}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 text-[11px] whitespace-nowrap">{t.completedAt}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaButton variant="secondary" size="sm" onClick={() => setSelectedTask(t)}>
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* DETAIL TASK MODAL */}
      <DnaModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={`Detail Prosedur Closing: ${selectedTask?.taskName}`}
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-200">
            <div>Kategori: <strong>{selectedTask?.category}</strong></div>
            <div>Pelaksana: <strong>{selectedTask?.owner}</strong></div>
            <div>Approver: <strong>{selectedTask?.approver}</strong></div>
            <div>Waktu Selesai: <strong>{selectedTask?.completedAt}</strong></div>
            <div className="border-t border-slate-200 pt-2">
              <span className="text-slate-500 block mb-1">Bukti Dokumen Rekonsiliasi:</span>
              <div className="flex items-center gap-2 text-blue-700 font-semibold font-mono bg-white p-2 rounded border border-slate-100">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{selectedTask?.evidenceAttachment}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedTask(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
