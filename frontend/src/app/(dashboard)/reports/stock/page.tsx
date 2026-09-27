"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Boxes,
  Download,
  PackageCheck,
  AlertTriangle,
  Gift,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";

interface StockRecord {
  id: string;
  code: string;
  name: string;
  warehouse: string;
  goodQty: number;
  rejectQty: number;
  freeQty: number;
  totalQty: number;
}

export default function ReportStockPage() {
  const { toast } = useDnaToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports-stock"],
    queryFn: async () => {
      const res = await api.get("/reports/stock");
      return res.data;
    },
  });

  const stocks: StockRecord[] = useMemo(() => {
    const raw = Array.isArray(data?.data) ? data.data : [];
    return raw.map((it: any) => {
      const good = Number(it.qty_bagus ?? 0);
      const reject = Number(it.qty_reject ?? 0);
      const free = Number(it.qty_free ?? 0);
      return {
        id: `${it.goods_id}-${it.warehouse_name}`,
        code: it.goods_code || "-",
        name: it.goods_name || "-",
        warehouse: it.warehouse_name || "-",
        goodQty: good,
        rejectQty: reject,
        freeQty: free,
        totalQty: good + reject + free,
      };
    });
  }, [data]);

  const warehouseOptions = useMemo(
    () => Array.from(new Set(stocks.map((s) => s.warehouse))).sort(),
    [stocks],
  );

  const filteredData = stocks.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.warehouse.toLowerCase().includes(q);
    const matchWh = warehouseFilter === "ALL" || item.warehouse === warehouseFilter;
    return matchSearch && matchWh;
  });

  const totalPhysical = filteredData.reduce((sum, s) => sum + s.totalQty, 0);
  const totalGood = filteredData.reduce((sum, s) => sum + s.goodQty, 0);
  const totalReject = filteredData.reduce((sum, s) => sum + s.rejectQty, 0);
  const totalFree = filteredData.reduce((sum, s) => sum + s.freeQty, 0);

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="Laporan Posisi Stok Gudang (Stock Balance)"
        description="Monitoring kuantitas fisik persediaan bahan baku, kemasan, dan produk jadi lintas seluruh fasilitas gudang"
        actions={
          <DnaButton
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              toast({
                title: "Ekspor Laporan Stok",
                description: "Mengunduh file Excel Laporan Stok Real-Time...",
                variant: "success"
              });
            }}
          >
            Ekspor Excel
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Fisik Persediaan"
          value={totalPhysical.toLocaleString("id-ID")}
          icon={<Boxes className="w-5 h-5 text-indigo-600" />}
          variant="info"
          subtext="Total seluruh kuantitas di gudang"
        />
        <DnaStatCard
          label="Stok Bagus (Siap Pakai/Kirim)"
          value={totalGood.toLocaleString("id-ID")}
          icon={<PackageCheck className="w-5 h-5 text-emerald-600" />}
          variant="success"
          subtext="Lolos QC dan layak proses"
        />
        <DnaStatCard
          label="Stok Cacat / Reject"
          value={totalReject.toLocaleString("id-ID")}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          variant={totalReject > 0 ? "warning" : "default"}
          subtext="Rusak/reject dalam penampungan"
        />
        <DnaStatCard
          label="Stok Gratis / Free"
          value={totalFree.toLocaleString("id-ID")}
          icon={<Gift className="w-5 h-5 text-amber-600" />}
          variant="warning"
          subtext="Bonus/sampel bebas bayar"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        toolbarProps={{
          searchQuery: searchTerm,
          onSearchChange: setSearchTerm,
          searchPlaceholder: "Cari kode, nama barang, gudang...",
          extraActions: (
            <div className="flex items-center gap-2">
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Semua Gudang</option>
                {warehouseOptions.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            </div>
          ),
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="px-4 py-3 h-[40px] w-[130px]">Kode Barang</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Nama Barang</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Gudang</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[120px]">Stok Bagus</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Stok Cacat</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Stok Free</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[120px]">Total Fisik</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data posisi stok...
                  </DnaTd>
                </DnaTableRow>
              ) : isError ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-12 text-center">
                    <p className="text-rose-600 mb-3">Gagal memuat laporan stok dari server.</p>
                    <DnaButton variant="secondary" size="sm" onClick={() => refetch()}>
                      Coba Lagi
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ) : filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada barang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item) => (
                  <DnaTableRow
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors group h-[48px]"
                  >
                    <DnaTd className="px-4 py-2">
                      <DnaCell.Code value={item.code} />
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-slate-900 font-medium truncate max-w-[240px]">
                      {item.name}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-slate-800 truncate max-w-[180px]">
                      {item.warehouse}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={item.goodQty}
                        colorClass="text-emerald-700 font-semibold"
                      />
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      {item.rejectQty > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {item.rejectQty.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      {item.freeQty > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {item.freeQty.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.Number value={item.totalQty} />
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </div>
  );
}