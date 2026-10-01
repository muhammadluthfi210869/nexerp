"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  StatementRow,
  DateRange,
  LabaRugiKpis,
  LedgerDrilldownResponse
} from "../_types/laba-rugi.types";

export function useLabaRugiOperations() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  });
  const [showComparison, setShowComparison] = useState(false);
  const [selectedRow, setSelectedRow] = useState<StatementRow | null>(null);

  // 1. Fetch live Profit & Loss Report
  const { data: plData, isLoading, refetch } = useQuery<any>({
    queryKey: ["finance-report-profit-loss", dateRange.start, dateRange.end],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/reports/profit-loss", {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end
          }
        });
        return unwrapResponse<any>(res);
      } catch {
        return null;
      }
    }
  });

  // 2. Fetch drilldown General Ledger for selected account
  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery<LedgerDrilldownResponse | null>({
    queryKey: ["finance-report-gl-drilldown", selectedRow?.code, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!selectedRow?.code) return null;
      try {
        const res = await api.get(`/finance/reports/general-ledger/${selectedRow.code}`, {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end
          }
        });
        return unwrapResponse<LedgerDrilldownResponse>(res);
      } catch {
        return null;
      }
    },
    enabled: !!selectedRow && !selectedRow.isHeader && !selectedRow.isTotal
  });

  // Transform backend report to rows
  const { rows, totalPendapatan, totalHpp, labaKotor, labaOperasional, labaBersih } = useMemo(() => {
    const revTotal = Number(plData?.operatingRevenue?.total || 0);
    const cogsTotal = Number(plData?.cogs?.total || 0);
    const gross = Number(plData?.grossProfit || (revTotal - cogsTotal));
    const opexTotal = Number(plData?.operatingExpenses?.total || 0);
    const opIncome = Number(plData?.operatingIncome || (gross - opexTotal));
    const net = Number(plData?.netProfit || (opIncome + Number(plData?.otherIncome?.total || 0) - Number(plData?.otherExpenses?.total || 0)));

    const resultRows: StatementRow[] = [];

    // Header 1: REVENUE
    resultRows.push({
      code: "4000",
      name: "I. PENDAPATAN OPERASIONAL (REVENUE)",
      level: 0,
      isHeader: true,
      currentAmount: revTotal,
      prevAmount: 0,
      growthPct: 0
    });
    const revGroups = plData?.operatingRevenue?.groups || {};
    Object.keys(revGroups).forEach((grp) => {
      (revGroups[grp] || []).forEach((acc: any) => {
        resultRows.push({
          code: acc.code,
          name: `  ${acc.name}`,
          level: 1,
          currentAmount: Number(acc.balance || 0),
          prevAmount: 0,
          growthPct: 0
        });
      });
    });
    resultRows.push({
      code: "TOT_REV",
      name: "TOTAL PENDAPATAN OPERASIONAL",
      level: 0,
      isTotal: true,
      currentAmount: revTotal,
      prevAmount: 0,
      growthPct: 0
    });

    // Header 2: COGS
    resultRows.push({
      code: "5000",
      name: "II. BEBAN POKOK PENJUALAN / PRODUKSI (COGS / HPP)",
      level: 0,
      isHeader: true,
      currentAmount: cogsTotal,
      prevAmount: 0,
      growthPct: 0
    });
    const cogsGroups = plData?.cogs?.groups || {};
    Object.keys(cogsGroups).forEach((grp) => {
      (cogsGroups[grp] || []).forEach((acc: any) => {
        resultRows.push({
          code: acc.code,
          name: `  ${acc.name}`,
          level: 1,
          currentAmount: Number(acc.balance || 0),
          prevAmount: 0,
          growthPct: 0
        });
      });
    });
    resultRows.push({
      code: "TOT_COGS",
      name: "TOTAL BEBAN POKOK PRODUKSI (HPP)",
      level: 0,
      isTotal: true,
      currentAmount: cogsTotal,
      prevAmount: 0,
      growthPct: 0
    });

    // 3. GROSS PROFIT
    resultRows.push({
      code: "GROSS_PRF",
      name: "LABA KOTOR (GROSS PROFIT)",
      level: 0,
      isTotal: true,
      currentAmount: gross,
      prevAmount: 0,
      growthPct: 0
    });

    // 4. OPEX
    resultRows.push({
      code: "6000",
      name: "III. BEBAN OPERASIONAL & ADMINISTRASI (OPEX)",
      level: 0,
      isHeader: true,
      currentAmount: opexTotal,
      prevAmount: 0,
      growthPct: 0
    });
    const opexGroups = plData?.operatingExpenses?.groups || {};
    Object.keys(opexGroups).forEach((grp) => {
      (opexGroups[grp] || []).forEach((acc: any) => {
        resultRows.push({
          code: acc.code,
          name: `  ${acc.name}`,
          level: 1,
          currentAmount: Number(acc.balance || 0),
          prevAmount: 0,
          growthPct: 0
        });
      });
    });
    resultRows.push({
      code: "TOT_OPEX",
      name: "TOTAL BEBAN OPERASIONAL (OPEX)",
      level: 0,
      isTotal: true,
      currentAmount: opexTotal,
      prevAmount: 0,
      growthPct: 0
    });

    // 5. OPERATIONAL & NET PROFIT
    resultRows.push({
      code: "NET_OP_PRF",
      name: "LABA OPERASIONAL BERSIH (EBIT)",
      level: 0,
      isTotal: true,
      currentAmount: opIncome,
      prevAmount: 0,
      growthPct: 0
    });
    resultRows.push({
      code: "NET_PRF",
      name: "TOTAL LABA RUGI BERSIH SETELAH PAJAK",
      level: 0,
      isTotal: true,
      currentAmount: net,
      prevAmount: 0,
      growthPct: 0
    });

    return {
      rows: resultRows,
      totalPendapatan: revTotal,
      totalHpp: cogsTotal,
      labaKotor: gross,
      labaOperasional: opIncome,
      labaBersih: net
    };
  }, [plData]);

  const grossMarginPct = totalPendapatan > 0 ? ((labaKotor / totalPendapatan) * 100).toFixed(1) : "0.0";
  const netMarginPct = totalPendapatan > 0 ? ((labaBersih / totalPendapatan) * 100).toFixed(1) : "0.0";

  const kpis: LabaRugiKpis = {
    totalPendapatan,
    totalHpp,
    labaKotor,
    labaOperasional,
    labaBersih,
    grossMarginPct,
    netMarginPct
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    toast.success("Exporting Laporan Laba Rugi ke Excel...");
  };

  const handleSelectRow = (row: StatementRow) => {
    setSelectedRow(row);
  };

  const handleCloseModal = () => {
    setSelectedRow(null);
  };

  return {
    dateRange,
    setDateRange,
    showComparison,
    setShowComparison,
    selectedRow,
    setSelectedRow,
    handleSelectRow,
    handleCloseModal,
    isLoading,
    refetch,
    ledgerData,
    isLedgerLoading,
    rows,
    kpis,
    handlePrint,
    handleExportExcel
  };
}

export type UseLabaRugiOperationsReturn = ReturnType<typeof useLabaRugiOperations>;
