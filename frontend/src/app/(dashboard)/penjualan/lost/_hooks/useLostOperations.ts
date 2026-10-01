import { useState, useMemo, useEffect, useCallback } from "react";
import { useDnaToast } from "@/components/dna";
import { api } from "@/lib/api";
import { LostProspectItem, ChurnedClientItem } from "../_types/lost.types";

export function useLostOperations() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("prospects");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<LostProspectItem | null>(null);
  const [selectedChurn, setSelectedChurn] = useState<ChurnedClientItem | null>(null);

  const [prospects, setProspects] = useState<LostProspectItem[]>([]);
  const [churns, setChurns] = useState<ChurnedClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lostGroupRes, lostDealsRes, lostChurnRes] = await Promise.allSettled([
        api.get<any[]>("/bussdev/leads/group/lost"),
        api.get<any[]>("/crm/lost-deals"),
        api.get<any[]>("/bussdev/analytics/lost-churn"),
      ]);

      const prospectList: LostProspectItem[] = [];

      if (lostGroupRes.status === "fulfilled" && Array.isArray(lostGroupRes.value.data)) {
        for (const item of lostGroupRes.value.data) {
          prospectList.push({
            id: item.id || `lead-${Math.random()}`,
            brandName: item.brandName || item.clientName || "Brand",
            productName: item.productInterest || "Kustom Kosmetik",
            clientName: item.clientName || "Klien",
            phoneNo: item.phoneNo || item.phone || "",
            bdName: item.pic?.name || item.lastActionBy || "BusDev",
            estimatedValue: Number(item.estimatedValue || 0),
            sampleDate: item.updatedAt ? new Date(item.updatedAt).toISOString().slice(0, 10) : "-",
            sampleStatus: item.status || "LOST",
            lostReason: (item.lostReason as any) || "OTHER",
            lostNotes: item.notes || item.reason || "",
          });
        }
      }

      if (lostDealsRes.status === "fulfilled" && Array.isArray(lostDealsRes.value.data)) {
        for (const deal of lostDealsRes.value.data) {
          if (!prospectList.some((p) => p.id === deal.id || p.id === deal.leadId)) {
            prospectList.push({
              id: deal.id,
              brandName: deal.lead?.clientName || "Brand",
              productName: "Produk Maklon",
              clientName: deal.lead?.clientName || "Klien",
              phoneNo: "",
              bdName: "BusDev",
              estimatedValue: 0,
              sampleDate: deal.createdAt ? new Date(deal.createdAt).toISOString().slice(0, 10) : "-",
              sampleStatus: "LOST",
              lostReason: (deal.reason as any) || "OTHER",
              lostNotes: deal.notes || "",
            });
          }
        }
      }

      setProspects(prospectList);

      const churnList: ChurnedClientItem[] = [];
      if (lostChurnRes.status === "fulfilled" && Array.isArray(lostChurnRes.value.data)) {
        for (const c of lostChurnRes.value.data) {
          churnList.push({
            id: c.id || `churn-${Math.random()}`,
            clientName: c.brand || c.clientName || "Klien Maklon",
            brandName: c.brand || "Brand",
            phoneNo: c.phone || "",
            lifetimeValue: Number(c.lostValue || 0),
            totalOrders: c.totalOrders || 1,
            lastOrderDate: c.lastOrderDate || "-",
            inactivityMonths: c.inactivityMonths || 6,
            lastProductOrdered: c.lastProduct || "Sediaan Kosmetik",
            churnReason: c.reason || "Tidak ada repeat order",
          });
        }
      }
      setChurns(churnList);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data lost & churn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Global KPI calculations
  const totalLostCount = prospects.length;
  const totalChurnCount = churns.length;
  const totalLostValue = prospects.reduce((sum, p) => sum + p.estimatedValue, 0);

  const filteredProspects = useMemo(() => {
    if (!searchQuery.trim()) return prospects;
    const q = searchQuery.toLowerCase();
    return prospects.filter(
      (p) =>
        p.brandName.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q)
    );
  }, [prospects, searchQuery]);

  const filteredChurn = useMemo(() => {
    if (!searchQuery.trim()) return churns;
    const q = searchQuery.toLowerCase();
    return churns.filter(
      (c) =>
        c.brandName.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.lastProductOrdered.toLowerCase().includes(q)
    );
  }, [churns, searchQuery]);

  const handleReEngage = (name: string, phone?: string) => {
    if (phone) {
      window.open(
        `https://wa.me/${phone.replace(/\D/g, "")}?text=Halo%20${encodeURIComponent(
          name
        )},%20kami%20dari%20tim%20BusDev%20Dreamlab...`,
        "_blank"
      );
    } else {
      toast.info(`Menjadwalkan follow-up re-engagement untuk ${name}`);
    }
  };

  return {
    toast,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedProspect,
    setSelectedProspect,
    selectedChurn,
    setSelectedChurn,
    prospects,
    churns,
    loading,
    error,
    fetchData,
    totalLostCount,
    totalChurnCount,
    totalLostValue,
    filteredProspects,
    filteredChurn,
    handleReEngage,
  };
}
