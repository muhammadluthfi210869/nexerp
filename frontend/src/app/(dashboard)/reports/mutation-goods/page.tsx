"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowRightLeft,
  Search,
  Warehouse,
  Download,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast,
} from "@/components/dna";

interface MutationRecord {
  id: string;
  date: string;
  docNumber: string;
  type: "INBOUND" | "OUTBOUND" | "TRANSFER" | "ADJUSTMENT" | "RETURN";
  warehouse: string;
  materialName: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
  unit: string;
  notes: string;
}

const INITIAL_MUTATIONS: MutationRecord[] = [
  {
    id: "MUT-001",
    date: "2026-09-01",
    docNumber: "GRN-2026-0001",
    type: "INBOUND",
    warehouse: "Gudang Bahan Baku",
    materialName: "Hairdensyl Complex",
    qtyIn: 500,
    qtyOut: 0,
    balance: 500,
    unit: "gr",
    notes: "Penerimaan PO-2026-0001 dari BASF Care"
  },
  {
    id: "MUT-002",
    date: "2026-09-02",
    docNumber: "TRF-2026-0001",
    type: "TRANSFER",
    warehouse: "Gudang Bahan Baku",
    materialName: "Hairdensyl Complex",
    qtyIn: 0,
    qtyOut: 50,
    balance: 450,
    unit: "gr",
    notes: "Mutasi keluar ke Gudang Kemasan"
  },
  {
    id: "MUT-003",
    date: "2026-09-02",
    docNumber: "TRF-2026-0001",
    type: "TRANSFER",
    warehouse: "Gudang Kemasan",
    materialName: "Hairdensyl Complex",
    qtyIn: 50,
    qtyOut: 0,
    balance: 50,
    unit: "gr",
    notes: "Mutasi masuk dari Gudang Bahan Baku"
  },
  {
    id: "MUT-004",
    date: "2026-09-03",
    docNumber: "DO-2026-0001",
    type: "OUTBOUND",
    warehouse: "Gudang Barang Jadi",
    materialName: "Day Cream SPF 30 (Farah Derma)",
    qtyIn: 0,
    qtyOut: 3000,
    balance: 0,
    unit: "pcs",
    notes: "Surat jalan DO ke klien Farah Derma Clinic"
  },
  {
    id: "MUT-005",
    date: "2026-09-04",
    docNumber: "ADJ-2026-0001",
    type: "ADJUSTMENT",
    warehouse: "Gudang Bahan Baku",
    materialName: "Hairdensyl Complex",
    qtyIn: 0,
    qtyOut: 2.5,
    balance: 447.5,
    unit: "gr",
    notes: "Penyesuaian susut panas mixing"
  },
  {
    id: "MUT-006",
    date: "2026-09-06",
    docNumber: "GRN-2026-0002",
    type: "INBOUND",
    warehouse: "Gudang Kemasan",
    materialName: "IPM (Isopropyl Myristate)",
    qtyIn: 1000,
    qtyOut: 0,
    balance: 1000,
    unit: "gr",
    notes: "Penerimaan PO-2026-0002 supplier Croda"
  },
  {
    id: "MUT-007",
    date: "2026-09-09",
    docNumber: "ADJ-2026-0002",
    type: "ADJUSTMENT",
    warehouse: "Gudang Kemasan",
    materialName: "IPM (Isopropyl Myristate)",
    qtyIn: 0,
    qtyOut: 15,
    balance: 985,
    unit: "gr",
    notes: "Pecah fisik kemasan luar"
  },
  {
    id: "MUT-008",
    date: "2026-09-13",
    docNumber: "ADJ-2026-0003",
    type: "ADJUSTMENT",
    warehouse: "Gudang Barang Jadi",
    materialName: "Niacinamide PC Grade",
    qtyIn: 5,
    qtyOut: 0,
    balance: 105,
    unit: "gr",
    notes: "Bonus sampel gratis dari supplier"
  }
];

