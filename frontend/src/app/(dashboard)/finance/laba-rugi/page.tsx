"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  KpiCard,
  DnaBadge,
  TableWrapper,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaTdNumber,
  DnaButton
} from "@/components/dna";
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  Layers
} from "lucide-react";
import { toast } from "sonner";

interface FinancialLineItem {
  id: string;
  name: string;
  amount: number;
  isNegative?: boolean;
}

interface FinancialGroup {
  id: string;
  groupTitle: string;
  subGroups: {
    subTitle: string;
    items: FinancialLineItem[];
    subTotal: number;
  }[];
  totalLabel: string;
  totalAmount: number;
}

export default function LabaRugiReportPage() {
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-30");
  const [isExporting, setIsExporting] = useState(false);

  // Financial Data Matching Image 1
  const operatingRevenue: FinancialGroup = {
    id: "rev",
    groupTitle: "OPERATING REVENUE",
    subGroups: [
      {
        subTitle: "PENJUALAN",
        items: [
          { id: "rev-1", name: "Penjualan Kosmetik", amount: 0.00 },
          { id: "rev-2", name: "Penjualan Sampel", amount: 132100600.00 },
          { id: "rev-3", name: "Pendapatan Ongkir", amount: 0.00 }
        ],
        subTotal: 132100600.00
      },
      {
        subTitle: "RETUR DAN POTONGAN PENJUALAN",
        items: [
          { id: "rev-4", name: "Retur Penjualan", amount: 0.00 },
          { id: "rev-5", name: "Potongan Penjualan", amount: 2350000.00, isNegative: true }
        ],
        subTotal: -2350000.00
      }
    ],
    totalLabel: "TOTAL OPERATING REVENUE",
    totalAmount: 129750600.00
  };

  const costOfGoodsSold: FinancialGroup = {
    id: "cogs",
    groupTitle: "COST OF GOODS SOLD",
    subGroups: [
      {
        subTitle: "HARGA POKOK PENJUALAN",
        items: [
          { id: "cogs-1", name: "Harga Pokok Barang Jadi", amount: 0.00 },
          { id: "cogs-2", name: "Harga Pokok Bahan Baku", amount: 0.00 },
          { id: "cogs-3", name: "Harga Pokok Bahan Pembantu", amount: 0.00 },
          { id: "cogs-4", name: "Pemakaian Bahan Baku", amount: 0.00 },
          { id: "cogs-5", name: "Pemakaian Bahan Pembantu", amount: 0.00 },
          { id: "cogs-6", name: "Tenaga Kerja Pabrik", amount: 0.00 },
          { id: "cogs-7", name: "Listrik Pabrik", amount: 0.00 },
          { id: "cogs-8", name: "Air Pabrik", amount: 0.00 },
          { id: "cogs-9", name: "Overhead Pabrik & Depresiasi Mesin", amount: 113131766.11 }
        ],
        subTotal: 113131766.11
      }
    ],
    totalLabel: "TOTAL COST OF GOODS SOLD",
    totalAmount: 113131766.11
  };

  const grossProfit = operatingRevenue.totalAmount - costOfGoodsSold.totalAmount; // 16,618,833.89

  const operatingExpenses: FinancialGroup = {
    id: "opex",
    groupTitle: "OPERATING EXPENSES (BEBAN OPERASIONAL)",
    subGroups: [
      {
        subTitle: "BEBAN PENJUALAN & PEMASARAN",
        items: [
          { id: "op-1", name: "Beban Iklan & Digital Marketing", amount: 1250000.00 },
          { id: "op-2", name: "Beban Sample & Komisi BD", amount: 850000.00 }
        ],
        subTotal: 2100000.00
      },
      {
        subTitle: "BEBAN UMUM & ADMINISTRASI",
        items: [
          { id: "op-3", name: "Beban Gaji Karyawan Kantor", amount: 4500000.00 },
          { id: "op-4", name: "Biaya Notifikasi BPOM & Uji Lab", amount: 1200000.00 },
          { id: "op-5", name: "Biaya ATK, Internet & Utilitas", amount: 650000.00 }
        ],
        subTotal: 6350000.00
      }
    ],
    totalLabel: "TOTAL OPERATING EXPENSES",
    totalAmount: 8450000.00
  };

  const netOperatingIncome = grossProfit - operatingExpenses.totalAmount; // 8,168,833.89
  const netIncome = netOperatingIncome;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Laporan Laba Rugi Periode " + startDate + " s/d " + endDate + " berhasil diexport ke Excel (.xlsx)");
    }, 800);
  };

  return (
    <DnaPageContainer>
      {/* Page Header */}
      <DnaPageHeader
        title="Laba Rugi"
        badge={<DnaBadge status="info">LAPORAN KEUANGAN</DnaBadge>}
        subtitle="Laporan laba rugi komprehensif (Profit & Loss Statement) standar akuntansi PSAK / IFRS."
        action={
          <DnaButton
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportExcel}
          >
            {isExporting ? "Mengunduh..." : "Export Excel"}
          </DnaButton>
        }
      />

      {/* KPI Cards: Total Laba Rugi, Total Beban HPP, Laba Operasional Bersih */}
      <DnaKpiGrid>
        <KpiCard
          label="Total Laba Rugi (Net Income)"
          value={`Rp ${formatRupiah(netIncome).split(",")[0]}`}
          subtext="Laba bersih setelah beban & HPP"
          variant="emerald"
        />
        <KpiCard
          label="Laba Operasional Bersih"
          value={`Rp ${formatRupiah(netOperatingIncome).split(",")[0]}`}
          subtext="Gross profit dikurangi beban opersional"
          variant="blue"
        />
        <KpiCard
          label="Total Beban HPP (COGS)"
          value={`Rp ${formatRupiah(costOfGoodsSold.totalAmount).split(",")[0]}`}
          subtext="Bahan baku, kemasan & pabrikasi"
          variant="amber"
        />
        <KpiCard
          label="Total Pendapatan Operasional"
          value={`Rp ${formatRupiah(operatingRevenue.totalAmount).split(",")[0]}`}
          subtext="Net revenue penjualan & jasa"
          variant="slate"
        />
      </DnaKpiGrid>

      {/* Date Range Period Toolbar 1:1 Image 1 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Periode: <span className="text-rose-500">*</span>
          </span>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
            />
            <span className="text-slate-400 font-bold">/</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
            />
          </div>
          <DnaButton
            variant="secondary"
            size="sm"
            icon={<Filter className="w-3.5 h-3.5" />}
            onClick={() => toast.info(`Filter periode diterapkan: ${startDate} s/d ${endDate}`)}
          >
            Filter
          </DnaButton>
        </div>

        <div className="flex items-center gap-2">
          <DnaButton
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={handleExportExcel}
          >
            Export Excel (.xlsx)
          </DnaButton>
        </div>
      </div>

      {/* Unified Hierarchical Laba Rugi Table 1:1 Image 1 */}
      <TableWrapper>
        <DnaTable>
          <DnaTableHead>
            <tr className="bg-slate-700 text-white">
              <DnaTh className="text-white font-bold py-3">Description</DnaTh>
              <DnaTh align="right" className="text-white font-bold w-64 py-3">Balance (IDR)</DnaTh>
            </tr>
          </DnaTableHead>
          <DnaTableBody>
            {/* 1. OPERATING REVENUE */}
            <tr className="bg-slate-100/90 font-black text-slate-800 text-xs border-y border-slate-200">
              <td colSpan={2} className="py-2.5 px-3.5 uppercase tracking-wide">
                {operatingRevenue.groupTitle}
              </td>
            </tr>

            {operatingRevenue.subGroups.map((sub, sIdx) => (
              <React.Fragment key={sIdx}>
                {/* SubGroup Title */}
                <tr className="bg-slate-50/60 font-bold text-slate-700 text-xs">
                  <td className="py-2 px-6 font-bold">{sub.subTitle}</td>
                  <td className="py-2 px-3.5 text-right font-bold text-slate-900">
                    {sub.subTotal < 0 ? `-${formatRupiah(Math.abs(sub.subTotal))}` : formatRupiah(sub.subTotal)}
                  </td>
                </tr>
                {/* Line Items */}
                {sub.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/50 text-xs">
                    <td className="py-1.5 px-10 text-slate-600 font-medium">{it.name}</td>
                    <td className="py-1.5 px-3.5 text-right text-slate-700 tabular-nums">
                      {it.isNegative ? `-${formatRupiah(it.amount)}` : formatRupiah(it.amount)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* Total Operating Revenue */}
            <tr className="bg-slate-100 font-black text-slate-900 text-xs border-t border-b-2 border-slate-300">
              <td className="py-2.5 px-3.5">{operatingRevenue.totalLabel}</td>
              <td className="py-2.5 px-3.5 text-right text-blue-800 font-black">
                {formatRupiah(operatingRevenue.totalAmount)}
              </td>
            </tr>

            {/* 2. COST OF GOODS SOLD */}
            <tr className="bg-slate-100/90 font-black text-slate-800 text-xs border-y border-slate-200">
              <td colSpan={2} className="py-2.5 px-3.5 uppercase tracking-wide">
                {costOfGoodsSold.groupTitle}
              </td>
            </tr>

            {costOfGoodsSold.subGroups.map((sub, sIdx) => (
              <React.Fragment key={sIdx}>
                <tr className="bg-slate-50/60 font-bold text-slate-700 text-xs">
                  <td className="py-2 px-6 font-bold">{sub.subTitle}</td>
                  <td className="py-2 px-3.5 text-right font-bold text-slate-900">
                    {formatRupiah(sub.subTotal)}
                  </td>
                </tr>
                {sub.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/50 text-xs">
                    <td className="py-1.5 px-10 text-slate-600 font-medium">{it.name}</td>
                    <td className="py-1.5 px-3.5 text-right text-slate-700 tabular-nums">
                      {formatRupiah(it.amount)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* Total Cost of Goods Sold */}
            <tr className="bg-slate-100 font-black text-slate-900 text-xs border-t border-b border-slate-300">
              <td className="py-2.5 px-3.5">{costOfGoodsSold.totalLabel}</td>
              <td className="py-2.5 px-3.5 text-right text-rose-800 font-black">
                {formatRupiah(costOfGoodsSold.totalAmount)}
              </td>
            </tr>

            {/* Gross Profit (Laba Kotor) */}
            <tr className="bg-blue-50/80 font-black text-blue-950 text-xs border-y-2 border-blue-200">
              <td className="py-3 px-3.5 uppercase">GROSS PROFIT (LABA KOTOR)</td>
              <td className="py-3 px-3.5 text-right font-black text-blue-900 text-sm">
                Rp {formatRupiah(grossProfit)}
              </td>
            </tr>

            {/* 3. OPERATING EXPENSES */}
            <tr className="bg-slate-100/90 font-black text-slate-800 text-xs border-y border-slate-200">
              <td colSpan={2} className="py-2.5 px-3.5 uppercase tracking-wide">
                {operatingExpenses.groupTitle}
              </td>
            </tr>

            {operatingExpenses.subGroups.map((sub, sIdx) => (
              <React.Fragment key={sIdx}>
                <tr className="bg-slate-50/60 font-bold text-slate-700 text-xs">
                  <td className="py-2 px-6 font-bold">{sub.subTitle}</td>
                  <td className="py-2 px-3.5 text-right font-bold text-slate-900">
                    {formatRupiah(sub.subTotal)}
                  </td>
                </tr>
                {sub.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/50 text-xs">
                    <td className="py-1.5 px-10 text-slate-600 font-medium">{it.name}</td>
                    <td className="py-1.5 px-3.5 text-right text-slate-700 tabular-nums">
                      {formatRupiah(it.amount)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* Total Operating Expenses */}
            <tr className="bg-slate-100 font-black text-slate-900 text-xs border-t border-b border-slate-300">
              <td className="py-2.5 px-3.5">{operatingExpenses.totalLabel}</td>
              <td className="py-2.5 px-3.5 text-right text-rose-800 font-black">
                {formatRupiah(operatingExpenses.totalAmount)}
              </td>
            </tr>

            {/* Net Operating Income (Laba Operasional Bersih) */}
            <tr className="bg-slate-100/90 font-black text-slate-900 text-xs border-y-2 border-slate-300">
              <td className="py-3 px-3.5 uppercase">OPERATING INCOME (LABA OPERASIONAL BERSIH)</td>
              <td className="py-3 px-3.5 text-right font-black text-slate-900 text-sm">
                Rp {formatRupiah(netOperatingIncome)}
              </td>
            </tr>

            {/* Final Highlight: NET PROFIT / NET INCOME */}
            <tr className="bg-emerald-500 text-white font-black text-sm border-t-2 border-emerald-600 shadow-xs">
              <td className="py-3.5 px-4 uppercase tracking-wider">
                NET INCOME (LABA BERSIH TAHUN BERJALAN)
              </td>
              <td className="py-3.5 px-4 text-right font-black text-white text-base tabular-nums">
                Rp {formatRupiah(netIncome)}
              </td>
            </tr>
          </DnaTableBody>
        </DnaTable>
      </TableWrapper>
    </DnaPageContainer>
  );
}
