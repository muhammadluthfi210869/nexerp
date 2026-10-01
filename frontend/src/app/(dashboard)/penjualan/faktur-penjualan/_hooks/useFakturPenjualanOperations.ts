"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import type { SalesInvoice } from "../_types/faktur-penjualan.types";

export function useFakturPenjualanOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailInvoice, setDetailInvoice] = useState<SalesInvoice | null>(null);
  const [isExcelOpen, setIsExcelOpen] = useState(false);

  // Query live Invoices
  const {
    data: invoices = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SalesInvoice[]>({
    queryKey: ["commercial-invoices"],
    queryFn: async () => {
      const resp = await api.get("/commercial/invoices");
      return (resp.data || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || inv.id,
        soNumber: inv.salesOrder?.orderNumber || inv.soId || "-",
        customerName: inv.salesOrder?.lead?.clientName || inv.customerName || "Customer",
        brandName: inv.salesOrder?.brandName || inv.brandName || "Brand",
        invoiceDate: inv.invoiceDate
          ? new Date(inv.invoiceDate).toISOString().split("T")[0]
          : inv.createdAt
          ? new Date(inv.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "2026-04-15",
        subtotal: Number(inv.amountDue) || 0,
        totalDiscount: Number(inv.discountAmount) || 0,
        taxAmount: Number(inv.taxAmount) || 0,
        downPaymentOffset: Number(inv.downPaymentOffset) || 0,
        grandTotal: Number(inv.amountDue) || 0,
        paidAmount: Number(inv.paidAmount) || 0,
        paymentStatus: (inv.status === "PAID"
          ? "PAID"
          : inv.status === "PARTIAL"
          ? "PARTIAL"
          : "UNPAID") as "PAID" | "UNPAID" | "PARTIAL",
        arGatekeeperStatus: (inv.salesOrder?.deliveryGateStatus || "HELD") as "HELD" | "RELEASED",
        unpaidReason:
          inv.unpaidReason ||
          (inv.status !== "PAID" ? "Menunggu pelunasan termin ke-2 sebelum DO delivery released." : undefined),
        notes: inv.notes || "",
        picBusDev: inv.salesOrder?.lead?.pic?.name || "Andi Pratama",
        items: (inv.items || []).map((it: any) => ({
          id: it.id,
          itemCode: it.productId || "FG-ITEM",
          itemName: it.description || it.productName || "Finished Goods Maklon",
          qty: Number(it.quantity) || 1000,
          unit: "pcs",
          price: Number(it.unitPrice) || Number(inv.amountDue) || 0,
          discount: Number(it.discount) || 0,
          total: Number(it.subtotal) || Number(inv.amountDue) || 0,
        })),
      }));
    },
  });

  // Release Delivery Gate Mutation
  const releaseGatekeeperMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return api.post(`/commercial/invoices/${invoiceId}/release-delivery`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-invoices"] });
      toast.success(
        "AR Gatekeeper Diperbarui",
        "Delivery Order untuk tagihan kini berstatus RELEASED."
      );
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal merilis delivery gatekeeper";
      toast.error("Gagal", msg);
    },
  });

  // Tab Filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      let matchesTab = true;
      if (activeTab === "paid") {
        matchesTab = inv.paymentStatus === "PAID";
      } else if (activeTab === "unpaid") {
        matchesTab = inv.paymentStatus === "UNPAID" || inv.paymentStatus === "PARTIAL";
      }

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.soNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.brandName.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [invoices, activeTab, searchTerm]);

  // KPIs
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalUnpaid = totalInvoiced - totalPaid;
  const heldCount = invoices.filter((i) => i.arGatekeeperStatus === "HELD").length;

  const countAll = invoices.length;
  const countPaid = invoices.filter((i) => i.paymentStatus === "PAID").length;
  const countUnpaid = invoices.filter((i) => i.paymentStatus !== "PAID").length;

  const toggleGatekeeper = (invId: string) => {
    releaseGatekeeperMutation.mutate(invId);
  };

  const handleToggleDetailGatekeeper = () => {
    if (!detailInvoice) return;
    toggleGatekeeper(detailInvoice.id);
    setDetailInvoice({
      ...detailInvoice,
      arGatekeeperStatus: detailInvoice.arGatekeeperStatus === "HELD" ? "RELEASED" : "HELD",
    });
  };

  return {
    // Tab & Search
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    filteredInvoices,

    // Query states
    isLoading,
    isError,
    error,
    refetch,

    // KPI counts
    totalInvoiced,
    totalPaid,
    totalUnpaid,
    heldCount,
    countAll,
    countPaid,
    countUnpaid,

    // Detail drawer state & handlers
    detailInvoice,
    setDetailInvoice,
    toggleGatekeeper,
    handleToggleDetailGatekeeper,

    // Modals
    isExcelOpen,
    setIsExcelOpen,
  };
}
