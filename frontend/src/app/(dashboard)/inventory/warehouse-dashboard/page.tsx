"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  AlertTriangle,
  ArrowRightLeft,
  Package,
  Plus,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
  DnaBadge,
} from "@/components/dna";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

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

export default function WarehouseDashboard() {
  const router = useRouter();

  // 1. Fetch Catalog
  const { data: rawCatalog = [], isLoading: isCatalogLoading } = useQuery({
    queryKey: ["warehouse-catalog"],
    queryFn: async () => {
      const res = await api.get("/warehouse/catalog");
      return unwrapResponse<any[]>(res);
    },
  });

  // 2. Fetch Transactions
  const { data: rawTransactions = [], isLoading: isTxLoading } = useQuery({
    queryKey: ["warehouse-transactions"],
    queryFn: async () => {
      const res = await api.get("/warehouse/transactions");
      return unwrapResponse<any[]>(res);
    },
  });

  // 3. Process KPI metrics
  const catalogList = useMemo(() => Array.isArray(rawCatalog) ? rawCatalog : [], [rawCatalog]);
  const txList = useMemo(() => Array.isArray(rawTransactions) ? rawTransactions : [], [rawTransactions]);

  const totalItems = catalogList.length;
  const totalQuantity = useMemo(() => {
    return catalogList.reduce((acc, item) => acc + (Number(item.stock) || 0), 0);
  }, [catalogList]);

  const lowStocks: LowStockItem[] = useMemo(() => {
    return catalogList
      .filter((item) => (Number(item.stock) || 0) <= (Number(item.minStock) || 0))
      .map((item) => ({
        id: item.id,
        code: item.sku || item.code || item.id.slice(0, 8),
        name: item.name || "Material",
        currentStock: Number(item.stock) || 0,
        minStock: Number(item.minStock) || 0,
        unit: item.unit || "pcs",
        category: item.category || "General",
      }));
  }, [catalogList]);

  const recentMutations: RecentMutationItem[] = useMemo(() => {
    return txList.slice(0, 10).map((tx) => ({
      id: tx.id,
      date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("id-ID") : "-",
      mutationNo: tx.referenceNo || `TX-${tx.id.slice(0, 6)}`,
      type: (tx.type as any) || "TRANSFER",
      material: tx.inventory?.material?.name || tx.material?.name || "Bahan / Barang",
      qty: Number(tx.quantity) || 0,
      unit: tx.inventory?.material?.unit || tx.material?.unit || "pcs",
      warehouse: tx.inventory?.warehouse?.name || "Gudang Utama",
    }));
  }, [txList]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INBOUND":
        return <DnaBadge variant="success">Masuk</DnaBadge>;
      case "OUTBOUND":
        return <DnaBadge variant="critical">Keluar</DnaBadge>;
      case "TRANSFER":
        return <DnaBadge variant="info">Transfer</DnaBadge>;
      case "ADJUSTMENT":
        return <DnaBadge variant="warning">Penyesuaian</DnaBadge>;
      default:
        return <DnaBadge variant="default">{type}</DnaBadge>;
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
              onClick={() => router.push("/inventory/mutation")}
            >
              + Mutasi Antar Gudang
            </DnaButton>
            <DnaButton
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => router.push("/inventory/outbound")}
            >
              + Buat Pengiriman DO
            </DnaButton>
          </div>
        }
      />

      {/* 4 KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Jenis Barang"
          value={totalItems.toLocaleString("id-ID")}
          icon={Package}
          variant="default"
          subtext="Master item SKU terdaftar"
        />
        <DnaStatCard
          title="Total Kuantitas Stok"
          value={totalQuantity.toLocaleString("id-ID")}
          icon={Boxes}
          variant="success"
          subtext="Total unit di seluruh gudang"
        />
        <DnaStatCard
          title="Barang Low Stock"
          value={lowStocks.length.toLocaleString("id-ID")}
          icon={AlertTriangle}
          variant="danger"
          subtext="Segera terbitkan purchase request"
        />
        <DnaStatCard
          title="Mutasi Tercatat"
          value={txList.length.toLocaleString("id-ID")}
          icon={ArrowRightLeft}
          variant="warning"
          subtext="Pergerakan fisik barang tercatat"
        />
      </DnaKpiGrid>

      {/* 2 Parity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Peringatan Stok Minimum */}
        <DnaDataTableCard title="Peringatan Stok Rendah (Under Min Stock)">
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh>Kode</DnaTh>
                  <DnaTh>Nama Barang</DnaTh>
                  <DnaTh className="text-right">Stok Saat Ini</DnaTh>
                  <DnaTh className="text-right">Min Stok</DnaTh>
                  <DnaTh className="text-center">Status</DnaTh>
                  <DnaTh className="text-center">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {isCatalogLoading ? (
                  <DnaTableRow>
                    <DnaTd colSpan={6} className="text-center py-6 text-slate-500">
                      Memuat data katalog material...
                    </DnaTd>
                  </DnaTableRow>
                ) : lowStocks.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={6} className="text-center py-6 text-slate-500">
                      Seluruh material berada di atas batas minimum buffer stock.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  lowStocks.map((item) => (
                    <DnaTableRow key={item.id}>
                      <DnaTd className="font-semibold text-blue-600">{item.code}</DnaTd>
                      <DnaTd className="font-medium text-slate-900 truncate max-w-[140px]">{item.name}</DnaTd>
                      <DnaTd className="text-right font-bold text-rose-600 tabular-nums">
                        {item.currentStock.toLocaleString("id-ID")} {item.unit}
                      </DnaTd>
                      <DnaTd className="text-right text-slate-500 tabular-nums">
                        {item.minStock.toLocaleString("id-ID")} {item.unit}
                      </DnaTd>
                      <DnaTd className="text-center">
                        <DnaBadge variant="critical" className="text-[10px]">Perlu PR</DnaBadge>
                      </DnaTd>
                      <DnaTd className="text-center">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push("/pembelian/scm-pembelian/create")}
                        >
                          Order
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>

        {/* Table 2: Mutasi Terakhir */}
        <DnaDataTableCard title="Riwayat Mutasi & Pergerakan Terkini">
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh>Tanggal</DnaTh>
                  <DnaTh>No. Mutasi</DnaTh>
                  <DnaTh>Tipe</DnaTh>
                  <DnaTh>Barang</DnaTh>
                  <DnaTh className="text-right">Kuantitas</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {isTxLoading ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="text-center py-6 text-slate-500">
                      Memuat riwayat transaksi mutasi...
                    </DnaTd>
                  </DnaTableRow>
                ) : recentMutations.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="text-center py-6 text-slate-500">
                      Belum ada transaksi mutasi fisik yang tercatat.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  recentMutations.map((item) => (
                    <DnaTableRow key={item.id}>
                      <DnaTd className="text-slate-600 tabular-nums">{item.date}</DnaTd>
                      <DnaTd className="font-semibold text-slate-800">{item.mutationNo}</DnaTd>
                      <DnaTd>{getTypeBadge(item.type)}</DnaTd>
                      <DnaTd className="font-medium text-slate-900 truncate max-w-[140px]">{item.material}</DnaTd>
                      <DnaTd className={`text-right font-bold tabular-nums ${item.qty < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {item.qty > 0 ? `+${item.qty}` : item.qty} {item.unit}
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      </div>
    </div>
  );
}
