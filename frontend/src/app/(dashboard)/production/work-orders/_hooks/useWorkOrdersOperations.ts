"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  WorkOrderItem,
  WorkOrderStage,
  WorkOrdersKpis,
  CreateWorkOrderFormData,
  AdvanceStageFormData,
  STAGE_LABELS,
  NEXT_STAGE_FLOW,
} from "../_types/work-orders.types";

const INITIAL_CREATE_FORM: CreateWorkOrderFormData = {
  soCode: "",
  customer: "",
  brand: "",
  product: "",
  category: "Skincare",
  netto: "30 ml",
  targetQty: 5000,
  startDate: new Date().toISOString().slice(0, 10),
  targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  pic: "Budi Santoso",
  notes: "",
};

export function useWorkOrdersOperations() {
  const toast = useDnaToast();

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<WorkOrderItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [advanceItem, setAdvanceItem] = useState<WorkOrderItem | null>(null);

  // Form states for Create WO
  const [createFormData, setCreateFormData] = useState<CreateWorkOrderFormData>(INITIAL_CREATE_FORM);

  // Advance Stage form state
  const [advanceFormData, setAdvanceFormData] = useState<AdvanceStageFormData>({
    goodQty: 0,
    rejectQty: 0,
    notes: "",
  });

  // Queries
  const { data: serverWorkOrders, isLoading } = useQuery<WorkOrderItem[]>({
    queryKey: ["production-work-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/active");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          return unwrapped.map((item: any, idx: number): WorkOrderItem => ({
            id: item.id || `wo-${idx}`,
            code: item.code || `SPK-2026-${String(idx + 1).padStart(4, "0")}`,
            batchNumber: item.batchNumber || item.batchCode || `BATCH-${item.id}`,
            salesOrderCode: item.salesOrderCode || item.soNumber || `SO-${item.id}`,
            customerName: item.customerName || item.customer?.name || "PT Cantika Glow Nusantara",
            brandName: item.brandName || item.brand || "GlowAura",
            productName: item.productName || item.product?.name || "Brightening Serum 30ml",
            category: item.category || "Skincare",
            netto: item.netto || "30 ml",
            targetQty: Number(item.targetQty) || 5000,
            goodQty: Number(item.goodQty) || 0,
            rejectQty: Number(item.rejectQty) || 0,
            startDate: item.startDate ? item.startDate.slice(0, 10) : "2026-09-08",
            targetDate: item.targetDate ? item.targetDate.slice(0, 10) : "2026-09-12",
            currentStage: (item.currentStage || "MIXING") as WorkOrderStage,
            progressPct: Number(item.progressPct) || 30,
            status: (item.status || "IN_PROGRESS") as any,
            picOperator: item.picOperator || item.pic || "Operator Produksi",
            notes: item.notes || "",
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch active work orders", err);
      }
      return [];
    },
  });

  const [localWorkOrders, setLocalWorkOrders] = useState<WorkOrderItem[]>([]);
  const workOrders = useMemo(() => {
    return [...localWorkOrders, ...(serverWorkOrders || [])];
  }, [localWorkOrders, serverWorkOrders]);

  // Filtered list
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (activeTab === "WAITING" && wo.currentStage !== "WAITING_MATERIAL") return false;
      if (activeTab === "MIXING" && wo.currentStage !== "MIXING") return false;
      if (activeTab === "FILLING" && wo.currentStage !== "FILLING") return false;
      if (activeTab === "PACKING" && wo.currentStage !== "PACKING") return false;
      if (activeTab === "QC_HOLD" && wo.currentStage !== "QC_HOLD") return false;
      if (activeTab === "FINISHED" && wo.currentStage !== "FINISHED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = wo.code.toLowerCase().includes(q);
        const matchBatch = wo.batchNumber.toLowerCase().includes(q);
        const matchCustomer = wo.customerName.toLowerCase().includes(q);
        const matchBrand = wo.brandName.toLowerCase().includes(q);
        const matchProduct = wo.productName.toLowerCase().includes(q);
        const matchSo = wo.salesOrderCode.toLowerCase().includes(q);
        if (!matchCode && !matchBatch && !matchCustomer && !matchBrand && !matchProduct && !matchSo) {
          return false;
        }
      }
      return true;
    });
  }, [workOrders, activeTab, searchQuery]);

  // KPI Calculations
  const kpis: WorkOrdersKpis = useMemo(() => {
    return {
      totalActive: workOrders.filter((w) => w.status !== "COMPLETED" && w.status !== "CANCELLED").length,
      inMixing: workOrders.filter((w) => w.currentStage === "MIXING").length,
      inFilling: workOrders.filter((w) => w.currentStage === "FILLING").length,
      inPacking: workOrders.filter((w) => w.currentStage === "PACKING").length,
      qcHoldCount: workOrders.filter((w) => w.currentStage === "QC_HOLD").length,
      completedCount: workOrders.filter((w) => w.currentStage === "FINISHED" || w.status === "COMPLETED").length,
    };
  }, [workOrders]);

  const handleOpenDetailDrawer = (wo: WorkOrderItem) => {
    setDetailItem(wo);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
  };

  const handleOpenAdvanceModal = (wo: WorkOrderItem) => {
    setAdvanceItem(wo);
    setAdvanceFormData({
      goodQty: wo.goodQty || wo.targetQty,
      rejectQty: wo.rejectQty || 0,
      notes: wo.notes || "",
    });
  };

  const handleCloseAdvanceModal = () => {
    setAdvanceItem(null);
  };

  const handleCreateWo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!createFormData.product || !createFormData.customer) {
      toast.error("Validasi Gagal", "Harap isi nama klien dan nama produk.");
      return;
    }

    const newWo: WorkOrderItem = {
      id: `wo-${Date.now()}`,
      code: `SPK-2026-${String(workOrders.length + 45).padStart(4, "0")}`,
      batchNumber: `BATCH-${createFormData.brand.slice(0, 4).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      salesOrderCode: createFormData.soCode || `SO-2026-0${workOrders.length + 200}`,
      customerName: createFormData.customer,
      brandName: createFormData.brand,
      productName: createFormData.product,
      category: createFormData.category,
      netto: createFormData.netto,
      targetQty: Number(createFormData.targetQty),
      goodQty: 0,
      rejectQty: 0,
      startDate: createFormData.startDate,
      targetDate: createFormData.targetDate,
      currentStage: "WAITING_MATERIAL",
      progressPct: 5,
      status: "IN_PROGRESS",
      picOperator: createFormData.pic,
      notes: createFormData.notes || "",
    };

    setLocalWorkOrders([newWo, ...localWorkOrders]);
    setIsCreateModalOpen(false);
    toast.success("SPK Berhasil Diterbitkan", `Surat Perintah Kerja ${newWo.code} untuk ${newWo.productName} telah dibuat.`);
  };

  const handleAdvanceStage = () => {
    if (!advanceItem) return;
    const nextStage = NEXT_STAGE_FLOW[advanceItem.currentStage];
    advanceItem.currentStage = nextStage;
    advanceItem.goodQty = advanceFormData.goodQty || advanceItem.goodQty;
    advanceItem.rejectQty = advanceFormData.rejectQty || advanceItem.rejectQty;

    if (nextStage === "MIXING") advanceItem.progressPct = 30;
    else if (nextStage === "FILLING") advanceItem.progressPct = 60;
    else if (nextStage === "PACKING") advanceItem.progressPct = 85;
    else if (nextStage === "QC_HOLD") advanceItem.progressPct = 95;
    else if (nextStage === "FINISHED") {
      advanceItem.progressPct = 100;
      advanceItem.status = "COMPLETED";
    }

    setAdvanceItem(null);
    toast.success("Tahapan Berhasil Dimajukan", `${advanceItem.code} kini berada pada tahap: ${STAGE_LABELS[nextStage]?.label}`);
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isLoading,
    workOrders,
    filteredWorkOrders,
    kpis,
    // Modals & Drawer
    isCreateModalOpen,
    setIsCreateModalOpen,
    detailItem,
    isDetailDrawerOpen,
    advanceItem,
    // Form states & setters
    createFormData,
    setCreateFormData,
    advanceFormData,
    setAdvanceFormData,
    // Handlers
    handleCreateWo,
    handleAdvanceStage,
    handleOpenDetailDrawer,
    handleCloseDetailDrawer,
    handleOpenAdvanceModal,
    handleCloseAdvanceModal,
  };
}
