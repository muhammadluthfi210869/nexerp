"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaInput,
} from "@/components/dna";
import { PackageCheck, AlertTriangle, Gift, Search, Calendar, FileSpreadsheet, Eye, Printer } from "lucide-react";

interface GoodsReceiptReportItem {
  id: string;
  date: string;
  grnNumber: string;
  poNumber: string;
  supplier: string;
  materialName: string;
  qtyReceived: number;
  qtyGood: number;
  qtyReject: number;
  qtyFree: number;
  warehouse: string;
  officer: string;
  unit: string;
}

const REPORT_DATA: GoodsReceiptReportItem[] = [
  {
    id: "grn-1",
    date: "2026-09-13",
    grnNumber: "GRN-2026-0001",
    poNumber: "PO-2026-0001",
    supplier: "PT. Chemico Indonesia",
    materialName: "Niacinamide USP Grade 99%",
    qtyReceived: 200,
    qtyGood: 195,
    qtyReject: 5,
    qtyFree: 0,
    warehouse: "Gudang Bahan Baku (GBB)",
    officer: "Budi Santoso",
    unit: "KG"
  },
  {
    id: "grn-2",
    date: "2026-09-13",
    grnNumber: "GRN-2026-0001",
    poNumber: "PO-2026-0001",
    supplier: "PT. Chemico Indonesia",
    materialName: "Glycerin USP Pharma 99.7%",
    qtyReceived: 480,
    qtyGood: 480,
    qtyReject: 0,
    qtyFree: 20,
    warehouse: "Gudang Bahan Baku (GBB)",
    officer: "Budi Santoso",
    unit: "KG"
  },
  {
    id: "grn-3",
    date: "2026-09-15",
    grnNumber: "GRN-2026-0002",
    poNumber: "PO-2026-0004",
    supplier: "PT. Indesso Aroma",
    materialName: "Montanov 68 Emulsifier",
    qtyReceived: 52,
    qtyGood: 50,
    qtyReject: 2,
    qtyFree: 0,
    warehouse: "Gudang Bahan Baku (GBB)",
    officer: "Ahmad Fauzi",
    unit: "KG"
  },
  {
    id: "grn-4",
    date: "2026-09-15",
    grnNumber: "GRN-2026-0002",
    poNumber: "PO-2026-0004",
    supplier: "PT. Indesso Aroma",
    materialName: "Carbomer 940 Polymer",
    qtyReceived: 100,
    qtyGood: 100,
    qtyReject: 0,
    qtyFree: 5,
    warehouse: "Gudang Bahan Baku (GBB)",
    officer: "Ahmad Fauzi",
    unit: "KG"
  },
  {
    id: "grn-5",
    date: "2026-09-16",
    grnNumber: "GRN-2026-0003",
    poNumber: "PO-2026-0002",
    supplier: "PT. Multi Kemas Plastindo",
    materialName: "Botol Serum 30ml Pipet Emas",
    qtyReceived: 5000,
    qtyGood: 4950,
    qtyReject: 50,
    qtyFree: 100,
    warehouse: "Gudang Kemasan Primer (GKP)",
    officer: "Wahyu Hidayat",
    unit: "PCS"
  }
];

