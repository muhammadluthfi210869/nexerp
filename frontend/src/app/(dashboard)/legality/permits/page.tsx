"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldCheck,
  Search,
  PlusCircle,
  FileText,
  Clock,
  ChevronRight,
  Gavel,
  History,
  Download,
  Calendar,
  Zap,
  Globe,
  Verified,
  ArrowRight,
} from "lucide-react";
import { DnaBadge, DnaButton, StatCard, TableWrapper } from "@/components/dna";
import {
  OperationalButton,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
} from "@/components/operational";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { formatOperationalDate } from "@/lib/operational-formatters";

export default function LegalityHub() {
  const [searchTerm, setSearchTerm] = useState("");
  const [advancePermit, setAdvancePermit] = useState<any>(null);
  const [advanceNotes, setAdvanceNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: permits = [], isLoading } = useQuery({
    queryKey: ["permits"],
    queryFn: async () => {
      const resp = await api.get("/legality/permits");
      return resp.data;
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const resp = await api.patch(`/legality/permits/${id}/status`, { status, notes });
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permits"] });
      toast.success("Status permit diperbarui", {
        description: "Permit telah maju ke tahap berikutnya.",
      });
      setAdvancePermit(null);
      setAdvanceNotes("");
    },
    onError: (err: any) => {
      toast.error("Pembaruan gagal", {
        description: err.response?.data?.message || "Gagal memperbarui status permit.",
      });
    },
  });

  const STATUS_FLOW: Record<string, string[]> = {
    DRAFT: ["PENDING_REVIEW", "ACTIVE"],
    PENDING_REVIEW: ["ACTIVE", "REJECTED"],
    ACTIVE: ["EXPIRING_SOON", "SUSPENDED"],
    EXPIRING_SOON: ["ACTIVE", "EXPIRED"],
    EXPIRED: ["ACTIVE"],
    SUSPENDED: ["ACTIVE"],
    REJECTED: ["DRAFT"],
  };

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_REVIEW: "Pending Review",
    ACTIVE: "Aktif",
    EXPIRING_SOON: "Segera Habis",
    EXPIRED: "Kedaluwarsa",
    SUSPENDED: "Ditangguhkan",
    REJECTED: "Ditolak",
  };

  const activePermits = permits?.filter((p: any) => p.status === 'ACTIVE').length ?? 0;
  const expiringSoon = permits?.filter((p: any) => p.status === 'EXPIRING_SOON').length ?? 0;
  const inProgress = permits?.filter((p: any) => p.status === 'EXPIRED' || p.status === 'EXPIRING_SOON').length ?? 0;
  const healthScore = permits?.length > 0 ? Math.round((activePermits / permits.length) * 100) + '%' : '100%';

  const filteredPermits = permits.filter((p: any) => {
    const term = searchTerm.toLowerCase();
    return (
      p.id?.toLowerCase().includes(term) ||
      p.name?.toLowerCase().includes(term) ||
      p.issuer?.toLowerCase().includes(term) ||
      p.type?.toLowerCase().includes(term)
    );
  });

  return (
    <OperationalPageShell
      title="Registry Perizinan"
      subtitle="Pelacakan permit, lisensi, dan kepatuhan regulasi"
      actions={
        <div className="flex gap-2">
          <DnaButton variant="outline" icon={<History className="h-4 w-4 text-amber-500" />}>
            Audit Log
          </DnaButton>
          <DnaButton variant="primary" icon={<PlusCircle className="h-4 w-4" />} className="bg-amber-600 hover:bg-amber-700 text-white">
            Tambah Permit
          </DnaButton>
        </div>
      }
    >
      <OperationalMetricGrid>
        <OperationalMetricCard label="Permit Aktif" value={activePermits} icon={<Verified className="h-4 w-4" />} tone="green" />
        <OperationalMetricCard label="Segera Habis" value={expiringSoon} icon={<Clock className="h-4 w-4" />} tone="amber" />
        <OperationalMetricCard label="Dalam Proses" value={inProgress} icon={<Zap className="h-4 w-4" />} tone="blue" />
        <OperationalMetricCard label="Kesehatan Regulasi" value={healthScore} icon={<ShieldCheck className="h-4 w-4" />} />
      </OperationalMetricGrid>

      <OperationalPanel>
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <h3 className="text-[13px] font-semibold text-slate-900">Indeks Permit & Lisensi</h3>
            <span className="text-[11px] font-medium text-slate-500">· {filteredPermits.length} record</span>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari permit ID / penerbit..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <TableWrapper>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-3 py-2 text-[12px] font-semibold normal-case text-slate-500">Permit ID / Referensi</th>
                <th className="px-3 py-2 text-[12px] font-semibold normal-case text-slate-500">Nama / Penerbit</th>
                <th className="px-3 py-2 text-[12px] font-semibold normal-case text-slate-500">Kategori</th>
                <th className="px-3 py-2 text-[12px] font-semibold normal-case text-slate-500">Berlaku s/d</th>
                <th className="px-3 py-2 text-center text-[12px] font-semibold normal-case text-slate-500">Status</th>
                <th className="px-3 py-2 text-right text-[12px] font-semibold normal-case text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-slate-500">Memuat data registry...</td>
                </tr>
              ) : filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-slate-500">Tidak ada data berkas perizinan yang ditemukan</td>
                </tr>
              ) : (
                filteredPermits.map((permit: any) => (
                  <tr key={permit.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-md bg-amber-50 text-amber-600">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[12px] font-semibold text-slate-900">{permit.id}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[12px] font-semibold text-slate-900">{permit.name}</p>
                      <p className="text-[11px] text-slate-500">{permit.issuer}</p>
                    </td>
                    <td className="px-3 py-3">
                      <DnaBadge status="default">{permit.type}</DnaBadge>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-slate-600 tabular-nums">
                      {formatOperationalDate(permit.expiry)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <OperationalStatusBadge
                        status={
                          permit.status === 'ACTIVE' ? "success" :
                          permit.status === 'EXPIRING_SOON' ? "pending" :
                          permit.status === 'EXPIRED' ? "danger" : "neutral"
                        }
                      >
                        {STATUS_LABELS[permit.status] || getOperationalStatusLabel(permit.status)}
                      </OperationalStatusBadge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <DnaButton size="sm" variant="ghost" icon={<Download className="h-3.5 w-3.5" />} onClick={() => console.log("Download permit:", permit.id)} />
                        {STATUS_FLOW[permit.status] && STATUS_FLOW[permit.status].length > 0 && (
                          <DnaButton size="sm" variant="primary" icon={<ArrowRight className="h-3.5 w-3.5" />} onClick={() => setAdvancePermit(permit)} className="bg-amber-600 hover:bg-amber-700 text-white">
                            Maju
                          </DnaButton>
                        )}
                        <DnaButton size="sm" variant="outline" icon={<ChevronRight className="h-3.5 w-3.5" />} onClick={() => console.log("View permit details:", permit.id)}>
                          Detail
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrapper>
      </OperationalPanel>

      <OperationalPanel>
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-amber-500 text-white">
            <Gavel className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-[13px] font-semibold text-slate-900">Regulatory Intelligence</h4>
            <p className="text-[12px] leading-relaxed text-slate-600">
              Pelacakan otomatis siklus renewal untuk 12+ badan regulasi internasional. Mesin proaktif kami memberi notifikasi ke konsultan hukum 90 hari sebelum masa berlaku habis.
            </p>
            <div className="flex gap-4 pt-1">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <Globe className="h-3.5 w-3.5 text-amber-500" /> Kepatuhan Global
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Digital Vault
              </span>
            </div>
          </div>
          <DnaButton variant="secondary" icon={<ChevronRight />} className="bg-slate-800 text-white">
            Peta Regulasi
          </DnaButton>
        </div>
      </OperationalPanel>

      {advancePermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-amber-100 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-amber-500 text-white">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">Majukan Status Permit</h3>
                  <p className="mt-0.5 text-[11px] text-slate-600">Perbarui tahap progresi permit</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-[10px] font-medium text-slate-500">Permit</p>
                <p className="text-[13px] font-semibold text-slate-900">{advancePermit.name}</p>
                <p className="text-[11px] text-slate-500">{advancePermit.id} • {advancePermit.issuer}</p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium text-slate-500">Status Saat Ini</p>
                <div className="flex flex-wrap items-center gap-2">
                  <DnaBadge status={advancePermit.status === 'ACTIVE' ? 'success' : advancePermit.status === 'EXPIRED' ? 'critical' : 'warning'}>
                    {STATUS_LABELS[advancePermit.status] || advancePermit.status}
                  </DnaBadge>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                  <span className="text-[11px] text-slate-500">Maju ke:</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(STATUS_FLOW[advancePermit.status] || []).map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => {
                        setAdvancePermit({ ...advancePermit, _nextStatus: nextStatus });
                      }}
                      className={`rounded-md border-2 px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        advancePermit._nextStatus === nextStatus
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
                      }`}
                    >
                      {STATUS_LABELS[nextStatus] || nextStatus}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 text-[11px] font-medium text-slate-500">Catatan (opsional)</p>
                <textarea
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white p-3 text-[12px] font-medium text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Tambahkan catatan untuk perubahan status ini..."
                />
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 bg-slate-50 p-4">
              <button
                onClick={() => { setAdvancePermit(null); setAdvanceNotes(""); }}
                className="h-9 flex-1 rounded-md border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (advancePermit._nextStatus) {
                    advanceMutation.mutate({
                      id: advancePermit.id,
                      status: advancePermit._nextStatus,
                      notes: advanceNotes,
                    });
                  }
                }}
                disabled={!advancePermit._nextStatus || advanceMutation.isPending}
                className="h-9 flex-1 rounded-md bg-amber-500 text-[12px] font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {advanceMutation.isPending ? "Memperbarui..." : "Konfirmasi Maju"}
              </button>
            </div>
          </div>
        </div>
      )}
    </OperationalPageShell>
  );
}
