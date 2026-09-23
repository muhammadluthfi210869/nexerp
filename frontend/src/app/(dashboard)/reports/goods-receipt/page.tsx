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
import { DnaCell } from "@/components/dna/cells/DnaCell";
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
          label="Total Fisik Diterima"
          value={totalDiterima.toLocaleString("id-ID")}
          icon={<PackageCheck className="w-5 h-5 text-indigo-600" />}
          variant="info"
          subtext="Total kuantitas item masuk"
        />
        <DnaStatCard
          label="Kondisi Bagus (Acc Pay)"
          value={totalBagus.toLocaleString("id-ID")}
          icon={<PackageCheck className="w-5 h-5 text-emerald-600" />}
          variant="success"
          subtext="Layak masuk stok & dibayar"
        />
        <DnaStatCard
          label="Kondisi Reject (No Pay)"
          value={totalReject.toLocaleString("id-ID")}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          variant={totalReject > 0 ? "warning" : "default"}
          subtext="Rusak / cacat / retur supplier"
        />
        <DnaStatCard
          label="Barang Gratis / Free"
          value={totalFree.toLocaleString("id-ID")}
          icon={<Gift className="w-5 h-5 text-amber-600" />}
          variant="warning"
          subtext="Sample gratis & toleransi bonus"
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery: search,
          onSearchChange: setSearch,
          searchPlaceholder: "Cari No. GRN, PO, Supplier, Bahan...",
          extraActions: (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="text-[11px] text-rose-600 hover:underline font-medium"
                >
                  Reset
                </button>
              )}
            </div>
          ),
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px] min-w-[1280px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 h-[40px] w-[110px]">Tanggal</th>
                <th className="px-3 py-3 h-[40px] w-[130px]">No. GRN</th>
                <th className="px-3 py-3 h-[40px] w-[130px]">No. PO</th>
                <th className="px-3 py-3 h-[40px]">Supplier</th>
                <th className="px-3 py-3 h-[40px]">Nama Barang</th>
                <th className="px-3 py-3 h-[40px] text-right w-[110px]">Qty Diterima</th>
                <th className="px-3 py-3 h-[40px] text-right w-[90px]">Bagus</th>
                <th className="px-3 py-3 h-[40px] text-right w-[90px]">Reject</th>
                <th className="px-3 py-3 h-[40px] text-right w-[90px]">Free</th>
                <th className="px-3 py-3 h-[40px]">Gudang</th>
                <th className="px-4 py-3 h-[40px] text-center w-[70px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <PackageCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data penerimaan barang yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/60 transition-colors group h-[48px]"
                  >
                    {/* Kolom 1: Tanggal */}
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                      {row.date}
                    </td>

                    {/* Kolom 2: No. GRN */}
                    <td className="px-3 py-2">
                      <DnaCell.Code value={row.grnNumber} />
                    </td>

                    {/* Kolom 3: No. PO */}
                    <td className="px-3 py-2">
                      <DnaCell.Code value={row.poNumber} />
                    </td>

                    {/* Kolom 4: Supplier */}
                    <td className="px-3 py-2 text-slate-800 font-medium truncate max-w-[160px]">
                      {row.supplier}
                    </td>

                    {/* Kolom 5: Nama Barang */}
                    <td className="px-3 py-2 text-slate-900 truncate max-w-[180px]">
                      {row.materialName}
                    </td>

                    {/* Kolom 6: Qty Diterima */}
                    <td className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={row.qtyReceived}
                        unit={row.unit}
                      />
                    </td>

                    {/* Kolom 7: Bagus */}
                    <td className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={row.qtyGood}
                        colorClass="text-emerald-700 font-semibold"
                      />
                    </td>

                    {/* Kolom 8: Reject */}
                    <td className="px-3 py-2 text-right">
                      {row.qtyReject > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {row.qtyReject.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>

                    {/* Kolom 9: Free */}
                    <td className="px-3 py-2 text-right">
                      {row.qtyFree > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          +{row.qtyFree.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>

                    {/* Kolom 10: Gudang */}
                    <td className="px-3 py-2 text-slate-700 truncate max-w-[150px]">
                      {row.warehouse}
                    </td>

                    {/* Kolom 11: Aksi */}
                    <td className="px-4 py-2 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(row)}
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
