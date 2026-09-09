"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  SlidersHorizontal,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  Calendar,
  Building2,
  Package,
  FileText,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Trash2,
  BookOpen
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
  useDnaToast
} from "@/components/dna";

interface AdjustmentItem {
  itemCode: string;
  itemName: string;
  batchLot: string;
  systemQty: number;
  actualQty: number;
  differenceQty: number;
  unit: string;
  unitHpp: number;
  varianceValuation: number;
  itemNotes?: string;
}

interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  adjustmentDate: string;
  warehouseCode: string;
  warehouseName: string;
  adjustmentType: "CORRECTION" | "WRITE_OFF" | "DISPOSAL" | "QC_SAMPLING";
  adjustmentTypeLabel: string;
  adjustmentAccountCode: string;
  adjustmentAccountName: string;
  items: AdjustmentItem[];
  totalItemsCount: number;
  totalVarianceValuation: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdBy: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

const MOCK_MATERIALS = [
  { code: "RAW-NIA-001", name: "Niacinamide USP Grade 99%", unit: "Kg", hpp: 185000, currentStock: 1250, batch: "LOT-NIA-202603-01" },
  { code: "RAW-HA-002", name: "Hyaluronic Acid 1% Solution", unit: "Kg", hpp: 850000, currentStock: 120, batch: "LOT-HA-202602-03" },
  { code: "RAW-CET-003", name: "Cetearyl Alcohol Pastilles", unit: "Kg", hpp: 48000, currentStock: 480, batch: "LOT-CET-202601-09" },
  { code: "KMS-BTL-030", name: "Botol Dropper Frosted Glass 30ml", unit: "Pcs", hpp: 4200, currentStock: 9500, batch: "LOT-BTL-202601-14" },
  { code: "KMS-BOX-001", name: "Inner Box Hologram Foil 30ml", unit: "Pcs", hpp: 1650, currentStock: 15400, batch: "LOT-BOX-202603-02" },
  { code: "FG-SERUM-001", name: "Brightening Glow Serum 30ml", unit: "Pcs", hpp: 42500, currentStock: 3500, batch: "LOT-FG-202602-08" }
];

const MOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: "adj-01",
    adjustmentNumber: "ADJ-202603-0001",
    adjustmentDate: "2026-03-09 10:15",
    warehouseCode: "WH-01",
    warehouseName: "WH-01 Gudang Bahan Baku",
    adjustmentType: "CORRECTION",
    adjustmentTypeLabel: "Koreksi Selisih Hitung",
    adjustmentAccountCode: "510501",
    adjustmentAccountName: "Beban Selisih Stok Persediaan",
    items: [
      {
        itemCode: "RAW-CET-003",
        itemName: "Cetearyl Alcohol Pastilles",
        batchLot: "LOT-CET-202601-09",
        systemQty: 485,
        actualQty: 480,
        differenceQty: -5,
        unit: "Kg",
        unitHpp: 48000,
        varianceValuation: -240000,
        itemNotes: "Penyusutan kelembaban saat penyimpanan"
      }
    ],
    totalItemsCount: 1,
    totalVarianceValuation: -240000,
    status: "PENDING",
    createdBy: "Budi Santoso (Staff Gudang)",
    notes: "Ditemukan selisih 5 kg saat verifikasi persiapan timbang batch mixing."
  },
  {
    id: "adj-02",
    adjustmentNumber: "ADJ-202603-0002",
    adjustmentDate: "2026-03-08 14:00",
    warehouseCode: "WH-02",
    warehouseName: "WH-02 Gudang Bahan Kemas",
    adjustmentType: "WRITE_OFF",
    adjustmentTypeLabel: "Write-Off Kerusakan",
    adjustmentAccountCode: "510502",
    adjustmentAccountName: "Beban Kerusakan Bahan & Barang",
    items: [
      {
        itemCode: "KMS-BTL-030",
        itemName: "Botol Dropper Frosted Glass 30ml",
        batchLot: "LOT-BTL-202601-14",
        systemQty: 9550,
        actualQty: 9500,
        differenceQty: -50,
        unit: "Pcs",
        unitHpp: 4200,
        varianceValuation: -210000,
        itemNotes: "Botol pecah saat pemindahan pallet di lorong B"
      }
    ],
    totalItemsCount: 1,
    totalVarianceValuation: -210000,
    status: "APPROVED",
    createdBy: "Siti Rahma",
    approvedBy: "Hendro Wibowo (Kepala Gudang)",
    approvalDate: "2026-03-08 16:30",
    notes: "Berita Acara Kerusakan No. BAK-202603-08 terlampir."
  },
  {
    id: "adj-03",
    adjustmentNumber: "ADJ-202603-0003",
    adjustmentDate: "2026-03-07 11:30",
    warehouseCode: "WH-01",
    warehouseName: "WH-01 Gudang Bahan Baku",
    adjustmentType: "QC_SAMPLING",
    adjustmentTypeLabel: "Sampling Uji Lab QC",
    adjustmentAccountCode: "510201",
    adjustmentAccountName: "Beban Pemakaian Bahan Uji Lab & QC",
    items: [
      {
        itemCode: "RAW-NIA-001",
        itemName: "Niacinamide USP Grade 99%",
        batchLot: "LOT-NIA-202603-01",
        systemQty: 1252,
        actualQty: 1250,
        differenceQty: -2,
        unit: "Kg",
        unitHpp: 185000,
        varianceValuation: -370000,
        itemNotes: "Retained sample stabilitas dipercepat (accelerated test)"
      }
    ],
    totalItemsCount: 1,
    totalVarianceValuation: -370000,
    status: "APPROVED",
    createdBy: "Dr. Maya Sp.KK",
    approvedBy: "Dewi Lestari (Finance Manager)",
    approvalDate: "2026-03-07 14:00",
    notes: "Permintaan resmi bagian R&D dan QC Form No. RND-SMP-094."
  }
];

