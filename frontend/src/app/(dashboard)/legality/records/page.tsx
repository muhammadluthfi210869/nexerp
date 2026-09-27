"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  FileBadge,
  FlaskConical,
  History,
  Calendar,
  ShieldAlert,
  Plus,
  ArrowRightCircle,
  MessageSquare,
  Activity,
  Moon,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowRight,
  Building2,
  Bookmark,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaTable,
  DnaBadge,
  DnaButton,
  DnaDetailDrawer,
  useDnaToast,
} from "@/components/dna";

export default function LegalityRecordsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useDnaToast();
  const [activeTab, setActiveTab] = useState("hki");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const { data: hkiData = [], isLoading: loadingHki } = useQuery({
    queryKey: ["hki-records"],
    queryFn: async () => {
      const resp = await api.get("/legality/hki");
      return resp.data || [];
    },
  });

  const { data: bpomData = [], isLoading: loadingBpom } = useQuery({
    queryKey: ["bpom-records"],
    queryFn: async () => {
      const resp = await api.get("/legality/bpom");
      return resp.data || [];
    },
  });

  const { data: halalData = [], isLoading: loadingHalal } = useQuery({
    queryKey: ["halal-records"],
    queryFn: async () => {
      const resp = await api.get("/legality/halal");
      return resp.data || [];
    },
  });

  const advanceHkiMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/legality/hki/${id}/advance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      success("Tahap pendaftaran HKI berhasil dilanjutkan ke stage berikutnya.");
      setIsDetailDrawerOpen(false);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || "Gagal melanjutkan tahap HKI");
    },
  });

  const advanceBpomMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/legality/bpom/${id}/advance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      success("Tahap notifikasi BPOM berhasil dilanjutkan ke stage berikutnya.");
      setIsDetailDrawerOpen(false);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || "Gagal melanjutkan tahap BPOM");
    },
  });

  const advanceHalalMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/legality/halal/${id}/advance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      success("Tahap sertifikasi Halal berhasil dilanjutkan ke stage berikutnya.");
      setIsDetailDrawerOpen(false);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || "Gagal melanjutkan tahap Halal");
    },
  });

  const currentDataset =
    activeTab === "hki" ? hkiData : activeTab === "bpom" ? bpomData : halalData;
  const isCurrentLoading =
    activeTab === "hki" ? loadingHki : activeTab === "bpom" ? loadingBpom : loadingHalal;

  const filteredDataset = useMemo(() => {
    if (!searchTerm.trim()) return currentDataset;
    const q = searchTerm.toLowerCase();
    return currentDataset.filter((r: any) => {
      const idStr = (r.hkiId || r.bpomId || r.halalId || r.id || "").toLowerCase();
      const nameStr = (r.brandName || r.productName || r.manufacturer || "").toLowerCase();
      const clientStr = (r.clientName || "").toLowerCase();
      const typeStr = (r.type || r.category || "").toLowerCase();
      return (
        idStr.includes(q) ||
        nameStr.includes(q) ||
        clientStr.includes(q) ||
        typeStr.includes(q)
      );
    });
  }, [currentDataset, searchTerm]);

  const handleAdvance = (record: any) => {
    if (activeTab === "hki") advanceHkiMutation.mutate(record.id);
    else if (activeTab === "bpom") advanceBpomMutation.mutate(record.id);
    else advanceHalalMutation.mutate(record.id);
  };

  const isAdvancing =
    advanceHkiMutation.isPending ||
    advanceBpomMutation.isPending ||
    advanceHalalMutation.isPending;

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. PAGE HEADER DENGAN TABS TERPADU (Golden Rule 2) ── */}
      <DnaPageHeader
        backLink={{ href: "/legality/dashboard", label: "Kembali ke Dashboard Legal" }}
        title="ARSIP & SIKLUS AUDIT REGULASI"
        badge={<DnaBadge variant="info">AUDIT REPOSITORY</DnaBadge>}
        subtitle="Repositori terpadu penelusuran status berkas HKI, notifikasi BPOM, dan sertifikasi Halal per produk"
        tabs={[
          {
            key: "hki",
            label: "HKI Merek & Branding",
            count: hkiData.length,
            icon: <FileBadge className="w-3.5 h-3.5" />,
          },
          {
            key: "bpom",
            label: "Notifikasi BPOM Kosmetik",
            count: bpomData.length,
            icon: <FlaskConical className="w-3.5 h-3.5" />,
          },
          {
            key: "halal",
            label: "Sertifikasi Halal (BPJPH)",
            count: halalData.length,
            icon: <Moon className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <Link href="/legality/input">
            <DnaButton variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
              Tambah Berkas Regulasi
            </DnaButton>
          </Link>
        }
      />

      {/* ── 02. MODULAR 4 KPI METRIC CARDS ── */}
      <DnaKpiGrid
        cards={[
          {
            key: "TOTAL_HKI",
            title: "TOTAL MEREK HKI TERDAFTAR",
            value: hkiData.length.toLocaleString("id-ID"),
            deltaText: "Perlindungan hak cipta & merek",
            isDeltaPositive: true,
            icon: <FileBadge className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            isSelected: activeTab === "hki",
            onClick: () => setActiveTab("hki"),
          },
          {
            key: "TOTAL_BPOM",
            title: "PRODUK NOTIFIKASI BPOM",
            value: bpomData.length.toLocaleString("id-ID"),
            deltaText: "Nomor NA aktif & dalam proses",
            isDeltaPositive: true,
            icon: <FlaskConical className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            isSelected: activeTab === "bpom",
            onClick: () => setActiveTab("bpom"),
          },
          {
            key: "TOTAL_HALAL",
            title: "SERTIFIKASI HALAL PRODUK",
            value: halalData.length.toLocaleString("id-ID"),
            deltaText: "Sertifikasi BPJPH & ketertelusuran",
            isDeltaPositive: true,
            icon: <Moon className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            isSelected: activeTab === "halal",
            onClick: () => setActiveTab("halal"),
          },
          {
            key: "COMPLIANCE_RATE",
            title: "TOTAL KESELURUHAN ARSIP",
            value: (hkiData.length + bpomData.length + halalData.length).toLocaleString("id-ID"),
            deltaText: "Berkas dalam audit log terpadu",
            isDeltaPositive: true,
            icon: <CheckCircle2 className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            isSelected: false,
          },
        ]}
      />

      {/* ── 03. MODULAR DATA TABLE CARD (Golden Rule 1 & 4) ── */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery: searchTerm,
          onSearchChange: setSearchTerm,
          searchPlaceholder: `Cari nomor ID, nama produk/merek, atau klien pemilik...`,
          actionButton: {
            label: "Daftar Baru",
            onClick: () => {
              window.location.href = "/legality/input";
            },
          },
        }}
      >
        <DnaTable className="table-fixed w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
              <th className="p-3 w-10 text-slate-400">#</th>
              <th className="p-3 w-[26%]">IDENTITAS BERKAS & MEREK</th>
              <th className="p-3 w-[20%]">KLIEN & KATEGORI</th>
              <th className="p-3 w-[22%]">TAHAPAN PIPELINE & DURASI</th>
              <th className="p-3 w-[18%] text-center">STATUS AUDIT</th>
              <th className="p-3 text-center w-[14%] whitespace-nowrap">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isCurrentLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Sinkronisasi arsip legalitas...</span>
                  </div>
                </td>
              </tr>
            ) : filteredDataset.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Tidak ada rekam berkas yang sesuai kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredDataset.map((record: any, idx: number) => {
                const regId = record.hkiId || record.bpomId || record.halalId || record.id;
                const regTitle = record.brandName || record.productName || record.manufacturer;
                return (
                  <tr
                    key={record.id || idx}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedRecord({
                        ...record,
                        recordType: activeTab.toUpperCase(),
                        regId,
                        regTitle,
                      });
                      setIsDetailDrawerOpen(true);
                    }}
                  >
                    <td className="p-3 text-slate-400 tabular-nums text-[11px] tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 truncate uppercase">{regTitle}</div>
                      <div className="tabular-nums text-[11px] text-blue-600 font-semibold">{regId}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 truncate">{record.clientName || "PT Nex Industri"}</div>
                      <div className="text-[11px] text-slate-500 truncate">{record.type || record.category || "Kosmetika"}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900 text-xs truncate">
                        {record.stage ? record.stage.replace("_", " ") : "Pemeriksaan Substantif"}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        {record.daysElapsed ? `${record.daysElapsed} hari berjalan` : "Baru diajukan"}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <DnaBadge
                        variant={
                          record.status === "DONE"
                            ? "success"
                            : record.status === "IN_PROGRESS"
                            ? "info"
                            : "critical"
                        }
                      >
                        {record.status || "IN PROGRESS"}
                      </DnaBadge>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                          onClick={() => {
                            setSelectedRecord({
                              ...record,
                              recordType: activeTab.toUpperCase(),
                              regId,
                              regTitle,
                            });
                            setIsDetailDrawerOpen(true);
                          }}
                          title="Inspeksi Arsip"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </DnaButton>
                        {record.status !== "DONE" && (
                          <DnaButton
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 text-[10.5px]"
                            disabled={isAdvancing}
                            onClick={() => handleAdvance(record)}
                            title="Lanjutkan Tahap"
                          >
                            Advance
                          </DnaButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

      {/* ── 04. DETAIL DRAWER QUICK PEEK (Golden Rule 5) ── */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedRecord?.regTitle || "Detail Arsip Legalitas"}
        subtitle={`Nomor Registrasi: ${selectedRecord?.regId || "-"} • Kategori: ${selectedRecord?.recordType || "-"}`}
        badge={
          selectedRecord?.status === "DONE" ? (
            <DnaBadge variant="success">TERBIT RESMI</DnaBadge>
          ) : (
            <DnaBadge variant="info">TAHAP EVALUASI</DnaBadge>
          )
        }
        tabs={[
          {
            id: "specs",
            label: "Rincian Berkas & Legalitas",
            content: selectedRecord ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nama Berkas / Merek</span>
                    <span className="font-bold text-slate-900 text-sm uppercase">{selectedRecord.regTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nomor Registrasi / SK</span>
                    <span className="tabular-nums font-bold text-blue-600 text-sm">{selectedRecord.regId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Klien Pemilik Hak</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.clientName || "PT Nex Industri"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Kategori Dokumen</span>
                    <span className="tabular-nums text-slate-700">{selectedRecord.type || selectedRecord.category || "Kosmetika"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">PIC Penanggung Jawab</span>
                    <span className="font-medium text-slate-800">{selectedRecord.pic?.name || "Tim Regulasi"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Durasi Proses</span>
                    <span className="tabular-nums font-semibold text-slate-800">{selectedRecord.daysElapsed || 0} Hari</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Siklus Tahapan Kepatuhan</span>
                    <span className="text-slate-500 text-[11px]">
                      Tahap saat ini: {selectedRecord.stage?.replace("_", " ") || "Pemeriksaan Substantif"}
                    </span>
                  </div>
                  <DnaBadge variant="info">Aktif</DnaBadge>
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
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={() => success("Salinan dossier berkas diekspor.")}
            >
              Export Dossier
            </DnaButton>
            <div className="flex items-center gap-2">
              {selectedRecord && selectedRecord.status !== "DONE" && (
                <DnaButton
                  variant="secondary"
                  size="sm"
                  disabled={isAdvancing}
                  onClick={() => handleAdvance(selectedRecord)}
                >
                  Lanjutkan Tahap
                </DnaButton>
              )}
              <DnaButton variant="primary" size="sm" onClick={() => setIsDetailDrawerOpen(false)}>
                Selesai
              </DnaButton>
            </div>
          </div>
        }
      />
    </div>
  );
}
