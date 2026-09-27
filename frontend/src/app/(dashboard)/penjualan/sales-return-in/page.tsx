"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaInput,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { RotateCcw, Package, Eye, CheckCircle2, Clock, Search, Warehouse } from "lucide-react";

interface SalesReturnItemRow {
  id: string;
  materialName: string;
  qtyOriginal: number;
  qtyReturned: number;
}

interface SalesReturnInRecord {
  id: string;
  orderNumber: string;
  returnDate: string;
  customerName: string;
  brandName: string;
  warehouseName: string;
  status: string;
  items: SalesReturnItemRow[];
  itemsCount: number;
  notes?: string;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function statusVariant(status: string) {
  const s = status.toUpperCase();
  if (s.includes("POTONG") || s.includes("CLOSE") || s.includes("SELESAI")) return "emerald" as const;
  if (s.includes("DRAFT") || s.includes("OPEN")) return "blue" as const;
  if (s.includes("VOID") || s.includes("BATAL")) return "danger" as const;
  return "amber" as const;
}

export default function SalesReturnInPage() {
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<SalesReturnInRecord | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<SalesReturnInRecord[]>({
    queryKey: ["sales-returns-in"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/returns");
        const list = res.data?.data || res.data || [];
        if (!Array.isArray(list)) return [];
        return list.map(
          (item: any): SalesReturnInRecord => ({
            id: item.id,
            orderNumber: item.so?.orderNumber || "—",
            returnDate: formatDate(item.returnDate),
            customerName: item.so?.lead?.clientName || item.so?.brandName || "—",
            brandName: item.so?.brandName || "—",
            warehouseName: item.warehouse?.name || "—",
            status: item.returnStatus || "—",
            items: Array.isArray(item.items)
              ? item.items.map((row: any) => ({
                  id: row.id,
                  materialName: row.material?.name || row.material?.code || "—",
                  qtyOriginal: Number(row.qtyOriginal ?? 0),
                  qtyReturned: Number(row.qtyReturned ?? 0),
                }))
              : [],
            itemsCount: Number(item.items?.length ?? 0),
            notes: item.notes || undefined,
          })
        );
      } catch {
        return [];
      }
    },
  });

  const filtered = data.filter(
    (d) =>
      d.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.brandName.toLowerCase().includes(search.toLowerCase())
  );

  const totalQtyReturned = data.reduce(
    (acc, d) => acc + d.items.reduce((sum, row) => sum + row.qtyReturned, 0),
    0
  );
  const uniqueCustomers = new Set(data.map((d) => d.customerName)).size;
  const uniqueWarehouses = new Set(data.map((d) => d.warehouseName)).size;

  if (isLoading) {
    return (
      <DnaPageContainer>
        <DnaPageHeader
          title="Penerimaan Barang Masuk: Retur Penjualan"
          subtitle="Pencatatan fisik barang masuk dari klaim retur pelanggan"
          breadcrumbs={[{ label: "Barang Masuk", href: "/inventory" }, { label: "Retur Penjualan" }]}
        />
        <DnaLoadingSkeleton rows={6} />
      </DnaPageContainer>
    );
  }

  if (isError) {
    return (
      <DnaPageContainer>
        <DnaPageHeader
          title="Penerimaan Barang Masuk: Retur Penjualan"
          subtitle="Pencatatan fisik barang masuk dari klaim retur pelanggan"
          breadcrumbs={[{ label: "Barang Masuk", href: "/inventory" }, { label: "Retur Penjualan" }]}
        />
        <DnaErrorState
          title="Gagal Memuat Retur Penjualan"
          message="Tidak dapat mengambil data dari /bussdev/returns."
          onRetry={() => refetch()}
        />
      </DnaPageContainer>
    );
  }

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Penerimaan Barang Masuk: Retur Penjualan"
        subtitle="Pencatatan fisik barang masuk dari klaim retur pelanggan, pemeriksaan QC karantina, dan pelepasan kembali ke stok atau scrap"
        breadcrumbs={[{ label: "Barang Masuk", href: "/inventory" }, { label: "Retur Penjualan" }]}
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Masuk Retur"
          value={`${data.length} Berkas`}
          icon={<RotateCcw className="w-4 h-4" />}
          delta={{ value: "Penerimaan Fisik Gudang", isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Total Qty Diretur"
          value={`${totalQtyReturned.toLocaleString("id-ID")} Unit`}
          icon={<Package className="w-4 h-4" />}
          delta={{ value: "Akumulasi qtyReturned", isPositive: false }}
          variant="warning"
        />
        <DnaStatCard
          label="Pelanggan Terdampak"
          value={`${uniqueCustomers} Klien`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          delta={{ value: "Dari Sales Order terkait", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Gudang Penerima"
          value={`${uniqueWarehouses} Gudang`}
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: "Lokasi karantina tercatat", isPositive: true }}
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Barang Masuk Retur Penjualan"
        count={filtered.length}
        totalItems={data.length}
        actions={
          <div className="w-64">
            <DnaInput
              placeholder="Cari no. SO, pelanggan, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        }
      >
        {data.length === 0 ? (
          <DnaEmptyState
            title="Belum Ada Retur Penjualan"
            description="Tidak ada dokumen retur penjualan (returnStatus) yang tercatat di sistem."
          />
        ) : (
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3">No. Sales Order</th>
                  <th className="px-4 py-3">Tanggal Retur</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Gudang</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-blue-600">{item.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{item.returnDate}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.customerName}</td>
                    <td className="px-4 py-3 text-slate-700">{item.warehouseName}</td>
                    <td className="px-4 py-3 text-center">
                      <DnaBadge variant={statusVariant(item.status)}>
                        {item.status.replace(/_/g, " ")}
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedRecord(item)}
                      >
                        Lihat
                      </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DnaTable>
          </div>
        )}
      </DnaDataTableCard>

      {/* Modal Detail */}
      <DnaModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Penerimaan Retur: ${selectedRecord?.orderNumber || ""}`}
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">No. Sales Order</span>
                <span className="tabular-nums font-bold text-slate-800">{selectedRecord.orderNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Tanggal Penerimaan Fisik</span>
                <span className="font-medium text-slate-800">{selectedRecord.returnDate}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Pelanggan</span>
                <span className="font-semibold text-slate-900">{selectedRecord.customerName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Brand</span>
                <span className="font-medium text-slate-800">{selectedRecord.brandName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Gudang Penerima</span>
                <span className="font-medium text-slate-800 inline-flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                  {selectedRecord.warehouseName}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Status Retur</span>
                <DnaBadge variant={statusVariant(selectedRecord.status)}>
                  {selectedRecord.status.replace(/_/g, " ")}
                </DnaBadge>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium mb-2">
                Rincian Item Diretur ({selectedRecord.itemsCount})
              </span>
              {selectedRecord.items.length === 0 ? (
                <p className="text-slate-500 text-xs italic">Belum ada item tercatat pada dokumen retur ini.</p>
              ) : (
                <DnaTable className="w-full text-left text-[12px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2 text-right">Qty Original</th>
                      <th className="px-3 py-2 text-right">Qty Diretur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedRecord.items.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 font-medium text-slate-800">{row.materialName}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {row.qtyOriginal.toLocaleString("id-ID")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold text-blue-600">
                          {row.qtyReturned.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DnaTable>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium">Catatan Fisik Penerimaan</span>
              <p className="text-slate-700 mt-1">{selectedRecord.notes || "—"}</p>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedRecord(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}