export default function ReportMutationGoodsPage() {
  const { toast } = useDnaToast();
  const [mutations] = useState<MutationRecord[]>(INITIAL_MUTATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredData = useMemo(() => {
    return mutations.filter(item => {
      const matchSearch =
        item.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase());
      const matchWh = warehouseFilter === "ALL" || item.warehouse === warehouseFilter;
      const matchType = typeFilter === "ALL" || item.type === typeFilter;
      return matchSearch && matchWh && matchType;
    });
  }, [mutations, searchTerm, warehouseFilter, typeFilter]);

  const totalIn = filteredData.reduce((sum, m) => sum + m.qtyIn, 0);
  const totalOut = filteredData.reduce((sum, m) => sum + m.qtyOut, 0);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INBOUND":
        return <DnaBadge status="success">Masuk (Inbound)</DnaBadge>;
      case "OUTBOUND":
        return <DnaBadge status="danger">Keluar (Outbound)</DnaBadge>;
      case "TRANSFER":
        return <DnaBadge status="info">Mutasi Antar Gudang</DnaBadge>;
      case "ADJUSTMENT":
        return <DnaBadge status="warning">Penyesuaian Stok</DnaBadge>;
      case "RETURN":
        return <DnaBadge status="danger">Retur Barang</DnaBadge>;
      default:
        return <DnaBadge status="default">{type}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Laporan Mutasi Keluar & Masuk Barang"
        description="Buku jurnal riwayat pergerakan stok, transfer internal, penerimaan bahan, dan pengiriman barang jadi"
        actions={
          <DnaButton
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              toast({
                title: "Ekspor Mutasi Barang",
                description: "Mengunduh file Excel Laporan Mutasi Barang...",
                variant: "success"
              });
            }}
          >
            Ekspor Excel
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Transaksi Mutasi"
          value={filteredData.length.toString()}
          icon={ArrowRightLeft}
          variant="default"
          subtext="Pergerakan stok tercatat"
        />
        <DnaStatCard
          title="Total Kuantitas Masuk"
          value={totalIn.toLocaleString("id-ID")}
          icon={ArrowDownRight}
          variant="success"
          subtext="Inbound & transfer masuk"
        />
        <DnaStatCard
          title="Total Kuantitas Keluar"
          value={totalOut.toLocaleString("id-ID")}
          icon={ArrowUpRight}
          variant="danger"
          subtext="Outbound & pemakaian produksi"
        />
        <DnaStatCard
          title="Audit Trail Status"
          value="Tervalidasi"
          icon={RefreshCw}
          variant="info"
          subtext="Terhubung ke dokumen transaksi"
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no dokumen, nama barang, catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Gudang</option>
            <option value="Gudang Bahan Baku">Gudang Bahan Baku</option>
            <option value="Gudang Kemasan">Gudang Kemasan</option>
            <option value="Gudang Barang Jadi">Gudang Barang Jadi</option>
            <option value="Gudang Surabaya">Gudang Surabaya</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Tipe Transaksi</option>
            <option value="INBOUND">Penerimaan (Inbound)</option>
            <option value="OUTBOUND">Pengeluaran (Outbound)</option>
            <option value="TRANSFER">Mutasi Antar Gudang</option>
            <option value="ADJUSTMENT">Penyesuaian Stok</option>
          </select>
        </div>
      </div>

      {/* 1:1 Table (Exactly 11 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Mutasi Keluar & Masuk Barang">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">No. Dokumen</th>
                <th className="py-3 px-4">Tipe Transaksi</th>
                <th className="py-3 px-4">Gudang</th>
                <th className="py-3 px-4">Barang</th>
                <th className="py-3 px-4 text-right">Masuk</th>
                <th className="py-3 px-4 text-right">Keluar</th>
                <th className="py-3 px-4 text-right">Saldo Akhir</th>
                <th className="py-3 px-4 text-center">Satuan</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi mutasi sesuai filter
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 text-slate-600">{item.date}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{item.docNumber}</td>
                    <td className="py-3 px-4">{getTypeBadge(item.type)}</td>
                    <td className="py-3 px-4 text-slate-700">{item.warehouse}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.materialName}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      {item.qtyIn > 0 ? `+${item.qtyIn.toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-600">
                      {item.qtyOut > 0 ? `-${item.qtyOut.toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {item.balance.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 uppercase font-medium">{item.unit}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{item.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </div>
  );
}
