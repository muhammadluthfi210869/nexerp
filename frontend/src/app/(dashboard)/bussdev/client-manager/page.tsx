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
      try { return (await api.get<any[]>("/bussdev/leads/group/guest?mine=true")).data; }
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
      <div className="overflow-x-auto" style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ padding: "1rem 0.5rem 1rem 1.5rem", width: "12%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>SUMBER</th>
              <th style={{ padding: "1rem 0.5rem", width: "20%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>NAMA</th>
              <th style={{ padding: "1rem 0.5rem", width: "20%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>KONTAK</th>
              <th style={{ padding: "1rem 0.5rem", width: "20%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>PRODUK</th>
              <th style={{ padding: "1rem 0.5rem", width: "13%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>TANGGAL</th>
              <th style={{ padding: "1rem 1.5rem 1rem 0.5rem", width: "15%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "right" }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }} className="hover:bg-blue-50/10">
                  <td style={{ padding: "1rem 0.5rem 1rem 1.5rem" }}>
                    <span style={{
                      background: item.type === "guest" ? "#FFF7ED" : "#EFF6FF",
                      color: item.type === "guest" ? "#C2410C" : "#1D4ED8",
                      border: `1px solid ${item.type === "guest" ? "#FFEDD5" : "#DBEAFE"}`,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "8px",
                      fontWeight: 950,
                      display: "inline-block"
                    }}>
                      {item.type === "guest" ? "TAMU" : "INTAKE"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0.5rem" }}>
                    <span style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>
                      {item.clientName.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0.5rem" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#1E293B" }}>
                      {item.contactInfo || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0.5rem" }}>
                    <span style={{ fontSize: "10px", fontWeight: 950, color: "#2563EB" }}>
                      {(item.productInterest || "—").toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0.5rem" }}>
                    <span className="tabular-nums" style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>
                      {item.date ? new Date(item.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.5rem 1rem 0.5rem", textAlign: "right" }}>
                    {item.type === "guest" ? (
                      <DnaButton variant="primary" size="sm" icon={<ArrowUpRight className="w-3 h-3" />} onClick={() => convertMutation.mutate(item.id)} disabled={convertMutation.isPending} className="text-[8px] font-black uppercase">Konversi</DnaButton>
                    ) : (
                      <span style={{ fontSize: "8px", fontWeight: 950, color: "#2563EB" }}>SUDAH LEAD</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "#94A3B8", fontSize: "12px" }}>
                  Tidak ada data tamu atau lead.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/sample?mine=true")).data,
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
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/production?mine=true")).data,
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
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/ro?mine=true")).data,
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
        <div className="overflow-x-auto" style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "1rem 0.5rem 1rem 1.5rem", width: "25%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>BRAND & CLIENT</th>
                <th style={{ padding: "1rem 0.5rem", width: "20%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>INTEREST</th>
                <th style={{ padding: "1rem 0.5rem", width: "10%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>ORDERS</th>
                <th style={{ padding: "1rem 0.5rem", width: "15%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "right" }}>TOTAL SPENT</th>
                <th style={{ padding: "1rem 0.5rem", width: "15%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>LOYALTY</th>
                <th style={{ padding: "1rem 1.5rem 1rem 0.5rem", width: "15%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>FOLLOW UP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "1rem 0.5rem 1rem 1.5rem" }}><div className="h-4 w-full bg-slate-100 rounded animate-pulse" /></td>
                    <td style={{ padding: "1rem 0.5rem" }}><div className="h-4 w-full bg-slate-100 rounded animate-pulse" /></td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}><div className="h-4 w-8 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}><div className="h-4 w-16 bg-slate-100 rounded animate-pulse ml-auto" /></td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}><div className="h-4 w-12 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                    <td style={{ padding: "1rem 1.5rem 1rem 0.5rem", textAlign: "center" }}><div className="h-4 w-12 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                  </tr>
                ))
              ) : filtered?.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "#94A3B8", fontSize: "12px" }}>
                    No repeat order data found
                  </td>
                </tr>
              ) : (
                filtered?.map((lead: any) => {
                  const totalSpent = Number(lead.planOmset || lead.estimatedValue || 0);
                  const orderCount = lead.orderCount || 0;
                  const loyaltyLevel = orderCount >= 3 ? "GOLD" : orderCount >= 1 ? "SILVER" : "BRONZE";
                  const fuStatus = lead.fuStatus || "NOT_FOLLOWED_UP";
                  const fuConfig = FU_CONFIG[fuStatus] || FU_CONFIG.NOT_FOLLOWED_UP;

                  return (
                    <tr key={lead.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }} className="hover:bg-blue-50/10">
                      <td style={{ padding: "1rem 0.5rem 1rem 1.5rem" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{lead.clientName.toUpperCase()}</span>
                          {lead.brandName && <span style={{ fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>({lead.brandName.toUpperCase()})</span>}
                        </div>
                      </td>
                      <td style={{ padding: "1rem 0.5rem" }}>
                        <span style={{ fontSize: "10px", fontWeight: 950, color: "#2563EB" }}>{lead.productInterest.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{orderCount}x</span>
                      </td>
                      <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                        <span className="tabular-nums" style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{formatCurrency(totalSpent)}</span>
                      </td>
                      <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                        <DnaBadge status={loyaltyLevel === "GOLD" ? "warning" : loyaltyLevel === "SILVER" ? "default" : "critical"}>
                          <Star className="h-2.5 w-2.5" />{loyaltyLevel}
                        </DnaBadge>
                      </td>
                      <td style={{ padding: "1rem 1.5rem 1rem 0.5rem", textAlign: "center" }}>
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