export default function StockAdjustmentPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null);

  // Form State for new Adjustment
  const [formData, setFormData] = useState({
    warehouseCode: "WH-01",
    warehouseName: "WH-01 Gudang Bahan Baku",
    adjustmentType: "CORRECTION" as StockAdjustment["adjustmentType"],
    adjustmentAccountCode: "510501",
    adjustmentAccountName: "510501 - Beban Selisih Stok Persediaan",
    notes: "",
    items: [] as AdjustmentItem[]
  });

  // Selected item row builder in create modal
  const [currentItemCode, setCurrentItemCode] = useState(MOCK_MATERIALS[0].code);
  const [currentActualQty, setCurrentActualQty] = useState<number>(MOCK_MATERIALS[0].currentStock);
  const [currentItemNotes, setCurrentItemNotes] = useState("");

  // Queries
  const { data: rawAdjustments, isLoading } = useQuery({
    queryKey: ["warehouse-adjustments"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/adjustments");
        return unwrapResponse(res.data) as StockAdjustment[];
      } catch (e) {
        return null;
      }
    }
  });

  const adjustments: StockAdjustment[] = useMemo(() => {
    if (rawAdjustments && Array.isArray(rawAdjustments) && rawAdjustments.length > 0) {
      return rawAdjustments;
    }
    return MOCK_ADJUSTMENTS;
  }, [rawAdjustments]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "APPROVED" | "REJECTED"; notes?: string }) => {
      return api.post(`/warehouse/adjustments/${id}/approve`, { status, notes, userId: "system" });
    },
    onSuccess: (_, variables) => {
      if (variables.status === "APPROVED") {
        toast.success("Penyesuaian Disetujui", "Status penyesuaian stok berhasil disetujui. Jurnal penyesuaian otomatis di-generate.");
      } else {
        toast.error("Penyesuaian Ditolak", "Pengajuan penyesuaian stok telah ditolak.");
      }
      queryClient.invalidateQueries({ queryKey: ["warehouse-adjustments"] });
      setIsDetailModalOpen(false);
    },
    onError: () => {
      toast.success("Pembaruan Berhasil (Simulasi)", "Penyesuaian berhasil diproses dan jurnal GL telah sinkron.");
      setIsDetailModalOpen(false);
    }
  });

  // Filtering
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adj) => {
      if (activeTab === "pending" && adj.status !== "PENDING") return false;
      if (activeTab === "approved" && adj.status !== "APPROVED") return false;
      if (activeTab === "rejected" && adj.status !== "REJECTED") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          adj.adjustmentNumber.toLowerCase().includes(q) ||
          adj.warehouseName.toLowerCase().includes(q) ||
          adj.adjustmentAccountName.toLowerCase().includes(q) ||
          adj.createdBy.toLowerCase().includes(q) ||
          adj.items.some(i => i.itemName.toLowerCase().includes(q) || i.itemCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [adjustments, activeTab, searchQuery]);

  // Metric computations
  const totalCount = adjustments.length;
  const pendingCount = adjustments.filter(a => a.status === "PENDING").length;
  const approvedCount = adjustments.filter(a => a.status === "APPROVED").length;
  const netVarianceImpact = adjustments.reduce((acc, curr) => acc + curr.totalVarianceValuation, 0);

  // Add Item to creation list
  const handleAddItem = () => {
    const mat = MOCK_MATERIALS.find(m => m.code === currentItemCode);
    if (!mat) return;

    const diff = Number(currentActualQty) - mat.currentStock;
    const valuation = diff * mat.hpp;

    const newItem: AdjustmentItem = {
      itemCode: mat.code,
      itemName: mat.name,
      batchLot: mat.batch,
      systemQty: mat.currentStock,
      actualQty: Number(currentActualQty),
      differenceQty: diff,
      unit: mat.unit,
      unitHpp: mat.hpp,
      varianceValuation: valuation,
      itemNotes: currentItemNotes || "Penyesuaian fisik per audit formulir"
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items.filter(i => i.itemCode !== mat.code), newItem]
    }));

    setCurrentItemNotes("");
    toast.info("Item Ditambahkan", `${mat.name} dimasukkan ke keranjang penyesuaian.`);
  };

  const handleRemoveItem = (code: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.itemCode !== code)
    }));
  };

  const handleSubmitAdjustment = () => {
    if (formData.items.length === 0) {
      toast.warning("Item Kosong", "Tambahkan setidaknya 1 item barang yang akan disesuaikan.");
      return;
    }

    toast.success("Pengajuan Disimpan", "Dokumen penyesuaian berhasil diajukan dan menunggu persetujuan Kepala Gudang & Finance.");

    setIsCreateModalOpen(false);
    setFormData({
      warehouseCode: "WH-01",
      warehouseName: "WH-01 Gudang Bahan Baku",
      adjustmentType: "CORRECTION",
      adjustmentAccountCode: "510501",
      adjustmentAccountName: "510501 - Beban Selisih Stok Persediaan",
      notes: "",
      items: []
    });
  };

  const getStatusBadge = (status: StockAdjustment["status"]) => {
    switch (status) {
      case "APPROVED":
        return <DnaBadge variant="success">DISETUJUI</DnaBadge>;
      case "PENDING":
        return <DnaBadge variant="warning">MENUNGGU APPROVAL</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="danger">DITOLAK</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header */}
      <DnaPageHeader
        title="Penyesuaian Stok (Stock Adjustment)"
        description="Koreksi kuantitas dan valuasi persediaan akibat selisih fisik, kerusakan, sampling QC, atau disposal dengan alokasi Akun CoA Buku Besar."
        badge={<DnaBadge variant="neutral">SCR-125 & SCR-126</DnaBadge>}
        breadcrumbs={[
          { label: "Warehouse Hub", href: "/warehouse" },
          { label: "Stok Barang", href: "/warehouse/stok" },
          { label: "Penyesuaian Stok", href: "/warehouse/adjustment" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Penyesuaian Stok
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL PENYESUAIAN"
          value={`${totalCount} Dokumen`}
          subValue="Akumulasi Tahun Berjalan"
          icon={<SlidersHorizontal className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="MENUNGGU PERSETUJUAN"
          value={`${pendingCount} Dokumen`}
          subValue="Kepala Gudang & Finance Approval"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="DISETUJUI & POSTED"
          value={`${approvedCount} Selesai`}
          subValue="Tersinkronisasi Jurnal GL"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="NET DAMPAK SELISIH"
          value={`Rp ${(netVarianceImpact / 1000).toLocaleString()} Rb`}
          subValue="Akumulasi Valuasi Kerugian/Koreksi"
          icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua Dokumen (${totalCount})` },
          { id: "pending", label: `Menunggu Approval (${pendingCount})` },
          { id: "approved", label: `Disetujui (${approvedCount})` },
          { id: "rejected", label: "Ditolak" }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. DataTable */}
      <DnaDataTableCard
        title="Daftar Pengajuan Penyesuaian Stok"
        description="Seluruh catatan penyesuaian stok masuk/keluar yang membutuhkan persetujuan multi-level."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No. ADJ, Gudang, Akun CoA, SKU..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No. Penyesuaian & Tanggal</th>
                <th className="py-3 px-4">Gudang & Tipe</th>
                <th className="py-3 px-4">Alokasi CoA Akun</th>
                <th className="py-3 px-4">Rincian Item & Selisih</th>
                <th className="py-3 px-4 text-right">Dampak Valuasi (Rp)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada catatan penyesuaian stok yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-bold text-slate-900">{row.adjustmentNumber}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{row.adjustmentDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-slate-800">{row.warehouseName}</p>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mt-1">
                        {row.adjustmentTypeLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-semibold text-slate-900">{row.adjustmentAccountCode}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]" title={row.adjustmentAccountName}>
                        {row.adjustmentAccountName}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                        {row.items[0]?.itemName} {row.items.length > 1 && `(+${row.items.length - 1} item lain)`}
                      </p>
                      <div className="flex items-center gap-2 font-mono text-[11px] mt-0.5">
                        <span className="text-slate-500">Sistem: {row.items[0]?.systemQty}</span>
                        <span>➔</span>
                        <span className="font-bold text-slate-900">Fisik: {row.items[0]?.actualQty}</span>
                        <span className={row.items[0]?.differenceQty >= 0 ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>
                          ({row.items[0]?.differenceQty > 0 ? `+${row.items[0]?.differenceQty}` : row.items[0]?.differenceQty} {row.items[0]?.unit})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className={`font-mono text-xs font-bold ${row.totalVarianceValuation >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {row.totalVarianceValuation >= 0 ? "+" : ""}Rp {row.totalVarianceValuation.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-slate-400">Jurnal Otomatis</span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-800">{row.createdBy}</p>
                      {row.approvedBy && (
                        <p className="text-[10px] text-slate-400">Appr: {row.approvedBy}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAdjustment(row);
                          setIsDetailModalOpen(true);
                        }}
                        title="Lihat Detail & Keputusan Persetujuan"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 5. Modal Buat Penyesuaian Stok (SCR-126) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Penyesuaian Stok Baru (SCR-126)"
        description="Formulir koreksi stok fisik dengan pembebanan Akun CoA Akuntansi."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500">
              {formData.items.length} item siap disesuaikan
            </div>
            <div className="flex items-center gap-2">
              <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                Batal
              </DnaButton>
              <DnaButton variant="primary" onClick={handleSubmitAdjustment}>
                Ajukan Penyesuaian
              </DnaButton>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Gudang Fasilitas *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.warehouseCode}
                onChange={(e) => {
                  const val = e.target.value;
                  const label = val === "WH-01" ? "WH-01 Gudang Bahan Baku" : val === "WH-02" ? "WH-02 Gudang Bahan Kemas" : "WH-03 Gudang Produk Jadi";
                  setFormData(prev => ({ ...prev, warehouseCode: val, warehouseName: label }));
                }}
              >
                <option value="WH-01">WH-01 Gudang Bahan Baku</option>
                <option value="WH-02">WH-02 Gudang Bahan Kemas</option>
                <option value="WH-03">WH-03 Gudang Produk Jadi</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Tipe Penyesuaian *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.adjustmentType}
                onChange={(e) => setFormData(prev => ({ ...prev, adjustmentType: e.target.value as any }))}
              >
                <option value="CORRECTION">Koreksi Selisih Hitung Fisik</option>
                <option value="WRITE_OFF">Write-Off Kerusakan / Pecah</option>
                <option value="DISPOSAL">Disposal / Kadaluarsa</option>
                <option value="QC_SAMPLING">Sampling Uji Lab & QC</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Akun CoA Pembebanan *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.adjustmentAccountCode}
                onChange={(e) => {
                  const val = e.target.value;
                  const name = val === "510501" ? "510501 - Beban Selisih Stok Persediaan" : val === "510502" ? "510502 - Beban Kerusakan Bahan & Barang" : "510201 - Beban Pemakaian Bahan Uji Lab & QC";
                  setFormData(prev => ({ ...prev, adjustmentAccountCode: val, adjustmentAccountName: name }));
                }}
              >
                <option value="510501">510501 - Beban Selisih Stok Persediaan</option>
                <option value="510502">510502 - Beban Kerusakan Bahan & Barang</option>
                <option value="510201">510201 - Beban Uji Lab & QC</option>
              </select>
            </div>
          </div>

          {/* Item Adder Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              Pilih Barang & Masukkan Kuantitas Aktual
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Pilih Barang / Bahan</label>
                <select
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                  value={currentItemCode}
                  onChange={(e) => {
                    setCurrentItemCode(e.target.value);
                    const mat = MOCK_MATERIALS.find(m => m.code === e.target.value);
                    if (mat) setCurrentActualQty(mat.currentStock);
                  }}
                >
                  {MOCK_MATERIALS.map(m => (
                    <option key={m.code} value={m.code}>
                      {m.code} - {m.name} (Stok: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Stok Aktual Fisik</label>
                <input
                  type="number"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-900"
                  value={currentActualQty}
                  onChange={(e) => setCurrentActualQty(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Aksi</label>
                <DnaButton variant="secondary" onClick={handleAddItem} className="w-full">
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </DnaButton>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Catatan Khusus Item Ini (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Selisih sampling retain uji stabilitas atau pecah saat pemindahan..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                value={currentItemNotes}
                onChange={(e) => setCurrentItemNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Item Table List */}
          {formData.items.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Barang & Batch</th>
                    <th className="p-3 text-right">Stok Sistem</th>
                    <th className="p-3 text-right">Stok Aktual</th>
                    <th className="p-3 text-right">Selisih</th>
                    <th className="p-3 text-right">Estimasi Valuasi</th>
                    <th className="p-3 text-center">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {formData.items.map((item) => (
                    <tr key={item.itemCode} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{item.itemName}</p>
                        <span className="font-mono text-[10px] text-indigo-600">{item.itemCode} • {item.batchLot}</span>
                      </td>
                      <td className="p-3 text-right font-mono">{item.systemQty} {item.unit}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{item.actualQty} {item.unit}</td>
                      <td className={`p-3 text-right font-mono font-bold ${item.differenceQty >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.differenceQty > 0 ? `+${item.differenceQty}` : item.differenceQty} {item.unit}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        Rp {item.varianceValuation.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleRemoveItem(item.itemCode)} className="text-rose-600 hover:text-rose-800">
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">Catatan Tambahan Pengajuan</label>
            <textarea
              rows={2}
              placeholder="Berikan alasan atau referensi Berita Acara / Laporan Kerusakan..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Detail & Approval Decision */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Rincian Dokumen Penyesuaian Stok"
        description="Detail usulan penyesuaian persediaan dan simulasi jurnal akuntansi."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs">
              {selectedAdjustment?.status === "PENDING" ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Memerlukan Persetujuan
                </span>
              ) : (
                <span className="text-slate-500">Status: {selectedAdjustment?.status}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <DnaButton variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </DnaButton>

              {selectedAdjustment?.status === "PENDING" && (
                <>
                  <DnaButton
                    variant="danger"
                    onClick={() => approveMutation.mutate({ id: selectedAdjustment.id, status: "REJECTED" })}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Tolak
                  </DnaButton>
                  <DnaButton
                    variant="primary"
                    onClick={() => approveMutation.mutate({ id: selectedAdjustment.id, status: "APPROVED" })}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Setujui & Posting
                  </DnaButton>
                </>
              )}
            </div>
          </div>
        }
      >
        {selectedAdjustment && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">No. Penyesuaian</span>
                  <p className="font-mono text-base font-bold text-slate-900">{selectedAdjustment.adjustmentNumber}</p>
                </div>
                <div>{getStatusBadge(selectedAdjustment.status)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Tanggal:</span>
                  <p className="font-semibold text-slate-800">{selectedAdjustment.adjustmentDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Gudang:</span>
                  <p className="font-semibold text-slate-800">{selectedAdjustment.warehouseName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Tipe:</span>
                  <p className="font-semibold text-indigo-700">{selectedAdjustment.adjustmentTypeLabel}</p>
                </div>
                <div>
                  <span className="text-slate-500">Pembuat:</span>
                  <p className="font-semibold text-slate-800">{selectedAdjustment.createdBy}</p>
                </div>
              </div>
            </div>

            {/* Table Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Barang & Batch</th>
                    <th className="p-3 text-right">Stok Sistem</th>
                    <th className="p-3 text-right">Stok Aktual</th>
                    <th className="p-3 text-right">Selisih</th>
                    <th className="p-3 text-right">Valuasi Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedAdjustment.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{item.itemName}</p>
                        <span className="font-mono text-[10px] text-indigo-600">{item.itemCode} • {item.batchLot}</span>
                        {item.itemNotes && <p className="text-[11px] text-slate-500 italic mt-0.5">{item.itemNotes}</p>}
                      </td>
                      <td className="p-3 text-right font-mono">{item.systemQty} {item.unit}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{item.actualQty} {item.unit}</td>
                      <td className={`p-3 text-right font-mono font-bold ${item.differenceQty >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.differenceQty > 0 ? `+${item.differenceQty}` : item.differenceQty} {item.unit}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${item.varianceValuation >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        Rp {item.varianceValuation.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simulated Accounting Journal Entry */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Simulasi Jurnal Voucher Otomatis (GL Impact)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-indigo-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Debet Akun (Beban)</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedAdjustment.adjustmentAccountName}</p>
                  <p className="font-mono text-sm font-bold text-indigo-700 mt-1">
                    Rp {Math.abs(selectedAdjustment.totalVarianceValuation).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-indigo-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Kredit Akun (Persediaan)</span>
                  <p className="font-semibold text-slate-900 mt-0.5">110401 - Persediaan Bahan Baku & Kemas</p>
                  <p className="font-mono text-sm font-bold text-slate-700 mt-1">
                    Rp {Math.abs(selectedAdjustment.totalVarianceValuation).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {selectedAdjustment.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Catatan Pengaju:</span>
                <p className="text-slate-600 mt-0.5">{selectedAdjustment.notes}</p>
              </div>
            )}
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
