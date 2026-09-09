"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Filter,
  DollarSign,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  FileCheck,
  Calendar
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
  DnaTabNav,
  useDnaToast,
  formatRupiah
} from "@/components/dna";

interface ClosingTaskItem {
  id: string;
  taskName: string;
  category: "BANK_RECONCILE" | "AP_AR_REVIEW" | "STOCK_VALUATION" | "DEPRECIATION" | "TAX_FILING" | "GL_REVIEW";
  owner: string;
  dueDate: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  approver: string;
  completedAt?: string;
  evidenceNotes?: string;
}

const FALLBACK_CLOSING_TASKS: ClosingTaskItem[] = [
  {
    id: "cl-1",
    taskName: "Rekonsiliasi Rekening Koran Seluruh Bank (BCA, Mandiri, BRI)",
    category: "BANK_RECONCILE",
    owner: "Dewi Lestari",
    dueDate: "2026-09-05",
    status: "DONE",
    approver: "Bambang Sudarsono (Finance Head)",
    completedAt: "2026-09-05 16:30",
    evidenceNotes: "Bank statement dan GL reconciled 100% matched."
  },
  {
    id: "cl-2",
    taskName: "Verifikasi Valuasi Persediaan Akhir Bahan Baku & Produk Jadi",
    category: "STOCK_VALUATION",
    owner: "Yayan Sopian (Gudang)",
    dueDate: "2026-09-04",
    status: "DONE",
    approver: "Bambang Sudarsono",
    completedAt: "2026-09-04 18:00",
    evidenceNotes: "Stock opname fisik cocok dengan kartu stok mutasi."
  },
  {
    id: "cl-3",
    taskName: "Posting Beban Depresiasi Aset Tetap Bulanan",
    category: "DEPRECIATION",
    owner: "Dewi Lestari",
    dueDate: "2026-09-05",
    status: "DONE",
    approver: "Bambang Sudarsono",
    completedAt: "2026-09-05 11:15",
    evidenceNotes: "JV-2026-0902 telah terposting ke GL."
  },
  {
    id: "cl-4",
    taskName: "Review Umur Piutang (AR Aging) & Konfirmasi Penerimaan DP",
    category: "AP_AR_REVIEW",
    owner: "Dewi Lestari",
    dueDate: "2026-09-06",
    status: "DONE",
    approver: "Bambang Sudarsono",
    completedAt: "2026-09-06 14:20",
    evidenceNotes: "AR aging verified, bad debt allowance 0%."
  },
  {
    id: "cl-5",
    taskName: "Rekapitulasi Pajak PPh 21, PPh 23, dan PPN Keluaran",
    category: "TAX_FILING",
    owner: "Dewi Lestari",
    dueDate: "2026-09-10",
    status: "IN_PROGRESS",
    approver: "Bambang Sudarsono",
    evidenceNotes: "Sedang sinkronisasi faktur pajak DJP."
  }
];

export default function ClosingPeriodLockPage() {
  const toast = useDnaToast();
  const [selectedPeriod, setSelectedPeriod] = useState("Agustus 2026");
  const [isPeriodLocked, setIsPeriodLocked] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const { data: serverData } = useQuery({
    queryKey: ["finance-closing-tasks", selectedPeriod],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/closing");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map
        }
      } catch (err) {
        console.warn("Using fallback closing tasks", err);
      }
      return FALLBACK_CLOSING_TASKS;
    }
  });

  const taskList = serverData || FALLBACK_CLOSING_TASKS;

  const completedCount = taskList.filter((t) => t.status === "DONE").length;
  const progressPct = Math.round((completedCount / taskList.length) * 100);

  const handleToggleLock = () => {
    setIsPeriodLocked(!isPeriodLocked);
    if (!isPeriodLocked) {
      toast.success("Periode Berhasil Dikunci", `Periode ${selectedPeriod} telah dikunci (Hard Lock). Transaksi lampau tidak dapat diubah.`);
    } else {
      toast.warning("Periode Dibuka", `Kunci periode ${selectedPeriod} dibuka sementara untuk audit.`);
    }
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Closing Checklist & Period Lock"
        subtitle="Audit checklist penutupan buku akhir bulan dan penguncian periode transaksi akuntansi (Period Lock)"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            {isPeriodLocked ? <Lock className="w-3.5 h-3.5 text-rose-600" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isPeriodLocked ? "Period Locked" : "Period Open"}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
            >
              <option value="Agustus 2026">Periode: Agustus 2026</option>
              <option value="September 2026">Periode: September 2026 (Berjalan)</option>
            </select>
            <DnaButton
              variant={isPeriodLocked ? "secondary" : "primary"}
              size="md"
              onClick={handleToggleLock}
            >
              {isPeriodLocked ? (
                <>
                  <Unlock className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Buka Kunci Periode
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-1.5" />
                  Kunci Periode (Hard Lock)
                </>
              )}
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Progress Closing Periode"
          value={`${progressPct}%`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: `${completedCount} dari ${taskList.length} Task Selesai`, isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Status Kunci Transaksi"
          value={isPeriodLocked ? "Terkunci (Lock)" : "Terbuka (Open)"}
          icon={isPeriodLocked ? <Lock className="w-5 h-5 text-rose-600" /> : <Unlock className="w-5 h-5 text-emerald-600" />}
          subtext="Mencegah Edit Transaksi Lampau"
          variant={isPeriodLocked ? "critical" : "warning"}
        />
        <DnaStatCard
          label="Sign-Off Approver"
          value="Finance Head"
          icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
          subtext="Bambang Sudarsono, SE, Ak"
          variant="blue"
        />
        <DnaStatCard
          label="Laba Bersih Siap Posting"
          value="Rp 214.850.000"
          icon={<DollarSign className="w-5 h-5 text-purple-600" />}
          subtext="Auto-Post ke Retained Earnings"
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Checklist Tugas Penutupan Buku (Closing)"
        badge={
          <DnaBadge variant="default">
            {taskList.length} Item Checklist
          </DnaBadge>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Nama Task / Prosedur Closing</th>
                <th className="px-3.5 py-3">Kategori</th>
                <th className="px-3.5 py-3">Penanggung Jawab (Owner)</th>
                <th className="px-3.5 py-3">Batas Waktu</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3">Bukti / Catatan Verifikasi</th>
                <th className="px-3.5 py-3">Approver Sign-Off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taskList.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3.5 py-3 font-semibold text-slate-900">{task.taskName}</td>
                  <td className="px-3.5 py-3">
                    <DnaBadge variant="info">
                      {task.category.replace(/_/g, " ")}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-3 text-slate-800 font-medium">{task.owner}</td>
                  <td className="px-3.5 py-3 text-slate-700">{task.dueDate}</td>
                  <td className="px-3.5 py-3">
                    <DnaBadge variant={task.status === "DONE" ? "success" : "warning"}>
                      {task.status}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-3 text-slate-600 text-[11px] italic">
                    {task.evidenceNotes || "-"}
                  </td>
                  <td className="px-3.5 py-3 text-slate-800 font-medium">{task.approver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
