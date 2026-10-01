import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  CogsRequestView,
  CogsRequestItem,
  CogsSampleMap,
  CogsRequestKpis,
} from "../_types/cogs-request.types";

export function useCogsRequestOperations() {
  const [view, setView] = useState<CogsRequestView>("list");
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [moqList, setMoqList] = useState<number[]>([]);
  const [currentMoq, setCurrentMoq] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientName, setClientName] = useState("PT Maju Jaya");
  const [valuationDate, setValuationDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const addMoq = () => {
    if (!currentMoq) return;
    setMoqList([...moqList, Number(currentMoq)]);
    setCurrentMoq("");
  };

  const removeMoq = (index: number) => {
    setMoqList(moqList.filter((_, idx) => idx !== index));
  };

  const { data: hppRequests = [], isLoading: hppLoading, refetch } = useQuery<CogsRequestItem[]>({
    queryKey: ["cogs-hpp-requests"],
    queryFn: async () => {
      try {
        const resp = await api.get("/finance/cogs-requests");
        const body = resp.data;
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      } catch {
        return [];
      }
    },
  });

  const { data: samples = {}, isLoading: samplesLoading } = useQuery<CogsSampleMap>({
    queryKey: ["rnd-samples-for-cogs"],
    queryFn: async () => {
      try {
        const resp = await api.get("/rnd/samples");
        return resp.data || {};
      } catch {
        return {};
      }
    },
  });

  const handleFinalize = async () => {
    try {
      const joNum = `JO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      const payload = {
        jobOrderNumber: joNum,
        description: `HPP Request ${clientName} - ${selectedSample || "Formula Standard"} - ${notes || "Valuation"}`,
        totalCost: moqList[0] ? moqList[0] * 12500 : 5000000,
        totalRevenue: moqList[0] ? moqList[0] * 25000 : 10000000,
      };
      await api.post("/finance/cogs-requests", payload);
      toast.success("Request HPP berhasil difinalisasi!");
      refetch();
      setView("list");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal memfinalisasi HPP request");
    }
  };

  const filteredRequests = hppRequests.filter((req: CogsRequestItem) => {
    const term = searchTerm.toLowerCase();
    const pelanggan = String(req.pelanggan || req.customer || req.description || "").toLowerCase();
    const produk = String(req.produk || req.product || req.jobOrderNumber || "").toLowerCase();
    const kode = String(req.kode || req.code || req.jobOrderNumber || req.id || "").toLowerCase();
    const formula = String(req.formula || req.formulaCode || "").toLowerCase();
    return (
      pelanggan.includes(term) ||
      produk.includes(term) ||
      kode.includes(term) ||
      formula.includes(term)
    );
  });

  const activeCount = hppRequests.filter((r) => !r.closedAt).length;
  const closedCount = hppRequests.filter((r) => !!r.closedAt).length;

  const kpis: CogsRequestKpis = {
    activeCount,
    closedCount,
    totalRecords: hppRequests.length,
    filteredCount: filteredRequests.length,
  };

  const handleSelectDetail = (product: string) => {
    setSelectedSample(product);
    setView("form");
  };

  return {
    view,
    setView,
    selectedSample,
    setSelectedSample,
    moqList,
    setMoqList,
    currentMoq,
    setCurrentMoq,
    searchTerm,
    setSearchTerm,
    clientName,
    setClientName,
    valuationDate,
    setValuationDate,
    notes,
    setNotes,
    addMoq,
    removeMoq,
    hppRequests,
    hppLoading,
    refetch,
    samples,
    samplesLoading,
    handleFinalize,
    filteredRequests,
    activeCount,
    closedCount,
    kpis,
    handleSelectDetail,
  };
}
