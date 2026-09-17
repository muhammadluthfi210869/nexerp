"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Warehouse,
  Boxes,
  AlertTriangle,
  ArrowRightLeft,
  Search,
  Package,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  Eye,
  Plus,
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

interface LowStockItem {
  id: string;
  code: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  category: string;
}

interface RecentMutationItem {
  id: string;
  date: string;
  mutationNo: string;
  type: "INBOUND" | "OUTBOUND" | "TRANSFER" | "ADJUSTMENT";
  material: string;
  qty: number;
  unit: string;
  warehouse: string;
}

const LOW_STOCK_DATA: LowStockItem[] = [
  { id: "1", code: "BBK-0002", name: "Niacinamide PC Grade", currentStock: 248, minStock: 300, unit: "gr", category: "Bahan Baku" },
  { id: "2", code: "KSR-0001", name: "Dus Inner Box Serum Day", currentStock: 1200, minStock: 3000, unit: "pcs", category: "Kemasan Sekunder" },
  { id: "3", code: "BBK-0044", name: "Cetyl Alcohol", currentStock: 15, minStock: 50, unit: "kg", category: "Bahan Baku" },
  { id: "4", code: "KPR-0012", name: "Tutup Pump Treatment 20mm", currentStock: 850, minStock: 2000, unit: "pcs", category: "Kemasan Primer" },
  { id: "5", code: "BPB-0005", name: "Lakban Fragile Merah 2 Inch", currentStock: 8, minStock: 24, unit: "roll", category: "Bahan Pembantu" }
];

const RECENT_MUTATIONS_DATA: RecentMutationItem[] = [
  { id: "1", date: "2026-09-14", mutationNo: "DO-2026-0004", type: "OUTBOUND", material: "Serum Niacinamide 10% 20ml", qty: -100, unit: "pcs", warehouse: "Gudang Barang Jadi" },
  { id: "2", date: "2026-09-13", mutationNo: "ADJ-2026-0003", type: "ADJUSTMENT", material: "Niacinamide PC Grade", qty: 5, unit: "gr", warehouse: "Gudang Barang Jadi" },
  { id: "3", date: "2026-09-12", mutationNo: "TRF-2026-0004", type: "TRANSFER", material: "Hairdensyl Complex", qty: -100, unit: "gr", warehouse: "Gudang Bahan Baku" },
  { id: "4", date: "2026-09-11", mutationNo: "DO-2026-0003", type: "OUTBOUND", material: "Moisturizer Gel Aloe 50gr", qty: -1500, unit: "pcs", warehouse: "Gudang Barang Jadi" },
  { id: "5", date: "2026-09-09", mutationNo: "ADJ-2026-0002", type: "ADJUSTMENT", material: "IPM (Isopropyl Myristate)", qty: -15, unit: "gr", warehouse: "Gudang Kemasan" }
];

export default function WarehouseDashboard() {
  const router = useRouter();
  const { toast } = useDnaToast();
  const [lowStocks] = useState<LowStockItem[]>(LOW_STOCK_DATA);
  const [recentMutations] = useState<RecentMutationItem[]>(RECENT_MUTATIONS_DATA);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INBOUND":
        return <DnaBadge status="success">Masuk</DnaBadge>;
      case "OUTBOUND":
        return <DnaBadge status="danger">Keluar</DnaBadge>;
      case "TRANSFER":
        return <DnaBadge status="info">Transfer</DnaBadge>;
      case "ADJUSTMENT":
        return <DnaBadge status="warning">Penyesuaian</DnaBadge>;
      default:
        return <DnaBadge status="default">{type}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Dashboard Departemen Gudang"
        description="Pusat kendali pergerakan persediaan, monitoring batas minimum buffer stock, dan logistik multi-gudang"
        actions={
          <div className="flex gap-2">
            <DnaButton
              variant="outline"
              icon={<ArrowRightLeft className="h-4 w-4" />}
              onClick={() => router.push("/goods-transfer/create")}
            >
              + Mutasi Antar Gudang
            </DnaButton>
            <DnaButton
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => router.push("/delivery-out/create")}
            >
              + Buat Pengiriman DO
            </DnaButton>
          </div>
        }
      />

      {/* 4 KPI Cards (1:1 Legacy G-SERP) */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Jenis Barang"
          value="6.116"
          icon={Package}
          variant="default"
          subtext="Master item SKU terdaftar"
        />
        <DnaStatCard
          title="Total Kuantitas Stok"
          value="3.561.786"
          icon={Boxes}
          variant="success"
          subtext="Total unit di seluruh gudang"
        />
        <DnaStatCard
          title="Barang Low Stock"
          value="394"
          icon={AlertTriangle}
          variant="danger"
          subtext="Segera terbitkan purchase request"
        />
        <DnaStatCard
          title="Mutasi Bulan Ini"
          value="319"
          icon={ArrowRightLeft}
          variant="warning"
          subtext="Pergerakan fisik barang tercatat"
        />
      </DnaKpiGrid>

      {/* 2 Clean Parity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Peringatan Stok Minimum */}
        <DnaDataTableCard title="Peringatan Stok Rendah (Under Min Stock)">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Nama Barang</th>
                  <th className="py-2.5 px-3 text-right">Stok Saat Ini</th>
                  <th className="py-2.5 px-3 text-right">Min Stok</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStocks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-blue-600">{item.code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 truncate max-w-[140px]">{item.name}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      {item.currentStock.toLocaleString()} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {item.minStock.toLocaleString()} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DnaBadge status="danger" className="text-[10px]">Perlu PR</DnaBadge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/purchase-request/create")}
                      >
                        Order
                      </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>

        {/* Table 2: Mutasi Terakhir */}
        <DnaDataTableCard title="Riwayat Mutasi & Pergerakan Terkini">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">No. Mutasi</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3">Barang</th>
                  <th className="py-2.5 px-3 text-right">Kuantitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMutations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600">{item.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.mutationNo}</td>
                    <td className="py-2.5 px-3">{getTypeBadge(item.type)}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 truncate max-w-[140px]">{item.material}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${item.qty < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {item.qty > 0 ? `+${item.qty}` : item.qty} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      </div>
    </div>
  );
}
