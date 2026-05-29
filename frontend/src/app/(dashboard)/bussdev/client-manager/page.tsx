"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaInput, DnaButton } from "@/components/dna";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { toast } from "sonner";
import { Search, BookUser, FlaskConical, Package, RefreshCw, ArrowUpRight, Star, ChevronDown, Loader2 } from "lucide-react";
import { DashboardCards } from "@/components/bussdev/DashboardCards";
import { PipelineLeadTable } from "@/components/bussdev/PipelineLeadTable";
import { StageConfirmDialog } from "@/components/bussdev/StageConfirmDialog";
import { SAMPLE_STAGES, PRODUCTION_STAGES } from "@/components/bussdev/pipeline-constants";
import { cn, formatCurrency } from "@/lib/utils";

// ── Buku Tamu Tab ──

function BukuTamuContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: guests, isLoading: isLoadingGuests } = useQuery({
    queryKey: ["client-manager-guests"],
    queryFn: async () => {
      try { return (await api.get("/guests")).data; }
      catch { return []; }
    },
  });

  const { data: intakeLeads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["bussdev-leads-group", "guest"],
    queryFn: async () => {
      try { return (await api.get<any[]>("/bussdev/leads/group/guest")).data; }
      catch { return []; }
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (guestId: string) => api.post(`/bussdev/guest/${guestId}/convert`),
    onSuccess: () => {
      toast.success("Tamu berhasil dikonversi menjadi Sales Lead!");
      queryClient.invalidateQueries({ queryKey: ["client-manager-guests"] });
      queryClient.invalidateQueries({ queryKey: ["bussdev-leads-group"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal konversi"),
  });

  // Merge GuestLog + intake leads into unified list
  const mergedItems = [
    ...(guests || []).map((g: any) => ({
      id: g.id, type: "guest" as const,
      clientName: g.clientName, contactInfo: g.contactInfo,
      productInterest: g.productInterest, date: g.visitDate,
    })),
    ...(intakeLeads || []).map((l: any) => ({
      id: l.id, type: "lead" as const,
      clientName: l.clientName, contactInfo: l.contactInfo || "—",
      productInterest: l.productInterest, date: l.createdAt,
    })),
  ];

  const filtered = mergedItems.filter((item) =>
    item.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.productInterest?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = isLoadingGuests || isLoadingLeads;

  if (isLoading) return <div className="h-96 bg-slate-50 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6 animate-fade-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-600 rounded-full" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">GUEST REGISTRY</h3>
          <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">{filtered.length}</span>
        </div>
        <div className="w-full md:w-80">
          <DnaInput placeholder="CARI TAMU / LEAD..." icon={<Search className="h-3.5 w-3.5" />} className="font-black text-[10px] uppercase tracking-widest" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <TableWrapper>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-table-header text-slate-400">SUMBER</th>
                <th className="px-6 py-4 text-table-header text-slate-400">NAMA</th>
                <th className="px-6 py-4 text-table-header text-slate-400">KONTAK</th>
                <th className="px-6 py-4 text-table-header text-slate-400">PRODUK</th>
                <th className="px-6 py-4 text-table-header text-slate-400">TANGGAL</th>
                <th className="px-6 py-4 text-table-header text-slate-400 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
                    <td className="px-6 py-4">
                      <DnaBadge status={item.type === "guest" ? "warning" : "info"}>
                        {item.type === "guest" ? "Tamu" : "Intake"}
                      </DnaBadge>
                    </td>
                    <td className="px-6 py-4"><span className="font-black text-slate-900 uppercase italic text-xs">{item.clientName}</span></td>
                    <td className="px-6 py-4"><span className="text-[10px] font-medium text-slate-500">{item.contactInfo || "—"}</span></td>
                    <td className="px-6 py-4"><span className="text-[10px] font-black text-blue-600 uppercase italic">{item.productInterest || "—"}</span></td>
                    <td className="px-6 py-4"><span className="text-[10px] font-black text-slate-500 tabular-nums">{item.date ? new Date(item.date).toLocaleDateString("id-ID") : "—"}</span></td>
                    <td className="px-6 py-4 text-right">
                      {item.type === "guest" ? (
                        <DnaButton variant="primary" size="sm" icon={<ArrowUpRight className="w-3 h-3" />} onClick={() => convertMutation.mutate(item.id)} disabled={convertMutation.isPending} className="text-[8px] font-black uppercase">Konversi</DnaButton>
                      ) : (
                        <span className="text-[8px] font-black text-blue-500 uppercase">Sudah Lead</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><p className="text-[10px] font-black text-slate-300 uppercase italic">Tidak ada data</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TableWrapper>
    </div>
  );
}

// ── Sample Tab ──

function SampleContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [nextStage, setNextStage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: analytics } = useQuery({
    queryKey: ["bussdev-analytics", "sample"],
    queryFn: async () => { try { return (await api.get("/bussdev/analytics/sample")).data; } catch { return null; } },
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["bussdev-leads-group", "sample"],
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/sample")).data,
  });

  const filtered = leads?.filter((l: any) =>
    l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pipelineLeads = filtered?.map((l: any) => ({
    id: l.id, clientName: l.clientName, brandName: l.brandName, productInterest: l.productInterest,
    category: l.category, source: l.source || null, moq: Number(l.moq || 0), unitPrice: Number(l.unitPrice || 0),
    estimatedValue: Number(l.estimatedValue || 0), status: l.status || l.stage, slaDays: l.slaDays || 0, notes: l.notes || null,
  }));

  const handleAdvance = (lead: any, targetStage: string) => { setSelectedLead(lead); setNextStage(targetStage); setIsModalOpen(true); };
  const handleMarkLost = (lead: any) => { setSelectedLead(lead); setNextStage("LOST"); setIsModalOpen(true); };

  return (
    <div className="space-y-6 animate-fade-slide-in">
      <DashboardCards variant="sample" data={analytics} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-800 rounded-full" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">SAMPLE STREAM</h3>
          </div>
          <div className="w-full md:w-80">
            <DnaInput placeholder="SEARCH BRAND / CLIENT..." icon={<Search className="h-3.5 w-3.5" />} className="font-black text-[10px] uppercase tracking-widest" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <PipelineLeadTable leads={pipelineLeads} isLoading={isLoading} onAdvance={handleAdvance} onMarkLost={handleMarkLost} stageMap={SAMPLE_STAGES} />
        <StageConfirmDialog isOpen={isModalOpen} onOpenChange={setIsModalOpen} lead={selectedLead} targetStage={nextStage} />
      </div>
    </div>
  );
}

// ── Produksi Tab ──

function ProductionContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [nextStage, setNextStage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: analytics } = useQuery({
    queryKey: ["bussdev-analytics", "production"],
    queryFn: async () => { try { return (await api.get("/bussdev/analytics/production")).data; } catch { return null; } },
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["bussdev-leads-group", "production"],
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/production")).data,
  });

  const filtered = leads?.filter((l: any) =>
    l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pipelineLeads = filtered?.map((l: any) => ({
    id: l.id, clientName: l.clientName, brandName: l.brandName, productInterest: l.productInterest,
    category: l.category, source: l.source || null, moq: Number(l.moq || 0), unitPrice: Number(l.unitPrice || 0),
    estimatedValue: Number(l.estimatedValue || 0), status: l.status || l.stage, slaDays: l.slaDays || 0, notes: l.notes || null,
  }));

  const handleAdvance = (lead: any, targetStage: string) => { setSelectedLead(lead); setNextStage(targetStage); setIsModalOpen(true); };
  const handleMarkLost = (lead: any) => { setSelectedLead(lead); setNextStage("LOST"); setIsModalOpen(true); };

  if (isLoading) return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-8 w-8 text-cyan-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-slide-in">
      <DashboardCards variant="production" data={analytics} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-cyan-800 rounded-full" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">BATCH STREAM</h3>
          </div>
          <div className="w-full md:w-80">
            <DnaInput placeholder="SEARCH BRAND / CLIENT..." icon={<Search className="h-3.5 w-3.5" />} className="font-black text-[10px] uppercase tracking-widest" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <PipelineLeadTable leads={pipelineLeads} isLoading={isLoading} onAdvance={handleAdvance} onMarkLost={handleMarkLost} stageMap={PRODUCTION_STAGES} />
        <StageConfirmDialog isOpen={isModalOpen} onOpenChange={setIsModalOpen} lead={selectedLead} targetStage={nextStage} />
      </div>
    </div>
  );
}

// ── RO Tab ──

const FU_CONFIG: Record<string, { label: string; color: string }> = {
  NOT_FOLLOWED_UP: { label: "Belum FU", color: "bg-slate-100 text-slate-500" },
  FU_1: { label: "FU 1", color: "bg-amber-100 text-amber-700" },
  FU_2: { label: "FU 2", color: "bg-orange-100 text-orange-700" },
  FU_3: { label: "FU 3", color: "bg-rose-100 text-rose-700" },
};

function ROContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [fuDropdownOpen, setFuDropdownOpen] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["bussdev-analytics", "ro"],
    queryFn: async () => { try { return (await api.get("/bussdev/analytics/ro")).data; } catch { return null; } },
  });

  const { data: leads, isLoading: isLeadsLoading } = useQuery({
    queryKey: ["bussdev-leads-group", "ro"],
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/ro")).data,
  });

  const updateFuMutation = useMutation({
    mutationFn: async ({ leadId, fuStatus }: { leadId: string; fuStatus: string }) => {
      return (await api.patch("/bussdev/lead/" + leadId + "/follow-up", { fuStatus })).data;
    },
    onSuccess: () => { toast.success("Follow-up status updated!"); queryClient.invalidateQueries({ queryKey: ["bussdev-leads-group"] }); },
    onError: (err: any) => { toast.error(err.response?.data?.message || "Failed to update FU status"); },
  });

  const filtered = leads?.filter((l: any) =>
    l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = isAnalyticsLoading || isLeadsLoading;

  return (
    <div className="space-y-6 animate-fade-slide-in">
      <DashboardCards variant="ro" data={analytics} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-slate-800 rounded-full" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">LOYALTY STREAM ANALYSIS</h3>
          </div>
          <div className="w-full md:w-80">
            <DnaInput placeholder="SEARCH VIP PARTNER / BRAND..." icon={<Search className="h-3.5 w-3.5" />} className="font-black text-[10px] uppercase tracking-widest" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <TableWrapper>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-table-header text-slate-400">BRAND & CLIENT</th>
                  <th className="px-6 py-4 text-table-header text-slate-400">INTEREST</th>
                  <th className="px-4 py-4 text-table-header text-slate-400 text-center">ORDERS</th>
                  <th className="px-4 py-4 text-table-header text-slate-400 text-right">TOTAL SPENT</th>
                  <th className="px-4 py-4 text-table-header text-slate-400 text-center">LOYALTY</th>
                  <th className="px-4 py-4 text-table-header text-slate-400 text-center">FOLLOW UP</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {[...Array(6)].map((_, j) => (<td key={j} className="px-4 py-4"><div className="h-4 w-full bg-slate-100 rounded animate-pulse" /></td>))}
                    </tr>
                  ))
                ) : filtered?.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-[10px] font-black text-slate-400 uppercase">No repeat order data found</td></tr>
                ) : (
                  filtered?.map((lead: any) => {
                    const totalSpent = Number(lead.planOmset || lead.estimatedValue || 0);
                    const orderCount = lead.orderCount || 0;
                    const loyaltyLevel = orderCount >= 3 ? "GOLD" : orderCount >= 1 ? "SILVER" : "BRONZE";
                    const fuStatus = lead.fuStatus || "NOT_FOLLOWED_UP";
                    const fuConfig = FU_CONFIG[fuStatus] || FU_CONFIG.NOT_FOLLOWED_UP;

                    return (
                      <tr key={lead.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs uppercase italic">{lead.clientName}</span>
                            {lead.brandName && <span className="text-[9px] font-medium text-slate-500 uppercase">({lead.brandName})</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-[10px] font-medium text-slate-600 uppercase">{lead.productInterest}</span></td>
                        <td className="px-4 py-4 text-center"><span className="font-black text-slate-900 text-xs">{orderCount}x</span></td>
                        <td className="px-4 py-4 text-right"><span className="font-black text-slate-900 text-xs tabular-nums">{formatCurrency(totalSpent)}</span></td>
                        <td className="px-4 py-4 text-center">
                          <DnaBadge status={loyaltyLevel === "GOLD" ? "warning" : loyaltyLevel === "SILVER" ? "default" : "critical"}>
                            <Star className="h-2.5 w-2.5" />{loyaltyLevel}
                          </DnaBadge>
                        </td>
                        <td className="px-4 py-4 text-center relative">
                          <div className="relative inline-block">
                            <button onClick={() => setFuDropdownOpen(fuDropdownOpen === lead.id ? null : lead.id)} className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase border transition-all cursor-pointer", fuConfig.color)}>
                              {fuConfig.label} <ChevronDown className="inline h-2.5 w-2.5 ml-1" />
                            </button>
                            {fuDropdownOpen === lead.id && (
                              <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-10 p-1">
                                {Object.entries(FU_CONFIG).map(([key, config]) => (
                                  <button key={key} onClick={() => { updateFuMutation.mutate({ leadId: lead.id, fuStatus: key }); setFuDropdownOpen(null); }}
                                    className={cn("w-full text-left px-3 py-2 rounded-lg text-[8px] font-black uppercase hover:bg-slate-50 transition-colors", config.color)}>
                                    {config.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TableWrapper>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-emerald-800 rounded-full" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">RETENTION RADAR</h3>
        </div>
      </div>
    </div>
  );
}

// ── Main Client Manager Page ──

export default function ClientManagerPage() {
  const [tab, setTab] = useState("buku-tamu");

  return (
    <DashboardShell title="Client" titleAccent="Manager" subtitle="Pipeline per fase: Buku Tamu → Sample → Produksi → Repeat Order">
      <Tabs value={tab} onValueChange={setTab} className="space-y-8">
        <TabsList className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-14 w-fit">
          <TabsTrigger value="buku-tamu" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <BookUser className="w-4 h-4" /> Buku Tamu
          </TabsTrigger>
          <TabsTrigger value="sample" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <FlaskConical className="w-4 h-4" /> Sample
          </TabsTrigger>
          <TabsTrigger value="produksi" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <Package className="w-4 h-4" /> Produksi
          </TabsTrigger>
          <TabsTrigger value="ro" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <RefreshCw className="w-4 h-4" /> Repeat Order
          </TabsTrigger>
        </TabsList>
        <TabsContent value="buku-tamu"><BukuTamuContent /></TabsContent>
        <TabsContent value="sample"><SampleContent /></TabsContent>
        <TabsContent value="produksi"><ProductionContent /></TabsContent>
        <TabsContent value="ro"><ROContent /></TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
