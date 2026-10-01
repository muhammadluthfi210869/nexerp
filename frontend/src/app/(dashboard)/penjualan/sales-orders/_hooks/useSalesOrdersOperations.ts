"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api";
import { unwrapData } from "@/lib/api-client";
import { useDnaToast } from "@/components/dna";
import type {
  SalesOrderItem,
  SalesOrderFormData,
  SalesOrderItemLine,
  CodeFormatType,
} from "../_types/sales-orders.types";

const defaultInitialItem: SalesOrderItemLine = {
  itemName: "",
  netto: "50ml",
  qty: 2000,
  unitPrice: 35000,
  discount: 0,
  subtotal: 70000000,
};

const defaultFormValues: SalesOrderFormData = {
  customerName: "",
  brandName: "",
  category: "MAKLON_BARU",
  orderDate: new Date().toISOString().slice(0, 10),
  deadlineFinal: "2026-10-31",
  deadlineDesign: "2026-09-20",
  deadlineRnd: "2026-09-28",
  deadlineScm: "2026-10-08",
  deadlineProduction: "2026-10-25",
  items: [{ ...defaultInitialItem }],
  notes: "",
};

export function useSalesOrdersOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedColumn, setSelectedColumn] = useState("ALL");
  const [filterValue, setFilterValue] = useState("ALL");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("ALL");
    setFilterValue("ALL");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SalesOrderItem | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [codeType, setCodeType] = useState<CodeFormatType>("SHORT");
  const [form, setForm] = useState<SalesOrderFormData>(defaultFormValues);

  // Query commercial sales orders
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useApiQuery<SalesOrderItem[]>(
    ["commercial-sales-orders"],
    async () => {
      const resp = await api.get("/commercial/sales-orders");
      const raw = unwrapData<any[]>(resp.data);
      const items = Array.isArray(raw) ? raw : [];
      return items.map((so: any) => ({
        id: so.id,
        soCode: so.orderNumber,
        orderDate: so.orderDate
          ? new Date(so.orderDate).toISOString().slice(0, 10)
          : so.createdAt
          ? new Date(so.createdAt).toISOString().slice(0, 10)
          : "",
        customerName: so.lead?.clientName || so.customerName || "Pelanggan",
        brandName: so.brandName || so.lead?.brandName || "Brand",
        category: (so.salesCategory || so.category || "MAKLON_BARU") as SalesOrderItem["category"],
        deadlineFinal: so.deadlineFinal
          ? new Date(so.deadlineFinal).toISOString().slice(0, 10)
          : "-",
        deadlinePic: {
          design: so.deadlineDesign
            ? new Date(so.deadlineDesign).toISOString().slice(0, 10)
            : "-",
          rnd: so.deadlineRnd ? new Date(so.deadlineRnd).toISOString().slice(0, 10) : "-",
          scm: so.deadlineScm ? new Date(so.deadlineScm).toISOString().slice(0, 10) : "-",
          production: so.deadlineProduction
            ? new Date(so.deadlineProduction).toISOString().slice(0, 10)
            : "-",
        },
        items: (so.items || []).map((it: any) => ({
          itemName: it.productName || it.description || "Item",
          netto: it.netto ? `${it.netto}` : "30g",
          qty: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          discount: Number(it.discount) || 0,
          subtotal:
            (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0),
        })),
        grandTotal: Number(so.totalAmount) || 0,
        approvalStatus: so.status || "PENDING",
        gatekeeperStatus: (so.deliveryGateStatus || "HELD") as "HELD" | "RELEASED",
        notes: so.notes || "",
      }));
    },
  );

  // Query leads for customer matching
  const { data: leads = [] } = useApiQuery<any[]>(
    ["bussdev-leads"],
    async () => {
      try {
        const resp = await api.get("/bussdev/leads");
        return unwrapData<any[]>(resp.data) || [];
      } catch {
        return [];
      }
    }
  );

  // Filter column and status definitions
  const customerOptions = useMemo(
    () => Array.from(new Set(orders.map((o) => o.customerName).filter(Boolean))) as string[],
    [orders]
  );

  const filterColumns = useMemo(
    () => [
      {
        key: "category",
        label: "Kategori Order",
        type: "select" as const,
        options: ["MAKLON_BARU", "REPEAT_ORDER", "JUAL_PUTUS"],
      },
      {
        key: "gatekeeper",
        label: "Gatekeeper DO",
        type: "select" as const,
        options: ["RELEASED", "HELD"],
      },
      {
        key: "customer",
        label: "Pelanggan",
        type: "select" as const,
        options: customerOptions,
      },
      { key: "sort_total", label: "Nilai SO (Tertinggi / Terendah)", type: "sort_numeric" as const },
      { key: "sort_code", label: "No. SO (A-Z / Z-A)", type: "sort_alpha" as const },
    ],
    [customerOptions]
  );

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "Semua Status" },
      { value: "PENDING", label: "Menunggu Approval", color: "amber" as const },
      { value: "IN_PRODUCTION", label: "Proses Pabrik", color: "purple" as const },
      { value: "COMPLETED", label: "Selesai", color: "emerald" as const },
      { value: "APPROVED", label: "Approved", color: "blue" as const },
    ],
    []
  );

  // KPI calculations
  const totalOmzet = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalPending = orders.filter((o) => o.approvalStatus === "PENDING").length;
  const totalInProd = orders.filter((o) => o.approvalStatus === "IN_PRODUCTION").length;
  const totalReleased = orders.filter((o) => o.gatekeeperStatus === "RELEASED").length;

  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => {
      const matchStatus = selectedStatus === "ALL" || o.approvalStatus === selectedStatus;

      let matchColumn = true;
      if (selectedColumn === "category" && filterValue !== "ALL") {
        matchColumn = o.category === filterValue;
      } else if (selectedColumn === "gatekeeper" && filterValue !== "ALL") {
        matchColumn = o.gatekeeperStatus === filterValue;
      } else if (selectedColumn === "customer" && filterValue !== "ALL") {
        matchColumn = o.customerName === filterValue;
      }

      let matchDate = true;
      if (dateMode !== "ALL" && o.orderDate) {
        const itemDate = new Date(o.orderDate);
        if (!isNaN(itemDate.getTime())) {
          const now = new Date();
          if (dateMode === "1_DAY") {
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            matchDate = itemDate >= oneDayAgo && itemDate <= now;
          } else if (dateMode === "1_WEEK") {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchDate = itemDate >= oneWeekAgo && itemDate <= now;
          } else if (dateMode === "1_MONTH") {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchDate = itemDate >= oneMonthAgo && itemDate <= now;
          } else if (dateMode === "1_YEAR") {
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            matchDate = itemDate >= oneYearAgo && itemDate <= now;
          } else if (dateMode === "CUSTOM" && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchDate = itemDate >= start && itemDate <= end;
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = o.soCode.toLowerCase().includes(q);
        const matchCustomer = o.customerName.toLowerCase().includes(q);
        const matchBrand = o.brandName.toLowerCase().includes(q);
        if (!matchCode && !matchCustomer && !matchBrand) return false;
      }

      return matchStatus && matchColumn && matchDate;
    });

    if (selectedColumn === "sort_total") {
      result = [...result].sort((a, b) =>
        filterValue === "asc" ? a.grandTotal - b.grandTotal : b.grandTotal - a.grandTotal
      );
    } else if (selectedColumn === "sort_code") {
      result = [...result].sort((a, b) =>
        filterValue === "desc"
          ? b.soCode.localeCompare(a.soCode)
          : a.soCode.localeCompare(b.soCode)
      );
    }

    return result;
  }, [orders, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate, searchQuery]);

  // Gatekeeper mutation
  const gatekeeperMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "HELD" | "RELEASED" }) => {
      return api.post(`/commercial/sales-orders/${id}/delivery-gate`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["commercial-sales-orders"] });
      toast.success(
        `Gatekeeper Pengiriman diubah ke ${variables.status}. ${
          variables.status === "RELEASED"
            ? "Gudang diizinkan mencetak Surat Jalan / DO."
            : "Gudang dikunci dari pengiriman."
        }`
      );
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal mengubah gatekeeper";
      toast.error(msg);
    },
  });

  // Create SO mutation
  const createSOMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/commercial/sales-orders", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-sales-orders"] });
      toast.success("Sales Order berhasil diterbitkan!");
      setIsCreateOpen(false);
      setForm(defaultFormValues);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal menerbitkan SO";
      toast.error(msg);
    },
  });

  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemName: "",
          netto: "30ml",
          qty: 1000,
          unitPrice: 25000,
          discount: 0,
          subtotal: 25000000,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (form.items.length <= 1) {
      toast.warning("Minimal harus ada 1 item produk dalam Sales Order!");
      return;
    }
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateItem = (index: number, field: keyof SalesOrderItemLine, val: any) => {
    setForm((prev) => {
      const updated = [...prev.items];
      const target = { ...updated[index], [field]: val };
      const qty = Number(target.qty) || 0;
      const price = Number(target.unitPrice) || 0;
      const disc = Number(target.discount) || 0;
      target.subtotal = qty * price - disc;
      updated[index] = target;
      return { ...prev, items: updated };
    });
  };

  const handleCreateSO = () => {
    if (!form.customerName.trim()) {
      toast.warning("Nama Pelanggan wajib diisi!");
      return;
    }

    const validItems = form.items.filter((it) => it.itemName.trim().length > 0);
    if (validItems.length === 0) {
      toast.warning("Minimal harus mengisi 1 nama produk valid!");
      return;
    }

    const matchedCustomer = leads.find(
      (c: any) =>
        c.clientName?.toLowerCase() === form.customerName.trim().toLowerCase() ||
        c.name?.toLowerCase() === form.customerName.trim().toLowerCase()
    );
    const leadId = matchedCustomer?.id || (leads[0]?.id ?? "00000000-0000-0000-0000-000000000001");

    createSOMutation.mutate({
      leadId,
      salesCategory: form.category,
      brandName: form.brandName || form.customerName,
      deadlineFinal: form.deadlineFinal,
      deadlineDesign: form.deadlineDesign,
      deadlineRnd: form.deadlineRnd,
      deadlineScm: form.deadlineScm,
      deadlineProduction: form.deadlineProduction,
      notes: form.notes,
      items: validItems.map((it) => ({
        materialId: "00000000-0000-0000-0000-000000000001",
        productName: it.itemName,
        netto: it.netto,
        quantity: Number(it.qty) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discount: Number(it.discount) || 0,
      })),
    });
  };

  const handleToggleGatekeeper = (so: SalesOrderItem) => {
    const nextStatus = so.gatekeeperStatus === "HELD" ? "RELEASED" : "HELD";
    gatekeeperMutation.mutate({ id: so.id, status: nextStatus });
    if (selectedDetail && selectedDetail.id === so.id) {
      setSelectedDetail((prev) => (prev ? { ...prev, gatekeeperStatus: nextStatus } : null));
    }
  };

  return {
    // State & Filter Props
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    selectedColumn,
    setSelectedColumn,
    filterValue,
    setFilterValue,
    dateMode,
    setDateMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    statusOptions,
    filterColumns,
    handleResetAll,

    // Modals & Drawers
    isCreateOpen,
    setIsCreateOpen,
    selectedDetail,
    setSelectedDetail,
    codeType,
    setCodeType,
    form,
    setForm,
    handleAddItem,
    handleRemoveItem,
    handleUpdateItem,

    // Data & KPIs
    orders,
    filteredOrders,
    isLoading,
    isError,
    error,
    refetch,
    totalOmzet,
    totalPending,
    totalInProd,
    totalReleased,

    // Handlers
    handleCreateSO,
    handleToggleGatekeeper,
    isSubmitting: createSOMutation.isPending,
    isTogglingGatekeeper: gatekeeperMutation.isPending,
    toast,
  };
}

export type UseSalesOrdersOperationsReturn = ReturnType<typeof useSalesOrdersOperations>;
