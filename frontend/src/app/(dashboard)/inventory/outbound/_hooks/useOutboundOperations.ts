import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { DeliveryOutItem, OutboundFormData } from "../_types/outbound.types";

export function useOutboundOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPurchaseReturn = searchParams.get("type") === "purchase-return";
  const actionParam = searchParams.get("action");
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedDo, setSelectedDo] = useState<DeliveryOutItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: rawShipments = [], isLoading } = useQuery({
    queryKey: ["fulfillment-shipments"],
    queryFn: async () => {
      try {
        const res = await api.get("/fulfillment/shipments");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: rawSalesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/commercial/sales-orders");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const deliveries: DeliveryOutItem[] = useMemo(() => {
    if (!rawShipments || !Array.isArray(rawShipments)) return [];
    return rawShipments.map((s: any) => ({
      id: s.id,
      code: `DO-${s.id.slice(0, 8).toUpperCase()}`,
      date: s.shippedAt ? new Date(s.shippedAt).toISOString().split("T")[0] : "-",
      soNumber: s.so?.orderNumber || s.soId || "-",
      soDate: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : "-",
      customer: s.so?.lead?.clientName || "Pelanggan",
      creator: "Logistics Officer",
      courier: s.notes?.includes("[Ekspedisi:")
        ? s.notes.split("[Ekspedisi:")[1]?.split("]")[0]?.trim()
        : "Logistik Internal",
      trackingNo: s.trackingNo || "-",
      status: (s.status as DeliveryOutItem["status"]) || "SHIPPED",
      notes: s.notes || "-",
      items: (s.items && s.items.length > 0)
        ? s.items.map((it: any) => ({
            name: it.material?.name || "Produk Maklon",
            unit: "pcs",
            qtySales: Number(it.qty || 0),
            qtyAvailable: Number(it.qty || 0),
            qtyShip: Number(it.qty || 0),
          }))
        : [
            {
              name: `Pengiriman SO ${s.so?.orderNumber || s.soId?.slice(0, 8) || ""}`,
              unit: "batch",
              qtySales: 1,
              qtyAvailable: 1,
              qtyShip: 1,
            },
          ],
    }));
  }, [rawShipments]);

  // Form State
  const [formData, setFormData] = useState<OutboundFormData>({
    code: `DO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split("T")[0],
    soId: "",
    soNumber: "",
    customer: "",
    courier: "JNE Cargo",
    trackingNo: "",
    notes: "",
    items: [],
  });

  useEffect(() => {
    if (rawSalesOrders.length > 0 && !formData.soId) {
      const firstSo = rawSalesOrders[0];
      setFormData((prev) => ({
        ...prev,
        soId: firstSo.id,
        soNumber: firstSo.orderNumber || firstSo.id,
        customer: firstSo.lead?.clientName || "Pelanggan",
      }));
    }
  }, [rawSalesOrders, formData.soId]);

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return deliveries.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.courier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [deliveries, searchTerm, statusFilter]);

  const totalDelivered = useMemo(() => deliveries.filter((d) => d.status === "DELIVERED").length, [deliveries]);
  const totalShipped = useMemo(() => deliveries.filter((d) => d.status === "SHIPPED").length, [deliveries]);
  const totalPacking = useMemo(() => deliveries.filter((d) => d.status === "PACKING").length, [deliveries]);

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    router.push(isPurchaseReturn ? "/inventory/outbound?type=purchase-return&action=create" : "/delivery-out/create");
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    if (actionParam === "create") {
      router.push(isPurchaseReturn ? "/inventory/outbound?type=purchase-return" : "/delivery-out");
    }
  };

  const handleViewDetail = (item: DeliveryOutItem) => {
    setSelectedDo(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const handlePrint = (item: DeliveryOutItem) => {
    toast({
      title: "Mencetak Surat Jalan",
      description: `Mengunduh PDF Surat Jalan ${item.code}`,
      variant: "info",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.soId) {
      toast.warning("Pilih Sales Order terlebih dahulu");
      return;
    }

    try {
      await api.post("/fulfillment/shipments", {
        soId: formData.soId,
        logisticsId: "00000000-0000-0000-0000-000000000001",
        trackingNo: formData.trackingNo || undefined,
        notes: `[Ekspedisi: ${formData.courier}] ${formData.notes || ""}`.trim() || undefined,
      });

      toast.success("Surat Jalan pengiriman berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: ["fulfillment-shipments"] });
      setIsCreateOpen(false);
      if (actionParam === "create") {
        router.push(isPurchaseReturn ? "/inventory/outbound?type=purchase-return" : "/delivery-out");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat surat jalan pengiriman");
    }
  };

  const handleUpdateStatus = async (id: string, status: "DELIVERED" | "SHIPPED") => {
    try {
      await api.patch(`/fulfillment/shipments/${id}/status`, { status });
      toast.success(`Status pengiriman berhasil diubah menjadi ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["fulfillment-shipments"] });
      setSelectedDo(null);
      setIsDetailOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal memperbarui status pengiriman");
    }
  };

  return {
    isPurchaseReturn,
    actionParam,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedDo,
    isDetailOpen,
    isCreateOpen,
    rawSalesOrders,
    deliveries,
    filteredData,
    totalDelivered,
    totalShipped,
    totalPacking,
    formData,
    setFormData,
    handleOpenCreate,
    handleCloseCreate,
    handleViewDetail,
    handleCloseDetail,
    handlePrint,
    handleSave,
    handleUpdateStatus,
  };
}
