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
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Layers,
  Building2
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaSelect,
  DnaTable,
  DnaInput,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

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
];

export default function MutasiStokReportPage() {
  const toast = useDnaToast();
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMutations = useMemo(() => {
    return FALLBACK_MUTATIONS.filter((m) => {
      const matchSearch =
        m.docRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.itemName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchWh = warehouseFilter === "ALL" || m.sourceWarehouse.includes(warehouseFilter) || m.destWarehouse.includes(warehouseFilter);
      return matchSearch && matchWh;
    });
  }, [searchQuery, warehouseFilter]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Mutasi Barang & Kartu Stok (Goods Movement Ledger)"
        description="Jejak audit lengkap pergerakan arus masuk Inbound Goods Receipt, pengeluaran produksi SPK, transfer gudang, dan adjustment opname."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-167 & SCR-166: Full Traceability Audit</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Kartu Mutasi
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Laporan Mutasi ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Inbound (Penerimaan)"
          value="15.100 Unit"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+Inbound PO", isPositive: true }}
          subtext="Penerimaan Barang Supplier"
          variant="success"
        />
        <DnaStatCard
          label="Total Outbound (Produksi SPK)"
          value="4.850 Unit"
          icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Konsumsi Line", isPositive: false }}
          subtext="Pengeluaran Mixing & Filling"
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
          label="Adjustment Opname"
          value="0 Unit"
          icon={<Layers className="w-5 h-5 text-purple-600" />}
          delta={{ value: "Zero Variance", isPositive: true }}
          subtext="Akurasi Fisik vs Sistem 100%"
          variant="purple"
        />
      </DnaKpiGrid>

      {/* TABLE LIST FORMAT PERSIS SCR-167 */}
      <DnaDataTableCard
        title="Daftar Log Mutasi & Kartu Stok Fisik"
        badge={<DnaBadge variant="default">{filteredMutations.length} Transaksi Mutasi</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2.5">
<DnaSelect 
              value={warehouseFilter}
              onChange={setWarehouseFilter}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Gudang: * (Semua Gudang)</option>
              <option value="Bahan Baku">Gudang Bahan Baku</option>
              <option value="Kemasan">Gudang Kemasan</option>
              <option value="Barang Jadi">Gudang Barang Jadi</option>
            </DnaSelect>
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
              <DnaInput
                type="date"
                value={dateRange.start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
              />
              <span className="text-slate-400 font-semibold">s/d</span>
              <DnaInput
                type="date"
                value={dateRange.end}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
              />
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari Dokumen / SKU..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Tanggal & Waktu</th>
                <th className="px-3.5 py-3">No. Dokumen Ref</th>
                <th className="px-3.5 py-3">Kode Barang</th>
                <th className="px-3.5 py-3">Nama Barang</th>
                <th className="px-3.5 py-3">Gudang Asal</th>
                <th className="px-3.5 py-3">Gudang Tujuan / Line</th>
                <th className="px-3.5 py-3 text-right">Qty Masuk</th>
                <th className="px-3.5 py-3 text-right">Qty Keluar</th>
                <th className="px-3.5 py-3 text-right">Saldo Berjalan</th>
                <th className="px-3.5 py-3">Petugas / PIC</th>
                <th className="px-3.5 py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMutations.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{m.datetime}</td>
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-bold">{m.docRef}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600">{m.itemCode}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{m.itemName}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px]">{m.sourceWarehouse}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px]">{m.destWarehouse}</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">
                    {m.qtyIn > 0 ? `+${m.qtyIn} ${m.unit}` : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">
                    {m.qtyOut > 0 ? `-${m.qtyOut} ${m.unit}` : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-black text-slate-900">
                    {m.balance} {m.unit}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-medium">{m.pic}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 text-[11px] max-w-xs truncate">{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
