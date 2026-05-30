"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, TestTube, ClipboardCheck, Dna, Binary, Clock, CheckCircle2, FlaskConical, TrendingUp, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { FormulaBuilder } from "@/components/rnd/formula-builder";
import { DnaButton } from "@/components/dna";
import { KpiCard } from "@/components/dna/KpiCard";


export default function RndExecutiveDashboard() {
  const queryClient = useQueryClient();
  const [activeFormula, setActiveFormula] = useState<{ id: string; name: string } | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const metricsQuery = useQuery({
    queryKey: ["rnd-metrics"],
    queryFn: async () => {
      const res = await api.get("/rnd/dashboard");
      return res.data?.data || res.data;
    },
    refetchInterval: 30000,
  });

  const { data: npfs, isLoading: loadingNpfs } = useQuery({
    queryKey: ["rnd-npfs"],
    queryFn: () => api.get("/rnd/npf").then(res => res.data)
  });

  const { data: samples, isLoading: loadingSamples } = useQuery<any[]>({
    queryKey: ["rnd-samples"],
    queryFn: () => api.get("/rnd/samples").then(res => res.data)
  });

  const createSample = useMutation({
    mutationFn: (npfId: string) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return api.post("/rnd/samples", {
        npf_id: npfId,
        rnd_id: user.id || "00000000-0000-0000-0000-000000000000",
        status: "DRAFT"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
      toast.success("Formulation track initialized for this product.");
    },
    onError: () => toast.error("Track collision. Failed to initiate formulation sample.")
  });

  const handleOpenBuilder = (sample: { id: string; version: number; npf?: { product_name: string } }) => {
    setActiveFormula({ id: sample.id, name: sample.npf?.product_name || `Sample V${sample.version}` });
    setIsBuilderOpen(true);
  };

  const metrics = metricsQuery.data;

  const pipelineRows = useMemo(() => {
    const raw = metrics?.tables?.pipelineMaster;
    if (!raw || raw.length === 0) return [];
    return raw.map((r: any) => ({
      id: r.id,
      brand: r.brand || 'Generic',
      prod: r.product || '—',
      cat: 'SKINCARE',
      stage: r.stage,
      rev: parseInt(r.revisions) || 0,
      stab: 'N/A',
      time: (r.totalTime || '').replace('Total: ', '').replace(' Days', 'd') || '—',
      status: r.status,
    }));
  }, [metrics]);

  const picRows = useMemo(() => {
    const raw = metrics?.tables?.performanceEvaluation;
    if (!raw || raw.length === 0) return [];
    return raw.map((r: any) => ({
      name: r.picName,
      output: r.output,
      eff: r.efficiency,
      avg: (r.efficiency || '').replace('% OT', '') + 'd',
      quality: r.quality,
      qualNote: 'FIRST-TIME',
      util: r.utilization,
    }));
  }, [metrics]);

  const failureRows = useMemo(() => {
    const raw = metrics?.tables?.failureLogs;
    if (!raw || raw.length === 0) return [];
    return raw.map((r: any) => ({
      prod: r.productName,
      stage: r.stage,
      reason: r.reason,
      pic: r.picName,
    }));
  }, [metrics]);

  if (metricsQuery.isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Syncing Intelligence...</p>
    </div>
  );

  return (
    <DashboardShell
      title="R&D Intelligence Center"
      actions={
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
          <Dna className="h-5 w-5 text-emerald-500 blur-[0.5px] animate-pulse" />
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight leading-none">Active Samples</p>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">{samples?.length || 0}</p>
          </div>
        </div>
      }
    >
      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="bg-white border-slate-200 mb-6">
          <TabsTrigger value="executive" className="flex items-center gap-2">
            Executive
          </TabsTrigger>
          <TabsTrigger value="npf" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            NPF Inbox
            {npfs?.length > 0 && (
              <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm bg-emerald-500/20 text-emerald-400">
                {npfs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="lab" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Active Lab
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════ */}
        {/* TAB 1 — EXECUTIVE DASHBOARD                 */}
        {/* ════════════════════════════════════════════ */}
        <TabsContent value="executive">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <KpiCard
              label="ON-TIME RATE"
              value={`${metrics?.timeliness?.onTimeRate ?? 85.4}%`}
              targetPct={metrics?.timeliness?.onTimeRate ?? 85}
              icon={<Clock />}
            />
            <KpiCard
              label="FIRST-TIME APPROVAL"
              value={`${metrics?.accuracy?.firstTimeApprovalRate ?? 72.1}%`}
              targetPct={metrics?.accuracy?.firstTimeApprovalRate ?? 72}
              icon={<CheckCircle2 />}
            />
            <KpiCard
              label="OVERALL APPROVAL"
              value={`${metrics?.approval?.overallRate ?? 84.4}%`}
              targetPct={metrics?.approval?.overallRate ?? 84}
              icon={<FlaskConical />}
            />
            <KpiCard
              label="UTILIZATION"
              value={`${metrics?.performance?.utilizationRate ?? 92}%`}
              targetPct={metrics?.performance?.utilizationRate ?? 92}
              icon={<TrendingUp />}
            />
            <KpiCard
              label="OVERDUE"
              value={String(metrics?.timeliness?.overdueCount ?? 3)}
              targetPct={(metrics?.timeliness?.overdueCount ?? 3) === 0 ? 100 : 0}
              icon={<AlertTriangle />}
            />
            <KpiCard
              label="FAILED ITEMS"
              value={String(metrics?.accuracy?.failedItemsCount ?? 5)}
              targetPct={(metrics?.accuracy?.failedItemsCount ?? 5) === 0 ? 100 : Math.max(0, 100 - (metrics?.accuracy?.failedItemsCount ?? 5) * 20)}
              icon={<X />}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-rose-500 rounded-full" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-900 italic">1. R&D PIPELINE MASTER (FLOW VELOCITY)</h3>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1600px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase">RND ID / BRAND</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase">PRODUCT NAME / CATEGORY</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">STAGE PROGRESSION</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">ACCURACY (REV)</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">STABILITY</th>
                      <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase">CYCLE TIME</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                      {pipelineRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">No pipeline data available</p>
                          </td>
                        </tr>
                      ) : pipelineRows.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-[13px] font-black text-slate-900">#{row.id}</p>
                          <p className="text-[9px] font-medium text-slate-400 uppercase">{row.brand}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[12px] font-black text-slate-900 uppercase">{row.prod}</p>
                          <p className="text-[9px] font-medium text-slate-400">{row.cat}</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <StageVisual progress={row.stage.toString()} />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={cn(
                            "text-sm font-black",
                            row.rev === 0 ? "text-emerald-500" : (row.rev < 2 ? "text-amber-500" : "text-rose-500")
                          )}>{row.rev}x</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black text-white",
                            row.stab === 'PASSED' ? 'bg-emerald-500' : (row.stab === 'TESTING' ? 'bg-blue-500' : 'bg-slate-500')
                          )}>{row.stab}</span>
                        </td>
                        <td className="px-6 py-5 text-right text-sm font-black tabular text-slate-900">{row.time}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-md text-[9px] font-black text-white",
                            row.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-slate-900'
                          )}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8 items-start mt-8">
            <div className="flex-1 w-full space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-gray-700 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">2. PIC PERFORMANCE EVALUATION</h3>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-50">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">PIC NAME / PERIOD</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">OUTPUT (COMP/APP)</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">EFFICIENCY</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">QUALITY</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">UTILIZATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {picRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">No performance data available</p>
                          </td>
                        </tr>
                      ) : picRows.map((row: any, i: number) => (
                        <tr key={i} className={cn("hover:bg-slate-50/50 transition-colors", i < 2 && "border-b border-slate-50")}>
                          <td className="px-6 py-6">
                            <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{row.name}</p>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <p className="text-[14px] font-black text-slate-900 tabular">{row.output}</p>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <p className="text-[12px] font-black text-emerald-600 uppercase tracking-tighter">{row.eff}</p>
                             <p className="text-[9px] font-medium text-slate-400 uppercase">Avg: {row.avg}</p>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <p className="text-[12px] font-black text-blue-600 uppercase tracking-tighter">{row.quality}</p>
                             <p className="text-[9px] font-medium text-slate-400 uppercase">{row.qualNote}</p>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <p className="text-[14px] font-black text-slate-900 tabular">{row.util}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="w-full xl:w-[450px] space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-rose-500 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic text-rose-600">3. FAILURE / REJECT LOG</h3>
              </div>
              <div className="rounded-2xl border border-rose-100 shadow-sm bg-rose-50/30 p-6">
                <div className="flex justify-between items-center mb-6 border-b border-rose-100 pb-4">
                  <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">PRODUCT / STAGE</p>
                  <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">REASON</p>
                </div>
                <div className="space-y-6">
                    {failureRows.length === 0 ? (
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight text-center py-4">No failures logged</p>
                    ) : failureRows.map((row: any, i: number) => (
                      <div key={i} className="flex justify-between items-start">
                      <div>
                        <p className="text-[13px] font-black text-slate-900 tracking-tight">{row.prod}</p>
                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">STAGE: {row.stage}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-black text-rose-500 tracking-tight">{row.reason}</p>
                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">PIC: {row.pic}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════ */}
        {/* TAB 2 — NPF INBOX                           */}
        {/* ════════════════════════════════════════════ */}
        <TabsContent value="npf">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <p className="text-lg font-black text-slate-900">NEW PRODUCT FORMULATION (NPF) REQUESTS</p>
                <p className="text-xs text-slate-500">Incoming mission-parameters from Commercial - Business Development.</p>
              </div>
            </div>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Product Name</TableHead>
                  <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Client</TableHead>
                  <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Target Price</TableHead>
                  <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingNpfs ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-200"><TableCell colSpan={4}><Skeleton className="h-10 w-full bg-white" /></TableCell></TableRow>
                  ))
                ) : npfs?.map((npf: { id: string; product_name: string; target_usage?: string; client_name?: string; target_price: number }) => (
                  <TableRow key={npf.id} className="border-slate-200 group hover:bg-slate-50 transition-colors">
                    <TableCell className="font-black text-slate-900">
                      <p>{npf.product_name}</p>
                      <p className="text-[10px] text-slate-500 font-sans italic">{npf.target_usage || 'Daily Cosmetics'}</p>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{npf.client_name || 'N/A'}</TableCell>
                    <TableCell className="text-emerald-500 font-sans font-black">${npf.target_price}</TableCell>
                    <TableCell className="text-right">
                      <DnaButton
                        variant="outline"
                        size="sm"
                        className="bg-emerald-600/10 border-emerald-600/30 text-emerald-500 hover:bg-emerald-600 hover:text-white h-8"
                        onClick={() => createSample.mutate(npf.id)}
                        disabled={createSample.isPending}
                        icon={<Plus className="h-3 w-3" />}
                      >
                        Initialize Track
                      </DnaButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════ */}
        {/* TAB 3 — ACTIVE FORMULATION LAB               */}
        {/* ════════════════════════════════════════════ */}
        <TabsContent value="lab">
          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden p-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] -mr-16 -mt-16" />
              <div className="border-b border-slate-200 px-6 py-4 flex flex-row items-center justify-between">
                <div>
                  <p className="text-lg font-black text-slate-900">ACTIVE SAMPLES LAB</p>
                  <p className="text-xs text-slate-500">Live development cycle of product prototypes.</p>
                </div>
              </div>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Sample Tracker</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Origin NPF</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Status</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSamples ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="border-slate-200"><TableCell colSpan={4}><Skeleton className="h-10 w-full bg-white" /></TableCell></TableRow>
                    ))
                  ) : samples?.map((sample: { id: string; version: number; created_at: string; status: string; npf?: { product_name: string } }) => (
                    <TableRow key={sample.id} className="border-slate-200 hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded bg-white flex items-center justify-center text-emerald-500 font-sans text-[10px] border border-slate-200 font-black">V{sample.version}</span>
                          <div>
                            <p className="text-xs text-slate-700 font-black uppercase tracking-tighter">SAMP-ID-{(sample.id.split('-')[0]).toUpperCase()}</p>
                            <p className="text-[10px] text-slate-600 font-sans">{new Date(sample.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-900 font-black text-xs uppercase">{sample.npf?.product_name || 'Generic Sample'}</TableCell>
                      <TableCell>
                        <span className={`rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border shadow-sm ${
                          sample.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white text-slate-500 border-slate-200'
                        }`}>
                          {sample.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-white hover:bg-slate-100 h-8"
                          onClick={() => handleOpenBuilder(sample)}
                          icon={<Binary className="h-4 w-4" />}
                        >
                          Build Formula
                        </DnaButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-[70vw] bg-white border-slate-200 text-slate-900 p-0 overflow-hidden">
          {activeFormula && (
            <FormulaBuilder
              sampleId={activeFormula.id}
              sampleName={activeFormula.name}
              onSuccess={() => {
                setIsBuilderOpen(false);
                queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function StageVisual({ progress }: { progress: string }) {
  const stages = ["QUEUE", "FORMULA", "LAB", "SHIP", "REVIEW", "DONE"];
  let currentIndex = 0;
  if (progress === 'QUEUE') currentIndex = 0;
  else if (progress === 'FORMULATING') currentIndex = 1;
  else if (progress === 'LAB_TEST') currentIndex = 2;
  else if (progress === 'READY_TO_SHIP' || progress === 'SHIPPED' || progress === 'RECEIVED') currentIndex = 3;
  else if (progress === 'CLIENT_REVIEW' || progress === 'REVISION_QUEUE') currentIndex = 4;
  else if (progress === 'APPROVED') currentIndex = 5;
  else currentIndex = 0;

  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-[140px] mx-auto">
      <div className="flex gap-0.5 w-full">
        {stages.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= currentIndex ? "bg-primary shadow-[0_0_8px_rgba(37,99,235,0.3)]" : "bg-slate-100")} />
        ))}
      </div>
      <div className="flex justify-between w-full">
        <span className="text-[6px] font-medium text-slate-400 uppercase">{stages[0]}</span>
        <span className="text-[6px] font-medium text-primary uppercase tracking-tight">{stages[currentIndex]}</span>
        <span className="text-[6px] font-medium text-slate-400 uppercase">{stages[5]}</span>
      </div>
    </div>
  );
}
