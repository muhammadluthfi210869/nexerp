"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { toast } from "sonner";
import {
  PurchaseApprovalRecord,
  ConflictState,
  LineSourcesState,
} from "../_types/purchase-approval.types";

export function usePurchaseApprovalOperations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  const [approveDialogId, setApproveDialogId] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [conflict, setConflict] = useState<ConflictState>({ open: false });
  const [selectedRecord, setSelectedRecord] = useState<PurchaseApprovalRecord | null>(null);
  const [poDiscount, setPoDiscount] = useState(0);
  const [poShippingCost, setPoShippingCost] = useState(0);
  const [lineSources, setLineSources] = useState<LineSourcesState>({});

  const {
    data: serverData,
    isLoading,
    refetch,
  } = useQuery<PurchaseApprovalRecord[]>({
    queryKey: ["purchase-approval-center"],
    queryFn: async () => {
      try {
        const res = await api.get("/scm/purchase-orders");
        const raw = unwrapResponse(res);
        const list = Array.isArray(raw) ? raw : raw?.data || [];

        return list.map((po: any, idx: number) => {
          const submissionNo = po.submissionNo || `REQ-PO-2609-${String(idx + 1).padStart(4, "0")}`;
          const poNumber = po.poNumber || `PO-2609-${String(idx + 1).padStart(4, "0")}`;
          const rawDate = po.createdAt || po.orderDate || new Date().toISOString();
          const submissionDate = rawDate.slice(0, 10);
          const requester = po.scm?.fullName || po.requester || "Staff SCM Procurement";
          const department = po.department || "SCM / Purchasing";
          const docType = po.docType || "Purchase Order (PO)";
          const totalAmount = Number(po.totalValue || po.totalAmount || 0);

          let currentTier = "Tier 1 - Dept Head";
          if (totalAmount > 50000000) {
            currentTier = "Tier 3 - Direksi";
          } else if (totalAmount > 10000000) {
            currentTier = "Tier 2 - Finance Mgr";
          }

          return {
            ...po,
            id: po.id || `po-rec-${idx}`,
            submissionNo,
            submissionDate,
            docType,
            refDocNo: poNumber,
            poNumber,
            requester,
            department,
            totalAmount,
            currentTier: po.currentTier || currentTier,
            status: po.status || "PENDING_APPROVAL",
            items: po.items || [],
          } as PurchaseApprovalRecord;
        });
      } catch (err: any) {
        if (err?.response?.status === 409) {
          const data = err.response?.data;
          setConflict({
            open: true,
            lastModifiedAt:
              data?.timestamp || data?.lastModifiedAt || new Date().toISOString(),
            lastModifiedBy:
              data?.modifiedBy || data?.lastModifiedBy || "user lain",
          });
          return [];
        }
        console.warn("Failed to fetch purchase approval items", err);
        return [];
      }
    },
  });

  const records = useMemo(() => serverData || [], [serverData]);

  // Derived filter options
  const docTypes = useMemo(() => {
    const set = new Set(records.map((r) => r.docType).filter(Boolean));
    return Array.from(set);
  }, [records]);

  const departments = useMemo(() => {
    const set = new Set(records.map((r) => r.department).filter(Boolean));
    return Array.from(set);
  }, [records]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        rec.submissionNo.toLowerCase().includes(q) ||
        rec.refDocNo.toLowerCase().includes(q) ||
        rec.requester.toLowerCase().includes(q) ||
        rec.department.toLowerCase().includes(q) ||
        rec.docType.toLowerCase().includes(q);

      const matchDocType =
        docTypeFilter === "ALL" || rec.docType === docTypeFilter;
      const matchStatus =
        statusFilter === "ALL" || rec.status === statusFilter;
      const matchDept =
        departmentFilter === "ALL" || rec.department === departmentFilter;

      return matchSearch && matchDocType && matchStatus && matchDept;
    });
  }, [records, searchQuery, docTypeFilter, statusFilter, departmentFilter]);

  // KPI Metrics
  const totalSubmissions = records.length;
  const pendingCount = records.filter(
    (r) =>
      r.status === "PENDING_APPROVAL" ||
      r.status === "DRAFT" ||
      r.status === "SUBMITTED"
  ).length;
  const approvedCount = records.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = records.filter((r) => r.status === "REJECTED").length;
  const totalValue = records.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);

  // Detail Modal
  const handleOpenDetail = (rec: PurchaseApprovalRecord) => {
    setSelectedRecord(rec);
    setPoDiscount(Number(rec.discountAmount || rec.discountManual || 0));
    setPoShippingCost(Number(rec.shippingCost || 0));
    const sources: LineSourcesState = {};
    (rec.items || []).forEach((it: any, idx: number) => {
      sources[it.id || it.materialId || `item-${idx}`] =
        Number(it.currentStock || 0) >= Number(it.quantity || it.qty || 0)
          ? "STOCK"
          : "PO";
    });
    setLineSources(sources);
  };

  const handleCloseDetail = () => {
    setSelectedRecord(null);
  };

  // Approval Handlers
  const handleApproveConfirm = () => {
    toast.success("Pengajuan berhasil disetujui.");
    setApproveDialogId(null);
    refetch();
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }
    toast.success("Pengajuan berhasil ditolak.");
    setRejectDialogId(null);
    setRejectReason("");
    refetch();
  };

  const handleRejectClose = () => {
    setRejectDialogId(null);
    setRejectReason("");
  };

  const handleConflictRefresh = () => {
    setConflict({ open: false });
    refetch();
  };

  const handleConflictCancel = () => {
    setConflict({ open: false });
  };

  return {
    // Search & Filter State
    searchQuery,
    setSearchQuery,
    docTypeFilter,
    setDocTypeFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    docTypes,
    departments,

    // Dialog & Conflict State
    approveDialogId,
    setApproveDialogId,
    handleApproveConfirm,
    rejectDialogId,
    setRejectDialogId,
    rejectReason,
    setRejectReason,
    handleRejectConfirm,
    handleRejectClose,
    conflict,
    handleConflictRefresh,
    handleConflictCancel,

    // Detail Modal State & Handlers
    selectedRecord,
    poDiscount,
    setPoDiscount,
    poShippingCost,
    setPoShippingCost,
    lineSources,
    setLineSources,
    handleOpenDetail,
    handleCloseDetail,

    // Data & Computed
    records,
    filteredRecords,
    isLoading,
    refetch,
    totalSubmissions,
    pendingCount,
    approvedCount,
    rejectedCount,
    totalValue,
  };
}

export type PurchaseApprovalOperations = ReturnType<typeof usePurchaseApprovalOperations>;
