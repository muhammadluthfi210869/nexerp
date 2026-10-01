import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  ApAgingItem,
  ApAgingDateRange,
  ApAgingKpis,
} from "../_types/ap-aging.types";

export function useApAgingOperations() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [bucketFilter, setBucketFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState<ApAgingDateRange>({
    start: "2026-09-01",
    end: "2026-09-30",
  });
  const [selectedInvoice, setSelectedInvoice] = useState<ApAgingItem | null>(null);

  // Live AP / Aging & Bills query
  const {
    data: apReportRaw,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["reports-ap-aging", dateRange.end],
    queryFn: async (): Promise<any> => {
      try {
        const res = await api.get("/reports/ap-aging", {
          params: { asOfDate: dateRange.end },
        });
        return res.data;
      } catch {
        const res2 = await api.get("/finance/bills");
        return { data: unwrapResponse<any[]>(res2) || [] };
      }
    },
  });

  // Live Bank Accounts query for authentic real-time balance
  const { data: bankAccountsRaw = [] } = useQuery({
    queryKey: ["finance-bank-accounts-ap"],
    queryFn: async (): Promise<any[]> => {
      try {
        const res = await api.get("/finance/bank-accounts");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const realTimeBankBalance = useMemo(() => {
    return (bankAccountsRaw || []).reduce(
      (acc: number, b: any) => acc + Number(b.balance || 0),
      0
    );
  }, [bankAccountsRaw]);

  const apItems: ApAgingItem[] = useMemo(() => {
    const rawList = apReportRaw?.data || [];
    const now = new Date();

    return rawList.flatMap((b: any) => {
      // If structured as supplier aggregated record from /reports/ap-aging
      if (b.supplier_name && b.total_ap !== undefined) {
        const items: ApAgingItem[] = [];
        const baseId = b.supplier_id || "supp";
        const supplierName = b.supplier_name;

        if (b.h_minus_3 > 0) {
          items.push({
            id: `${baseId}-h3`,
            vendor: supplierName,
            invoiceNo: `INV-H3-${baseId.slice(0, 6)}`,
            invoiceDate: dateRange.start,
            deadline: dateRange.end,
            statusDueDate: "H-3",
            daysOverdue: 0,
            amount: Number(b.h_minus_3),
            bucket: "Current",
          });
        }
        if (b.h_minus_7 > 0) {
          items.push({
            id: `${baseId}-h7`,
            vendor: supplierName,
            invoiceNo: `INV-H7-${baseId.slice(0, 6)}`,
            invoiceDate: dateRange.start,
            deadline: dateRange.end,
            statusDueDate: "H-7",
            daysOverdue: 0,
            amount: Number(b.h_minus_7),
            bucket: "Current",
          });
        }
        if (b.current > 0) {
          items.push({
            id: `${baseId}-curr`,
            vendor: supplierName,
            invoiceNo: `INV-CURR-${baseId.slice(0, 6)}`,
            invoiceDate: dateRange.start,
            deadline: dateRange.end,
            statusDueDate: "NORMAL",
            daysOverdue: 0,
            amount: Number(b.current),
            bucket: "Current",
          });
        }
        if (b.over_30 > 0) {
          items.push({
            id: `${baseId}-o30`,
            vendor: supplierName,
            invoiceNo: `INV-O30-${baseId.slice(0, 6)}`,
            invoiceDate: dateRange.start,
            deadline: dateRange.end,
            statusDueDate: "OVERDUE",
            daysOverdue: 15,
            amount: Number(b.over_30),
            bucket: "1-30",
          });
        }
        if (b.over_60 > 0) {
          items.push({
            id: `${baseId}-o60`,
            vendor: supplierName,
            invoiceNo: `INV-O60-${baseId.slice(0, 6)}`,
            invoiceDate: dateRange.start,
            deadline: dateRange.end,
            statusDueDate: "OVERDUE",
            daysOverdue: 45,
            amount: Number(b.over_60),
            bucket: "31-60",
          });
        }
        if (b.over_90 > 0) {
          items.push({
            id: `${baseId}-o90`,
            vendor: supplierName,
            invoiceNo: `INV-O90-${baseId.slice(0, 6)}`,
            invoiceDate: dateRange.start,
            deadline: dateRange.end,
            statusDueDate: "OVERDUE",
            daysOverdue: 90,
            amount: Number(b.over_90),
            bucket: ">60",
          });
        }
        return items;
      }

      // Individual bill/invoice item fallback
      const deadline = b.dueDate || b.createdAt;
      const daysToDue = deadline
        ? Math.ceil((new Date(deadline).getTime() - now.getTime()) / 86400000)
        : 0;
      const daysOverdue = daysToDue < 0 ? Math.abs(daysToDue) : 0;
      let statusDueDate: "H-3" | "H-7" | "OVERDUE" | "NORMAL" = "NORMAL";
      if (daysToDue < 0) statusDueDate = "OVERDUE";
      else if (daysToDue <= 3) statusDueDate = "H-3";
      else if (daysToDue <= 7) statusDueDate = "H-7";

      let bucket: "Current" | "1-30" | "31-60" | ">60" = "Current";
      if (daysOverdue > 60) bucket = ">60";
      else if (daysOverdue > 30) bucket = "31-60";
      else if (daysOverdue > 0) bucket = "1-30";

      return [
        {
          id: b.id || Math.random().toString(),
          vendor: b.supplier?.name || b.lead?.clientName || "Vendor Supplier",
          invoiceNo: b.invoiceNumber || `BILL-${b.id?.slice(0, 8)}`,
          invoiceDate: b.createdAt
            ? new Date(b.createdAt).toISOString().split("T")[0]
            : "",
          deadline: deadline
            ? new Date(deadline).toISOString().split("T")[0]
            : "",
          statusDueDate,
          daysOverdue,
          amount: Number(b.amountDue || b.totalAmount || 0),
          bucket,
        },
      ];
    });
  }, [apReportRaw, dateRange.start, dateRange.end]);

  const totalOutstanding = useMemo(
    () => apItems.reduce((acc, r) => acc + r.amount, 0),
    [apItems]
  );
  const countH3 = useMemo(
    () => apItems.filter((r) => r.statusDueDate === "H-3").length,
    [apItems]
  );
  const countH7 = useMemo(
    () => apItems.filter((r) => r.statusDueDate === "H-7").length,
    [apItems]
  );
  const overdueCount = useMemo(
    () => apItems.filter((r) => r.statusDueDate === "OVERDUE").length,
    [apItems]
  );

  const kpis: ApAgingKpis = useMemo(
    () => ({
      totalOutstanding,
      countH3,
      countH7,
      overdueCount,
      totalInvoices: apItems.length,
      realTimeBankBalance,
    }),
    [
      totalOutstanding,
      countH3,
      countH7,
      overdueCount,
      apItems.length,
      realTimeBankBalance,
    ]
  );

  const filteredItems = useMemo(() => {
    return apItems.filter((item) => {
      const matchSearch =
        item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBucket =
        bucketFilter === "ALL" || item.bucket === bucketFilter;
      return matchSearch && matchBucket;
    });
  }, [apItems, searchQuery, bucketFilter]);

  const handleExportExcel = () => {
    toast.success("Exporting AP Aging ke Excel...");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenDetail = (item: ApAgingItem) => {
    setSelectedInvoice(item);
  };

  const handleCloseDetail = () => {
    setSelectedInvoice(null);
  };

  return {
    // State
    searchQuery,
    setSearchQuery,
    bucketFilter,
    setBucketFilter,
    dateRange,
    setDateRange,
    selectedInvoice,
    setSelectedInvoice,

    // Query & Data
    isLoading,
    refetch,
    apItems,
    filteredItems,
    kpis,
    realTimeBankBalance,

    // Handlers
    handleExportExcel,
    handlePrint,
    handleOpenDetail,
    handleCloseDetail,
  };
}

export type ApAgingOperationsReturn = ReturnType<typeof useApAgingOperations>;
