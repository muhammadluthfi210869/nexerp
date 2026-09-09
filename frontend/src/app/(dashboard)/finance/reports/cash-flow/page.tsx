"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import { DollarSign, ArrowDownRight, ArrowUpRight, FileSpreadsheet, Activity } from "lucide-react";

interface CashFlowItem {
  category: "OPERATING" | "INVESTING" | "FINANCING";
  name: string;
  amount: number;
}

const SAMPLE_CASH_FLOW: CashFlowItem[] = [
  // Aktivitas Operasi
  { category: "OPERATING", name: "Penerimaan Kas dari Pelanggan (Trade AR)", amount: 1850000000 },
  { category: "OPERATING", name: "Penerimaan Uang Muka Penjualan (DP Pelanggan)", amount: 450000000 },
  { category: "OPERATING", name: "Pembayaran Kas ke Pemasok Bahan Baku & Kemasan", amount: -980000000 },
  { category: "OPERATING", name: "Pembayaran Upah & Gaji Karyawan Pabrik", amount: -280000000 },
  { category: "OPERATING", name: "Pembayaran Beban Listrik, Air, & Utilitas Pabrik", amount: -75000000 },
  { category: "OPERATING", name: "Pembayaran Pajak (PPh 23 & PPN Bersih)", amount: -45000000 },

  // Aktivitas Investasi
  { category: "INVESTING", name: "Perolehan Mesin Homogenizer Baru", amount: -150000000 },
  { category: "INVESTING", name: "Perolehan Aset Tak Berwujud (Sertifikasi ISO & Halal)", amount: -35000000 },

  // Aktivitas Pendanaan
  { category: "FINANCING", name: "Penerimaan Modal Tambahan Pemegang Saham", amount: 200000000 },
  { category: "FINANCING", name: "Pembayaran Dividen / Prive", amount: -50000000 },
];

export default function CashFlowReportPage() {
  const [items, setItems] = useState<CashFlowItem[]>(SAMPLE_CASH_FLOW);
  const [period, setPeriod] = useState("2026-08");

  const opTotal = items.filter((i) => i.category === "OPERATING").reduce((acc, i) => acc + i.amount, 0);
  const invTotal = items.filter((i) => i.category === "INVESTING").reduce((acc, i) => acc + i.amount, 0);
  const finTotal = items.filter((i) => i.category === "FINANCING").reduce((acc, i) => acc + i.amount, 0);
  const netCashFlow = opTotal + invTotal + finTotal;

  const beginningCash = 835000000;
  const endingCash = beginningCash + netCashFlow;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Arus Kas (Cash Flow Statement)"
        subtitle="Laporan pergerakan kas masuk dan kas keluar dari aktivitas operasi, investasi, dan pendanaan"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Laporan Arus Kas" }]}
        actions={
          <DnaButton variant="secondary" onClick={() => alert("Laporan Arus Kas (.xlsx) berhasil diekspor.")}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Ekspor Excel
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Arus Kas Bersih Operasi (CFO)"
          value={formatRupiah(opTotal)}
          variant="emerald"
          icon={<Activity className="h-4 w-4" />}
          delta={{ value: "Penerimaan SO vs Pengadaan", isPositive: true }}
        />
        <DnaStatCard
          label="Arus Kas Investasi (CFI)"
          value={formatRupiah(invTotal)}
          variant="amber"
          icon={<ArrowUpRight className="h-4 w-4" />}
          delta={{ value: "Belanja Mesin & Sertifikasi", isPositive: false }}
        />
        <DnaStatCard
          label="Arus Kas Pendanaan (CFF)"
          value={formatRupiah(finTotal)}
          variant="blue"
          icon={<DollarSign className="h-4 w-4" />}
          delta={{ value: "Setoran Modal Bersih", isPositive: true }}
        />
        <DnaStatCard
          label="Kenaikan / (Penurunan) Kas"
          value={formatRupiah(netCashFlow)}
          variant="slate"
          delta={{ value: `Kas Akhir: ${formatRupiah(endingCash)}`, isPositive: netCashFlow >= 0 }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard title="Rincian Aliran Kas Masuk dan Keluar (Metode Langsung)">
        <div className="overflow-x-auto p-4 space-y-6">
          {/* Operasi */}
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
              1. ARUS KAS DARI AKTIVITAS OPERASI
            </h4>
            <div className="space-y-2">
              {items
                .filter((i) => i.category === "OPERATING")
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[12px] py-1 border-b border-slate-100">
                    <span className="text-slate-700">{item.name}</span>
                    <span className={`font-mono font-medium ${item.amount >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                      {item.amount < 0 ? `(${formatRupiah(Math.abs(item.amount))})` : formatRupiah(item.amount)}
                    </span>
                  </div>
                ))}
              <div className="flex justify-between text-[12px] font-bold pt-2 text-slate-900">
                <span>Arus Kas Bersih yang Dihasilkan dari Aktivitas Operasi</span>
                <span className="font-mono text-emerald-700">{formatRupiah(opTotal)}</span>
              </div>
            </div>
          </div>

          {/* Investasi */}
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
              2. ARUS KAS DARI AKTIVITAS INVESTASI
            </h4>
            <div className="space-y-2">
              {items
                .filter((i) => i.category === "INVESTING")
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[12px] py-1 border-b border-slate-100">
                    <span className="text-slate-700">{item.name}</span>
                    <span className={`font-mono font-medium ${item.amount >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                      {item.amount < 0 ? `(${formatRupiah(Math.abs(item.amount))})` : formatRupiah(item.amount)}
                    </span>
                  </div>
                ))}
              <div className="flex justify-between text-[12px] font-bold pt-2 text-slate-900">
                <span>Arus Kas Bersih yang Digunakan untuk Aktivitas Investasi</span>
                <span className="font-mono text-amber-700">({formatRupiah(Math.abs(invTotal))})</span>
              </div>
            </div>
          </div>

          {/* Pendanaan */}
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
              3. ARUS KAS DARI AKTIVITAS PENDANAAN
            </h4>
            <div className="space-y-2">
              {items
                .filter((i) => i.category === "FINANCING")
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[12px] py-1 border-b border-slate-100">
                    <span className="text-slate-700">{item.name}</span>
                    <span className={`font-mono font-medium ${item.amount >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                      {item.amount < 0 ? `(${formatRupiah(Math.abs(item.amount))})` : formatRupiah(item.amount)}
                    </span>
                  </div>
                ))}
              <div className="flex justify-between text-[12px] font-bold pt-2 text-slate-900">
                <span>Arus Kas Bersih dari Aktivitas Pendanaan</span>
                <span className="font-mono text-blue-700">{formatRupiah(finTotal)}</span>
              </div>
            </div>
          </div>

          {/* Saldo Kas */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[13px]">
            <div className="flex justify-between text-slate-600">
              <span>Saldo Kas Awal Periode</span>
              <span className="font-mono font-semibold text-slate-900">{formatRupiah(beginningCash)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Kenaikan Bersih Kas & Setara Kas</span>
              <span className="font-mono font-semibold text-emerald-700">+{formatRupiah(netCashFlow)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-[14px] text-slate-900">
              <span>Saldo Kas Akhir Periode (Konsolidasi Giro BCA, Mandiri & Kas Pabrik)</span>
              <span className="font-mono text-blue-600">{formatRupiah(endingCash)}</span>
            </div>
          </div>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
