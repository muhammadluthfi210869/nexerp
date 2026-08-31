"use client";

import { useState, useMemo } from "react";
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
  Zap,
  Globe,
  Verified,
  ArrowRight,
} from "lucide-react";
import {
  PageShell,
  CanonicalMetricGrid,
  MetricCard,
  DataTable,
  StatusBadge,
  mapStatus,
  SectionCard,
  SectionCardContent,
} from "@/components/canonical";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { formatOperationalDate } from "@/lib/operational-formatters";
import type { ColumnDef } from "@tanstack/react-table";

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

  const filteredPermits = useMemo(() => permits.filter((p: any) => {
    const term = searchTerm.toLowerCase();
    return (
      p.id?.toLowerCase().includes(term) ||
      p.name?.toLowerCase().includes(term) ||
      p.issuer?.toLowerCase().includes(term) ||
      p.type?.toLowerCase().includes(term)
    );
  }), [permits, searchTerm]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "permit",
      header: "Permit ID / Referensi",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <span className="text-[12px] font-medium text-slate-900">{row.original.id}</span>
        </div>
      ),
    },
    {
      id: "name",
      header: "Nama / Penerbit",
      cell: ({ row }: any) => (
        <div>
          <p className="text-[12px] font-medium text-slate-900">{row.original.name}</p>
          <p className="text-[11px] text-slate-500">{row.original.issuer}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Kategori",
      cell: ({ getValue }: any) => (
        <StatusBadge variant="default">{String(getValue() ?? "—")}</StatusBadge>
      ),
    },
    {
      accessorKey: "expiry",
      header: "Berlaku s/d",
      cell: ({ getValue }: any) => (
        <span className="text-[12px] text-slate-600 tabular-nums">
          {formatOperationalDate(getValue())}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }: any) => (
        <div className="flex justify-center">
          <StatusBadge variant={mapStatus(row.original.status)}>
            {STATUS_LABELS[row.original.status] || getOperationalStatusLabel(row.original.status)}
          </StatusBadge>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }: any) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label="Download"
            className="h-7 w-7 rounded-md border border-[#E2E8F0] bg-white text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
            onClick={() => console.log("Download permit:", row.original.id)}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          {STATUS_FLOW[row.original.status] && STATUS_FLOW[row.original.status].length > 0 && (
            <button
              type="button"
              className="h-7 px-2 inline-flex items-center gap-1 rounded-md bg-amber-500 text-white text-[11px] font-medium hover:bg-amber-600"
              onClick={() => setAdvancePermit(row.original)}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Maju</span>
            </button>
          )}
          <button
            type="button"
            className="h-7 px-2 inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => console.log("View permit details:", row.original.id)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Detail</span>
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <PageShell
      title="Registry Perizinan"
      subtitle="Pelacakan permit, lisensi, dan kepatuhan regulasi"
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <History className="h-4 w-4 text-amber-500" />
            <span>Audit Log</span>
          </button>
          <button
            type="button"
            className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white text-[12px] font-medium hover:bg-amber-700"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tambah Permit</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <CanonicalMetricGrid>
          <MetricCard label="Permit Aktif" value={activePermits} icon={<Verified />} variant="success" />
          <MetricCard label="Segera Habis" value={expiringSoon} icon={<Clock />} variant="warning" />
          <MetricCard label="Dalam Proses" value={inProgress} icon={<Zap />} variant="info" />
          <MetricCard label="Kesehatan Regulasi" value={healthScore} icon={<ShieldCheck />} variant="neutral" />
        </CanonicalMetricGrid>

        <DataTable
          title="Indeks Permit & Lisensi"
          data={filteredPermits}
          columns={columns}
          getRowId={(row: any) => row.id}
          loading={isLoading}
          searchPlaceholder="Cari permit ID / penerbit..."
          emptyMessage="Tidak ada data berkas perizinan"
          toolbarRight={
            <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400 min-w-[260px]">
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                placeholder="Cari permit ID / penerbit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700 placeholder:text-slate-400"
              />
            </label>
          }
          enableSearch={false}
        />

        <SectionCard>
          <SectionCardContent>
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-amber-500 text-white">
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
              <button
                type="button"
                className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-slate-800 text-white text-[12px] font-medium hover:bg-slate-900"
              >
                <ChevronRight className="h-4 w-4" />
                <span>Peta Regulasi</span>
              </button>
            </div>
          </SectionCardContent>
        </SectionCard>
      </div>

      {advancePermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white">
            <div className="border-b border-amber-100 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500 text-white">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">Majukan Status Permit</h3>
                  <p className="mt-0.5 text-[11px] text-slate-600">Perbarui tahap progresi permit</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-[#E2E8F0] bg-slate-50 p-3">
                <p className="mb-1 text-[10px] font-medium text-slate-500">Permit</p>
                <p className="text-[13px] font-semibold text-slate-900">{advancePermit.name}</p>
                <p className="text-[11px] text-slate-500">{advancePermit.id} • {advancePermit.issuer}</p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium text-slate-500">Status Saat Ini</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge variant={mapStatus(advancePermit.status)}>
                    {STATUS_LABELS[advancePermit.status] || advancePermit.status}
                  </StatusBadge>
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
                      className={`rounded-lg border-2 px-3 py-1.5 text-[12px] font-medium transition-colors ${
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
                  className="min-h-[80px] w-full rounded-lg border border-[#E2E8F0] bg-white p-3 text-[12px] font-medium text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Tambahkan catatan untuk perubahan status ini..."
                />
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 bg-slate-50 p-4">
              <button
                onClick={() => { setAdvancePermit(null); setAdvanceNotes(""); }}
                className="h-9 flex-1 rounded-lg border border-[#E2E8F0] text-[12px] font-medium text-slate-600 hover:bg-slate-100"
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
                className="h-9 flex-1 rounded-lg bg-amber-500 text-[12px] font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {advanceMutation.isPending ? "Memperbarui..." : "Konfirmasi Maju"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
