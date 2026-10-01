"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { toast } from "sonner";
import type {
  ProcurementItem,
  InternalTransferItem,
  StockOpnameItem,
  LogisticsItem,
  Warehouse,
  Material,
  FefoData,
  TransferFormItem,
  OpnameFormItem,
} from "../_types/workstation.types";

export function useWorkstationOperations() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("procurement");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [selectedIssueItem, setSelectedIssueItem] = useState<LogisticsItem | any>(null);
  const [selectedOpname, setSelectedOpname] = useState<StockOpnameItem | any>(null);
  const [managerPin, setManagerPin] = useState("");

  // Transfer Form State
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [destWarehouse, setDestWarehouse] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transferItems, setTransferItems] = useState<TransferFormItem[]>([]);
  const [newMatId, setNewMatId] = useState("");
  const [newMatQty, setNewMatQty] = useState("");

  // Opname Form State
  const [opnameWarehouse, setOpnameWarehouse] = useState("");
  const [opnameItems, setOpnameItems] = useState<OpnameFormItem[]>([]);

  // Queries
  const { data: procurementItems = [] } = useQuery<ProcurementItem[]>({
    queryKey: ["ws-procurement"],
    queryFn: () => api.get("/scm/purchase-orders").then((r) => r.data?.slice?.(0, 5) || []),
  });

  const { data: internalTransfers = [] } = useQuery<InternalTransferItem[]>({
    queryKey: ["ws-transfers"],
    queryFn: () => api.get("/warehouse/transfers").then((r) => r.data?.slice?.(0, 5) || []),
  });

  const { data: stockOpnames = [] } = useQuery<StockOpnameItem[]>({
    queryKey: ["ws-opnames"],
    queryFn: () => api.get("/warehouse/opname").then((r) => r.data?.slice?.(0, 5) || []),
  });

  const { data: logisticsItems = [] } = useQuery<LogisticsItem[]>({
    queryKey: ["ws-release"],
    queryFn: () => api.get("/warehouse/release-requests").then((r) => r.data?.slice?.(0, 5) || []),
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["ws-warehouses"],
    queryFn: () => api.get("/master/warehouses").then((r) => r.data || []),
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["ws-materials"],
    // GET /master/materials is paginated ({ data, total, ... }) â€” unwrap before .map.
    queryFn: () => api.get("/master/materials").then(unwrapResponse),
  });

  const { data: fefoData } = useQuery<FefoData>({
    queryKey: ["ws-fefo", selectedIssueItem?.materialId],
    queryFn: () => api.get(`/warehouse/suggest-batch/${selectedIssueItem.materialId}`).then((r) => r.data),
    enabled: !!selectedIssueItem?.materialId,
  });

  const fefoSuggestion: FefoData = fefoData || {
    suggestedBatch: { batchNumber: "B240420-A", expDate: "2024-12-31", location: { name: "AISLE 4-B" } },
  };
  const isFefoLoading = false;

  // Mutations
  const createOpnameMutation = useMutation({
    mutationFn: (data: any) => api.post("/warehouse/opname", data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Stock Opname created.");
      queryClient.invalidateQueries({ queryKey: ["ws-opnames"] });
      setIsOpnameModalOpen(false);
      setOpnameItems([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: any) => api.post("/warehouse/transfers", data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Transfer order created.");
      queryClient.invalidateQueries({ queryKey: ["ws-transfers"] });
      setIsTransferModalOpen(false);
      setTransferItems([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const approveOpnameMutation = useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) =>
      api.post(`/warehouse/opname/${id}/approve-pin`, { userId: "system", pin }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Opname approved. Inventory adjusted.");
      queryClient.invalidateQueries({ queryKey: ["ws-opnames"] });
      setSelectedOpname(null);
      setManagerPin("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "PIN verification failed"),
  });

  const issueBatchMutation = useMutation({
    mutationFn: (data: { batchId: string; status: string }) =>
      api.post(`/warehouse/batches/${data.batchId}/status`, { status: data.status, userId: "system" }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Batch issued following FEFO protocol.");
      setSelectedIssueItem(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const handleIssueConfirmation = () => {
    const batchId = fefoSuggestion?.suggestedBatch?.batchNumber;
    if (batchId) {
      issueBatchMutation.mutate({ batchId, status: "ISSUED" });
    } else {
      // No FEFO batch to issue, so no request is made.
      toast.error("Tidak ada batch FEFO untuk material ini â€” tidak ada pengeluaran stok yang tercatat.");
    }
  };

  const addTransferMaterial = (matId: string) => {
    const mat = materials.find((m: any) => m.id === matId);
    if (!mat) return;
    setTransferItems([...transferItems, { materialId: mat.id, materialName: mat.name, qty: 1 }]);
    setNewMatId("");
  };

  const addOpnameMaterial = (matId: string) => {
    const mat = materials.find((m: any) => m.id === matId);
    if (!mat) return;
    if (opnameItems.find((i) => i.materialId === matId)) return;
    setOpnameItems([
      ...opnameItems,
      {
        materialId: mat.id,
        name: mat.name,
        systemQty: Number(mat.stockQty || 0),
        actualQty: Number(mat.stockQty || 0),
      },
    ]);
  };

  const handleCreateOpname = () => {
    if (!opnameWarehouse) return toast.error("Select a warehouse.");
    if (opnameItems.length === 0) return toast.error("Add at least one material.");
    createOpnameMutation.mutate({
      warehouseId: opnameWarehouse,
      picId: "system",
      items: opnameItems.map((i) => ({
        materialId: i.materialId,
        systemQty: i.systemQty,
        actualQty: i.actualQty,
      })),
    });
  };

  const handleCreateTransfer = () => {
    if (!sourceWarehouse || !destWarehouse) return toast.error("Select both warehouses.");
    if (transferItems.length === 0) return toast.error("Add at least one material.");
    createTransferMutation.mutate({
      sourceWarehouseId: sourceWarehouse,
      destWarehouseId: destWarehouse,
      items: transferItems.map((i) => ({ materialId: i.materialId, qty: i.qty })),
      notes: vehicleNo ? `Vehicle: ${vehicleNo}` : undefined,
    });
  };

  const handleApproveOpname = () => {
    if (selectedOpname && managerPin.length >= 4) {
      approveOpnameMutation.mutate({ id: selectedOpname.id, pin: managerPin });
    }
  };

  return {
    activeTab,
    setActiveTab,
    isTransferModalOpen,
    setIsTransferModalOpen,
    isOpnameModalOpen,
    setIsOpnameModalOpen,
    selectedIssueItem,
    setSelectedIssueItem,
    selectedOpname,
    setSelectedOpname,
    managerPin,
    setManagerPin,
    sourceWarehouse,
    setSourceWarehouse,
    destWarehouse,
    setDestWarehouse,
    vehicleNo,
    setVehicleNo,
    transferItems,
    setTransferItems,
    newMatId,
    setNewMatId,
    newMatQty,
    setNewMatQty,
    opnameWarehouse,
    setOpnameWarehouse,
    opnameItems,
    setOpnameItems,
    procurementItems,
    internalTransfers,
    stockOpnames,
    logisticsItems,
    warehouses,
    materials,
    fefoSuggestion,
    isFefoLoading,
    createOpnameMutation,
    createTransferMutation,
    approveOpnameMutation,
    issueBatchMutation,
    handleIssueConfirmation,
    handleApproveOpname,
    handleCreateOpname,
    handleCreateTransfer,
    addTransferMaterial,
    addOpnameMaterial,
  };
}
