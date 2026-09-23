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
  useDnaToast
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

const FALLBACK_MUTATIONS: MutationItem[] = [
  { id: "1", datetime: "2026-09-08 09:30", docRef: "GR-PO-8821", itemCode: "RAW-NIC-01", itemName: "Niacinamide Pure Grade", sourceWarehouse: "Supplier PT Kimia", destWarehouse: "Gudang Bahan Baku CPKB", mutationType: "INBOUND_GR", qtyIn: 100, qtyOut: 0, balance: 250, unit: "Kg", pic: "Ahmad Staff Gudang", notes: "Penerimaan PO Inbound Bahan Baku" },
  { id: "2", datetime: "2026-09-08 11:15", docRef: "SPK-MIX-041", itemCode: "RAW-NIC-01", itemName: "Niacinamide Pure Grade", sourceWarehouse: "Gudang Bahan Baku CPKB", destWarehouse: "Line Mixing Produksi", mutationType: "OUTBOUND_SPK", qtyIn: 0, qtyOut: 25, balance: 225, unit: "Kg", pic: "Budi Operator Mixing", notes: "Pengeluaran Bahan Baku SPK Batch 2609-01" },
  { id: "3", datetime: "2026-09-07 14:00", docRef: "TRF-WH-009", itemCode: "PCK-BOT-30", itemName: "Botol Kaca Serum 30ml", sourceWarehouse: "Gudang Transit Karantina", destWarehouse: "Gudang Kemasan", mutationType: "TRANSFER_WH", qtyIn: 5000, qtyOut: 0, balance: 15000, unit: "Pcs", pic: "Siti Logistik", notes: "Transfer internal gudang pasca lulus QC APJ" },
  { id: "4", datetime: "2026-09-06 16:45", docRef: "OPN-202609-01", itemCode: "RAW-ALOE-05", itemName: "Aloe Vera Extract 10x", sourceWarehouse: "Sistem Inventory", destWarehouse: "Gudang Bahan Baku CPKB", mutationType: "ADJUSTMENT_OPNAME", qtyIn: 2, qtyOut: 0, balance: 48, unit: "Kg", pic: "Auditor Gudang", notes: "Koreksi hasil stock opname fisik mingguan" },
];

export default function MutasiStokReportPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMutation, setSelectedMutation] = useState<MutationItem | null>(null);

  const filteredMutations = useMemo(() => {
    return FALLBACK_MUTATIONS.filter((m) => {
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
  }, [searchQuery, activeTab]);

  const totalInbound = useMemo(() => FALLBACK_MUTATIONS.reduce((sum, m) => sum + m.qtyIn, 0), []);
  const totalOutbound = useMemo(() => FALLBACK_MUTATIONS.reduce((sum, m) => sum + m.qtyOut, 0), []);

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
          { id: "ALL", label: "Semua Mutasi", count: FALLBACK_MUTATIONS.length },
          { id: "INBOUND_GR", label: "Masuk (Inbound)", count: FALLBACK_MUTATIONS.filter((m) => m.mutationType === "INBOUND_GR").length },
          { id: "OUTBOUND_SPK", label: "Keluar (SPK)", count: FALLBACK_MUTATIONS.filter((m) => m.mutationType === "OUTBOUND_SPK").length },
          { id: "TRANSFER_WH", label: "Transfer Gudang", count: FALLBACK_MUTATIONS.filter((m) => m.mutationType === "TRANSFER_WH").length },
          { id: "ADJUSTMENT_OPNAME", label: "Penyesuaian", count: FALLBACK_MUTATIONS.filter((m) => m.mutationType === "ADJUSTMENT_OPNAME").length },
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
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 h-[40px] w-[130px]">Waktu</th>
                <th className="px-3 py-3 h-[40px] w-[130px]">No. Dokumen</th>
                <th className="px-3 py-3 h-[40px]">Barang & SKU</th>
                <th className="px-3 py-3 h-[40px] text-center w-[120px]">Tipe Mutasi</th>
                <th className="px-3 py-3 h-[40px]">Gudang Asal</th>
                <th className="px-3 py-3 h-[40px]">Gudang Tujuan</th>
                <th className="px-3 py-3 h-[40px] text-right w-[120px]">Pergerakan Qty</th>
                <th className="px-3 py-3 h-[40px] text-right w-[110px]">Saldo Akhir</th>
                <th className="px-4 py-3 h-[40px] text-right w-[70px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada catatan mutasi stok yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredMutations.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMutation(m)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* Kolom 1: Waktu */}
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                      {m.datetime}
                    </td>

                    {/* Kolom 2: No. Dokumen */}
                    <td className="px-3 py-2">
                      <DnaCell.Code value={m.docRef} />
                    </td>

                    {/* Kolom 3: Barang & SKU (1 Natural Pair) */}
                    <td className="px-3 py-2">
                      <DnaCell.DoubleText
                        primary={m.itemName}
                        secondary={m.itemCode}
                      />
                    </td>

                    {/* Kolom 4: Tipe Mutasi */}
                    <td className="px-3 py-2 text-center">
                      {getTypeBadge(m.mutationType)}
                    </td>

                    {/* Kolom 5: Gudang Asal */}
                    <td className="px-3 py-2 text-slate-800 truncate max-w-[150px]">
                      {m.sourceWarehouse}
                    </td>

                    {/* Kolom 6: Gudang Tujuan */}
                    <td className="px-3 py-2 text-slate-800 truncate max-w-[150px]">
                      {m.destWarehouse}
                    </td>

                    {/* Kolom 7: Pergerakan Qty */}
                    <td className="px-3 py-2 text-right">
                      {m.qtyIn > 0 ? (
                        <span className="font-semibold text-emerald-700 font-mono text-[12px]">
                          +{m.qtyIn.toLocaleString("id-ID")} {m.unit}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-700 font-mono text-[12px]">
                          -{m.qtyOut.toLocaleString("id-ID")} {m.unit}
                        </span>
                      )}
                    </td>

                    {/* Kolom 8: Saldo Akhir */}
                    <td className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={m.balance}
                        unit={m.unit}
                      />
                    </td>

                    {/* Kolom 9: Aksi */}
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMutation(m)}
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
                <div className="text-2xl font-bold font-mono">
                  {selectedMutation.qtyIn > 0 ? (
                    <span className="text-emerald-600">+{selectedMutation.qtyIn.toLocaleString("id-ID")} {selectedMutation.unit}</span>
                  ) : (
                    <span className="text-amber-600">-{selectedMutation.qtyOut.toLocaleString("id-ID")} {selectedMutation.unit}</span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  Saldo Sesudah Transaksi: <b className="text-slate-900 font-mono">{selectedMutation.balance.toLocaleString("id-ID")} {selectedMutation.unit}</b>
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
                  <span className="font-mono text-slate-800">{selectedMutation.datetime}</span>
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
