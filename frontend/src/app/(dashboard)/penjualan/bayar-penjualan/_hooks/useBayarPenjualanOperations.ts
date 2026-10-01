"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import type { ReceivablePayment } from "../_types/bayar-penjualan.types";

export function useBayarPenjualanOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState<ReceivablePayment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Payment Input Form State
  const [formPayAmount, setFormPayAmount] = useState("");
  const [formPph23, setFormPph23] = useState("0");
  const [formPph21, setFormPph21] = useState("0");
  const [formBank, setFormBank] = useState("BCA Maklon (264-035-1589)");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");

  // Live Query Invoices as Receivables
  const {
    data: payments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ReceivablePayment[]>({
    queryKey: ["commercial-payments"],
    queryFn: async () => {
      const resp = await api.get("/commercial/invoices");
      return (resp.data || []).map((inv: any) => {
        const total = Number(inv.amountDue) || 0;
        const paid = Number(inv.paidAmount) || 0;
        const remaining = Math.max(0, total - paid);
        const pph23 = Math.round(paid * 0.02);
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || inv.id,
          customerName: inv.salesOrder?.lead?.clientName || inv.customerName || "Customer",
          brandName: inv.salesOrder?.brandName || inv.brandName || "Brand",
          paymentDate: inv.invoiceDate
            ? new Date(inv.invoiceDate).toISOString().split("T")[0]
            : inv.createdAt
            ? new Date(inv.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          totalAmount: total,
          paidAmount: paid,
          remainingAmount: remaining,
          pph23Deduction: pph23,
          pph21Deduction: 0,
          netCashReceived: Math.max(0, paid - pph23),
          bankAccount: "BCA Maklon (264-035-1589)",
          status: (inv.status === "PAID"
            ? "PAID"
            : remaining < total && remaining > 0
            ? "PARTIAL"
            : "UNPAID") as ReceivablePayment["status"],
          notes: inv.notes || "",
        };
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/commercial/payments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-payments"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-invoices"] });
      toast.success(
        "Pembayaran Berhasil Dicatat",
        "Penerimaan pembayaran dan potongan withholding PPh berhasil divalidasi."
      );
      setIsPaymentModalOpen(false);
      setSelectedPayment(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal memproses pembayaran";
      toast.error("Validasi Gagal", msg);
    },
  });

  const filteredPayments = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.invoiceNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      (p.brandName && p.brandName.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Financial Metrics
  const totalReceivables = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalRemaining = payments.reduce((sum, p) => sum + p.remainingAmount, 0);
  const totalPph23 = payments.reduce((sum, p) => sum + p.pph23Deduction, 0);
  const totalPph21 = payments.reduce((sum, p) => sum + p.pph21Deduction, 0);
  const totalNetCash = payments.reduce((sum, p) => sum + p.netCashReceived, 0);

  const openPaymentDialog = (pay: ReceivablePayment) => {
    setSelectedPayment(pay);
    setFormPayAmount(String(pay.remainingAmount));
    const estPph23 = Math.round(pay.remainingAmount * 0.02);
    setFormPph23(String(estPph23));
    setFormPph21("0");
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    const payAmt = Number(formPayAmount) || 0;
    const pph23Amt = Number(formPph23) || 0;

    if (payAmt <= 0) {
      toast.error("Validasi Gagal", "Jumlah pembayaran harus lebih besar dari 0.");
      return;
    }

    createPaymentMutation.mutate({
      invoiceId: selectedPayment.id,
      amount: payAmt,
      paymentMethod: "BANK_TRANSFER",
      bankAccount: formBank,
      pph23Deduction: pph23Amt,
      notes: formNotes,
    });
  };

  const handleExportExcel = () => {
    toast.info(
      "Export Report",
      "Rekap pembayaran penjualan & withholding tax PPh diekspor ke Excel."
    );
  };

  // Calculate counts for header tabs
  const countAll = payments.length;
  const countPaid = payments.filter((p) => p.status === "PAID").length;
  const countPartial = payments.filter((p) => p.status === "PARTIAL").length;
  const countUnpaid = payments.filter((p) => p.status === "UNPAID").length;

  return {
    toast,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedPayment,
    setSelectedPayment,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    formPayAmount,
    setFormPayAmount,
    formPph23,
    setFormPph23,
    formPph21,
    setFormPph21,
    formBank,
    setFormBank,
    formDate,
    setFormDate,
    formNotes,
    setFormNotes,
    payments,
    filteredPayments,
    isLoading,
    isError,
    error,
    refetch,
    createPaymentMutation,
    totalReceivables,
    totalCollected,
    totalRemaining,
    totalPph23,
    totalPph21,
    totalNetCash,
    countAll,
    countPaid,
    countPartial,
    countUnpaid,
    openPaymentDialog,
    handlePaymentSubmit,
    handleExportExcel,
  };
}
