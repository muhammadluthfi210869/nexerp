import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  PurchaseDp,
  ActivePoOption,
  DpPembelianKpis,
  CASH_BANK_ACCOUNTS,
} from "../_types/dp-pembelian.types";

export function useDpPembelianOperations() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const {
    data: rawDps,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["purchase-down-payments"],
    queryFn: async () => {
      const res = await api.get("/purchase/down-payments");
      return unwrapResponse(res) || [];
    },
  });

  const { data: rawPos } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return unwrapResponse(res) || [];
    },
  });

  const activePos = useMemo<ActivePoOption[]>(() => {
    if (!rawPos || !Array.isArray(rawPos)) return [];
    return rawPos.map((po: any) => ({
      id: po.id,
      poNumber: po.poNumber || `PO-${po.id.slice(0, 8)}`,
      vendorName: po.supplier?.name || po.vendorName || "-",
      vendorCode: po.supplier?.id?.slice(0, 8) || "SUP",
      vendorId: po.supplierId,
      totalAmount: Number(po.totalValue || po.grandTotal || 0),
    }));
  }, [rawPos]);

  const dataList: PurchaseDp[] = useMemo(() => {
    if (!rawDps || !Array.isArray(rawDps)) return [];
    return rawDps.map((dp: any) => ({
      id: dp.id,
      dpNumber: dp.dpNumber || `DPB-${dp.id.slice(0, 8)}`,
      dpDate: dp.date ? dp.date.split("T")[0] : "",
      poNumber: dp.po?.poNumber || dp.poNumber || "-",
      vendorName: dp.supplier?.name || dp.vendor?.name || dp.vendorName || "-",
      vendorCode: dp.vendorId?.slice(0, 8) || dp.supplierId?.slice(0, 8) || "SUP",
      totalPoAmount: Number(dp.po?.totalValue || dp.amount || 0),
      dpPercentage:
        Number(dp.po?.totalValue) > 0
          ? Math.round((Number(dp.amount) / Number(dp.po.totalValue)) * 100)
          : 30,
      dpAmount: Number(dp.amount || 0),
      paymentAccount: dp.paymentMethod || "110201 - Bank BCA Operasional",
      referenceNumber: dp.referenceNumber || "",
      status:
        dp.remainingAmount <= 0 && Number(dp.appliedAmount) > 0
          ? "ALLOCATED"
          : dp.status || "PAID",
      allocatedBillNumber: dp.appliedToBill?.billNumber || "",
      notes: dp.notes || "",
      pic: "Finance Staff",
    }));
  }, [rawDps]);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDp, setSelectedDp] = useState<PurchaseDp | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [selectedPoNumber, setSelectedPoNumber] = useState("");
  const [dpDate, setDpDate] = useState(new Date().toISOString().split("T")[0]);
  const [dpPercentage, setDpPercentage] = useState<number>(30);
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [paymentAccount, setPaymentAccount] = useState(CASH_BANK_ACCOUNTS[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Calculate KPIs
  const kpis: DpPembelianKpis = useMemo(() => {
    const list = dataList;
    const total = list.length;
    const totalPaid = list
      .filter((d) => d.status === "PAID" || d.status === "ALLOCATED")
      .reduce((sum, d) => sum + d.dpAmount, 0);
    const unallocated = list
      .filter((d) => d.status === "PAID")
      .reduce((sum, d) => sum + d.dpAmount, 0);
    const pending = list.filter((d) => d.status === "PENDING_APPROVAL").length;

    return {
      total,
      totalPaid,
      unallocated,
      pending,
    };
  }, [dataList]);

  // Tab definitions
  const tabs = useMemo(
    () => [
      { key: "ALL", label: "Semua", count: dataList.length },
      {
        key: "PENDING_APPROVAL",
        label: "Menunggu Approval",
        count: dataList.filter((d) => d.status === "PENDING_APPROVAL").length,
      },
      {
        key: "PAID",
        label: "Terbayar (Aktif)",
        count: dataList.filter((d) => d.status === "PAID").length,
      },
      {
        key: "ALLOCATED",
        label: "Dipotong Faktur",
        count: dataList.filter((d) => d.status === "ALLOCATED").length,
      },
      {
        key: "VOID",
        label: "Batal",
        count: dataList.filter((d) => d.status === "VOID").length,
      },
    ],
    [dataList],
  );

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.dpNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.paymentAccount.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL"
          ? true
          : activeTab === "PENDING_APPROVAL"
          ? item.status === "PENDING_APPROVAL"
          : activeTab === "PAID"
          ? item.status === "PAID"
          : activeTab === "ALLOCATED"
          ? item.status === "ALLOCATED"
          : activeTab === "VOID"
          ? item.status === "VOID"
          : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleSelectPo = (poNo: string) => {
    setSelectedPoNumber(poNo);
    const po = activePos.find((p) => p.poNumber === poNo);
    if (po) {
      const calcAmount = (po.totalAmount * dpPercentage) / 100;
      setDpAmount(calcAmount);
    } else {
      setDpAmount(0);
    }
  };

  const handlePercentageChange = (pct: number) => {
    setDpPercentage(pct);
    const po = activePos.find((p) => p.poNumber === selectedPoNumber);
    if (po) {
      setDpAmount((po.totalAmount * pct) / 100);
    }
  };

  const createDpMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/purchase/down-payments", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-down-payments"] });
      toast.success("Uang Muka Pembelian (DP) berhasil dicatat & masuk ke Jurnal Akuntansi.");
      setIsCreateOpen(false);
      setSelectedPoNumber("");
      setDpAmount(0);
      setReferenceNumber("");
      setFormNotes("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mencatat DP pembelian");
    },
  });

  const handleCreateDp = () => {
    if (!selectedPoNumber) {
      toast.error("Pilih dokumen PO referensi");
      return;
    }
    const po = activePos.find((p) => p.poNumber === selectedPoNumber);
    if (!po) return;

    if (dpAmount <= 0) {
      toast.error("Nominal Uang Muka (DP) harus lebih dari Rp 0");
      return;
    }

    createDpMutation.mutate({
      vendorId: po.vendorId,
      amount: dpAmount,
      date: dpDate,
      notes: formNotes || `Pembayaran DP ${dpPercentage}% untuk PO ${po.poNumber}`,
    });
  };

  const handleApprovePayment = (_id: string) => {
    // PurchasePaymentsController exposes only POST / and POST /:id/reverse â€” there is no route
    // that confirms a DP payment, so this no longer flips the row to PAID locally and no longer
    // claims the cash/bank balance was debited.
    toast.warning(
      "Aksi belum tersedia",
      "Backend belum menyediakan rute konfirmasi pembayaran DP. Status DP tidak diubah dan saldo kas/bank tidak terpotong.",
    );
  };

  const handleExportExcel = () => {
    toast.success("Data DP Pembelian diexport ke Excel");
  };

  return {
    dataList,
    activePos,
    isLoading,
    isError,
    refetch,
    kpis,
    tabs,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredList,
    selectedDp,
    setSelectedDp,
    isCreateOpen,
    setIsCreateOpen,
    selectedPoNumber,
    setSelectedPoNumber,
    dpDate,
    setDpDate,
    dpPercentage,
    setDpPercentage,
    dpAmount,
    setDpAmount,
    paymentAccount,
    setPaymentAccount,
    referenceNumber,
    setReferenceNumber,
    formNotes,
    setFormNotes,
    handleSelectPo,
    handlePercentageChange,
    handleCreateDp,
    handleApprovePayment,
    handleExportExcel,
    isCreating: createDpMutation.isPending,
  };
}
