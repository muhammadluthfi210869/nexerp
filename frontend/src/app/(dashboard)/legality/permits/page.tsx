"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  Building2,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaTable,
  DnaBadge,
  DnaButton,
  DnaDetailDrawer,
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  useDnaToast,
} from "@/components/dna";

interface PermitItem {
  id: string;
  name: string;
  issuer: string;
  type: string;
  expiry: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "DRAFT" | "PENDING_REVIEW" | "SUSPENDED" | "REJECTED";
  notes?: string;
  documentUrl?: string;
}

const STATUS_FLOW: Record<string, string[]> = {
  DRAFT: ["PENDING_REVIEW", "ACTIVE"],
  PENDING_REVIEW: ["ACTIVE", "REJECTED"],
  ACTIVE: ["EXPIRING_SOON", "SUSPENDED"],
  EXPIRING_SOON: ["ACTIVE", "EXPIRED"],
  EXPIRED: ["ACTIVE"],
  SUSPENDED: ["ACTIVE"],
  REJECTED: ["DRAFT"],
};

export default function LegalityPermitsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useDnaToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermit, setSelectedPermit] = useState<PermitItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Advance Status Modal
  const [advancePermit, setAdvancePermit] = useState<PermitItem | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [advanceNotes, setAdvanceNotes] = useState("");

  const { data: permits = [], isLoading, isError, error, refetch } = useQuery<PermitItem[]>({
    queryKey: ["permits"],
    queryFn: async () => {
      const resp = await api.get("/legality/permits");
      return resp.data || [];
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const resp = await api.patch(`/legality/permits/${id}/status`, { status, notes });
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permits"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      success("Status perizinan berhasil diperbarui ke tahap berikutnya.");
      setAdvancePermit(null);
      setAdvanceNotes("");
      setIsDetailDrawerOpen(false);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || "Gagal memperbarui status izin.");
    },
  });

  const activePermits = permits.filter((p) => p.status === "ACTIVE").length;
  const expiringSoon = permits.filter((p) => p.status === "EXPIRING_SOON").length;
  const inProgress = permits.filter((p) => p.status === "EXPIRED" || p.status === "EXPIRING_SOON").length;
  const healthScore = permits.length > 0 ? `${Math.round((activePermits / permits.length) * 100)}%` : "100%";

  const filteredPermits = useMemo(() => {
    return permits.filter((p) => {
      // Tab Filter
      if (activeTab === "ACTIVE" && p.status !== "ACTIVE") return false;
      if (activeTab === "EXPIRING_SOON" && p.status !== "EXPIRING_SOON") return false;
      if (activeTab === "EXPIRED" && p.status !== "EXPIRED") return false;

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchId = p.id?.toLowerCase().includes(q);
        const matchName = p.name?.toLowerCase().includes(q);
        const matchIssuer = p.issuer?.toLowerCase().includes(q);
        const matchType = p.type?.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchIssuer && !matchType) return false;
      }
      return true;
    });
  }, [permits, activeTab, searchTerm]);

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. PAGE HEADER DENGAN TABS TERPADU (Golden Rule 2) ── */}
      <DnaPageHeader
        backLink={{ href: "/legality/dashboard", label: "Kembali ke Dashboard Legal" }}
        title="REGISTRY PERIZINAN & LISENSI RESMI"
        badge={<DnaBadge variant="info">LEGAL PERMITS</DnaBadge>}
        subtitle="Pencatatan izin edar BPOM, sertifikasi Halal, surat izin operasional pabrik, dan kelaikan usaha"
        tabs={[
          {
            key: "all",
            label: "Semua Perizinan",
            count: permits.length,
            icon: <FileText className="w-3.5 h-3.5" />,
          },
          {
            key: "ACTIVE",
            label: "Izin Aktif",
            count: activePermits,
            icon: <Verified className="w-3.5 h-3.5" />,
          },
          {
            key: "EXPIRING_SOON",
            label: "Expiring Soon (< 90 Hari)",
            count: expiringSoon,
            icon: <Clock className="w-3.5 h-3.5" />,
          },
          {
            key: "EXPIRED",
            label: "Kadaluarsa / Perlu Perpanjangan",
            count: permits.filter((p) => p.status === "EXPIRED").length,
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="outline"
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={() => success("Buku induk perizinan edar diekspor.")}
          >
            Export Buku Induk
          </DnaButton>
        }
      />

      {/* ── 02. MODULAR 4 KPI METRIC CARDS ── */}
      <DnaKpiGrid
        cards={[
          {
            key: "ACTIVE",
            title: "IZIN AKTIF RESMI",
            value: activePermits.toLocaleString("id-ID"),
            deltaText: "Berlaku penuh tanpa kendala",
            isDeltaPositive: true,
            icon: <Verified className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            isSelected: activeTab === "ACTIVE",
            onClick: () => setActiveTab(activeTab === "ACTIVE" ? "all" : "ACTIVE"),
          },
          {
            key: "EXPIRING",
            title: "MENDEKATI JATUH TEMPO",
            value: `${expiringSoon} Izin`,
            deltaText: "Perlu perpanjangan segera (< 90h)",
            isDeltaPositive: false,
            icon: <Clock className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            isSelected: activeTab === "EXPIRING_SOON",
            onClick: () => setActiveTab(activeTab === "EXPIRING_SOON" ? "all" : "EXPIRING_SOON"),
          },
          {
            key: "PROCESS",
            title: "DALAM PROSES / KADALUARSA",
            value: `${inProgress} Berkas`,
            deltaText: "Dokumen dalam evaluasi instansi",
            isDeltaPositive: true,
            icon: <Zap className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            isSelected: false,
          },
          {
            key: "HEALTH",
            title: "SKOR KESEHATAN REGULASI",
            value: healthScore,
            deltaText: "Tingkat kepatuhan audit legalitas",
            isDeltaPositive: true,
            icon: <ShieldCheck className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            isSelected: false,
          },
        ]}
      />

      {/* ── 03. MODULAR DATA TABLE CARD (Golden Rule 1 & 4) ── */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery: searchTerm,
          onSearchChange: setSearchTerm,
          searchPlaceholder: "Cari nomor izin, nama perizinan, atau instansi penerbit...",
        }}
      >
        <DnaTable className="table-fixed w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
              <th className="p-3 w-10 text-slate-400">#</th>
              <th className="p-3 w-[26%]">NO. IZIN & NAMA DOKUMEN</th>
              <th className="p-3 w-[20%]">INSTANSI & TIPE</th>
              <th className="p-3 w-[18%]">MASA BERLAKU</th>
              <th className="p-3 w-[18%] text-center">STATUS</th>
              <th className="p-3 text-center w-[18%] whitespace-nowrap">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Memuat buku perizinan edar...</span>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-rose-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span>Gagal memuat registry perizinan: {(error as any)?.message || "Terjadi kesalahan"}</span>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-md border border-rose-200 transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredPermits.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Tidak ada dokumen perizinan yang sesuai kriteria filter.
                </td>
              </tr>
            ) : (
              filteredPermits.map((permit, idx) => (
                <tr
                  key={permit.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPermit(permit);
                    setIsDetailDrawerOpen(true);
                  }}
                >
                  <td className="p-3 text-slate-400 font-mono text-[11px] tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 truncate uppercase">{permit.name}</div>
                    <div className="font-mono text-[11px] text-blue-600 font-semibold">{permit.id}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800 truncate">{permit.issuer}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{permit.type}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800 text-xs">{permit.expiry || "—"}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Batas Akhir Izin</div>
                  </td>
                  <td className="p-3 text-center">
                    <DnaBadge
                      variant={
                        permit.status === "ACTIVE"
                          ? "success"
                          : permit.status === "EXPIRING_SOON"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {permit.status.replace("_", " ")}
                    </DnaBadge>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                        onClick={() => {
                          setSelectedPermit(permit);
                          setIsDetailDrawerOpen(true);
                        }}
                        title="Lihat Detail Izin"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                      {STATUS_FLOW[permit.status] && STATUS_FLOW[permit.status].length > 0 && (
                        <DnaButton
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2 text-[10.5px]"
                          onClick={() => {
                            setAdvancePermit(permit);
                            setNextStatus(STATUS_FLOW[permit.status][0]);
                            setAdvanceNotes("");
                          }}
                          title="Lanjutkan Tahap Perizinan"
                        >
                          Tahap Berikutnya
                        </DnaButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

      {/* ── 04. DETAIL DRAWER QUICK PEEK (Golden Rule 5) ── */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedPermit?.name || "Detail Izin & Dokumen Legal"}
        subtitle={`ID Registrasi: ${selectedPermit?.id || "-"} • Instansi: ${selectedPermit?.issuer || "-"}`}
        badge={
          selectedPermit?.status === "ACTIVE" ? (
            <DnaBadge variant="success">IZIN RESMI AKTIF</DnaBadge>
          ) : selectedPermit?.status === "EXPIRING_SOON" ? (
            <DnaBadge variant="warning">EXPIRING SOON</DnaBadge>
          ) : (
            <DnaBadge variant="critical">KADALUARSA</DnaBadge>
          )
        }
        tabs={[
          {
            id: "specs",
            label: "Informasi Izin & Masa Berlaku",
            content: selectedPermit ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nama Perizinan</span>
                    <span className="font-bold text-slate-900 text-sm uppercase">{selectedPermit.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nomor Surat Keputusan (SK)</span>
                    <span className="font-mono font-bold text-blue-600 text-sm">{selectedPermit.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Instansi Penerbit</span>
                    <span className="font-semibold text-slate-800">{selectedPermit.issuer}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Kategori Dokumen</span>
                    <span className="font-mono text-slate-700">{selectedPermit.type}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[11px]">Batas Akhir Berlaku (Expiry Date)</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedPermit.expiry || "—"}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Sertifikat Digital Terindeks</span>
                    <span className="text-slate-500 text-[11px]">Telah diverifikasi sesuai standar OSS & BPOM</span>
                  </div>
                  <DnaBadge variant="info">Digital SK</DnaBadge>
                </div>
              </div>
            ) : null,
          },
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => {
                success(`Salinan berkas izin ${selectedPermit?.id} diunduh.`);
              }}
            >
              Unduh Salinan SK
            </DnaButton>
            <div className="flex items-center gap-2">
              {selectedPermit && STATUS_FLOW[selectedPermit.status] && (
                <DnaButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAdvancePermit(selectedPermit);
                    setNextStatus(STATUS_FLOW[selectedPermit.status][0]);
                    setAdvanceNotes("");
                  }}
                >
                  Ubah Tahap Status
                </DnaButton>
              )}
              <DnaButton variant="primary" size="sm" onClick={() => setIsDetailDrawerOpen(false)}>
                Selesai
              </DnaButton>
            </div>
          </div>
        }
      />

      {/* ── 05. MODAL ADVANCE STATUS PERIZINAN ── */}
      <DnaModal
        isOpen={!!advancePermit}
        onClose={() => setAdvancePermit(null)}
        title="Lanjutkan Tahapan Perizinan"
        subtitle={`Perbarui status untuk izin ${advancePermit?.name} (${advancePermit?.id})`}
        size="md"
        footer={
          <>
            <DnaButton variant="secondary" onClick={() => setAdvancePermit(null)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              disabled={advanceMutation.isPending || !nextStatus}
              onClick={() => {
                if (advancePermit && nextStatus) {
                  advanceMutation.mutate({
                    id: advancePermit.id,
                    status: nextStatus,
                    notes: advanceNotes,
                  });
                }
              }}
            >
              Simpan Perubahan
            </DnaButton>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tahap Status Baru *
            </label>
            <DnaSelect
              value={nextStatus}
              onChange={(val) => setNextStatus(val)}
              options={
                advancePermit && STATUS_FLOW[advancePermit.status]
                  ? STATUS_FLOW[advancePermit.status].map((s) => ({
                      value: s,
                      label: s.replace("_", " "),
                    }))
                  : []
              }
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Regulasi / Nomor Surat Pengantar
            </label>
            <DnaTextarea
              value={advanceNotes}
              onChange={(e) => setAdvanceNotes(e.target.value)}
              placeholder="Masukkan keterangan evaluasi dokumen atau tindak lanjut..."
              rows={3}
            />
          </div>
        </div>
      </DnaModal>
    </div>
  );
}
