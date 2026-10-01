"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast, formatRupiah } from "@/components/dna";
import type {
  FundRequestItem,
  FundRequestFormData,
  FundRequestKpis,
} from "../_types/fund-requests.types";

const INITIAL_FORM_DATA: FundRequestFormData = {
  level: "STAFF",
  applicant: "",
  department: "Produksi Manufaktur",
  purpose: "",
  coaAccount: "6190 - Beban Operasional Umum & Petty Cash",
  amount: "",
  requiredDate: new Date().toISOString().split("T")[0],
};

export function useFundRequestsOperations() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FundRequestItem | null>(null);

  const [formData, setFormData] = useState<FundRequestFormData>(INITIAL_FORM_DATA);

  const { data: rawRequests = [], refetch } = useQuery({
    queryKey: ["finance-fund-requests"],
    queryFn: async (): Promise<any[]> => {
      try {
        const res = await api.get("/finance/fund-requests");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const fundRequests: FundRequestItem[] = useMemo(() => {
    return rawRequests.map((req: any) => {
      const isDisbursed = req.status === "DISBURSED";
      const isApproved = req.status === "APPROVED" || req.status === "APPROVED_BY_DIR";
      const isRejected = req.status === "REJECTED";
      const approvalGate = req.status === "APPROVED_BY_DIR" ? "COMPLETED" : req.status === "APPROVED_BY_MGR" ? "DIREKTUR" : "ACCOUNTING";

      const approvalTierText = isDisbursed || req.status === "APPROVED_BY_DIR"
        ? "3. Direktur (Approved)"
        : req.status === "APPROVED_BY_MGR"
        ? "2. Accounting (Review)"
        : "1. Head Divisi";

      const disbStatus = isDisbursed
        ? ("DICAIRKAN" as const)
        : isApproved
        ? ("BELUM DICAIRKAN" as const)
        : ("MENUNGGU APPROVAL" as const);

      return {
        id: req.id,
        requestNo: req.requestNumber || `FR-${req.id?.slice(0, 8)}`,
        applicant: req.requester?.name || req.applicant || "Staff Pemohon",
        level: (req.level || "STAFF") as "STAFF" | "HEAD_DIVISI",
        department: req.department?.name || req.departmentId || "Operasional",
        purpose: req.reason || req.purpose || "Operasional",
        amount: Number(req.amount || 0),
        coaAccount: req.coaAccount || req.account?.name || "6190 - Beban Operasional Umum",
        currentApprovalLevel: approvalGate,
        approvalTier: approvalTierText,
        disbursementStatus: disbStatus,
        status: isDisbursed ? "DISBURSED" : isRejected ? "REJECTED" : isApproved ? "APPROVED" : "PENDING_APPROVAL",
        requestDate: req.createdAt ? new Date(req.createdAt).toISOString().split("T")[0] : "",
        requiredDate: req.requiredDate ? new Date(req.requiredDate).toISOString().split("T")[0] : "",
        notes: req.rejectReason || req.notes,
      };
    });
  }, [rawRequests]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const totalPengajuanBulanIni = useMemo(() => {
    return fundRequests.reduce((acc, r) => acc + r.amount, 0);
  }, [fundRequests]);

  const totalMenungguApproval = useMemo(() => {
    return fundRequests.filter((r) => r.status === "PENDING_APPROVAL").length;
  }, [fundRequests]);

  const totalDisbursed = useMemo(() => {
    return fundRequests
      .filter((r) => r.status === "DISBURSED")
      .reduce((acc, r) => acc + r.amount, 0);
  }, [fundRequests]);

  const kpis: FundRequestKpis = useMemo(
    () => ({
      totalPengajuanBulanIni,
      totalMenungguApproval,
      totalDisbursed,
      totalCount: fundRequests.length,
    }),
    [totalPengajuanBulanIni, totalMenungguApproval, totalDisbursed, fundRequests.length]
  );

  const statusOptions = useMemo(() => [
    { value: "ALL", label: "Semua Status" },
    { value: "PENDING_APPROVAL", label: "Menunggu Approval", color: "warning" as const },
    { value: "APPROVED", label: "Disetujui", color: "info" as const },
    { value: "DISBURSED", label: "Dicairkan", color: "success" as const },
    { value: "REJECTED", label: "Ditolak", color: "critical" as const },
  ], []);

  const filterColumns = useMemo(() => {
    const departments = Array.from(new Set(fundRequests.map((r) => r.department).filter(Boolean)));
    const coaAccounts = Array.from(new Set(fundRequests.map((r) => r.coaAccount).filter(Boolean)));
    return [
      {
        key: "department",
        label: "Departemen",
        type: "select" as const,
        options: departments,
      },
      {
        key: "coaAccount",
        label: "Akun Anggaran (CoA)",
        type: "select" as const,
        options: coaAccounts,
      },
      {
        key: "amount",
        label: "Urutkan Nominal",
        type: "sort_numeric" as const,
      },
    ];
  }, [fundRequests]);

  const filteredRequests = useMemo(() => {
    return fundRequests
      .filter((r) => {
        // Status filter
        if (selectedStatus !== "ALL" && r.status !== selectedStatus) {
          return false;
        }

        // Live Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = r.requestNo.toLowerCase().includes(q);
          const matchApp = r.applicant.toLowerCase().includes(q);
          const matchPurp = r.purpose.toLowerCase().includes(q);
          const matchDept = r.department.toLowerCase().includes(q);
          const matchCoa = r.coaAccount.toLowerCase().includes(q);
          if (!matchCode && !matchApp && !matchPurp && !matchDept && !matchCoa) {
            return false;
          }
        }

        // Column select filter
        if (selectedColumn === "department" && filterValue) {
          if (r.department !== filterValue) return false;
        }
        if (selectedColumn === "coaAccount" && filterValue) {
          if (r.coaAccount !== filterValue) return false;
        }

        // Date mode filter
        if (dateMode !== "ALL" && r.requestDate) {
          const itemDate = new Date(r.requestDate);
          const today = new Date();

          if (dateMode === "1_DAY") {
            const isToday =
              itemDate.getFullYear() === today.getFullYear() &&
              itemDate.getMonth() === today.getMonth() &&
              itemDate.getDate() === today.getDate();
            if (!isToday) return false;
          } else if (dateMode === "1_WEEK") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(today.getDate() - 7);
            if (itemDate < oneWeekAgo || itemDate > today) return false;
          } else if (dateMode === "1_MONTH") {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(today.getMonth() - 1);
            if (itemDate < oneMonthAgo || itemDate > today) return false;
          } else if (dateMode === "1_YEAR") {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            if (itemDate < oneYearAgo || itemDate > today) return false;
          } else if (dateMode === "CUSTOM") {
            if (startDate && r.requestDate < startDate) return false;
            if (endDate && r.requestDate > endDate) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedColumn === "amount") {
          if (filterValue === "asc") return a.amount - b.amount;
          if (filterValue === "desc") return b.amount - a.amount;
        }
        return 0;
      });
  }, [fundRequests, selectedStatus, searchQuery, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("");
    setFilterValue("");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  const handleSubmit = async () => {
    if (!formData.purpose || !formData.amount) {
      toast.error("Mohon lengkapi seluruh formulir pengajuan dana!");
      return;
    }
    try {
      await api.post("/finance/fund-request", {
        departmentId: formData.department,
        amount: Number(formData.amount),
        reason: formData.purpose,
      });
      toast.success("Pengajuan dana berhasil disubmit ke alur persetujuan!");
      refetch();
      setIsCreateModalOpen(false);
      setFormData({
        ...INITIAL_FORM_DATA,
        requiredDate: new Date().toISOString().split("T")[0],
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal mengajukan dana");
    }
  };

  const handleApprove = async (req: FundRequestItem) => {
    try {
      await api.patch(`/finance/fund-request/${req.id}/approve`, {
        approvedById: req.id,
      });
      toast.success(`Pengajuan dana ${req.requestNo} berhasil disetujui!`);
      refetch();
      setSelectedRequest(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyetujui pengajuan dana");
    }
  };

  const handleDisburse = async (req: FundRequestItem) => {
    try {
      await api.post(`/finance/fund-request/${req.id}/disburse`, {
        disbursedById: req.id,
        accountId: req.id,
      });
      toast.success(`Dana ${req.requestNo} (${formatRupiah(req.amount)}) berhasil dicairkan!`);
      refetch();
      setSelectedRequest(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal mencairkan dana");
    }
  };

  const handleReject = () => {
    toast.error("Pengajuan ditolak.");
    setSelectedRequest(null);
  };

  return {
    toast,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    statusOptions,
    selectedColumn,
    setSelectedColumn,
    filterValue,
    setFilterValue,
    filterColumns,
    dateMode,
    setDateMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleResetAll,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedRequest,
    setSelectedRequest,
    formData,
    setFormData,
    fundRequests,
    filteredRequests,
    kpis,
    totalPengajuanBulanIni,
    totalMenungguApproval,
    totalDisbursed,
    handleSubmit,
    handleApprove,
    handleDisburse,
    handleReject,
    refetch,
  };
}
