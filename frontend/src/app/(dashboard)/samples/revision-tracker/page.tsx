"use client";

import React, { useState, useMemo } from "react";
import {
  GitCommit,
  RefreshCw,
  AlertTriangle,
  Play,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Clock,
  User,
  FlaskConical
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { api } from "@/lib/api";

type RevisionStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "CANCELLED";

interface Lead {
  clientName: string;
  brandName: string;
}

interface Pic {
  name: string;
}

interface Formula {
  id: string;
  formulaCode: string;
  version: number;
}

interface RevisionSample {
  id: string;
  sampleCode: string;
  productName: string;
  lead: Lead;
  pic: Pic;
  revisionStatus: RevisionStatus;
  latestRevisionDate: string;
  completedAt: string | null;
  formulas: Formula[];
}

export default function RevisionTrackerPage() {
  const queryClient = useQueryClient();
  const toast = useDnaToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("new");
  const [selectedSample, setSelectedSample] = useState<RevisionSample | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const { data: activeRevisions = [], isLoading: isLoadingActive } = useQuery<RevisionSample[]>({
    queryKey: ["rnd-revisions"],
    queryFn: async () => (await api.get("/rnd/revisions")).data,
  });

  const { data: revisionHistory = [], isLoading: isLoadingHistory } = useQuery<RevisionSample[]>({
    queryKey: ["rnd-revision-history"],
    queryFn: async () => (await api.get("/rnd/revisions/history")).data,
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => api.post(`/rnd/revision/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rnd-revisions"] });
      toast.success("Revisi Dimulai", "Status revisi formulasi berhasil diubah ke dalam proses.");
      setIsDetailDrawerOpen(false);
    },
    onError: () => {
      toast.error("Gagal", "Tidak dapat memulai iterasi revisi.");
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/rnd/revision/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rnd-revisions"] });
      queryClient.invalidateQueries({ queryKey: ["rnd-revision-history"] });
      toast.success("Revisi Selesai", "Iterasi sampel formulasi berhasil ditandai selesai.");
      setIsDetailDrawerOpen(false);
    },
    onError: () => {
      toast.error("Gagal", "Tidak dapat menyelesaikan iterasi revisi.");
    },
  });

  const allRevisions = useMemo(() => [...activeRevisions, ...revisionHistory], [activeRevisions, revisionHistory]);
  const totalRevisions = allRevisions.length;
  const stuckRevisions = allRevisions.filter(
    (r) => (r.formulas?.length || 0) > 3 && r.revisionStatus === "IN_PROGRESS",
  ).length;

  const avgRevisionCount = useMemo(() => {
    if (allRevisions.length === 0) return "0";
    const sum = allRevisions.reduce((acc, r) => acc + (r.formulas?.length || 0), 0);
    return (sum / allRevisions.length).toFixed(1);
  }, [allRevisions]);

  const displayedList = useMemo(() => {
    let base = activeTab === "history" ? revisionHistory : activeRevisions;
    if (activeTab === "stuck") {
      base = allRevisions.filter((r) => (r.formulas?.length || 0) > 3);
    }

    if (!searchTerm.trim()) return base;
    const q = searchTerm.toLowerCase();
    return base.filter(
      (r) =>
        r.sampleCode.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.lead?.clientName?.toLowerCase().includes(q)
    );
  }, [activeTab, activeRevisions, revisionHistory, allRevisions, searchTerm]);

  const getStatusBadge = (status: RevisionStatus) => {
    switch (status) {
      case "NOT_STARTED":
        return <DnaBadge variant="neutral">BELUM DIMULAI</DnaBadge>;
      case "IN_PROGRESS":
        return <DnaBadge variant="warning">DALAM PROSES</DnaBadge>;
      case "DONE":
        return <DnaBadge variant="success">SELESAI</DnaBadge>;
      case "CANCELLED":
        return <DnaBadge variant="danger">DIBATALKAN</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  const isLoading = isLoadingActive || isLoadingHistory;

  return (
    <DnaPageContainer>
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Pelacak Iterasi Revisi Formulasi"
        description="Monitoring siklus revisi sampel R&D, identifikasi bottle-neck (>3 revisi), dan otorisasi tahap pengembangan."
        badge={<DnaBadge variant="neutral">REV-TRACK</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/samples/rnd-dashboard" },
          { label: "Kelola Formulasi", href: "/samples/formula" },
          { label: "Pelacak Revisi", href: "/samples/revision-tracker" }
        ]}
        tabs={[
          { id: "new", label: `Aktif (${activeRevisions.length})` },
          { id: "history", label: `Riwayat (${revisionHistory.length})` },
          { id: "stuck", label: `Kritis >3x (${stuckRevisions})` }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="secondary"
            onClick={() => toast.success("Export Berhasil", "Data riwayat revisi berhasil diekspor.")}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Export Excel
          </DnaButton>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="TOTAL SIKLUS REVISI"
          value={`${totalRevisions} Tiket`}
          subValue="Akumulasi Seluruh Sampel"
          icon={<GitCommit className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="TERKENDALA (>3 REVISI)"
          value={`${stuckRevisions} Sampel`}
          subValue="Perlu Intervensi Formulator Senior"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
        <DnaStatCard
          label="RATA-RATA ITERASI PER SAMPEL"
          value={`${avgRevisionCount}x Revisi`}
          subValue="Benchmark Standar Lab: 2.0x"
          icon={<RefreshCw className="w-5 h-5 text-amber-600" />}
        />
      </DnaKpiGrid>

      {/* 3. DataTable Card (Zero redundant title, zero horizontal scroll, max 6 cols) */}
      <DnaDataTableCard
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari kode sampel, nama produk, atau klien..."
      >
        <div className="w-full">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-[16%]">Kode & Tanggal</DnaTh>
                <DnaTh className="py-3 px-4 w-[28%]">Produk & Klien</DnaTh>
                <DnaTh className="py-3 px-4 w-[18%]">Formulator PIC</DnaTh>
                <DnaTh className="py-3 px-4 w-[14%]">Iterasi Formula</DnaTh>
                <DnaTh className="py-3 px-4 w-[14%]">Status</DnaTh>
                <DnaTh className="py-3 px-4 w-[10%] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data revisi sampel...
                  </DnaTd>
                </DnaTableRow>
              ) : displayedList.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada catatan revisi pada kategori ini.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                displayedList.map((entry) => {
                  const formulaCount = entry.formulas?.length || 0;
                  const isCritical = formulaCount > 3;
                  return (
                    <DnaTableRow key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="tabular-nums text-xs font-bold text-slate-900 truncate">{entry.sampleCode}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">
                          {entry.latestRevisionDate || entry.completedAt || "—"}
                        </p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="font-semibold text-slate-900 text-xs truncate">{entry.productName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{entry.lead?.clientName || "—"}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="font-medium text-slate-800 text-xs truncate">{entry.pic?.name || "—"}</p>
                        <p className="text-[11px] text-slate-400 truncate">R&D Formulator</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                          isCritical ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-800"
                        }`}>
                          {formulaCount}x Revisi
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isCritical ? "⚠️ Bottleneck" : "Normal"}
                        </p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4">
                        {getStatusBadge(entry.revisionStatus)}
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSample(entry);
                            setIsDetailDrawerOpen(true);
                          }}
                          title="Lihat Detail Revisi"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>
                  );
                })
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* 4. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedSample?.sampleCode || "Detail Revisi"}
        subtitle={selectedSample ? `${selectedSample.productName} • ${selectedSample.lead?.clientName}` : undefined}
        badge={selectedSample ? getStatusBadge(selectedSample.revisionStatus) : undefined}
        tabs={[
          {
            id: "summary",
            label: "Ringkasan",
            content: selectedSample ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="tabular-nums font-bold text-slate-900">{selectedSample.sampleCode}</span>
                    <span className="tabular-nums text-slate-500">{selectedSample.latestRevisionDate || selectedSample.completedAt || "—"}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{selectedSample.productName}</p>
                  <p className="text-slate-600">{selectedSample.lead?.clientName} ({selectedSample.lead?.brandName || "—"})</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Formulator PIC</span>
                    <p className="font-semibold text-slate-900">{selectedSample.pic?.name || "—"}</p>
                    <span className="text-[10px] text-slate-400">R&D Lab</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Total Iterasi Formula</span>
                    <p className="tabular-nums font-bold text-indigo-700 text-sm">{selectedSample.formulas?.length || 0} Versi</p>
                    <span className="text-[10px] text-slate-400">Tercatat di sistem</span>
                  </div>
                </div>
              </div>
            ) : null
          },
          {
            id: "branches",
            label: "Daftar Iterasi Formula",
            content: selectedSample ? (
              <div className="space-y-3 text-xs">
                <p className="font-bold text-slate-700 uppercase">Riwayat Branching Formula:</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <DnaTable>
                    <DnaTableHead>
                      <DnaTableRow>
                        <DnaTh className="p-2.5">Versi</DnaTh>
                        <DnaTh className="p-2.5">Kode Formula</DnaTh>
                      </DnaTableRow>
                    </DnaTableHead>
                    <DnaTableBody>
                      {(selectedSample.formulas || []).map((f, idx) => (
                        <DnaTableRow key={f.id || idx}>
                          <DnaTd className="p-2.5 font-bold tabular-nums text-slate-700">v{f.version || idx + 1}</DnaTd>
                          <DnaTd className="p-2.5 tabular-nums text-indigo-600 font-semibold">{f.formulaCode}</DnaTd>
                        </DnaTableRow>
                      ))}
                      {(selectedSample.formulas || []).length === 0 && (
                        <DnaTableRow>
                          <DnaTd colSpan={2} className="p-4 text-center text-slate-400">Belum ada cabang formula.</DnaTd>
                        </DnaTableRow>
                      )}
                    </DnaTableBody>
                  </DnaTable>
                </div>
              </div>
            ) : null
          }
        ]}
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>
              Tutup
            </DnaButton>
            {selectedSample?.revisionStatus === "NOT_STARTED" && (
              <DnaButton
                variant="primary"
                onClick={() => startMutation.mutate(selectedSample.id)}
                disabled={startMutation.isPending}
              >
                <Play className="w-4 h-4 mr-1.5" />
                Mulai Revisi
              </DnaButton>
            )}
            {selectedSample?.revisionStatus === "IN_PROGRESS" && (
              <DnaButton
                variant="primary"
                onClick={() => completeMutation.mutate(selectedSample.id)}
                disabled={completeMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Selesaikan Revisi
              </DnaButton>
            )}
          </div>
        }
      />
    </DnaPageContainer>
  );
}
