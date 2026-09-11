"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Unlock, Plus, RefreshCw, FileSpreadsheet, ShieldAlert } from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaBadge,
  DnaModal,
  DnaConfirmDialog,
  useDnaToast,
} from "@/components/dna";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

interface PeriodLock {
  id: string;
  period: string;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  notes?: string;
}

interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

const FALLBACK: PeriodLock[] = [
  { id: "pl-1", period: "2026-08-01", isLocked: true, lockedBy: "Bambang Finance Manager", lockedAt: "2026-09-02T15:30:00Z", notes: "Tutup buku Agustus 2026 — semua rekonsiliasi selesai" },
  { id: "pl-2", period: "2026-07-01", isLocked: true, lockedBy: "Bambang Finance Manager", lockedAt: "2026-08-03T14:00:00Z", notes: "Tutup buku Juli 2026" },
  { id: "pl-3", period: "2026-09-01", isLocked: false, notes: "Sedang berjalan" },
];

export default function FinancePeriodsPage() {
  const toast = useDnaToast();
  const qc = useQueryClient();
  const [isLockOpen, setLockOpen] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [trialPeriod, setTrialPeriod] = useState("");
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);

  // Form state
  const [periodMonth, setPeriodMonth] = useState("");
  const [notes, setNotes] = useState("");
  const [unlockReason, setUnlockReason] = useState("");

  const { data: periods = FALLBACK, isLoading } = useQuery({
    queryKey: ["finance-period-locks"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/period-locks");
        const body = unwrapResponse(res);
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : FALLBACK;
      } catch {
        return FALLBACK;
      }
    },
  });

  const lockMut = useMutation({
    mutationFn: (payload: { period: string; notes?: string }) =>
      api.post("/finance/period-locks/lock", payload).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Periode berhasil dikunci (Lock)");
      qc.invalidateQueries({ queryKey: ["finance-period-locks"] });
      setLockOpen(false);
      setPeriodMonth("");
      setNotes("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal mengunci periode"),
  });

  const unlockMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/finance/period-locks/${id}/unlock`, { reason }).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Periode berhasil dibuka (Unlock)");
      qc.invalidateQueries({ queryKey: ["finance-period-locks"] });
      setUnlockingId(null);
      setUnlockReason("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal membuka kunci periode"),
  });

  const trialMut = useMutation({
    mutationFn: (period: string) =>
      api.get(`/finance/reports/trial-balance?startDate=${period}&endDate=${period}`).then((r) => unwrapResponse(r)),
    onSuccess: (data: any) => {
      const rows: TrialBalanceRow[] = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
      setTrialBalance(rows);
      if (rows.length === 0) {
        toast.success("Neraca saldo kosong / periode belum ada transaksi");
      } else {
        const totalDebit = rows.reduce((s, r) => s + (r.debit ?? 0), 0);
        const totalCredit = rows.reduce((s, r) => s + (r.credit ?? 0), 0);
        if (Math.abs(totalDebit - totalCredit) < 0.01) {
          toast.success(`Neraca saldo BALANCE (${rows.length} akun). Debit = Kredit`);
        } else {
          toast.error(`Neraca TIDAK balance! Selisih: ${Math.abs(totalDebit - totalCredit).toLocaleString("id-ID")}`);
        }
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal mengambil neraca saldo"),
  });

  function submitLock() {
    if (!periodMonth) return;
    lockMut.mutate({ period: `${periodMonth}-01`, notes });
  }

  const lockedCount = periods.filter((p: PeriodLock) => p.isLocked).length;
  const openCount = periods.length - lockedCount;
  const latest = periods[0];

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Manajemen Periode Akuntansi (Period Lock)"
        description="Penguncian periode buku (monthly close), trial balance check, dan audit trail kunci buku."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SCR-070: Period Governance</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => qc.invalidateQueries({ queryKey: ["finance-period-locks"] })}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setLockOpen(true)}>
              <Lock className="w-4 h-4 mr-1.5" />
              Lock Periode
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Periode Terkunci"
          value={`${lockedCount}`}
          icon={<Lock className="w-5 h-5 text-rose-600" />}
          subtext="Periode yang sudah ditutup buku"
          variant="critical"
        />
        <DnaStatCard
          label="Periode Terbuka"
          value={`${openCount}`}
          icon={<Unlock className="w-5 h-5 text-emerald-600" />}
          subtext="Masih bisa menerima mutasi"
          variant="success"
        />
        <DnaStatCard
          label="Periode Terbaru"
          value={latest ? new Date(latest.period).toISOString().slice(0, 7) : "—"}
          icon={<FileSpreadsheet className="w-5 h-5 text-blue-600" />}
          subtext="Closing terakhir"
          variant="info"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Periode"
        badge={<DnaBadge variant="rose">{periods.length} Periode</DnaBadge>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Periode</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3">Locked By</th>
                <th className="px-3.5 py-3">Locked At</th>
                <th className="px-3.5 py-3">Catatan</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Memuat...</td></tr>
              ) : periods.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Belum ada data periode</td></tr>
              ) : periods.map((p: PeriodLock) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                    {new Date(p.period).toISOString().slice(0, 7)}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    {p.isLocked ? (
                      <DnaBadge variant="danger"><Lock className="w-3 h-3 mr-1 inline" />LOCKED</DnaBadge>
                    ) : (
                      <DnaBadge variant="success"><Unlock className="w-3 h-3 mr-1 inline" />OPEN</DnaBadge>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700">{p.lockedBy ?? "—"}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">{p.lockedAt ? new Date(p.lockedAt).toLocaleString("id-ID") : "—"}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 max-w-xs truncate">{p.notes ?? "—"}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setTrialPeriod(new Date(p.period).toISOString().slice(0, 7));
                          trialMut.mutate(new Date(p.period).toISOString().slice(0, 10));
                        }}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </DnaButton>
                      {p.isLocked && (
                        <DnaButton variant="danger" size="sm" onClick={() => setUnlockingId(p.id)}>
                          <Unlock className="w-3.5 h-3.5" />
                        </DnaButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Lock Period Modal */}
      <DnaModal
        isOpen={isLockOpen}
        onClose={() => setLockOpen(false)}
        title="Lock Periode Akuntansi"
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <p className="text-slate-600">Mengunci periode akan mencegah seluruh transaksi baru pada bulan tersebut. Pastikan seluruh rekonsiliasi sudah selesai.</p>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Periode (Bulan)</label>
            <DnaInput type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan (opsional)</label>
            <DnaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="contoh: Tutup buku bulanan" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setLockOpen(false)}>Batal</DnaButton>
            <DnaButton variant="danger" size="md" onClick={submitLock} disabled={!periodMonth || lockMut.isPending}>
              <Lock className="w-4 h-4 mr-1.5" />
              Lock Periode
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* Unlock Modal */}
      <DnaModal
        isOpen={!!unlockingId}
        onClose={() => setUnlockingId(null)}
        title="Unlock Periode (Admin Override)"
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <p className="text-rose-700 font-semibold">PERINGATAN: Unlock hanya untuk koreksi admin. Akan tercatat di audit log.</p>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alasan Unlock</label>
            <DnaInput value={unlockReason} onChange={(e) => setUnlockReason(e.target.value)} placeholder="contoh: Koreksi jurnal penutup" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setUnlockingId(null)}>Batal</DnaButton>
            <DnaButton
              variant="danger"
              size="md"
              onClick={() => unlockingId && unlockMut.mutate({ id: unlockingId, reason: unlockReason })}
              disabled={!unlockReason || unlockMut.isPending}
            >
              <Unlock className="w-4 h-4 mr-1.5" />
              Unlock
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* Trial Balance Modal */}
      <DnaModal
        isOpen={trialBalance.length > 0 || trialMut.isPending}
        onClose={() => { setTrialBalance([]); setTrialPeriod(""); }}
        title={`Trial Balance — ${trialPeriod}`}
        size="lg"
      >
        <div className="space-y-3 text-xs">
          {trialMut.isPending ? (
            <p className="text-slate-500 py-4 text-center">Memuat neraca saldo...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="px-2.5 py-2">Akun</th>
                    <th className="px-2.5 py-2 text-right">Debit</th>
                    <th className="px-2.5 py-2 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2.5 py-1.5">
                        <span className="font-mono text-[10px] text-slate-500 mr-2">{r.accountCode}</span>
                        <span className="text-slate-800">{r.accountName}</span>
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono">{(r.debit ?? 0).toLocaleString("id-ID")}</td>
                      <td className="px-2.5 py-1.5 text-right font-mono">{(r.credit ?? 0).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
