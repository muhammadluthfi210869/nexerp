"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Search, BookUser, FlaskConical, Package, RefreshCw, ArrowUpRight, Star, ChevronDown, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  OperationalPageShell,
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
} from "@/components/operational";
import { DashboardCards } from "@/components/bussdev/DashboardCards";
import { PipelineLeadTable } from "@/components/bussdev/PipelineLeadTable";
import { StageConfirmDialog } from "@/components/bussdev/StageConfirmDialog";
import { SAMPLE_STAGES, PRODUCTION_STAGES } from "@/components/bussdev/pipeline-constants";

// ── Buku Tamu Tab ──

function BukuTamuContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: guests, isLoading: isLoadingGuests } = useQuery({
    queryKey: ["client-manager-guests"],
    queryFn: async () => {
      try {
        return (await api.get("/guests")).data;
      } catch {
        return [];
      }
    },
  });

  const { data: intakeLeads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["bussdev-leads-group", "guest"],
    queryFn: async () => {
      try {
        return (await api.get<any[]>("/bussdev/leads/group/guest?mine=true")).data;
      } catch {
        return [];
      }
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

  const mergedItems = [
    ...(guests || []).map((g: any) => ({
      id: g.id,
      type: "guest" as const,
      clientName: g.clientName,
      contactInfo: g.contactInfo,
      productInterest: g.productInterest,
      date: g.visitDate,
    })),
    ...(intakeLeads || []).map((l: any) => ({
      id: l.id,
      type: "lead" as const,
      clientName: l.clientName,
      contactInfo: l.contactInfo || "—",
      productInterest: l.productInterest,
      date: l.createdAt,
    })),
  ];

  const filtered = mergedItems.filter(
    (item) =>
      item.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productInterest?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isLoading = isLoadingGuests || isLoadingLeads;

  if (isLoading) return <div className="h-96 rounded-md bg-slate-50 animate-pulse" />;

  return (
    <div className="operational-stack">
      <section className="operational-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-blue-600" />
            <h3 className="text-[14px] font-semibold text-slate-900">Registry Tamu</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {filtered.length}
            </span>
          </div>
          <div className="operational-input-wrap md:w-80">
            <span className="operational-input-icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Cari tamu / lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>
      <section className="operational-panel">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-[12%] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Sumber</th>
                  <th className="w-[20%] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Nama</th>
                  <th className="w-[20%] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Kontak</th>
                  <th className="w-[20%] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Produk</th>
                  <th className="w-[13%] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Tanggal</th>
                  <th className="w-[15%] px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 transition hover:bg-blue-50/40">
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                          item.type === "guest"
                            ? "border-orange-100 bg-orange-50 text-orange-700"
                            : "border-blue-100 bg-blue-50 text-blue-700",
                        )}
                      >
                        {item.type === "guest" ? "TAMU" : "INTAKE"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] font-medium text-slate-900">
                      {item.clientName}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-800">{item.contactInfo || "—"}</td>
                    <td className="px-3 py-2.5 text-[11px] font-medium text-blue-600">
                      {(item.productInterest || "—").toUpperCase()}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-[11px] text-slate-600">
                      {item.date
                        ? new Date(item.date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {item.type === "guest" ? (
                        <button
                          type="button"
                          className="operational-button is-primary h-8 px-3 text-[11px]"
                          onClick={() => convertMutation.mutate(item.id)}
                          disabled={convertMutation.isPending}
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          <span>Konversi</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-medium text-blue-600">SUDAH LEAD</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-10 text-center text-[12px] text-slate-400">
            Tidak ada data tamu atau lead.
          </p>
        )}
      </section>
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
    queryFn: async () => {
      try {
        return (await api.get("/bussdev/analytics/sample")).data;
      } catch {
        return null;
      }
    },
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["bussdev-leads-group", "sample"],
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/sample?mine=true")).data,
  });

  const filtered = leads?.filter(
    (l: any) =>
      l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.brandName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pipelineLeads = filtered?.map((l: any) => ({
    id: l.id,
    clientName: l.clientName,
    brandName: l.brandName,
    productInterest: l.productInterest,
    category: l.category,
    source: l.source || null,
    moq: Number(l.moq || 0),
    unitPrice: Number(l.unitPrice || 0),
    estimatedValue: Number(l.estimatedValue || 0),
    status: l.status || l.stage,
    slaDays: l.slaDays || 0,
    notes: l.notes || null,
  }));

  const handleAdvance = (lead: any, targetStage: string) => {
    setSelectedLead(lead);
    setNextStage(targetStage);
    setIsModalOpen(true);
  };
  const handleMarkLost = (lead: any) => {
    setSelectedLead(lead);
    setNextStage("LOST");
    setIsModalOpen(true);
  };

  return (
    <div className="operational-stack">
      <DashboardCards variant="sample" data={analytics} />
      <section className="operational-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-blue-800" />
            <h3 className="text-[14px] font-semibold text-slate-900">Sample Stream</h3>
          </div>
          <div className="operational-input-wrap md:w-80">
            <span className="operational-input-icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Cari brand / client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <PipelineLeadTable
            leads={pipelineLeads}
            isLoading={isLoading}
            onAdvance={handleAdvance}
            onMarkLost={handleMarkLost}
            stageMap={SAMPLE_STAGES}
          />
        </div>
      </section>
      <StageConfirmDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        lead={selectedLead}
        targetStage={nextStage}
      />
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
    queryFn: async () => {
      try {
        return (await api.get("/bussdev/analytics/production")).data;
      } catch {
        return null;
      }
    },
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["bussdev-leads-group", "production"],
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/production?mine=true")).data,
  });

  const filtered = leads?.filter(
    (l: any) =>
      l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.brandName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pipelineLeads = filtered?.map((l: any) => ({
    id: l.id,
    clientName: l.clientName,
    brandName: l.brandName,
    productInterest: l.productInterest,
    category: l.category,
    source: l.source || null,
    moq: Number(l.moq || 0),
    unitPrice: Number(l.unitPrice || 0),
    estimatedValue: Number(l.estimatedValue || 0),
    status: l.status || l.stage,
    slaDays: l.slaDays || 0,
    notes: l.notes || null,
  }));

  const handleAdvance = (lead: any, targetStage: string) => {
    setSelectedLead(lead);
    setNextStage(targetStage);
    setIsModalOpen(true);
  };
  const handleMarkLost = (lead: any) => {
    setSelectedLead(lead);
    setNextStage("LOST");
    setIsModalOpen(true);
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );

  return (
    <div className="operational-stack">
      <DashboardCards variant="production" data={analytics} />
      <section className="operational-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-cyan-800" />
            <h3 className="text-[14px] font-semibold text-slate-900">Batch Stream</h3>
          </div>
          <div className="operational-input-wrap md:w-80">
            <span className="operational-input-icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Cari brand / client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <PipelineLeadTable
            leads={pipelineLeads}
            isLoading={isLoading}
            onAdvance={handleAdvance}
            onMarkLost={handleMarkLost}
            stageMap={PRODUCTION_STAGES}
          />
        </div>
      </section>
      <StageConfirmDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        lead={selectedLead}
        targetStage={nextStage}
      />
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
    queryFn: async () => {
      try {
        return (await api.get("/bussdev/analytics/ro")).data;
      } catch {
        return null;
      }
    },
  });

  const { data: leads, isLoading: isLeadsLoading } = useQuery({
    queryKey: ["bussdev-leads-group", "ro"],
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/ro?mine=true")).data,
  });

  const updateFuMutation = useMutation({
    mutationFn: async ({ leadId, fuStatus }: { leadId: string; fuStatus: string }) => {
      return (await api.patch("/bussdev/lead/" + leadId + "/follow-up", { fuStatus })).data;
    },
    onSuccess: () => {
      toast.success("Status follow-up diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["bussdev-leads-group"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memperbarui status FU");
    },
  });

  const filtered = leads?.filter(
    (l: any) =>
      l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.brandName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isLoading = isAnalyticsLoading || isLeadsLoading;

  return (
    <div className="operational-stack">
      <DashboardCards variant="ro" data={analytics} />
      <section className="operational-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-slate-800" />
            <h3 className="text-[14px] font-semibold text-slate-900">Analisis Loyalty Stream</h3>
          </div>
          <div className="operational-input-wrap md:w-80">
            <span className="operational-input-icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Cari partner VIP / brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-[25%] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Brand & Client</th>
                <th className="w-[20%] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Interest</th>
                <th className="w-[10%] px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Orders</th>
                <th className="w-[15%] px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Total Spent</th>
                <th className="w-[15%] px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Loyalty</th>
                <th className="w-[15%] px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Follow Up</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="mx-auto h-3 w-8 rounded bg-slate-100 animate-pulse" />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="ml-auto h-3 w-16 rounded bg-slate-100 animate-pulse" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="mx-auto h-3 w-12 rounded bg-slate-100 animate-pulse" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="mx-auto h-3 w-12 rounded bg-slate-100 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-[12px] text-slate-400">
                    Tidak ada data repeat order
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
                    <tr key={lead.id} className="border-b border-slate-100 transition hover:bg-blue-50/40">
                      <td className="px-3 py-2.5">
                        <div className="text-[12px] font-medium text-slate-900">{lead.clientName}</div>
                        {lead.brandName && (
                          <div className="text-[10px] text-slate-500">({lead.brandName})</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-medium text-blue-600">
                        {(lead.productInterest ?? "").toUpperCase()}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[12px] font-medium text-slate-900">
                        {orderCount}x
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[12px] font-medium text-slate-900">
                        {formatCurrency(totalSpent)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                            loyaltyLevel === "GOLD"
                              ? "border-amber-100 bg-amber-50 text-amber-700"
                              : loyaltyLevel === "SILVER"
                                ? "border-slate-200 bg-slate-100 text-slate-700"
                                : "border-rose-100 bg-rose-50 text-rose-700",
                          )}
                        >
                          <Star className="mr-1 inline h-2.5 w-2.5" />
                          {loyaltyLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setFuDropdownOpen(fuDropdownOpen === lead.id ? null : lead.id)}
                            className={cn(
                              "rounded-md px-2 py-1 text-[10px] font-medium uppercase transition cursor-pointer",
                              fuConfig.color,
                            )}
                          >
                            {fuConfig.label} <ChevronDown className="ml-1 inline h-2.5 w-2.5" />
                          </button>
                          {fuDropdownOpen === lead.id && (
                            <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border border-slate-200 bg-white p-1 shadow-md">
                              {Object.entries(FU_CONFIG).map(([key, config]) => (
                                <button
                                  key={key}
                                  onClick={() => {
                                    updateFuMutation.mutate({ leadId: lead.id, fuStatus: key });
                                    setFuDropdownOpen(null);
                                  }}
                                  className={cn(
                                    "w-full rounded-md px-2 py-1.5 text-left text-[10px] font-medium uppercase transition hover:bg-slate-50",
                                    config.color,
                                  )}
                                >
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
      </section>
      <section className="operational-panel">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-emerald-800" />
          <h3 className="text-[14px] font-semibold text-slate-900">Retention Radar</h3>
        </div>
      </section>
    </div>
  );
}

// ── Main Client Manager Page ──

export default function ClientManagerPage() {
  const [tab, setTab] = useState("buku-tamu");

  return (
    <OperationalPageShell
      title="Client Manager"
      subtitle="Pipeline per fase: Buku Tamu → Sample → Produksi → Repeat Order"
    >
      <OperationalTabs value={tab} onValueChange={setTab}>
        <OperationalTabsList>
          <OperationalTabsTrigger value="buku-tamu">
            <BookUser className="h-4 w-4" />
            Buku Tamu
          </OperationalTabsTrigger>
          <OperationalTabsTrigger value="sample">
            <FlaskConical className="h-4 w-4" />
            Sample
          </OperationalTabsTrigger>
          <OperationalTabsTrigger value="produksi">
            <Package className="h-4 w-4" />
            Produksi
          </OperationalTabsTrigger>
          <OperationalTabsTrigger value="ro">
            <RefreshCw className="h-4 w-4" />
            Repeat Order
          </OperationalTabsTrigger>
        </OperationalTabsList>
        <OperationalTabsContent value="buku-tamu">
          <BukuTamuContent />
        </OperationalTabsContent>
        <OperationalTabsContent value="sample">
          <SampleContent />
        </OperationalTabsContent>
        <OperationalTabsContent value="produksi">
          <ProductionContent />
        </OperationalTabsContent>
        <OperationalTabsContent value="ro">
          <ROContent />
        </OperationalTabsContent>
      </OperationalTabs>
    </OperationalPageShell>
  );
}
