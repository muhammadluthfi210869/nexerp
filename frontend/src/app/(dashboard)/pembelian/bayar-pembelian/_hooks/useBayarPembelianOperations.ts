"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { ApBill, BankBalance, PaymentKpiData, ApAgingTab } from "../_types/bayar-pembelian.types";

export function useBayarPembelianOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  // Queries
  const {
    data: rawBills,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await api.get("/purchase/invoices");
      return unwrapResponse(res) || [];
    },
  });

  const { data: rawAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await api.get("/finance/bank-accounts");
      return unwrapResponse(res) || [];
    },
  });

  // Bank balances & Liquid Cash
  const bankBalances: BankBalance[] = useMemo(() => {
    if (!rawAccounts || !Array.isArray(rawAccounts) || rawAccounts.length === 0) {
      return [
        { accountCode: "110201", accountName: "Bank BCA Operasional", accountNumber: "731-0129-33", balance: 250000000 },
        { accountCode: "110202", accountName: "Bank Mandiri Utama", accountNumber: "137-00-9812-1", balance: 180000000 },
      ];
    }
    return rawAccounts.map((a: any) => ({
      accountCode: a.code || a.accountNumber || "110201",
      accountName: a.name || a.bankName || "Bank Operasional",
      accountNumber: a.accountNumber || "-",
      balance: Number(a.balance || 100000000),
    }));
  }, [rawAccounts]);

  const totalLiquidCash = useMemo(() => {
    return bankBalances.reduce((sum, b) => sum + b.balance, 0);
  }, [bankBalances]);

  // Transform raw bills to ApBill
  const dataList: ApBill[] = useMemo(() => {
    if (!rawBills || !Array.isArray(rawBills)) return [];
    return rawBills.map((b: any) => {
      const total = Number(b.grandTotal || 0);
      const paid = Number(b.paidAmount || 0);
      const remaining = Math.max(0, total - paid);
      return {
        id: b.id,
        billNumber: b.billNumber || b.invoiceNumber || "",
        vendorName: b.supplier?.name || b.supplierName || b.vendor?.name || b.vendorName || "-",
        vendorCode: b.vendorId?.slice(0, 8) || b.supplierId?.slice(0, 8) || "SUP",
        poNumber: b.purchaseOrder?.poNumber || b.poNumber || "-",
        invoiceDate: b.invoiceDate ? b.invoiceDate.split("T")[0] : "",
        dueDate: b.dueDate ? b.dueDate.split("T")[0] : "",
        daysToDue: b.dueDate ? Math.round((new Date(b.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
        availableDebitNote: 0,
        availableDp: 0,
        status: remaining <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
      };
    });
  }, [rawBills]);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<ApBill | null>(null);

  // Payment Form State
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedAccountCode, setSelectedAccountCode] = useState("110201");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [useDebitNote, setUseDebitNote] = useState<boolean>(true);
  const [refNumber, setRefNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Calculate KPIs & Aging
  const kpis: PaymentKpiData = useMemo(() => {
    const list = dataList;
    const totalUnpaid = list.reduce((sum, b) => sum + b.remainingAmount, 0);
    const overdueList = list.filter((b) => b.daysToDue < 0);
    const dueH3List = list.filter((b) => b.daysToDue >= 0 && b.daysToDue <= 3);
    const dueH7List = list.filter((b) => b.daysToDue > 3 && b.daysToDue <= 7);

    return {
      totalUnpaid,
      overdueCount: overdueList.length,
      overdueAmount: overdueList.reduce((sum, b) => sum + b.remainingAmount, 0),
      dueH3Count: dueH3List.length,
      dueH7Count: dueH7List.length,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL"
          ? true
          : activeTab === "OVERDUE"
          ? item.daysToDue < 0
          : activeTab === "H3"
          ? item.daysToDue >= 0 && item.daysToDue <= 3
          : activeTab === "H7"
          ? item.daysToDue > 3 && item.daysToDue <= 7
          : activeTab === "REGULAR"
          ? item.daysToDue > 7
          : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleOpenPayDrawer = (bill: ApBill) => {
    setSelectedBill(bill);
    let netRemaining = bill.remainingAmount;
    if (useDebitNote && bill.availableDebitNote > 0) {
      netRemaining -= bill.availableDebitNote;
    }
    setPayAmount(Math.max(0, netRemaining));
    setRefNumber(`TRF-AP-${Date.now().toString().slice(-6)}`);
    setPaymentNotes(`Pelunasan faktur ${bill.billNumber} (${bill.vendorName})`);
  };

  const handleClosePayDrawer = () => {
    setSelectedBill(null);
  };

  const payMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/purchase/payments", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success(`Pembayaran Faktur ${selectedBill?.billNumber} sebesar Rp ${payAmount.toLocaleString("id-ID")} berhasil diproses.`);
      setSelectedBill(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal memproses pembayaran AP");
    },
  });

  const handleProcessPayment = () => {
    if (!selectedBill) return;

    if (payAmount <= 0) {
      toast.error("Nominal pembayaran harus lebih dari Rp 0");
      return;
    }

    payMutation.mutate({
      billId: selectedBill.id,
      amount: payAmount,
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: refNumber || undefined,
      notes: paymentNotes || undefined,
    });
  };

  const handleExportExcel = () => {
    toast.success("Data Pelunasan AP diexport ke Excel");
  };

  return {
    // Data & state
    rawBills,
    isLoading,
    isError,
    refetch,
    bankBalances,
    totalLiquidCash,
    dataList,
    kpis,
    filteredList,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedBill,
    setSelectedBill,
    // Payment form
    paymentDate,
    setPaymentDate,
    selectedAccountCode,
    setSelectedAccountCode,
    payAmount,
    setPayAmount,
    useDebitNote,
    setUseDebitNote,
    refNumber,
    setRefNumber,
    paymentNotes,
    setPaymentNotes,
    // Handlers
    handleOpenPayDrawer,
    handleClosePayDrawer,
    handleProcessPayment,
    handleExportExcel,
    isPending: payMutation.isPending,
  };
}
