"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  PurchaseBill,
  InvoiceKpis,
  PendingInbound,
  IMPORT_HEADERS,
} from "../_types/faktur-pembelian.types";

export function useFakturPembelianOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  // 1. Fetch Verified Purchase Invoices (Bills)
  const { data: rawBills, isLoading, isError, refetch } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await api.get("/purchase/invoices");
      return unwrapResponse(res) || [];
    },
  });

  const dataList: PurchaseBill[] = useMemo(() => {
    if (!rawBills || !Array.isArray(rawBills)) return [];
    return rawBills.map((b: any) => ({
      id: b.id,
      billNumber: b.billNumber || b.invoiceNumber || "",
      poNumber: b.purchaseOrder?.poNumber || b.poNumber || b.poId || "-",
      vendorName: b.supplier?.name || b.supplierName || b.vendor?.name || b.vendorName || "-",
      procurementCategory: b.procurementCategory || "Bahan Baku (110401)",
      invoiceDate: b.invoiceDate ? b.invoiceDate.split("T")[0] : "",
      dueDate: b.dueDate ? b.dueDate.split("T")[0] : "",
      subtotal: Number(b.subtotal || 0),
      totalDiscountRp: Number(b.totalDiscount || b.discount || 0),
      taxAmount: Number(b.taxAmount || 0),
      grandTotal: Number(b.grandTotal || 0),
      paidAmount: Number(b.paidAmount || 0),
      dpDeduction: Number(b.downPaymentDeduction || 0),
      paymentStatus:
        b.paymentStatus ||
        (Number(b.paidAmount) >= Number(b.grandTotal)
          ? "PAID"
          : Number(b.paidAmount) > 0
          ? "PARTIAL"
          : "UNPAID"),
      unpaidReason: b.unpaidReason || "",
      notes: b.notes || "",
      pic: b.pic || "Finance Staff",
      items: (b.items || []).map((it: any) => ({
        id: it.id,
        itemCode: it.itemCode || it.material?.sku || "MAT-001",
        itemName: it.itemName || it.material?.name || "Item",
        qty: Number(it.qty || it.quantity || 0),
        unit: it.unit || it.material?.unit || "Kg",
        price: Number(it.price || it.unitPrice || 0),
        discountRp: Number(it.discount || 0),
        total: Number(it.total || it.totalPrice || 0),
        rejectQty: Number(it.rejectQty || 0),
      })),
    }));
  }, [rawBills]);

  // 2. Fetch Goods Receipts (GR / Inbounds) Ready for Invoicing (GSERP Workflow)
  const { data: rawInbounds, isLoading: isLoadingInbounds } = useQuery({
    queryKey: ["purchase-goods-receipts"],
    queryFn: async () => {
      try {
        const res = await api.get("/purchase/goods-receipts");
        return unwrapResponse(res) || [];
      } catch {
        return [];
      }
    },
  });

  const availableInbounds: PendingInbound[] = useMemo(() => {
    if (!rawInbounds || !Array.isArray(rawInbounds)) return [];
    return rawInbounds.map((ib: any) => {
      const poItems = ib.po?.items || [];
      const items = (ib.items || []).map((it: any) => {
        const poItem = poItems.find((p: any) => p.materialId === it.materialId);
        const unitPrice = Number(poItem?.unitPrice || 0);
        const qtyReceived = Number(it.qtyGood ?? it.qtyActual ?? 0);
        return {
          materialName: it.material?.name || poItem?.material?.name || "Material",
          qtyReceived,
          unit: it.material?.unit || poItem?.material?.unit || "pcs",
          unitPrice,
          subtotal: qtyReceived * unitPrice,
        };
      });

      const totalEstimated = items.reduce((acc: number, cur: any) => acc + cur.subtotal, 0);

      return {
        id: ib.id,
        inboundNumber: ib.inboundNumber || `GR-${ib.id.slice(0, 8)}`,
        poNumber: ib.po?.poNumber || "PO-REF",
        poId: ib.poId || ib.po?.id,
        vendorName: ib.po?.supplier?.name || ib.supplier?.name || "Supplier",
        vendorId: ib.po?.supplierId || ib.po?.supplier?.id,
        warehouseName: ib.warehouse?.name || "Gudang Utama",
        receivedAt: ib.receivedAt ? ib.receivedAt.split("T")[0] : new Date().toISOString().split("T")[0],
        status: ib.status || "APPROVED",
        totalEstimated,
        itemCount: items.length,
        items,
      };
    });
  }, [rawInbounds]);

  // Tabs & Navigation State
  const [mainTab, setMainTab] = useState<"INVOICES" | "PENDING_GR">("INVOICES");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);

  // Modal States
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedInbound, setSelectedInbound] = useState<PendingInbound | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [reasonModalBill, setReasonModalBill] = useState<PurchaseBill | null>(null);
  const [newReasonText, setNewReasonText] = useState("");

  // Calculate KPIs
  const kpis: InvoiceKpis = useMemo(() => {
    const list = dataList;
    const totalCount = list.length;
    const totalGrand = list.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalUnpaid = list
      .filter((b) => b.paymentStatus === "UNPAID" || b.paymentStatus === "PARTIAL")
      .reduce((sum, b) => sum + (b.grandTotal - b.paidAmount), 0);
    const paidCount = list.filter((b) => b.paymentStatus === "PAID").length;

    return {
      totalCount,
      totalGrand,
      totalUnpaid,
      paidCount,
    };
  }, [dataList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.unpaidReason && item.unpaidReason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTab =
        activeStatusFilter === "ALL"
          ? true
          : activeStatusFilter === "PAID"
          ? item.paymentStatus === "PAID"
          : activeStatusFilter === "UNPAID"
          ? item.paymentStatus === "UNPAID" || item.paymentStatus === "PARTIAL"
          : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeStatusFilter]);

  // Open Process Modal
  const handleOpenProcess = (inbound?: PendingInbound) => {
    if (inbound) {
      setSelectedInbound(inbound);
    } else if (availableInbounds.length > 0) {
      setSelectedInbound(availableInbounds[0]);
    } else {
      setSelectedInbound(null);
    }
    setIsProcessModalOpen(true);
  };

  // Process Mutation (GSERP Workflow: Convert GR & PO to Purchase Invoice)
  const processInvoiceMut = useMutation({
    mutationFn: async (payload: {
      inboundId: string;
      poId?: string;
      vendorId?: string;
      vendorInvoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      notes?: string;
    }) => {
      return unwrapResponse(
        await api.post("/purchase/invoices", {
          inboundId: payload.inboundId,
          poId: payload.poId,
          vendorId: payload.vendorId,
          invoiceNumber: payload.vendorInvoiceNumber,
          invoiceDate: payload.invoiceDate,
          dueDate: payload.dueDate,
          notes: payload.notes,
        }),
      );
    },
    onSuccess: (res: any) => {
      toast.success(
        "Faktur Pembelian Berhasil Diproses",
        `Faktur ${res?.billNumber || "FP"} berhasil diterbitkan dan masuk ke daftar Hutang Dagang (AP).`,
      );
      setIsProcessModalOpen(false);
      setSelectedInbound(null);
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-goods-receipts"] });
      setMainTab("INVOICES");
    },
    onError: (e) => toast.error("Gagal Memproses Faktur", extractApiError(e).message),
  });

  // Import Mutation
  const importMut = useMutation({
    mutationFn: async (rows: unknown[]) =>
      unwrapResponse(await api.post("/purchase/invoices/import", { rows })) as Array<{
        success: boolean;
        billNumber?: string;
        error?: string;
      }>,
    onSuccess: (results) => {
      const list = Array.isArray(results) ? results : [];
      const ok = list.filter((r) => r.success).length;
      const rejected = list.length - ok;
      if (ok === 0) {
        toast.error(
          "Impor faktur gagal",
          list[0]?.error || "Tidak ada baris yang diterima backend. Periksa format CSV.",
        );
      } else if (rejected > 0) {
        toast.warning(`${ok} faktur pembelian ditambahkan, ${rejected} baris ditolak backend.`);
      } else {
        toast.success(`${ok} faktur pembelian berhasil diimpor.`);
      }
      setIsImportModalOpen(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
    },
    onError: (e) => toast.error("Impor Gagal", extractApiError(e).message),
  });

  // Reason Update Mutation
  const updateReasonMut = useMutation({
    mutationFn: async ({ id, unpaidReason }: { id: string; unpaidReason: string }) =>
      unwrapResponse(await api.patch(`/purchase/invoices/${id}/reason`, { unpaidReason })),
    onSuccess: () => {
      toast.success("Alasan belum lunas berhasil diperbarui.");
      setReasonModalBill(null);
      setNewReasonText("");
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
    },
    onError: (e) => toast.error("Gagal update alasan", extractApiError(e).message),
  });

  return {
    // Data & Loading
    dataList,
    filteredList,
    availableInbounds,
    isLoading,
    isLoadingInbounds,
    isError,
    refetch,
    kpis,

    // Navigation & Filters
    mainTab,
    setMainTab,
    activeStatusFilter,
    setActiveStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedBill,
    setSelectedBill,

    // Process Modal (GSERP Workflow)
    isProcessModalOpen,
    setIsProcessModalOpen,
    selectedInbound,
    setSelectedInbound,
    handleOpenProcess,
    processInvoiceMut,

    // Import Modal
    isImportModalOpen,
    setIsImportModalOpen,
    importFile,
    setImportFile,
    importMut,

    // Reason Modal
    reasonModalBill,
    setReasonModalBill,
    newReasonText,
    setNewReasonText,
    updateReasonMut,
  };
}
