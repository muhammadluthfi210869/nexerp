"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  PendingOrder,
  PendingSample,
  ReturnRow,
  SelectedTarget,
  AccountOption,
  ArHubKpis,
} from "../_types/ar-hub.types";

export const num = (v: unknown) => Number(v ?? 0);

export const fmtDate = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "â€”";

export function useArHubOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("products");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [receivingAccountId, setReceivingAccountId] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [bankAdminFee, setBankAdminFee] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");

  const pendingQuery = useQuery<{ orders: PendingOrder[]; samples: PendingSample[] }>({
    queryKey: ["finance-ar-hub-pending"],
    queryFn: async () => {
      const res = await api.get("/finance/ar-hub/pending");
      const body = unwrapResponse<any>(res);
      const rawOrders: any[] = body?.orders ?? [];
      const rawSamples: any[] = body?.samples ?? [];

      return {
        orders: rawOrders.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName:
            inv.so?.lead?.clientName || inv.workOrder?.lead?.clientName || "Pelanggan tidak diketahui",
          brandName: inv.so?.lead?.brandName || inv.workOrder?.lead?.brandName || "â€”",
          reference: inv.so?.orderNumber || inv.workOrder?.woNumber || "â€”",
          issuedAt: inv.issuedAt ?? null,
          dueDate: inv.dueDate ?? null,
          amountDue: num(inv.amountDue),
          outstanding: num(inv.outstandingAmount),
          status: inv.status,
          invoiceType: inv.type,
        })),
        samples: rawSamples.map((s) => ({
          id: s.id,
          activityType: s.activityType,
          clientName: s.lead?.clientName || "â€”",
          brandName: s.lead?.brandName || "â€”",
          productInterest: s.lead?.productInterest || "â€”",
          notes: s.notes || "â€”",
          amount: num(s.amount),
          createdAt: s.createdAt ?? null,
        })),
      };
    },
  });

  // Aggregate figures for the KPI row â€” real invoice ledger, not a separate store.
  const invoicesQuery = useQuery<any[]>({
    queryKey: ["finance-ar-hub-invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices");
      const body = unwrapResponse<any>(res);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const accountsQuery = useQuery<any[]>({
    queryKey: ["finance-ar-hub-accounts"],
    queryFn: async () => {
      const res = await api.get("/finance/accounts");
      const body = unwrapResponse<any>(res);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows.filter((a) => a.isActive !== false);
    },
  });

  // Sales returns live in the BusDev module; readable by BusDev/Warehouse roles.
  const returnsQuery = useQuery<ReturnRow[]>({
    queryKey: ["finance-ar-hub-returns"],
    retry: false,
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/returns");
        const body = unwrapResponse<any>(res);
        const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
        return rows.map((r) => ({
          id: r.id,
          returnDate: r.returnDate ?? null,
          returnStatus: r.returnStatus || "â€”",
          notes: r.notes || "â€”",
          soNumber: r.so?.orderNumber || "â€”",
          brandName: r.so?.brandName || "â€”",
          clientName: r.so?.lead?.clientName || "â€”",
          itemCount: Array.isArray(r.items) ? r.items.length : 0,
        }));
      } catch {
        return [];
      }
    },
  });

  const receivables = useMemo(
    () => (invoicesQuery.data ?? []).filter((inv) => inv.category === "RECEIVABLE"),
    [invoicesQuery.data],
  );

  const totalReceivables = useMemo(
    () => receivables.reduce((acc, inv) => acc + num(inv.outstandingAmount), 0),
    [receivables],
  );

  const unpaidCount = useMemo(
    () => receivables.filter((i) => num(i.outstandingAmount) > 0).length,
    [receivables],
  );

  const overdue30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return receivables
      .filter((inv) => inv.dueDate && new Date(inv.dueDate).getTime() < cutoff && num(inv.outstandingAmount) > 0)
      .reduce((acc, inv) => acc + num(inv.outstandingAmount), 0);
  }, [receivables]);

  const collectionsMtd = useMemo(() => {
    const now = new Date();
    return receivables
      .filter((inv) => {
        if (inv.status !== "PAID" || !inv.paidAt) return false;
        const paid = new Date(inv.paidAt);
        return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
      })
      .reduce((acc, inv) => acc + num(inv.amountDue), 0);
  }, [receivables]);

  const orders = pendingQuery.data?.orders ?? [];
  const samples = pendingQuery.data?.samples ?? [];
  const returns = returnsQuery.data ?? [];

  const pendingAmount = useMemo(
    () => [...orders.map((o) => o.outstanding), ...samples.map((s) => s.amount)].reduce(
      (a, b) => a + b,
      0,
    ),
    [orders, samples],
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.reference.toLowerCase().includes(search.toLowerCase()),
      ),
    [orders, search],
  );

  const filteredSamples = useMemo(
    () =>
      samples.filter(
        (s) =>
          s.clientName.toLowerCase().includes(search.toLowerCase()) ||
          s.brandName.toLowerCase().includes(search.toLowerCase()),
      ),
    [samples, search],
  );

  const openValidate = (kind: "order" | "sample", row: any) => {
    setSelected({ kind, row });
    setReceivingAccountId("");
    setActualAmount(kind === "order" ? String(row.outstanding) : String(row.amount));
    setBankAdminFee("0");
    setTaxAmount("0");
    setNotes("");
  };

  const closeModal = () => {
    setSelected(null);
    setIsSubmitting(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const amount = Number(actualAmount);
    if (!receivingAccountId || !(amount > 0)) {
      toast.error("Validasi Gagal", "Akun penerima dan nominal aktual wajib diisi.");
      return;
    }

    // Backend maps: SAMPLE_PAYMENT -> SAMPLE, DOWN_PAYMENT -> DP_ORDER,
    // and falls through to the invoice settlement branch for RECEIVABLE invoices.
    const type =
      selected.kind === "order"
        ? "PNBP"
        : selected.row.activityType === "DOWN_PAYMENT"
        ? "DP_ORDER"
        : "SAMPLE";

    setIsSubmitting(true);
    try {
      await api.post("/finance/ar-hub/verify", {
        type,
        id: selected.row.id,
        receivingAccountId,
        actualAmount: amount,
        bankAdminFee: Number(bankAdminFee) || 0,
        taxAmount: Number(taxAmount) || 0,
        notes: notes.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["finance-ar-hub-pending"] });
      await queryClient.invalidateQueries({ queryKey: ["finance-ar-hub-invoices"] });
      toast.success(
        "Pembayaran Divalidasi",
        `${selected.row.invoiceNumber ?? selected.row.clientName} berhasil divalidasi.`,
      );
      closeModal();
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error("Gagal Validasi", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions: AccountOption[] = useMemo(
    () =>
      (accountsQuery.data ?? []).map((a) => ({
        value: a.id,
        label: `${a.code} â€” ${a.name}`,
      })),
    [accountsQuery.data],
  );

  const tableError = Boolean(pendingQuery.isError || invoicesQuery.isError);

  const kpis: ArHubKpis = {
    totalReceivables,
    unpaidCount,
    overdue30,
    collectionsMtd,
    pendingCount: orders.length + samples.length,
    pendingAmount,
    isInvoicesLoading: invoicesQuery.isLoading,
    isPendingLoading: pendingQuery.isLoading,
  };

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    selected,
    isSubmitting,
    receivingAccountId,
    setReceivingAccountId,
    actualAmount,
    setActualAmount,
    bankAdminFee,
    setBankAdminFee,
    taxAmount,
    setTaxAmount,
    notes,
    setNotes,
    orders,
    samples,
    returns,
    filteredOrders,
    filteredSamples,
    accountOptions,
    tableError,
    isLoading: pendingQuery.isLoading,
    isReturnsLoading: returnsQuery.isLoading,
    isAccountsLoading: accountsQuery.isLoading,
    kpis,
    openValidate,
    closeModal,
    handleVerify,
    refetchPending: () => pendingQuery.refetch(),
    refetchInvoices: () => invoicesQuery.refetch(),
    refetchAll: () => {
      pendingQuery.refetch();
      invoicesQuery.refetch();
    },
  };
}
