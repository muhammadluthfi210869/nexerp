"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type { PurchaseOrderRecord, ScmKpiMetrics } from "../_types/scm-pembelian.types";

export function useScmPembelianOperations() {
  const router = useRouter();
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderRecord | null>(null);

  // Live query from backend /scm/purchase-orders
  const {
    data: rawPos = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["scm-purchase-orders-list"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return unwrapResponse(res) || [];
    },
  });

  const poList: PurchaseOrderRecord[] = useMemo(() => {
    return (rawPos as any[]).map((po) => {
      const subtotal = Number(po.subtotal ?? po.totalAmount ?? 0);
      const discount = Number(po.discountAmount ?? 0);
      const shipping = Number(po.shippingCost ?? 0);
      const grandTotal = Number(po.grandTotal ?? po.totalAmount ?? subtotal - discount + shipping);

      return {
        id: po.id,
        poCode: po.poNumber || po.id,
        date: po.createdAt ? new Date(po.createdAt).toLocaleDateString("id-ID") : "-",
        supplierName: po.supplier?.name || po.vendor?.name || "Supplier Rekanan",
        supplierCategory: "Bahan Baku",
        warehouseTarget: po.warehouse?.name || "Gudang Utama",
        deadlineDate: po.dueDate ? new Date(po.dueDate).toLocaleDateString("id-ID") : "-",
        creatorName: po.creator?.name || "Admin Procurement",
        isSignedDigitally: true,
        subtotalAmount: subtotal,
        discountRp: discount,
        shippingCostRp: shipping,
        totalAmount: grandTotal,
        paymentStatus: (po.paymentStatus as any) || (po.status === "PAID" ? "PAID" : "UNPAID"),
        receivingStatus:
          po.status === "RECEIVED"
            ? "FULLY_RECEIVED"
            : po.status === "PARTIALLY_RECEIVED"
            ? "PARTIAL_RECEIVED"
            : "PENDING_INBOUND",
        items: (po.items || []).map((it: any) => ({
          id: it.id,
          materialCode: it.material?.code || it.materialId || "-",
          materialName: it.material?.name || "Item Material",
          category: "Bahan Baku",
          orderedQty: Number(it.quantity ?? it.qty ?? 0),
          goodQty: Number(it.qtyGood ?? it.quantity ?? 0),
          rejectQty: Number(it.qtyReject ?? 0),
          freeQty: Number(it.qtyFree ?? 0),
          unit: it.material?.unit || "kg",
          unitPrice: Number(it.unitPrice ?? it.price ?? 0),
          subtotal: Number(it.totalPrice ?? (it.quantity ?? 0) * (it.unitPrice ?? 0)),
        })),
        notes: po.notes,
      };
    });
  }, [rawPos]);

  // Filters
  const filteredPoList = useMemo(() => {
    return poList.filter((po) => {
      if (activeTab === "pending" && po.receivingStatus !== "PENDING_INBOUND") return false;
      if (activeTab === "partial" && po.receivingStatus !== "PARTIAL_RECEIVED") return false;
      if (activeTab === "completed" && po.receivingStatus !== "FULLY_RECEIVED") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        po.poCode.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.creatorName.toLowerCase().includes(q) ||
        po.warehouseTarget.toLowerCase().includes(q) ||
        po.items.some((it) => it.materialName.toLowerCase().includes(q) || it.materialCode.toLowerCase().includes(q))
      );
    });
  }, [poList, activeTab, searchQuery]);

  // KPIs
  const totalPoValue = useMemo(() => poList.reduce((sum, p) => sum + p.totalAmount, 0), [poList]);
  const pendingInboundCount = useMemo(
    () => poList.filter((p) => p.receivingStatus === "PENDING_INBOUND").length,
    [poList]
  );
  const fullyReceivedCount = useMemo(
    () => poList.filter((p) => p.receivingStatus === "FULLY_RECEIVED").length,
    [poList]
  );
  const partialReceivedCount = useMemo(
    () => poList.filter((p) => p.receivingStatus === "PARTIAL_RECEIVED").length,
    [poList]
  );

  const kpis: ScmKpiMetrics = {
    totalPoValue,
    totalPoCount: poList.length,
    pendingInboundCount,
    fullyReceivedCount,
    partialReceivedCount,
  };

  const handleCreatePo = () => {
    router.push("/purchase/create");
  };

  return {
    router,
    toast,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedPo,
    setSelectedPo,
    poList,
    filteredPoList,
    kpis,
    isLoading,
    isError,
    refetch,
    handleCreatePo,
  };
}