export default function GoodsReceiptReportPage() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<GoodsReceiptReportItem | null>(null);

  const filteredData = REPORT_DATA.filter((item) => {
    const matchSearch =
      item.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier.toLowerCase().includes(search.toLowerCase()) ||
      item.materialName.toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || item.date === dateFilter;
    return matchSearch && matchDate;
  });

  const totalDiterima = filteredData.reduce((acc, curr) => acc + curr.qtyReceived, 0);
  const totalBagus = filteredData.reduce((acc, curr) => acc + curr.qtyGood, 0);
  const totalReject = filteredData.reduce((acc, curr) => acc + curr.qtyReject, 0);
  const totalFree = filteredData.reduce((acc, curr) => acc + curr.qtyFree, 0);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Report Penerimaan Barang (GRN 3-Pilar)"
        description="Laporan audit fisik logistik inbound gudang maklon memisahkan kondisi Bagus (layak bayar), Reject (retur), dan Free sample."
        actions={
          <div className="flex gap-2">
            <DnaButton variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Cetak Laporan
            </DnaButton>
            <DnaButton variant="primary">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Ekspor Excel
            </DnaButton>
          </div>
        }
      />

      {/* KPI 3-Pilar */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Fisik Diterima"
          value={totalDiterima.toLocaleString("id-ID")}
          icon={PackageCheck}
          variant="default"
          subtext="Total kuantitas item masuk"
        />
        <DnaStatCard
          title="Kondisi Bagus (Acc Pay)"
          value={totalBagus.toLocaleString("id-ID")}
          icon={PackageCheck}
          variant="success"
          subtext="Layak masuk stok & dibayar"
        />
        <DnaStatCard
          title="Kondisi Reject (No Pay)"
          value={totalReject.toLocaleString("id-ID")}
          icon={AlertTriangle}
          variant="danger"
          subtext="Rusak / cacat / retur supplier"
        />
        <DnaStatCard
          title="Barang Gratis / Free"
          value={totalFree.toLocaleString("id-ID")}
          icon={Gift}
          variant="warning"
          subtext="Sample gratis & toleransi bonus"
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <DnaInput
              placeholder="Cari No. GRN, PO, Supplier, Bahan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="text-xs text-rose-600 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <span className="font-bold text-slate-800">{filteredData.length}</span> baris riwayat penerimaan
        </div>
      </div>

      {/* Tabel 1:1 G-SERP Clean Anti-Bloat (Tepat 11 Kolom) */}
      <DnaDataTableCard title="Log Rekapitulasi Penerimaan Fisik Barang">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">No. GRN</th>
                <th className="py-3 px-3">No. PO</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Nama Barang</th>
                <th className="py-3 px-3 text-right">Qty Diterima</th>
                <th className="py-3 px-3 text-right">Bagus</th>
                <th className="py-3 px-3 text-right">Reject</th>
                <th className="py-3 px-3 text-right">Free</th>
                <th className="py-3 px-3">Gudang</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada data penerimaan barang yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{row.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-sky-700 whitespace-nowrap">{row.grnNumber}</td>
                    <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap">{row.poNumber}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">{row.supplier}</td>
                    <td className="py-2.5 px-3 text-slate-800">{row.materialName}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {row.qtyReceived.toLocaleString("id-ID")} {row.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-700 whitespace-nowrap">
                      {row.qtyGood.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium whitespace-nowrap">
                      {row.qtyReject > 0 ? (
                        <span className="text-rose-600 font-bold">{row.qtyReject.toLocaleString("id-ID")}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium whitespace-nowrap">
                      {row.qtyFree > 0 ? (
                        <span className="text-amber-600 font-semibold">{row.qtyFree.toLocaleString("id-ID")}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{row.warehouse}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedItem(row)}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-sky-700 transition"
                        title="Lihat Detail Audit"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Audit */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-800">
                Detail Bukti Audit GRN: {selectedItem.grnNumber}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500 block">No. Purchase Order:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.poNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tanggal Penerimaan:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Supplier:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.supplier}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Petugas Penerima:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.officer}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="font-semibold text-slate-800">{selectedItem.materialName}</div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                    <span className="text-emerald-700 block font-semibold">Bagus</span>
                    <span className="text-sm font-bold text-emerald-800">{selectedItem.qtyGood} {selectedItem.unit}</span>
                  </div>
                  <div className="bg-rose-50 p-2 rounded border border-rose-100">
                    <span className="text-rose-700 block font-semibold">Reject</span>
                    <span className="text-sm font-bold text-rose-800">{selectedItem.qtyReject} {selectedItem.unit}</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded border border-amber-100">
                    <span className="text-amber-700 block font-semibold">Free</span>
                    <span className="text-sm font-bold text-amber-800">{selectedItem.qtyFree} {selectedItem.unit}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-3 bg-slate-50 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedItem(null)}>
                Tutup
              </DnaButton>
              <DnaButton variant="primary" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1.5" />
                Cetak Lembar GRN
              </DnaButton>
            </div>
          </div>
        </div>
      )}
    </DnaPageContainer>
  );
}
