import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  LeadRow,
  SalesOrderRow,
  GroupKey,
  unwrapList,
  mapLead,
  mapSalesOrder,
} from "../_types/client-manager.types";

export function useClientManagerOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as GroupKey) || "sample";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupKey>("sample");

  const handleTabChange = (newTab: string) => {
    router.push(`/penjualan/client-manager?tab=${newTab}`);
  };

  // â”€â”€ Query: klien per fase (endpoint bussdev yang sudah ada) â”€â”€
  const sampleQuery = useQuery<LeadRow[]>({
    queryKey: ["bussdev-leads-group", "sample"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/leads/group/sample");
        return unwrapList(res.data).map(mapLead);
      } catch {
        return [];
      }
    },
  });

  const productionQuery = useQuery<LeadRow[]>({
    queryKey: ["bussdev-leads-group", "production"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/leads/group/production");
        return unwrapList(res.data).map(mapLead);
      } catch {
        return [];
      }
    },
  });

  const roQuery = useQuery<LeadRow[]>({
    queryKey: ["bussdev-leads-group", "ro"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/leads/group/ro");
        return unwrapList(res.data).map(mapLead);
      } catch {
        return [];
      }
    },
  });

  const soQuery = useQuery<SalesOrderRow[]>({
    queryKey: ["bussdev-sales-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/sales-orders");
        return unwrapList(res.data).map(mapSalesOrder);
      } catch {
        return [];
      }
    },
  });

  const sampleLeads = useMemo(() => sampleQuery.data ?? [], [sampleQuery.data]);
  const productionLeads = useMemo(() => productionQuery.data ?? [], [productionQuery.data]);
  const roLeads = useMemo(() => roQuery.data ?? [], [roQuery.data]);
  const salesOrders = useMemo(() => soQuery.data ?? [], [soQuery.data]);

  const ordersByLead = useMemo(() => {
    const map = new Map<string, SalesOrderRow[]>();
    for (const so of salesOrders) {
      if (!so.leadId) continue;
      const list = map.get(so.leadId) || [];
      list.push(so);
      map.set(so.leadId, list);
    }
    return map;
  }, [salesOrders]);

  const activeQuery =
    activeTab === "production" ? productionQuery : activeTab === "ro" ? roQuery : sampleQuery;
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const refetch = () => activeQuery.refetch();

  const matches = (lead: LeadRow, q: string) =>
    !q ||
    lead.clientName.toLowerCase().includes(q) ||
    lead.brandName.toLowerCase().includes(q) ||
    lead.productInterest.toLowerCase().includes(q) ||
    lead.picName.toLowerCase().includes(q) ||
    (lead.city || "").toLowerCase().includes(q) ||
    (lead.province || "").toLowerCase().includes(q);

  const q = searchQuery.trim().toLowerCase();
  const sampleList = useMemo(() => sampleLeads.filter((l) => matches(l, q)), [sampleLeads, q]);
  const productionList = useMemo(() => productionLeads.filter((l) => matches(l, q)), [productionLeads, q]);
  const roList = useMemo(() => roLeads.filter((l) => matches(l, q)), [roLeads, q]);

  // â”€â”€ KPI (agregasi dari data nyata, bukan angka contoh) â”€â”€
  const sampleValue = sampleLeads.reduce((s, l) => s + l.estimatedValue, 0);
  const sampleMoq = sampleLeads.reduce((s, l) => s + l.moq, 0);
  const sampleApproved = sampleLeads.filter((l) => l.status === "SAMPLE_APPROVED").length;

  const productionValue = productionLeads.reduce((s, l) => s + l.estimatedValue, 0);
  const productionSpk = productionLeads.filter((l) => !!l.spkFileUrl).length;
  const productionLocked = productionLeads.filter((l) => l.isFormulaLocked).length;

  const roValue = roLeads.reduce((s, l) => s + l.estimatedValue, 0);
  const roRepeat = roLeads.filter((l) => l.orderCount > 1).length;
  const roRetention = roLeads.length > 0 ? Math.round((roRepeat / roLeads.length) * 100) : 0;

  const openLead = (lead: LeadRow, group: GroupKey) => {
    setSelectedLead(lead);
    setSelectedGroup(group);
  };

  const closeLead = () => {
    setSelectedLead(null);
  };

  const drawerOrders = selectedLead ? ordersByLead.get(selectedLead.id) || [] : [];

  return {
    activeTab,
    handleTabChange,
    searchQuery,
    setSearchQuery,
    selectedLead,
    setSelectedLead,
    selectedGroup,
    openLead,
    closeLead,
    sampleLeads,
    productionLeads,
    roLeads,
    salesOrders,
    ordersByLead,
    drawerOrders,
    activeQuery,
    isLoading,
    isError,
    refetch,
    sampleList,
    productionList,
    roList,
    sampleValue,
    sampleMoq,
    sampleApproved,
    productionValue,
    productionSpk,
    productionLocked,
    roValue,
    roRepeat,
    roRetention,
  };
}
