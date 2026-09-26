"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ArrowRightLeft,
  Calendar,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
  Layers,
  Warehouse,
  Eye,
  ArrowRight,
  FileText,
  CheckCircle2
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaDetailDrawer,
  useDnaToast,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { DnaCell } from "@/components/dna/cells/DnaCell";

interface MutationItem {
  id: string;
  datetime: string;
  docRef: string;
  itemCode: string;
  itemName: string;
  sourceWarehouse: string;
  destWarehouse: string;
  mutationType: "INBOUND_GR" | "OUTBOUND_SPK" | "TRANSFER_WH" | "ADJUSTMENT_OPNAME";
  qtyIn: number;
  qtyOut: number;
  balance: number;
  unit: string;
  pic: string;
  notes: string;
}

export default function MutasiStokReportPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMutation, setSelectedMutation] = useState<MutationItem | null>(null);

  const { data: rawTransactions = [], isLoading } = useQuery({
    queryKey: ["warehouse-transactions"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/transactions");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const liveMutations: MutationItem[] = useMemo(() => {
    if (!rawTransactions || !Array.isArray(rawTransactions)) return [];
    return rawTransactions.map((tx: any) => {
      const isOut = tx.type === "OUTBOUND";
      const isTrf = tx.type === "TRANSFER";
      const isAdj = tx.type === "ADJUSTMENT";
      const mutationType: MutationItem["mutationType"] = isOut
        ? "OUTBOUND_SPK"
        : isTrf
        ? "TRANSFER_WH"
        : isAdj
        ? "ADJUSTMENT_OPNAME"
        : "INBOUND_GR";

      const qty = Number(tx.quantity || 0);

      return {
        id: tx.id,
        datetime: tx.createdAt ? new Date(tx.createdAt).toISOString().replace("T", " ").slice(0, 16) : "-",
        docRef: tx.referenceNo || `TX-${tx.id.slice(0, 8).toUpperCase()}`,
        itemCode: tx.material?.code || "MAT-01",
        itemName: tx.material?.name || "Material",
        sourceWarehouse: isOut ? "Gudang Utama" : "Penerimaan / Vendor",
        destWarehouse: isOut ? "Produksi / Ekspedisi" : "Gudang Utama",
        mutationType,
        qtyIn: isOut ? 0 : qty,
        qtyOut: isOut ? qty : 0,
        balance: qty,
        unit: tx.material?.unit || "Kg",
        pic: tx.performedBy || "Petugas Gudang",
        notes: tx.notes || "-",
      };
    });
  }, [rawTransactions]);

  const filteredMutations = useMemo(() => {
    return liveMutations.filter((m) => {
      const matchSearch =
        m.docRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sourceWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.destWarehouse.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        m.mutationType === activeTab;

      return matchSearch && matchTab;
    });
  }, [liveMutations, searchQuery, activeTab]);

  const totalInbound = useMemo(() => liveMutations.reduce((sum, m) => sum + m.qtyIn, 0), [liveMutations]);
  const totalOutbound = useMemo(() => liveMutations.reduce((sum, m) => sum + m.qtyOut, 0), [liveMutations]);

  const getTypeBadge = (type: MutationItem["mutationType"]) => {
    switch (type) {
      case "INBOUND_GR":
        return <DnaBadge variant="success">Masuk (Inbound)</DnaBadge>;
      case "OUTBOUND_SPK":
        return <DnaBadge variant="warning">Keluar (SPK)</DnaBadge>;
      case "TRANSFER_WH":
        return <DnaBadge variant="info">Transfer</DnaBadge>;
      case "ADJUSTMENT_OPNAME":
        return <DnaBadge variant="purple">Penyesuaian</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Unified Tabs (Rule 2) */}
      <DnaPageHeader
        title="Laporan Mutasi Barang & Kartu Stok"
        description="Jejak audit lengkap arus keluar masuk material, pemakaian produksi SPK, transfer gudang, dan penyesuaian opname."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Full Traceability Ledger</span>
          </div>
        }
        tabs={[
          { id: "ALL", label: "Semua Mutasi", count: liveMutations.length },
          { id: "INBOUND_GR", label: "Masuk (Inbound)", count: liveMutations.filter((m) => m.mutationType === "INBOUND_GR").length },
          { id: "OUTBOUND_SPK", label: "Keluar (SPK)", count: liveMutations.filter((m) => m.mutationType === "OUTBOUND_SPK").length },
          { id: "TRANSFER_WH", label: "Transfer Gudang", count: liveMutations.filter((m) => m.mutationType === "TRANSFER_WH").length },
          { id: "ADJUSTMENT_OPNAME", label: "Penyesuaian", count: liveMutations.filter((m) => m.mutationType === "ADJUSTMENT_OPNAME").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Kartu Mutasi
            </DnaButton>
            <DnaButton variant="primary" size="sm" onClick={() => toast.success("Exporting Laporan Mutasi ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Volume Masuk (Inbound)"
          value={`${totalInbound.toLocaleString("id-ID")} Unit`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+Inbound PO", isPositive: true }}
          subtext="Penerimaan Bahan Supplier"
          variant="success"
        />
        <DnaStatCard
          label="Total Volume Keluar (SPK)"
          value={`${totalOutbound.toLocaleString("id-ID")} Unit`}
          icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Konsumsi Line", isPositive: false }}
          subtext="Pengeluaran Mixing & Kemas"
          variant="warning"
        />
        <DnaStatCard
          label="Transfer Antar Gudang"
          value="5.000 Unit"
          icon={<ArrowRightLeft className="w-5 h-5 text-blue-600" />}
          subtext="Relokasi Gudang Transit & Staging"
          variant="info"
        />
        <DnaStatCard
          label="Penyesuaian Opname"
          value="2 Unit"
          icon={<Layers className="w-5 h-5 text-purple-600" />}
          delta={{ value: "Audit Fisik", isPositive: true }}
          subtext="Akurasi Fisik vs Sistem Terjaga"
          variant="purple"
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari No Dokumen, SKU, nama material, gudang...",
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="px-4 py-3 h-[40px] w-[130px]">Waktu</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. Dokumen</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Barang & SKU</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Tipe Mutasi</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Gudang Asal</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Gudang Tujuan</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[120px]">Pergerakan Qty</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Saldo Akhir</DnaTh>
                <DnaTh className="px-4 py-3 h-[40px] text-right w-[70px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredMutations.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada catatan mutasi stok yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredMutations.map((m) => (
                  <DnaTableRow
                    key={m.id}
                    onClick={() => setSelectedMutation(m)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* Kolom 1: Waktu */}
                    <DnaTd className="px-4 py-2 text-slate-600 whitespace-nowrap">
                      {m.datetime}
                    </DnaTd>

                    {/* Kolom 2: No. Dokumen */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={m.docRef} />
                    </DnaTd>

                    {/* Kolom 3: Barang & SKU (1 Natural Pair) */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.DoubleText
                        primary={m.itemName}
                        secondary={m.itemCode}
                      />
                    </DnaTd>

                    {/* Kolom 4: Tipe Mutasi */}
                    <DnaTd className="px-3 py-2 text-center">
                      {getTypeBadge(m.mutationType)}
                    </DnaTd>

                    {/* Kolom 5: Gudang Asal */}
                    <DnaTd className="px-3 py-2 text-slate-800 truncate max-w-[150px]">
                      {m.sourceWarehouse}
                    </DnaTd>

                    {/* Kolom 6: Gudang Tujuan */}
                    <DnaTd className="px-3 py-2 text-slate-800 truncate max-w-[150px]">
                      {m.destWarehouse}
                    </DnaTd>

                    {/* Kolom 7: Pergerakan Qty */}
                    <DnaTd className="px-3 py-2 text-right">
                      {m.qtyIn > 0 ? (
                        <span className="font-semibold text-emerald-700 tabular-nums text-[12px]">
                          +{m.qtyIn.toLocaleString("id-ID")} {m.unit}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-700 tabular-nums text-[12px]">
                          -{m.qtyOut.toLocaleString("id-ID")} {m.unit}
                        </span>
                      )}
                    </DnaTd>

                    {/* Kolom 8: Saldo Akhir */}
                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={m.balance}
                        unit={m.unit}
                      />
                    </DnaTd>

                    {/* Kolom 9: Aksi */}
                    <DnaTd className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMutation(m)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={!!selectedMutation}
        onClose={() => setSelectedMutation(null)}
        title={selectedMutation?.docRef || "Detail Log Mutasi"}
        subtitle={`SKU: ${selectedMutation?.itemCode} • ${selectedMutation?.itemName}`}
        badge={selectedMutation && getTypeBadge(selectedMutation.mutationType)}
        footerActions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => toast.success(`Mencetak Bukti Mutasi ${selectedMutation?.docRef}...`)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Bukti Mutasi
            </DnaButton>
          </div>
        }
      >
        {selectedMutation && (
          <div className="space-y-6 text-xs">
            {/* Movement Quantity Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Volume Transaksi Mutasi
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold tabular-nums">
                  {selectedMutation.qtyIn > 0 ? (
                    <span className="text-emerald-600">+{selectedMutation.qtyIn.toLocaleString("id-ID")} {selectedMutation.unit}</span>
                  ) : (
                    <span className="text-amber-600">-{selectedMutation.qtyOut.toLocaleString("id-ID")} {selectedMutation.unit}</span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  Saldo Sesudah Transaksi: <b className="text-slate-900 tabular-nums">{selectedMutation.balance.toLocaleString("id-ID")} {selectedMutation.unit}</b>
                </div>
              </div>
            </div>

            {/* Logistics Route Information */}
            <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Jalur Aliran Barang
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Sumber / Asal:</span>
                  <span className="font-semibold text-slate-800">{selectedMutation.sourceWarehouse}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tujuan Alokasi:</span>
                  <span className="font-semibold text-blue-700">{selectedMutation.destWarehouse}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Waktu Pencatatan:</span>
                  <span className="tabular-nums text-slate-800">{selectedMutation.datetime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Operator / PIC:</span>
                  <span className="font-semibold text-slate-800">{selectedMutation.pic}</span>
                </div>
              </div>
            </div>

            {/* Audit Notes */}
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1">
              <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Catatan Transaksi & Audit Log
              </div>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                {selectedMutation.notes}
              </p>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </DnaPageContainer>
  );
}
