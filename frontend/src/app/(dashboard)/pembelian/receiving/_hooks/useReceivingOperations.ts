import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { Receipt, PurchaseOrderOption, ReceivingTab } from "../_types/receiving.types";

export function useReceivingOperations() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useDnaToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState("");
  const [doRef, setDoRef] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [taxTreatment, setTaxTreatment] = useState("PPN_11");

  const [activeTab, setActiveTab] = useState<ReceivingTab | string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const { data: purchaseOrders } = useQuery<PurchaseOrderOption[]>({
    queryKey: ["approved-po"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return (unwrapResponse(res) || [])
        .filter((po: any) => po.status === "ORDERED" || po.status === "PARTIAL")
        .map((po: any) => ({
          id: po.poNumber || po.id,
          vendor: po.supplier?.name || "-",
          items: (po.items || []).map((i: any) => ({
            id: i.material?.id || i.materialId,
            name: i.material?.name || "-",
            qty: Number(i.quantity || 0),
            unit: i.material?.unit || "PCS",
          })),
        }));
    },
  });

  const { data: receipts = [], isLoading } = useQuery<Receipt[]>({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/scm/inbounds");
      const toNum = (v: any) => Number(v ?? 0);
      return (unwrapResponse(res) || []).map((grn: any) => {
        const items = grn.items || [];
        let qtyBagus = 0,
          qtyReject = 0,
          qtyFree = 0;
        for (const it of items) {
          const q = toNum(it.qtyActual);
          if (it.qcStatus === "GOOD") qtyBagus += q;
          else if (it.qcStatus === "REJECT") qtyReject += q;
          else qtyFree += q;
        }
        return {
          id: grn.inboundNumber || grn.id,
          poId: grn.po?.poNumber || grn.poId || "-",
          vendor: grn.po?.supplier?.name || grn.supplier?.name || grn.vendorName || "-",
          date: grn.receivedAt ? new Date(grn.receivedAt).toISOString().split("T")[0] : "-",
          status: grn.status === "APPROVED" ? "VERIFIED" : "PENDING",
          qc: grn.status === "APPROVED" ? "PASSED" : "WAITING",
          qtyBagus,
          qtyReject,
          qtyFree,
          items: items.map((it: any) => ({
            name: it.material?.name || it.itemName || "Material",
            qtyActual: toNum(it.qtyActual),
            qcStatus: it.qcStatus || "PENDING",
          })),
        };
      });
    },
  });

  const createGRNMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/inbounds", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Kedatangan GRN berhasil didaftarkan. Menunggu verifikasi QC Lab.");
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["approved-po"] });
      setIsModalOpen(false);
      setSelectedPO("");
      setDoRef("");
      setInvoiceNo("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mendaftarkan GRN.");
    },
  });

  const arrivalsToday = receipts?.filter((r) => r.date === new Date().toISOString().split("T")[0]).length || 0;
  const awaitingQc = receipts?.filter((r) => r.qc === "WAITING").length || 0;
  const verifiedMtd = receipts?.filter((r) => r.status === "VERIFIED").length || 0;
  const rejected = receipts?.filter((r) => r.status === "REJECTED" || r.qc === "FAILED").length || 0;

  const poOptions = (purchaseOrders || []).map((po) => ({ label: `${po.id} â€” ${po.vendor}`, value: po.id }));

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch =
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.poId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.vendor.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL"
          ? true
          : activeTab === "WAITING_QC"
          ? r.qc === "WAITING"
          : activeTab === "VERIFIED"
          ? r.status === "VERIFIED"
          : activeTab === "REJECTED"
          ? r.status === "REJECTED" || r.qc === "FAILED"
          : true;

      return matchSearch && matchTab;
    });
  }, [receipts, searchQuery, activeTab]);

  const handleCreateGRN = () => {
    const selectedPoObj = purchaseOrders?.find((po) => po.id === selectedPO);
    createGRNMutation.mutate({
      poId: selectedPO,
      warehouseId: undefined,
      items: (selectedPoObj?.items || []).map((i) => ({
        materialId: i.id || i.name,
        qtyActual: Number(i.qty || 0),
      })),
    });
  };

  return {
    isModalOpen,
    setIsModalOpen,
    selectedPO,
    setSelectedPO,
    doRef,
    setDoRef,
    invoiceNo,
    setInvoiceNo,
    arrivalDate,
    setArrivalDate,
    taxTreatment,
    setTaxTreatment,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedReceipt,
    setSelectedReceipt,
    purchaseOrders,
    receipts,
    isLoading,
    createGRNMutation,
    arrivalsToday,
    awaitingQc,
    verifiedMtd,
    rejected,
    poOptions,
    filteredReceipts,
    handleCreateGRN,
  };
}
