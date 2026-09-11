"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ClipboardCheck,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  Calendar,
  Building2,
  Package,
  Printer,
  ShieldCheck,
  Upload,
  Layers,
  Search,
  Check,
  RotateCcw
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
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaTable,
  useDnaToast
} from "@/components/dna";

interface OpnameItem {
  itemCode: string;
  itemName: string;
  batchLot: string;
  binLocation: string;
  systemQty: number;
  actualQty: number | null;
  differenceQty: number;
  unit: string;
  unitHpp: number;
  varianceValuation: number;
  status: "MATCH" | "SURPLUS" | "DEFICIT" | "PENDING_COUNT";
  notes?: string;
}

interface OpnameSession {
  id: string;
  sessionCode: string;
  sessionDate: string;
  warehouseCode: string;
  warehouseName: string;
  auditorLead: string;
  auditorTeam: string[];
  totalSkus: number;
  countedSkus: number;
  matchedSkus: number;
  varianceSkus: number;
  netVarianceValuation: number;
  status: "DRAFT_FREEZE" | "IN_COUNT" | "RECONCILED_CLOSED";
  notes?: string;
  isInventoryFrozen: boolean;
  items: OpnameItem[];
}

const MOCK_OPNAME_SESSIONS: OpnameSession[] = [
  {
    id: "opn-01",
    sessionCode: "OPN-202603-0001",
    sessionDate: "2026-03-09",
    warehouseCode: "WH-01",
    warehouseName: "WH-01 Gudang Bahan Baku",
    auditorLead: "Hendro Wibowo",
    auditorTeam: ["Budi Santoso", "Dewi Sartika", "Rian Hendra"],
    totalSkus: 4,
    countedSkus: 4,
    matchedSkus: 2,
    varianceSkus: 2,
    netVarianceValuation: -610000,
    status: "IN_COUNT",
    isInventoryFrozen: true,
    notes: "Stok Opname Triwulan I Gudang Bahan Baku Kosmetik & Ekstrak Botani.",
    items: [
      {
        itemCode: "RAW-NIA-001",
        itemName: "Niacinamide USP Grade 99%",
        batchLot: "LOT-NIA-202603-01",
        binLocation: "Rak A-01 / Level 1",
        systemQty: 1252,
        actualQty: 1250,
        differenceQty: -2,
        unit: "Kg",
        unitHpp: 185000,
        varianceValuation: -370000,
        status: "DEFICIT",
        notes: "2 kg dipakai untuk retain sample uji stabilitas"
      },
      {
        itemCode: "RAW-HA-002",
        itemName: "Hyaluronic Acid 1% Solution",
        batchLot: "LOT-HA-202602-03",
        binLocation: "Rak A-02 / Level 2",
        systemQty: 120,
        actualQty: 120,
        differenceQty: 0,
        unit: "Kg",
        unitHpp: 850000,
        varianceValuation: 0,
        status: "MATCH"
      },
      {
        itemCode: "RAW-CET-003",
        itemName: "Cetearyl Alcohol Pastilles",
        batchLot: "LOT-CET-202601-09",
        binLocation: "Rak B-01 / Level 1",
        systemQty: 485,
        actualQty: 480,
        differenceQty: -5,
        unit: "Kg",
        unitHpp: 48000,
        varianceValuation: -240000,
        status: "DEFICIT",
        notes: "Susut kelembaban penyimpanan karung terbuka"
      },
      {
        itemCode: "RAW-GLY-004",
        itemName: "Glycerin Pharma Grade 99.7%",
        batchLot: "LOT-GLY-202602-11",
        binLocation: "Rak B-02 / Level 2",
        systemQty: 800,
        actualQty: 800,
        differenceQty: 0,
        unit: "Kg",
        unitHpp: 28000,
        varianceValuation: 0,
        status: "MATCH"
      }
    ]
  },
  {
    id: "opn-02",
    sessionCode: "OPN-202602-0002",
    sessionDate: "2026-02-28",
    warehouseCode: "WH-02",
    warehouseName: "WH-02 Gudang Bahan Kemas",
    auditorLead: "Hendro Wibowo",
    auditorTeam: ["Siti Rahma", "Ahmad Fauzi"],
    totalSkus: 2,
    countedSkus: 2,
    matchedSkus: 1,
    varianceSkus: 1,
    netVarianceValuation: -210000,
    status: "RECONCILED_CLOSED",
    isInventoryFrozen: false,
    notes: "Audit Akhir Bulan Bahan Kemas Botol & Tube.",
    items: [
      {
        itemCode: "KMS-BTL-030",
        itemName: "Botol Dropper Frosted Glass 30ml",
        batchLot: "LOT-BTL-202601-14",
        binLocation: "Pallet C-01",
        systemQty: 9550,
        actualQty: 9500,
        differenceQty: -50,
        unit: "Pcs",
        unitHpp: 4200,
        varianceValuation: -210000,
        status: "DEFICIT",
        notes: "Botol pecah telah dibuatkan Berita Acara Kerusakan"
      },
      {
        itemCode: "KMS-BOX-001",
        itemName: "Inner Box Hologram Foil 30ml",
        batchLot: "LOT-BOX-202603-02",
        binLocation: "Pallet C-03",
        systemQty: 15400,
        actualQty: 15400,
        differenceQty: 0,
        unit: "Pcs",
        unitHpp: 1650,
        varianceValuation: 0,
        status: "MATCH"
      }
    ]
  }
];

