"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CircleDollarSign,
  Search,
  Download,
  Boxes,
  TrendingUp,
  ShieldCheck,
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
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

interface ValuationRecord {
  id: string;
  code: string;
  name: string;
  unit: string;
  physicalQty: number;
  avgHpp: number;
  totalValuation: number;
}

export default function ReportStockValuationPage() {
  const { toast } = useDnaToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports-stock-valuation"],
    queryFn: async () => {
      const res = await api.get("/reports/stock-valuation");
      return res.data;
    },
  });

  const rows: ValuationRecord[] = useMemo(() => {
    const raw = Array.isArray(data?.data) ? data.data : [];
    return raw.map((it: any) => ({
      id: it.goods_id,
      code: it.goods_code || "-",
      name: it.goods_name || "-",
      unit: it.unit || "",
      physicalQty: Number(it.qty ?? 0),
      avgHpp: Number(it.unit_cost ?? 0),
      totalValuation: Number(it.total_value ?? 0),
    }));
  }, [data]);

  const valuationMethod: string = data?.data?.[0]?.valuation_method || "AVERAGE";

  const filteredData = rows.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
    );
  });

  const totalValuation = filteredData.reduce((sum, v) => sum + v.totalValuation, 0);
  const totalPhysicalItems = filteredData.reduce((sum, v) => sum + v.physicalQty, 0);

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="Laporan Valuasi Persediaan (Stock Valuation)"
        description="Analisis nilai moneter kapital persediaan aktif berdasarkan metode biaya yang dipakai (Moving Average / FIFO)"
        actions={
          <DnaButton
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              toast({
                title: "Ekspor Valuasi Stok",
                description: "Mengunduh file Excel Laporan Valuasi Persediaan...",
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
          label="Total Nilai Persediaan (Asset)"
          value={formatCurrency(totalValuation)}
          icon={CircleDollarSign}
          variant="default"
          subtext="Total aset persediaan di neraca"
        />
        <DnaStatCard
          label="Total Kuantitas Fisik"
          value={totalPhysicalItems.toLocaleString("id-ID")}
          icon={Boxes}
          variant="success"
          subtext="Akumulasi seluruh lot material & produk"
        />
        <DnaStatCard
          label="Metode Kalkulasi HPP"
          value={valuationMethod === "FIFO" ? "FIFO" : "Moving Average"}
          icon={TrendingUp}
          variant="info"
          subtext="Sesuai parameter laporan backend"
        />
        <DnaStatCard
          label="Item Ternilai"
          value={`${filteredData.length} Barang`}
          icon={ShieldCheck}
          variant="default"
          subtext="Barang dengan harga satuan tercatat"
        />
      </DnaKpiGrid>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <DnaDataTableCard title="Daftar Valuasi Nilai Persediaan">
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-12 text-center">#</DnaTh>
                <DnaTh className="py-3 px-4">Kode Barang</DnaTh>
                <DnaTh className="py-3 px-4">Nama Barang</DnaTh>
                <DnaTh className="py-3 px-4 text-right">Qty Fisik</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Satuan</DnaTh>
                <DnaTh className="py-3 px-4 text-right">HPP Satuan (Rp)</DnaTh>
                <DnaTh className="py-3 px-4 text-right">Total Nilai (Rp)</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat data valuasi persediaan...
                  </DnaTd>
                </DnaTableRow>
              ) : isError ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-8 text-center">
                    <p className="text-rose-600 mb-3">Gagal memuat laporan valuasi dari server.</p>
                    <DnaButton variant="secondary" size="sm" onClick={() => refetch()}>
                      Coba Lagi
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ) : filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data valuasi persediaan sesuai filter
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-3 px-4 font-semibold text-blue-600">{item.code}</DnaTd>
                    <DnaTd className="py-3 px-4 font-medium text-slate-900">{item.name}</DnaTd>
                    <DnaTd className="py-3 px-4 text-right font-bold text-slate-900">
                      {item.physicalQty.toLocaleString("id-ID")}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center text-slate-600 uppercase font-medium">{item.unit}</DnaTd>
                    <DnaTd className="py-3 px-4 text-right text-slate-700 font-medium">
                      {formatCurrency(item.avgHpp)}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(item.totalValuation)}
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