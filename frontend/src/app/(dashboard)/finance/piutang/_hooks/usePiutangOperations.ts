"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import type {
  Invoice,
  Bill,
  ArInvoiceRow,
  ArReturnRow,
  SalesOrderRow,
  PiutangTabId,
  ArHubSubTabId,
} from "../_types/piutang.types";

const num = (v: unknown) => Number(v ?? 0);
const fmtDate = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "â€”");

export function usePiutangOperations() {
  // Page Tab State
  const [activeTab, setActiveTab] = useState<PiutangTabId>("faktur-jual");

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Faktur Penjualan State & Queries
     â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [fakturJualSearch, setFakturJualSearch] = useState("");
  const invoicesQuery = useQuery<Invoice[]>({
    queryKey: ["piutang-invoices"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      const body = unwrapResponse<any>(resp);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows
        .filter((inv) => inv.category === "RECEIVABLE")
        .map((inv) => ({
          id: inv.invoiceNumber ?? "â€”",
          customer:
            inv.so?.lead?.clientName ||
            inv.workOrder?.lead?.clientName ||
            inv.customerName ||
            "Pelanggan tidak diketahui",
          date: inv.issuedAt ? new Date(inv.issuedAt).toISOString().split("T")[0] : "â€”",
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "â€”",
          amount: Number(inv.outstandingAmount ?? inv.amountDue ?? inv.totalAmount ?? 0),
          status: inv.status,
          source: inv.so?.orderNumber ? "Sales Order" : inv.workOrder?.woNumber ? "Work Order" : "Faktur",
        }));
    },
  });

  const filteredInvoices = (invoicesQuery.data ?? []).filter(
    (inv) =>
      inv.id.toLowerCase().includes(fakturJualSearch.toLowerCase()) ||
      inv.customer.toLowerCase().includes(fakturJualSearch.toLowerCase())
  );
  const totalReceivables = (invoicesQuery.data ?? []).reduce((acc, inv) => acc + inv.amount, 0);
  const overdueInvoices = (invoicesQuery.data ?? []).filter(
    (inv) => inv.dueDate !== "â€”" && new Date(inv.dueDate).getTime() < Date.now()
  );

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Faktur Pembelian State & Queries
     â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [fakturBeliSearch, setFakturBeliSearch] = useState("");
  const billsQuery = useQuery<Bill[]>({
    queryKey: ["piutang-bills"],
    queryFn: async () => {
      const resp = await api.get("/finance/bills");
      const body = unwrapResponse<any>(resp);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows
        .filter((b) => b.category === "PAYABLE")
        .map((b) => ({
          id: b.billNumber ?? b.invoiceNumber ?? "â€”",
          vendor: b.vendorName || b.supplier?.name || "Vendor tidak diketahui",
          date: b.issuedAt ? new Date(b.issuedAt).toISOString().split("T")[0] : "â€”",
          dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split("T")[0] : "â€”",
          total: Number(b.outstandingAmount ?? b.totalAmount ?? 0),
          status: b.status,
        }));
    },
  });

  const filteredBills = (billsQuery.data ?? []).filter(
    (b) =>
      b.id.toLowerCase().includes(fakturBeliSearch.toLowerCase()) ||
      b.vendor.toLowerCase().includes(fakturBeliSearch.toLowerCase())
  );
  const totalDebt = (billsQuery.data ?? []).reduce((acc, b) => acc + b.total, 0);
  const paidBillsCount = (billsQuery.data ?? []).filter((b) => b.status === "PAID").length;

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Sales Orders State & Queries
     â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [salesOrderSearch, setSalesOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderRow | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const salesOrdersQuery = useQuery<SalesOrderRow[]>({
    queryKey: ["piutang-sales-orders"],
    queryFn: async () => (await api.get("/finance/sales-orders")).data,
  });

  const filteredOrders = salesOrdersQuery.data?.filter(
    (o) =>
      o.orderNumber?.toLowerCase().includes(salesOrderSearch.toLowerCase()) ||
      o.lead?.clientName?.toLowerCase().includes(salesOrderSearch.toLowerCase())
  );
  const pendingVerificationOrders =
    salesOrdersQuery.data?.filter((o) => o.paymentProofUrl && !o.isPaymentVerified) || [];

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     AR Hub State & Queries
     â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [arHubActiveTab, setArHubActiveTab] = useState<ArHubSubTabId>("products");
  const [isArModalOpen, setIsArModalOpen] = useState(false);
  const [selectedArInvoice, setSelectedArInvoice] = useState<ArInvoiceRow | null>(null);

  const openPaymentModal = (inv: ArInvoiceRow) => {
    setSelectedArInvoice(inv);
    setIsArModalOpen(true);
  };

  const arPendingQuery = useQuery<{ orders: ArInvoiceRow[]; samples: ArInvoiceRow[] }>({
    queryKey: ["piutang-ar-hub-pending"],
    queryFn: async () => {
      const resp = await api.get("/finance/ar-hub/pending");
      const body = unwrapResponse<any>(resp);
      const rawOrders: any[] = body?.orders ?? [];
      const rawSamples: any[] = body?.samples ?? [];

      return {
        orders: rawOrders.map((inv) => {
          const grand = num(inv.amountDue);
          const sisa = num(inv.outstanding);
          return {
            id: inv.id,
            kode_faktur: inv.invoiceNumber || "â€”",
            kode_so: inv.so?.orderNumber || inv.workOrder?.woNumber || "â€”",
            ref: inv.dueDate ? fmtDate(inv.dueDate) : "â€”",
            tanggal: fmtDate(inv.issuedAt),
            pelanggan:
              inv.so?.lead?.clientName || inv.workOrder?.lead?.clientName || "Pelanggan tidak diketahui",
            grand_total: grand,
            dibayar: grand - sisa,
            sisa,
            status: inv.status || "â€”",
          };
        }),
        samples: rawSamples.map((s) => {
          const amount = num(s.amount);
          return {
            id: s.id,
            kode_faktur: s.activityType === "DOWN_PAYMENT" ? "DP Order" : "Sample Fee",
            kode_so: s.lead?.productInterest || "â€”",
            ref: s.activityType || "â€”",
            tanggal: fmtDate(s.createdAt),
            pelanggan: s.lead?.clientName || "â€”",
            produk: s.lead?.productInterest || s.notes || "â€”",
            grand_total: amount,
            dibayar: 0,
            sisa: amount,
            status: "MENUNGGU VALIDASI",
          };
        }),
      };
    },
  });

  const arInvoicesQuery = useQuery<any[]>({
    queryKey: ["piutang-ar-hub-invoices"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const arReturnsQuery = useQuery<ArReturnRow[]>({
    queryKey: ["piutang-ar-hub-returns"],
    retry: false,
    queryFn: async () => {
      try {
        const resp = await api.get("/bussdev/returns");
        const body = unwrapResponse<any>(resp);
        const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
        return rows.map((r) => ({
          id: r.id,
          no_retur: r.so?.orderNumber || "â€”",
          pelanggan: r.so?.lead?.clientName || "â€”",
          brand: r.so?.brandName || "â€”",
          tanggal: fmtDate(r.returnDate),
          jumlah_item: Array.isArray(r.items) ? r.items.length : 0,
          status: r.returnStatus || "â€”",
          catatan: r.notes || "â€”",
        }));
      } catch {
        return [];
      }
    },
  });

  const arReceivables = (arInvoicesQuery.data ?? []).filter((inv) => inv.category === "RECEIVABLE");
  const arTotalReceivables = arReceivables.reduce((acc, inv) => acc + num(inv.outstandingAmount), 0);
  const arOverdue30 = arReceivables
    .filter((inv) => {
      if (!inv.dueDate || num(inv.outstandingAmount) <= 0) return false;
      return new Date(inv.dueDate).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000;
    })
    .reduce((acc, inv) => acc + num(inv.outstandingAmount), 0);
  const now = new Date();
  const arCollectionsMtd = arReceivables
    .filter((inv) => {
      if (inv.status !== "PAID" || !inv.paidAt) return false;
      const paid = new Date(inv.paidAt);
      return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
    })
    .reduce((acc, inv) => acc + num(inv.amountDue), 0);

  const arOrders = arPendingQuery.data?.orders ?? [];
  const arSamples = arPendingQuery.data?.samples ?? [];
  const arReturns = arReturnsQuery.data ?? [];
  const arSampleRevenue = arSamples.reduce((acc, s) => acc + s.sisa, 0);

  return {
    // Navigation
    activeTab,
    setActiveTab,

    // Faktur Penjualan
    fakturJualSearch,
    setFakturJualSearch,
    invoices: invoicesQuery.data ?? [],
    filteredInvoices,
    totalReceivables,
    overdueInvoices,
    isLoadingInvoices: invoicesQuery.isLoading,

    // Faktur Pembelian
    fakturBeliSearch,
    setFakturBeliSearch,
    bills: billsQuery.data ?? [],
    filteredBills,
    totalDebt,
    paidBillsCount,
    isLoadingBills: billsQuery.isLoading,

    // Sales Orders
    salesOrderSearch,
    setSalesOrderSearch,
    filteredOrders,
    pendingVerificationOrders,
    selectedOrder,
    setSelectedOrder,
    isProofModalOpen,
    setIsProofModalOpen,
    isLoadingSalesOrders: salesOrdersQuery.isLoading,

    // AR Hub
    arHubActiveTab,
    setArHubActiveTab,
    isArModalOpen,
    setIsArModalOpen,
    selectedArInvoice,
    setSelectedArInvoice,
    openPaymentModal,
    arReceivables,
    arTotalReceivables,
    arOverdue30,
    arCollectionsMtd,
    arOrders,
    arSamples,
    arReturns,
    arSampleRevenue,
    isLoadingArPending: arPendingQuery.isLoading,
  };
}

export type PiutangOperations = ReturnType<typeof usePiutangOperations>;