export default function StockOpnamePage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<OpnameSession | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [managerPin, setManagerPin] = useState("");

  // Create form state
  const [newSessionForm, setNewSessionForm] = useState({
    warehouseCode: "WH-01",
    warehouseName: "WH-01 Gudang Bahan Baku",
    auditorLead: "Hendro Wibowo (Kepala Gudang)",
    auditorTeam: "Budi Santoso, Dewi Sartika",
    notes: "",
    freezeInventory: true
  });

  // Query sessions
  const { data: rawSessions, isLoading } = useQuery({
    queryKey: ["warehouse-opname-sessions"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/opname");
        return unwrapResponse(res.data) as OpnameSession[];
      } catch (e) {
        return null;
      }
    }
  });

  const sessions: OpnameSession[] = useMemo(() => {
    if (rawSessions && Array.isArray(rawSessions) && rawSessions.length > 0) {
      return rawSessions;
    }
    return MOCK_OPNAME_SESSIONS;
  }, [rawSessions]);

  // Filtering
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (activeTab === "active" && s.status === "RECONCILED_CLOSED") return false;
      if (activeTab === "closed" && s.status !== "RECONCILED_CLOSED") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          s.sessionCode.toLowerCase().includes(q) ||
          s.warehouseName.toLowerCase().includes(q) ||
          s.auditorLead.toLowerCase().includes(q) ||
          (s.notes && s.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [sessions, activeTab, searchQuery]);

  // Metric Computations
  const totalSessionsCount = sessions.length;
  const activeSessionsCount = sessions.filter(s => s.status !== "RECONCILED_CLOSED").length;
  const closedSessionsCount = sessions.filter(s => s.status === "RECONCILED_CLOSED").length;
  const totalNetVariance = sessions.reduce((acc, curr) => acc + curr.netVarianceValuation, 0);

  // Handlers
  const handleCreateSession = () => {
    toast.success(
      "Sesi Opname Dibuat",
      `Sesi ${newSessionForm.warehouseName} berhasil dimulai. Status freeze persediaan: AKTIF.`
    );
    setIsCreateModalOpen(false);
  };

  const handleUpdateCountItem = (itemCode: string, newActualQty: number) => {
    if (!selectedSession) return;
    const updatedItems = selectedSession.items.map(item => {
      if (item.itemCode === itemCode) {
        const diff = newActualQty - item.systemQty;
        const val = diff * item.unitHpp;
        const st: OpnameItem["status"] = diff === 0 ? "MATCH" : diff > 0 ? "SURPLUS" : "DEFICIT";
        return { ...item, actualQty: newActualQty, differenceQty: diff, varianceValuation: val, status: st };
      }
      return item;
    });

    const counted = updatedItems.filter(i => i.actualQty !== null).length;
    const matched = updatedItems.filter(i => i.differenceQty === 0).length;
    const variance = updatedItems.filter(i => i.differenceQty !== 0).length;
    const netVal = updatedItems.reduce((acc, curr) => acc + curr.varianceValuation, 0);

    setSelectedSession({
      ...selectedSession,
      items: updatedItems,
      countedSkus: counted,
      matchedSkus: matched,
      varianceSkus: variance,
      netVarianceValuation: netVal,
      status: "IN_COUNT"
    });

    toast.info("Hitungan Tersimpan", `Hasil hitung fisik untuk item ${itemCode} berhasil diperbarui.`);
  };

  const handleCloseAndReconcile = () => {
    if (managerPin !== "1234" && managerPin.length < 4) {
      toast.error("Otorisasi PIN Gagal", "Masukkan 4-digit PIN Manager yang valid untuk otorisasi rekonsiliasi.");
      return;
    }

    toast.success(
      "Sesi Opname Selesai & Direkonsiliasi",
      `Sesi ${selectedSession?.sessionCode} ditutup. Jurnal penyesuaian selisih stok (GL 510501) berhasil di-posting. Freeze gudang telah dibuka.`
    );

    setIsCloseSessionModalOpen(false);
    setIsCountModalOpen(false);
    setManagerPin("");
  };

  const getStatusBadge = (status: OpnameSession["status"]) => {
    switch (status) {
      case "DRAFT_FREEZE":
        return <DnaBadge variant="purple">FREEZE / DRAFT</DnaBadge>;
      case "IN_COUNT":
        return <DnaBadge variant="warning">PROSES HITUNG FISIK</DnaBadge>;
      case "RECONCILED_CLOSED":
        return <DnaBadge variant="success">SELESAI & DIREKONSILIASI</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Stok Opname (Physical Count Audit)"
        description="Perekaman hitung fisik persediaan (Metode Form Cepat V1 & Import Spreadsheet V2), audit selisih otomatis, dan rekonsiliasi Manager PIN."
        badge={<DnaBadge variant="neutral">SCR-150 & SCR-151</DnaBadge>}
        breadcrumbs={[
          { label: "Warehouse Hub", href: "/warehouse" },
          { label: "Stok Barang", href: "/warehouse/stok" },
          { label: "Stok Opname", href: "/warehouse/opname" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import Excel (V2)
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Mulai Sesi Opname (V1)
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL SESI AUDIT"
          value={`${totalSessionsCount} Sesi`}
          subValue="Riwayat Periode Berjalan"
          icon={<ClipboardCheck className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="SESI BERJALAN (FREEZING)"
          value={`${activeSessionsCount} Gudang`}
          subValue="Operasional Mutasi Dikunci"
          icon={<Lock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="SESI SELESAI & RECONCILED"
          value={`${closedSessionsCount} Selesai`}
          subValue="Jurnal Penyesuaian Terposting"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="NET VALUASI SELISIH"
          value={`Rp ${(totalNetVariance / 1000).toLocaleString()} Rb`}
          subValue="Dampak Beban Selisih Stok"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua Sesi (${totalSessionsCount})` },
          { id: "active", label: `Sesi Berjalan / Freeze (${activeSessionsCount})` },
          { id: "closed", label: `Selesai Ditutup (${closedSessionsCount})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. DataTable Card */}
      <DnaDataTableCard
        title="Daftar Sesi Rekonsiliasi Stok Opname"
        description="Sesi audit hitung fisik persediaan per gudang fasilitas maklon."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Kode Sesi, Gudang, PIC Auditor..."
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Sesi & Tanggal</th>
                <th className="py-3 px-4">Gudang Fasilitas</th>
                <th className="py-3 px-4">Progress Audit Fisik</th>
                <th className="py-3 px-4 text-right">Valuasi Selisih (Rp)</th>
                <th className="py-3 px-4">Status Sesi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada sesi stok opname yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900">
                        {row.isInventoryFrozen && <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        <span>{row.sessionCode}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{row.sessionDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-slate-800">{row.warehouseName}</p>
                      <span className="text-[11px] text-slate-500">Lead: {row.auditorLead}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span>{row.countedSkus} / {row.totalSkus} SKU</span>
                          <span className="font-bold text-slate-700">{Math.round((row.countedSkus / row.totalSkus) * 100)}%</span>
                        </div>
                        <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${(row.countedSkus / row.totalSkus) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span className="text-emerald-600 font-bold">{row.matchedSkus} Cocok</span>
                          <span>•</span>
                          <span className={row.varianceSkus > 0 ? "text-rose-600 font-bold" : "text-slate-400"}>
                            {row.varianceSkus} Selisih
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className={`font-mono text-xs font-bold ${row.netVarianceValuation >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {row.netVarianceValuation >= 0 ? "+" : ""}Rp {row.netVarianceValuation.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-slate-400">Akun GL 510501</span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSession(row);
                            setIsCountModalOpen(true);
                          }}
                          title="Input Hitung Fisik (V1) & Rincian Selisih"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </DnaButton>
                        {row.status !== "RECONCILED_CLOSED" && (
                          <DnaButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedSession(row);
                              setIsCloseSessionModalOpen(true);
                            }}
                            title="Tutup & Rekonsiliasi PIN"
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-600" /> Tutup
                          </DnaButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* 5. Modal Buat Sesi Opname Baru */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Mulai Sesi Stok Opname Baru"
        description="Inisialisasi audit hitung fisik dan penguncian mutasi gudang (Freeze Policy)."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateSession}>
              Aktifkan Sesi & Freeze
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Pilih Gudang Target Audit *</label>
<DnaSelect 
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={newSessionForm.warehouseCode}
              onChange={(value) => {
                const val = value;
                const label = val === "WH-01" ? "WH-01 Gudang Bahan Baku" : val === "WH-02" ? "WH-02 Gudang Bahan Kemas" : "WH-03 Gudang Produk Jadi";
                setNewSessionForm(prev => ({ ...prev, warehouseCode: val, warehouseName: label }));
              }}
            >
              <option value="WH-01">WH-01 Gudang Bahan Baku</option>
              <option value="WH-02">WH-02 Gudang Bahan Kemas</option>
              <option value="WH-03">WH-03 Gudang Produk Jadi</option>
            </DnaSelect>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Ketua Tim Auditor (Lead PIC) *</label>
            <DnaInput
              type="text"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={newSessionForm.auditorLead}
              onChange={(e) => setNewSessionForm(prev => ({ ...prev, auditorLead: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Anggota Tim Auditor Lapangan</label>
            <DnaInput
              type="text"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={newSessionForm.auditorTeam}
              onChange={(e) => setNewSessionForm(prev => ({ ...prev, auditorTeam: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Catatan / Agenda Opname</label>
            <DnaTextarea
              rows={2}
              placeholder="Contoh: Stok Opname Triwulan I..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={newSessionForm.notes}
              onChange={(e) => setNewSessionForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Kebijakan Freeze Mutasi (Poin 68-70)</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Selama sesi berlangsung, transaksi Inbound (GRN), Outbound (SJ), dan Transfer di gudang terpilih akan ditangguhkan hingga sesi direkonsiliasi.
            </p>
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Input Hitung Fisik V1 (SCR-151) & Rekonsiliasi */}
      <DnaModal
        isOpen={isCountModalOpen}
        onClose={() => setIsCountModalOpen(false)}
        title={selectedSession ? `Hitung Fisik (V1): ${selectedSession.sessionCode}` : "Hitung Fisik"}
        description="Masukkan kuantitas fisik aktual hasil penghitungan rak / bin lapangan."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs font-semibold text-slate-600">
              {selectedSession?.countedSkus} / {selectedSession?.totalSkus} SKU Terhitung ({selectedSession?.varianceSkus} Memiliki Selisih)
            </div>
            <div className="flex items-center gap-2">
              <DnaButton variant="secondary" onClick={() => setIsCountModalOpen(false)}>
                Tutup
              </DnaButton>
              {selectedSession?.status !== "RECONCILED_CLOSED" && (
                <DnaButton
                  variant="primary"
                  onClick={() => setIsCloseSessionModalOpen(true)}
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1" />
                  Rekonsiliasi & Tutup Sesi
                </DnaButton>
              )}
            </div>
          </div>
        }
      >
        {selectedSession && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Kode Sesi Audit</span>
                  <p className="font-mono text-sm font-bold text-slate-900">{selectedSession.sessionCode}</p>
                </div>
                <div>{getStatusBadge(selectedSession.status)}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500">Gudang:</span>
                  <p className="font-semibold text-slate-800">{selectedSession.warehouseName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Lead Auditor:</span>
                  <p className="font-semibold text-slate-800">{selectedSession.auditorLead}</p>
                </div>
                <div>
                  <span className="text-slate-500">Net Valuasi Selisih:</span>
                  <p className={`font-mono font-bold ${selectedSession.netVarianceValuation >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    Rp {selectedSession.netVarianceValuation.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Table of items to count */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Barang & Lokasi Bin</th>
                    <th className="p-3 text-right">Stok Sistem</th>
                    <th className="p-3 text-right">Hitung Fisik (Input)</th>
                    <th className="p-3 text-right">Selisih Fisik</th>
                    <th className="p-3 text-right">Dampak Valuasi</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedSession.items.map((item) => (
                    <tr key={item.itemCode} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{item.itemName}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{item.itemCode}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-bold">{item.binLocation}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-700">
                        {item.systemQty} {item.unit}
                      </td>
                      <td className="p-3 text-right">
                        {selectedSession.status === "RECONCILED_CLOSED" ? (
                          <span className="font-mono font-bold text-slate-900">{item.actualQty} {item.unit}</span>
                        ) : (
                          <DnaInput
                            type="number"
                            className="w-24 text-right font-mono font-bold text-xs bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-blue-500"
                            defaultValue={item.actualQty !== null ? item.actualQty : item.systemQty}
                            onBlur={(e) => handleUpdateCountItem(item.itemCode, Number(e.target.value))}
                          />
                        )}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${item.differenceQty === 0 ? "text-slate-600" : item.differenceQty > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.differenceQty > 0 ? `+${item.differenceQty}` : item.differenceQty} {item.unit}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${item.varianceValuation === 0 ? "text-slate-600" : item.varianceValuation > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        Rp {item.varianceValuation.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {item.status === "MATCH" && <DnaBadge variant="success">COCOK</DnaBadge>}
                        {item.status === "DEFICIT" && <DnaBadge variant="danger">KURANG</DnaBadge>}
                        {item.status === "SURPLUS" && <DnaBadge variant="purple">LEBIH</DnaBadge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DnaTable>
            </div>
          </div>
        )}
      </DnaModal>

      {/* 7. Modal Import Spreadsheet V2 */}
      <DnaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Spreadsheet Opname (V2)"
        description="Unggah template file Excel / CSV hasil barcode scanner massal."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsImportModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => {
                toast.success(
                  "Import Berhasil Diproses",
                  "Sebanyak 12 SKU berhasil diimpor dan disinkronkan ke sesi hitung fisik."
                );
                setIsImportModalOpen(false);
              }}
            >
              Proses Import File
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-2 hover:border-blue-500 bg-slate-50">
            <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
            <p className="font-semibold text-slate-800">Tarik file Excel (.xlsx / .csv) ke sini</p>
            <p className="text-[11px] text-slate-500">atau klik untuk memilih file dari komputer</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="text-blue-900">
              <p className="font-bold">Belum punya template file?</p>
              <p className="text-[11px] text-blue-700">Unduh format resmi kolom hitung barcode.</p>
            </div>
            <DnaButton
              variant="secondary"
              size="sm"
              onClick={() => toast.info("Template Diunduh", "Format template-opname.xlsx berhasil disimpan.")}
            >
              Unduh Template
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* 8. Modal Otorisasi Manager PIN & Tutup Sesi */}
      <DnaModal
        isOpen={isCloseSessionModalOpen}
        onClose={() => setIsCloseSessionModalOpen(false)}
        title="Otorisasi PIN & Rekonsiliasi Sesi Opname"
        description="Penutupan sesi audit fisik akan otomatis membukukan selisih stok ke Jurnal Penyesuaian Akuntansi."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCloseSessionModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCloseAndReconcile}>
              <Check className="w-4 h-4 mr-1" />
              Otorisasi & Tutup Sesi
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Verifikasi Finansial & Pelepasan Status Freeze</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Setelah diverifikasi oleh Manager, kuantitas sistem akan disesuaikan dengan kuantitas fisik aktual, dan jurnal selisih (Beban Akun 510501) akan dibuat otomatis.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Masukkan PIN Otorisasi Manager *</label>
            <DnaInput
              type="password"
              placeholder="••••"
              maxLength={6}
              className="w-full text-center font-mono text-xl tracking-[0.5em] bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
            />
            <p className="text-[10px] text-slate-500 text-center">Default PIN Otorisasi: 1234</p>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
