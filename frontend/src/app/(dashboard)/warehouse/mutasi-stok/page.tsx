"use client";

import React, { useState } from "react";
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
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface MutationItem {
  id: string;
  date: string;
  refNo: string;
  itemCode: string;
  itemName: string;
  type: "INBOUND" | "OUTBOUND_PROD" | "TRANSFER" | "ADJUSTMENT";
  qtyIn: number;
  qtyOut: number;
  balance: number;
  unit: string;
  operator: string;
  notes: string;
}

const FALLBACK_MUTATIONS: MutationItem[] = [
  { id: "1", date: "2026-09-08 09:30", refNo: "INB-PO-8821", itemCode: "RAW-NIC-01", itemName: "Niacinamide Pure Grade", type: "INBOUND", qtyIn: 100, qtyOut: 0, balance: 250, unit: "Kg", operator: "Ahmad Staff Gudang", notes: "Penerimaan PO Supplier PT Kimia Farma" },
  { id: "2", date: "2026-09-08 11:15", refNo: "REQ-MIX-041", itemCode: "RAW-NIC-01", itemName: "Niacinamide Pure Grade", type: "OUTBOUND_PROD", qtyIn: 0, qtyOut: 25, balance: 225, unit: "Kg", operator: "Budi Operator Mixing", notes: "Pengeluaran Bahan Baku SPK Batch 2609-01" },
  { id: "3", date: "2026-09-07 14:00", refNo: "TRF-WH-09", itemCode: "PCK-BOT-30", itemName: "Botol Kaca Serum 30ml", type: "TRANSFER", qtyIn: 5000, qtyOut: 0, balance: 15000, unit: "Pcs", operator: "Siti Logistik", notes: "Transfer dari Gudang Transit ke Gudang Filling" },
  { id: "4", date: "2026-09-06 16:45", refNo: "OPN-ADJ-002", itemCode: "PCK-BOX-01", itemName: "Folding Inner Box UV", type: "ADJUSTMENT", qtyIn: 0, qtyOut: 50, balance: 2200, unit: "Pcs", operator: "Dedi QC Stock", notes: "Penyesuaian Kerusakan Saat Handling" },
];

export default function MutasiStokReportPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredMutations = FALLBACK_MUTATIONS.filter((m) => {
    const matchSearch = m.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === "ALL" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Mutasi & Kartu Stok (Stock Movement Ledger)"
        description="Jejak audit lengkap pergerakan arus masuk (Inbound), keluar produksi (Outbound SPK), transfer antar gudang, dan adjustment opname."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Traceability Audit Realtime</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Mutasi Stok ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Mutasi Masuk (Inbound)"
          value="15.100 Unit"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+Inbound PO", isPositive: true }}
          subtext="Penerimaan Bahan Supplier"
          variant="success"
        />
        <DnaStatCard
          label="Total Pengeluaran Produksi"
          value="4.850 Unit"
          icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Konsumsi SPK", isPositive: false }}
          subtext="Mixing & Filling Batch"
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
          label="Penyesuaian / Scrap Opname"
          value="50 Unit"
          icon={<Layers className="w-5 h-5 text-rose-600" />}
          delta={{ value: "0.1% Shrinkage", isPositive: true }}
          subtext="Toleransi Normal Standar CPKB"
          variant="critical"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Kartu Log Mutasi Stok Fisik"
        badge={<DnaBadge variant="purple">{filteredMutations.length} Transaksi</DnaBadge>}
        customToolbar={
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">Semua Jenis Mutasi</option>
              <option value="INBOUND">Penerimaan Inbound</option>
              <option value="OUTBOUND_PROD">Pengeluaran Produksi</option>
              <option value="TRANSFER">Transfer Gudang</option>
              <option value="ADJUSTMENT">Penyesuaian Opname</option>
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Ref / Bahan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Waktu</th>
                <th className="px-3.5 py-3">No. Dokumen Ref</th>
                <th className="px-3.5 py-3">Kode SKU</th>
                <th className="px-3.5 py-3">Nama Bahan / Barang</th>
                <th className="px-3.5 py-3">Tipe Mutasi</th>
                <th className="px-3.5 py-3 text-right">Masuk</th>
                <th className="px-3.5 py-3 text-right">Keluar</th>
                <th className="px-3.5 py-3 text-right">Saldo Akhir</th>
                <th className="px-3.5 py-3">Petugas / Operator</th>
                <th className="px-3.5 py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMutations.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">{m.date}</td>
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-bold">{m.refNo}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600">{m.itemCode}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{m.itemName}</td>
                  <td className="px-3.5 py-2.5">
                    <DnaBadge
                      variant={
                        m.type === "INBOUND"
                          ? "success"
                          : m.type === "OUTBOUND_PROD"
                          ? "warning"
                          : m.type === "TRANSFER"
                          ? "info"
                          : "critical"
                      }
                    >
                      {m.type}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">
                    {m.qtyIn > 0 ? `+${m.qtyIn} ${m.unit}` : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">
                    {m.qtyOut > 0 ? `-${m.qtyOut} ${m.unit}` : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-black text-slate-900">
                    {m.balance} {m.unit}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700">{m.operator}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 text-[11px] max-w-xs truncate">{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
