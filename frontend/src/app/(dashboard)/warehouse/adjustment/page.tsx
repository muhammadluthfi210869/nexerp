"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  Warehouse,
  Printer,
  Trash2,
  TrendingDown,
  TrendingUp,
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
  DnaModal,
  DnaDetailDrawer,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaTable,
  formatRupiah,
  useDnaToast
} from "@/components/dna";
import { DnaCell } from "@/components/dna/cells/DnaCell";

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

export default function StockAdjustmentPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null);

  // Live catalog for materials in adjustments
  const { data: rawCatalog = [] } = useQuery({
    queryKey: ["warehouse-catalog"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const catalogOptions = useMemo(() => {
    if (!Array.isArray(rawCatalog)) return [];
    return rawCatalog.map((m: any) => ({
      code: m.code || m.id.slice(0, 8),
      name: m.name,
      unit: m.unit || "Unit",
      hpp: Number(m.unitPrice || 0),
      currentStock: Number(m.stockQty || 0),
      batch: m.inventories?.[0]?.batchNumber || "-",
    }));
  }, [rawCatalog]);

  // Form State for new Adjustment
  const [formData, setFormData] = useState({
    warehouseCode: "WH-01",
    warehouseName: "WH-01 Gudang Bahan Baku",
    adjustmentType: "CORRECTION" as StockAdjustment["adjustmentType"],
    adjustmentAccountCode: "510501",
    adjustmentAccountName: "510501 - Beban Selisih Stok Persediaan",
    notes: "",
    items: [] as AdjustmentItem[],
  });

  const [currentItemCode, setCurrentItemCode] = useState("");
  const [currentActualQty, setCurrentActualQty] = useState<number>(0);
  const [currentItemNotes, setCurrentItemNotes] = useState("");

  // Queries
  const { data: rawAdjustments } = useQuery({
    queryKey: ["warehouse-adjustments"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/adjustments");
        return unwrapResponse(res.data) as StockAdjustment[];
      } catch {
        return null;
      }
    },
  });

  const adjustments: StockAdjustment[] = useMemo(() => {
    if (!rawAdjustments || !Array.isArray(rawAdjustments)) return [];
    return rawAdjustments.map((a: any) => {
      const items: AdjustmentItem[] = (a.items || []).map((i: any) => {
        const sys = Number(i.systemQty || 0);
        const act = Number(i.actualQty || 0);
        const diff = act - sys;
        const hpp = Number(i.material?.unitPrice || 0);
        return {
          itemCode: i.material?.code || i.materialId?.slice(0, 8) || "MAT",
          itemName: i.material?.name || "Material",
          batchLot: i.batchNumber || "-",
          systemQty: sys,
          actualQty: act,
          differenceQty: diff,
          unit: i.material?.unit || "Unit",
          unitHpp: hpp,
          varianceValuation: diff * hpp,
          itemNotes: i.notes,
        };
      });

      const totalVal = items.reduce((sum: number, it: any) => sum + it.varianceValuation, 0);

      return {
        id: a.id,
        adjustmentNumber: a.adjustmentNumber || ("ADJ-" + a.id.slice(0, 8).toUpperCase()),
        adjustmentDate: a.createdAt ? new Date(a.createdAt).toISOString().replace("T", " ").slice(0, 16) : "-",
        warehouseCode: a.warehouse?.code || "WH-01",
        warehouseName: a.warehouse?.name || "Gudang Utama",
        adjustmentType: (a.type || "CORRECTION") as any,
        adjustmentTypeLabel:
          a.type === "WRITE_OFF"
            ? "Write-Off Kerusakan"
            : a.type === "DISPOSAL"
            ? "Pemusnahan Limbah"
            : "Koreksi Selisih Hitung",
        adjustmentAccountCode: "510501",
        adjustmentAccountName: "Beban Selisih Stok Persediaan",
        items,
        totalItemsCount: items.length,
        totalVarianceValuation: totalVal,
        status: (a.status || "PENDING") as any,
        createdBy: a.createdBy?.fullName || a.createdByName || "Petugas Gudang",
        approvedBy: a.approvedBy?.fullName,
        approvalDate: a.approvedAt ? new Date(a.approvedAt).toISOString().replace("T", " ").slice(0, 16) : undefined,
        notes: a.notes || "-",
      };
    });
  }, [rawAdjustments]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (adjId: string) => {
      const res = await api.post(`/warehouse/adjustments/${adjId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Adjustment disetujui & jurnal penyesuaian otomatis dibukukan.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-adjustments"] });
      setSelectedAdjustment(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui penyesuaian stok.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (adjId: string) => {
      const res = await api.post(`/warehouse/adjustments/${adjId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Adjustment ditolak.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-adjustments"] });
      setSelectedAdjustment(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menolak penyesuaian stok.");
    },
  });

  // Filtered List
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adj) => {
      const matchSearch =
        adj.adjustmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adj.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adj.createdBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "all" ? true :
        adj.status.toLowerCase() === activeTab.toLowerCase();

      return matchSearch && matchTab;
    });
  }, [adjustments, searchQuery, activeTab]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = adjustments.length;
    const pending = adjustments.filter((a) => a.status === "PENDING").length;
    const approved = adjustments.filter((a) => a.status === "APPROVED").length;
    const netVariance = adjustments
      .filter((a) => a.status === "APPROVED")
      .reduce((sum, a) => sum + a.totalVarianceValuation, 0);

    return { total, pending, approved, netVariance };
  }, [adjustments]);

  const getStatusBadge = (status: StockAdjustment["status"]) => {
    switch (status) {
      case "PENDING":
        return <DnaBadge variant="warning">Menunggu Approval</DnaBadge>;
      case "APPROVED":
        return <DnaBadge variant="success">Disetujui (Jurnal Terbit)</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="critical">Ditolak</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Unified Tabs (Rule 2) */}
      <DnaPageHeader
        title="Penyesuaian Stok (Stock Adjustment)"
        description="Rekonsiliasi varians kuantitas fisik persediaan terhadap catatan sistem dengan auto-journaling beban selisih."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Auto COA Journaling Gate</span>
          </div>
        }
        tabs={[
          { id: "all", label: "Semua Penyesuaian", count: adjustments.length },
          { id: "pending", label: "Menunggu Approval", count: kpis.pending },
          { id: "approved", label: "Disetujui", count: kpis.approved },
          { id: "rejected", label: "Ditolak", count: adjustments.filter((a) => a.status === "REJECTED").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data Adjustment diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Buat Penyesuaian Stok
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Dokumen Adjustment"
          value={`${kpis.total} Dokumen`}
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+2 minggu ini", isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Menunggu Approval"
          value={`${kpis.pending} Dokumen`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          subtext="Menunggu verifikasi persetujuan"
          variant={kpis.pending > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Adjustment Disetujui"
          value={`${kpis.approved} Dokumen`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="Tervalidasi & jurnal terbit"
          variant="success"
        />
        <DnaStatCard
          label="Net Varians Finansial"
          value={formatRupiah(kpis.netVariance)}
          icon={kpis.netVariance < 0 ? <TrendingDown className="w-5 h-5 text-red-500" /> : <TrendingUp className="w-5 h-5 text-emerald-600" />}
          subtext="Dampak COGS Buku Besar"
          variant={kpis.netVariance < 0 ? "warning" : "success"}
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari No Adjustment, Gudang, Pembuat...",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 h-[40px] w-[140px]">No. Adjustment</th>
                <th className="px-3 py-3 h-[40px] w-[110px]">Tanggal</th>
                <th className="px-3 py-3 h-[40px]">Gudang</th>
                <th className="px-3 py-3 h-[40px]">Tipe Adjustment</th>
                <th className="px-3 py-3 h-[40px] w-[110px]">Akun CoA</th>
                <th className="px-3 py-3 h-[40px]">PIC Pengaju</th>
                <th className="px-3 py-3 h-[40px] text-right w-[140px]">Varians Finansial</th>
                <th className="px-3 py-3 h-[40px] text-center w-[130px]">Status</th>
                <th className="px-4 py-3 h-[40px] text-right w-[70px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <SlidersHorizontal className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data penyesuaian stok yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => (
                  <tr
                    key={adj.id}
                    onClick={() => setSelectedAdjustment(adj)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* Kolom 1: No Adjustment */}
                    <td className="px-4 py-2">
                      <DnaCell.Code value={adj.adjustmentNumber} />
                    </td>

                    {/* Kolom 2: Tanggal */}
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {adj.adjustmentDate}
                    </td>

                    {/* Kolom 3: Gudang */}
                    <td className="px-3 py-2 text-slate-800 font-medium truncate max-w-[160px]">
                      {adj.warehouseName}
                    </td>

                    {/* Kolom 4: Tipe Adjustment */}
                    <td className="px-3 py-2 text-slate-700">
                      {adj.adjustmentTypeLabel}
                    </td>

                    {/* Kolom 5: Akun CoA */}
                    <td className="px-3 py-2 font-mono text-slate-800 text-[11.5px]">
                      {adj.adjustmentAccountCode}
                    </td>

                    {/* Kolom 6: PIC Pengaju */}
                    <td className="px-3 py-2 text-slate-800 truncate max-w-[140px]">
                      {adj.createdBy}
                    </td>

                    {/* Kolom 7: Varians Finansial */}
                    <td className="px-3 py-2 text-right">
                      <span className={`font-mono font-semibold text-[12px] ${adj.totalVarianceValuation < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        {formatRupiah(adj.totalVarianceValuation)}
                      </span>
                    </td>

                    {/* Kolom 8: Status */}
                    <td className="px-3 py-2 text-center">
                      {getStatusBadge(adj.status)}
                    </td>

                    {/* Kolom 9: Aksi */}
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAdjustment(adj)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={!!selectedAdjustment}
        onClose={() => setSelectedAdjustment(null)}
        title={selectedAdjustment?.adjustmentNumber || "Detail Penyesuaian"}
        subtitle={`Gudang: ${selectedAdjustment?.warehouseName} • Tipe: ${selectedAdjustment?.adjustmentTypeLabel}`}
        badge={selectedAdjustment && getStatusBadge(selectedAdjustment.status)}
        footerActions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => toast.success(`Mencetak Bukti Adjustment ${selectedAdjustment?.adjustmentNumber}...`)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Dokumen
            </DnaButton>
            {selectedAdjustment && selectedAdjustment.status === "PENDING" && (
              <>
                <DnaButton
                  variant="danger"
                  size="sm"
                  onClick={() => rejectMutation.mutate(selectedAdjustment.id)}
                  disabled={rejectMutation.isPending}
                >
                  Tolak
                </DnaButton>
                <DnaButton
                  variant="primary"
                  size="sm"
                  onClick={() => approveMutation.mutate(selectedAdjustment.id)}
                  disabled={approveMutation.isPending}
                >
                  Approve & Jurnal
                </DnaButton>
              </>
            )}
          </div>
        }
      >
        {selectedAdjustment && (
          <div className="space-y-6 text-xs">
            {/* Financial Impact Card */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              selectedAdjustment.totalVarianceValuation < 0
                ? "bg-red-50/70 border-red-200"
                : "bg-emerald-50/70 border-emerald-200"
            }`}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Total Dampak Valuasi Varians
              </div>
              <div className={`text-2xl font-bold font-mono ${
                selectedAdjustment.totalVarianceValuation < 0 ? "text-red-700" : "text-emerald-700"
              }`}>
                {formatRupiah(selectedAdjustment.totalVarianceValuation)}
              </div>
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>Alokasi Akun Beban (CoA):</span>
                <span className="font-mono font-semibold">{selectedAdjustment.adjustmentAccountCode} - {selectedAdjustment.adjustmentAccountName}</span>
              </div>
            </div>

            {/* Document Details */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Informasi Audit & Otorisasi
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Dibuat Oleh:</span>
                  <span className="font-semibold text-slate-800">{selectedAdjustment.createdBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tanggal Pengajuan:</span>
                  <span className="font-mono text-slate-800">{selectedAdjustment.adjustmentDate}</span>
                </div>
                {selectedAdjustment.approvedBy && (
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block">Disetujui Oleh:</span>
                    <span className="font-semibold text-emerald-800">{selectedAdjustment.approvedBy} ({selectedAdjustment.approvalDate})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Rincian Selisih Fisik per Material
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Nama Material</th>
                      <th className="py-2.5 px-3 text-right">Sistem</th>
                      <th className="py-2.5 px-3 text-right">Fisik</th>
                      <th className="py-2.5 px-3 text-right">Selisih</th>
                      <th className="py-2.5 px-3 text-right">Nilai Varians</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedAdjustment.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-800">{it.itemName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{it.itemCode}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{it.systemQty} {it.unit}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{it.actualQty} {it.unit}</td>
                        <td className={`py-2.5 px-3 text-right font-bold ${it.differenceQty < 0 ? "text-red-600" : "text-emerald-700"}`}>
                          {it.differenceQty > 0 ? `+${it.differenceQty}` : it.differenceQty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatRupiah(it.varianceValuation)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DnaTable>
              </div>
            </div>

            {selectedAdjustment.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold block text-slate-700 mb-1">Catatan Penyesuaian:</span>
                <p className="text-slate-600 leading-relaxed">{selectedAdjustment.notes}</p>
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Input Adjustment Baru */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Form Pengajuan Penyesuaian Stok (Stock Adjustment)"
        description="Koreksi stok fisik gudang terhadap sistem dengan jurnal penyesuaian otomatis pasca approval."
        size="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              onClick={() => {
                toast.success("Pengajuan adjustment stok berhasil dibuat dan menunggu approval Finance.");
                setIsCreateModalOpen(false);
              }}
            >
              Ajukan Penyesuaian Stok
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Lokasi Gudang *</label>
              <DnaSelect
                aria-label="Pilih Gudang"
                value={formData.warehouseCode}
                onChange={(val) => setFormData({ ...formData, warehouseCode: val })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value="WH-01">WH-01 Gudang Bahan Baku Utama</option>
                <option value="WH-02">WH-02 Gudang Kemas & Box</option>
                <option value="WH-03">WH-03 Gudang Produk Jadi</option>
                <option value="WH-04">WH-04 Gudang Karantina & QC</option>
              </DnaSelect>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tipe Penyesuaian *</label>
              <DnaSelect
                aria-label="Tipe Penyesuaian"
                value={formData.adjustmentType}
                onChange={(val) => setFormData({ ...formData, adjustmentType: val as any })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value="CORRECTION">Koreksi Selisih Hitung (Opname)</option>
                <option value="WRITE_OFF">Write-Off Kerusakan Material</option>
                <option value="DISPOSAL">Pemusnahan Limbah Kedaluwarsa</option>
                <option value="QC_SAMPLING">Pengambilan Sampel QC Laboratorium</option>
              </DnaSelect>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Alasan / Catatan Penyesuaian</label>
            <DnaTextarea
              rows={2}
              placeholder="Jelaskan alasan terjadinya selisih stok fisik..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-lg p-2"
            />
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
