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
import { DnaCell } from "@/components/dna/cells/DnaCell";

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
          label="Total Transaksi Mutasi"
          value={filteredData.length.toString()}
          icon={<ArrowRightLeft className="w-5 h-5 text-indigo-600" />}
          variant="info"
          subtext="Pergerakan stok tercatat"
        />
        <DnaStatCard
          label="Total Kuantitas Masuk"
          value={totalIn.toLocaleString("id-ID")}
          icon={<ArrowDownRight className="w-5 h-5 text-emerald-600" />}
          variant="success"
          subtext="Inbound & transfer masuk"
        />
        <DnaStatCard
          label="Total Kuantitas Keluar"
          value={totalOut.toLocaleString("id-ID")}
          icon={<ArrowUpRight className="w-5 h-5 text-rose-600" />}
          variant={totalOut > 0 ? "warning" : "default"}
          subtext="Outbound & pemakaian produksi"
        />
        <DnaStatCard
          label="Audit Trail Status"
          value="Tervalidasi"
          icon={<RefreshCw className="w-5 h-5 text-blue-600" />}
          variant="info"
          subtext="Terhubung ke dokumen transaksi"
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery: searchTerm,
          onSearchChange: setSearchTerm,
          searchPlaceholder: "Cari no dokumen, nama barang, catatan...",
          extraActions: (
            <div className="flex items-center gap-2">
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Semua Tipe Transaksi</option>
                <option value="INBOUND">Penerimaan (Inbound)</option>
                <option value="OUTBOUND">Pengeluaran (Outbound)</option>
                <option value="TRANSFER">Mutasi Antar Gudang</option>
                <option value="ADJUSTMENT">Penyesuaian Stok</option>
              </select>
            </div>
          ),
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px] min-w-[1250px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 h-[40px] w-[110px]">Tanggal</th>
                <th className="px-3 py-3 h-[40px] w-[140px]">No. Dokumen</th>
                <th className="px-3 py-3 h-[40px] text-center w-[130px]">Tipe Transaksi</th>
                <th className="px-3 py-3 h-[40px]">Gudang</th>
                <th className="px-3 py-3 h-[40px]">Barang</th>
                <th className="px-3 py-3 h-[40px] text-right w-[110px]">Masuk</th>
                <th className="px-3 py-3 h-[40px] text-right w-[110px]">Keluar</th>
                <th className="px-3 py-3 h-[40px] text-right w-[120px]">Saldo Akhir</th>
                <th className="px-4 py-3 h-[40px]">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada transaksi mutasi sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors group h-[48px]"
                  >
                    {/* Kolom 1: Tanggal */}
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                      {item.date}
                    </td>

                    {/* Kolom 2: No. Dokumen */}
                    <td className="px-3 py-2">
                      <DnaCell.Code value={item.docNumber} />
                    </td>

                    {/* Kolom 3: Tipe Transaksi */}
                    <td className="px-3 py-2 text-center">
                      {getTypeBadge(item.type)}
                    </td>

                    {/* Kolom 4: Gudang */}
                    <td className="px-3 py-2 text-slate-700 truncate max-w-[150px]">
                      {item.warehouse}
                    </td>

                    {/* Kolom 5: Barang */}
                    <td className="px-3 py-2 text-slate-900 font-medium truncate max-w-[180px]">
                      {item.materialName}
                    </td>

                    {/* Kolom 6: Masuk */}
                    <td className="px-3 py-2 text-right">
                      {item.qtyIn > 0 ? (
                        <span className="font-semibold text-emerald-700 font-mono text-[12px]">
                          +{item.qtyIn.toLocaleString("id-ID")} {item.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Kolom 7: Keluar */}
                    <td className="px-3 py-2 text-right">
                      {item.qtyOut > 0 ? (
                        <span className="font-semibold text-rose-700 font-mono text-[12px]">
                          -{item.qtyOut.toLocaleString("id-ID")} {item.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Kolom 8: Saldo Akhir */}
                    <td className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={item.balance}
                        unit={item.unit}
                      />
                    </td>

                    {/* Kolom 9: Keterangan */}
                    <td className="px-4 py-2 text-slate-600 truncate max-w-[200px]">
                      {item.notes}
                    </td>
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
