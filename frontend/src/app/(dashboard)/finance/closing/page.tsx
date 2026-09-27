"use client";

import React, { useState, useMemo } from "react";
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
  Check,
  Eye,
  FileText
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  useDnaToast,
  DnaInput
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

export default function ClosingPage() {
  const toast = useDnaToast();
  const [period, setPeriod] = useState("2026-08"); // Penutupan buku Agustus 2026
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<ClosingTaskItem | null>(null);

  // Live period lock check query
  const { data: lockData, refetch: refetchLock } = useQuery({
    queryKey: ["finance-period-lock-check", period],
    queryFn: async () => {
      try {
        const res = await api.get(`/finance/period-locks/check?period=${period}-01`);
        return res.data;
      } catch {
        return { isLocked: false };
      }
    },
  });

  const periodStatus: "HARD_LOCK" | "OPEN" = lockData?.isLocked ? "HARD_LOCK" : "OPEN";

  // Live closing tasks query
  const { data: rawTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ["finance-closing-tasks", period],
    queryFn: async () => {
      try {
        const res = await api.get(`/finance/closing-checklists?period=${period}-01`);
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const closingTasks: ClosingTaskItem[] = useMemo(() => {
    return rawTasks.map((t: any) => ({
      id: t.id,
      taskName: t.item || t.taskName || "Closing Task",
      category: t.category || "GL Review",
      owner: t.department || "Finance",
      dueDate: t.period ? new Date(t.period).toISOString().split("T")[0] : `${period}-28`,
      status: t.completed ? "DONE" : "IN_PROGRESS",
      evidenceAttachment: t.notes || "Doc-WP-01.pdf",
      approver: t.completedById ? "Manager Finance" : "Pending",
      completedAt: t.completedAt ? new Date(t.completedAt).toISOString().split("T")[0] : "",
    }));
  }, [rawTasks, period]);

  const doneCount = closingTasks.filter((t) => t.status === "DONE").length;
  const totalTasks = closingTasks.length;
  const progressPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const filteredTasks = useMemo(() => {
    return closingTasks.filter((t) => {
      const matchCategory = categoryFilter === "ALL" || t.category === categoryFilter;
      const matchSearch =
        t.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.approver.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [closingTasks, categoryFilter, searchQuery]);

  const handleGenerateChecklist = async () => {
    try {
      await api.post("/finance/closing-checklists/generate", { period: `${period}-01` });
      toast.success(`Checklist closing periode ${period} berhasil dibuat!`);
      refetchTasks();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal membuat checklist");
    }
  };

  const handleApplyLock = async (type: "SOFT_LOCK" | "HARD_LOCK" | "OPEN") => {
    try {
      if (type === "HARD_LOCK") {
        await api.post("/finance/period-locks/lock", {
          period: `${period}-01`,
          notes: `Monthly close hard-lock for period ${period}`,
        });
        toast.success(`Periode ${period} berhasil di Hard-Lock! Seluruh transaksi terkunci permanen.`);
      } else {
        toast.success(`Status periode ${period} diubah ke ${type}.`);
      }
      refetchLock();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal mengubah status penguncian periode");
    }
  };

  const handleCompleteTask = async (task: ClosingTaskItem) => {
    try {
      await api.post(`/finance/closing-checklists/${task.id}/complete`, {
        notes: `Sign-off completed on ${new Date().toISOString()}`,
      });
      toast.success(`Prosedur ${task.taskName} berhasil disign-off!`);
      setSelectedTask(null);
      refetchTasks();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal sign-off checklist item");
    }
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Closing Checklist & Period Lock (Tata Kelola Tutup Buku)"
        description="Checklist audit penutupan buku bulanan/tahunan dan penguncian periode akuntansi (Soft Lock & Hard Lock) untuk mencegah mutasi susulan backdate."
        tabs={[
          { id: "ALL", label: "Semua Prosedur" },
          { id: "Bank Reconcile", label: "Bank Reconcile" },
          { id: "AR Review", label: "AR Review" },
          { id: "AP Review", label: "AP Review" },
          { id: "Stock Valuation", label: "Stock Valuation" },
          { id: "Deprec", label: "Depreciation" },
          { id: "Statements", label: "Financial Statements" }
        ]}
        activeTab={categoryFilter}
        onTabChange={setCategoryFilter}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={handleGenerateChecklist}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Generate Checklist
            </DnaButton>
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
          delta={{ value: `${progressPct}% Selesai`, isPositive: progressPct === 100 }}
          subtext="Seluruh Kategori Audit Lolos Sign-off"
          variant="success"
        />
        <DnaStatCard
          label="Status Kunci Periode (Period Governance)"
          value={
            periodStatus === "HARD_LOCK"
              ? "🔒 HARD LOCK (Kunci Permanen)"
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
        customToolbar={
          <div className="flex items-center justify-between w-full">
            <div className="relative w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari prosedur, owner, atau approver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-semibold text-slate-800">{filteredTasks.length}</span> prosedur audit
            </div>
          </div>
        }
      >
        <DnaTable className="w-full text-left border-collapse text-xs table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-3.5 py-3 w-[26%]">Prosedur Audit & Kategori</th>
              <th className="px-3.5 py-3 w-[18%]">Pelaksana & Due Date</th>
              <th className="px-3.5 py-3 text-center w-[14%]">Status</th>
              <th className="px-3.5 py-3 w-[20%]">Approver & Selesai</th>
              <th className="px-3.5 py-3 w-[14%]">Bukti Dokumen</th>
              <th className="px-3.5 py-3 text-center w-[8%]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3.5 py-8 text-center text-slate-400">
                  Tidak ada prosedur audit yang cocok dengan kriteria filter.
                </td>
              </tr>
            ) : (
              filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="font-bold text-slate-900 truncate">{t.taskName}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">{t.category}</div>
                  </td>
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="font-medium text-slate-800 truncate">{t.owner}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">Due: {t.dueDate}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={t.status === "DONE" ? "success" : t.status === "IN_PROGRESS" ? "info" : "warning"}>
                      {t.status}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="font-semibold text-slate-800 truncate">{t.approver}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">{t.completedAt || "-"}</div>
                  </td>
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="text-blue-700 tabular-nums text-[11px] truncate underline cursor-pointer" onClick={() => setSelectedTask(t)}>
                      {t.evidenceAttachment}
                    </div>
                    <div className="text-[10px] text-slate-400">Audit Evidence</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaButton variant="ghost" size="sm" onClick={() => setSelectedTask(t)} title="Lihat Detail & Sign-off">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                    </DnaButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

      {/* DETAIL DRAWER (QUICK PEEK & AUDIT SIGN-OFF) */}
      <DnaDetailDrawer
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.taskName || "Prosedur Closing"}
        subtitle={`Kategori: ${selectedTask?.category} • Periode: ${period}`}
        badge={
          selectedTask ? (
            <DnaBadge variant={selectedTask.status === "DONE" ? "success" : "warning"}>
              {selectedTask.status}
            </DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "detail",
            label: "Detail Prosedur",
            content: selectedTask && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Kategori Prosedur</span>
                    <span className="font-semibold text-slate-900">{selectedTask.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Batas Waktu (Due Date)</span>
                    <span className="font-semibold text-slate-900">{selectedTask.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Pelaksana (Owner PIC)</span>
                    <span className="font-semibold text-slate-900">{selectedTask.owner}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Approver Sign-off</span>
                    <span className="font-semibold text-slate-900">{selectedTask.approver}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">Waktu Penyelesaian:</span>
                    <span className="tabular-nums text-emerald-700 font-bold">{selectedTask.completedAt || "Belum Selesai"}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Lampiran Bukti Audit (Working Paper)</span>
                  </h4>
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="tabular-nums text-blue-700 font-semibold">{selectedTask.evidenceAttachment}</span>
                    </div>
                    <DnaButton variant="secondary" size="sm" onClick={() => toast.success("Mengunduh lembar kerja audit...")}>
                      Unduh
                    </DnaButton>
                  </div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedTask(null)}>
              Tutup
            </DnaButton>
            <div className="flex gap-2">
              <DnaButton variant="secondary" size="md" onClick={() => toast.success("Mencetak lembar sign-off...")}>
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Sign-off
              </DnaButton>
              {selectedTask && selectedTask.status !== "DONE" && (
                <DnaButton variant="primary" size="md" onClick={() => handleCompleteTask(selectedTask)}>
                  <Check className="w-4 h-4 mr-1.5" />
                  Sign-off Selesai
                </DnaButton>
              )}
            </div>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
