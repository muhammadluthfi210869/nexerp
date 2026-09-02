"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { 
  FlaskConical, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Timer,
  History,
  Beaker,
  Thermometer,
  CloudRain,
  ShieldCheck,
  ClipboardCheck,
  MoreVertical,
  Activity,
  Plus,
  Loader2,
} from "lucide-react";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { StatCard } from "@/components/dna/StatCard";
import { DataCard } from "@/components/dna/DataCard";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaInput } from "@/components/dna/DnaInput";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface StabilityStudy {
  id: string;
  product: string;
  batch: string;
  chamber: string;
  startDate: string;
  interval: string;
  notes: string;
  status: string;
  currentMonth: number;
  nextTest: string;
  results: { date: string; month: number; ph: string; viscosity: string; appearance: string; notes: string }[];
}

export default function StabilityTestingPage() {
  const [showNewStudy, setShowNewStudy] = useState(false);
  const [showLogResult, setShowLogResult] = useState<string | null>(null);
  const [localStudies, setLocalStudies] = useState<StabilityStudy[]>([]);
  const queryClient = useQueryClient();

  const [newStudy, setNewStudy] = useState({
    product: "",
    batch: "",
    chamber: "A",
    startDate: new Date().toISOString().split("T")[0],
    interval: "1M",
    notes: "",
  });

  const [logResult, setLogResult] = useState({
    date: new Date().toISOString().split("T")[0],
    month: 1,
    ph: "",
    viscosity: "",
    appearance: "STABLE",
    notes: "",
  });

  const { data: stabilityLogs, isLoading } = useQuery({
    queryKey: ["stability-logs"],
    queryFn: async () => {
      const res = await api.get("/rnd/lab-test-results", { params: { type: "stability" } });
      return (res.data || []).map((r: any) => ({
        id: r.id.substring(0, 8).toUpperCase(),
        product: r.formula?.name || "Unknown",
        batch: r.formula?.sampleRequest?.sampleCode || "—",
        startDate: new Date(r.testDate).toISOString().split("T")[0],
        currentMonth: Math.floor((Date.now() - new Date(r.testDate).getTime()) / (30 * 24 * 60 * 60 * 1000)) || 1,
        status: r.stability40C === "STABLE" && r.stabilityRT === "STABLE" ? "STABLE" : "MONITORING",
        nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        chamber: "A",
        interval: "1M",
        notes: "",
        results: [] as any[],
      }));
    },
  });

  const createStudyMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post("/qc/audits", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Stability study created");
      queryClient.invalidateQueries({ queryKey: ["stability-logs"] });
      setShowNewStudy(false);
      setNewStudy({ product: "", batch: "", chamber: "A", startDate: new Date().toISOString().split("T")[0], interval: "1M", notes: "" });
    },
    onError: (err: any) => {
      toast.error("Failed to create study", {
        description: err.response?.data?.message || "Check connection",
      });
    },
  });

  const logResultMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post("/qc/audits", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Test result logged");
      queryClient.invalidateQueries({ queryKey: ["stability-logs"] });
      setShowLogResult(null);
      setLogResult({ date: new Date().toISOString().split("T")[0], month: 1, ph: "", viscosity: "", appearance: "STABLE", notes: "" });
    },
    onError: (err: any) => {
      toast.error("Failed to log result", {
        description: err.response?.data?.message || "Check connection",
      });
    },
  });

  const handleCreateStudy = () => {
    if (!newStudy.product) {
      toast.error("Product name is required");
      return;
    }

    const study: StabilityStudy = {
      id: `STAB-${Date.now().toString(36).toUpperCase()}`,
      product: newStudy.product,
      batch: newStudy.batch || `B-${Date.now()}`,
      chamber: newStudy.chamber,
      startDate: newStudy.startDate,
      interval: newStudy.interval,
      notes: newStudy.notes,
      status: "INITIATED",
      currentMonth: 1,
      nextTest: newStudy.startDate,
      results: [],
    };

    setLocalStudies((prev) => [study, ...prev]);
    setShowNewStudy(false);
    setNewStudy({ product: "", batch: "", chamber: "A", startDate: new Date().toISOString().split("T")[0], interval: "1M", notes: "" });
    toast.success("New stability study added");
  };

  const handleLogResult = (studyId: string) => {
    if (!logResult.ph && !logResult.viscosity) {
      toast.error("Enter at least one test value");
      return;
    }

    setLocalStudies((prev) =>
      prev.map((s) => {
        if (s.id !== studyId) return s;
        return {
          ...s,
          status: logResult.appearance === "STABLE" ? "STABLE" : "MONITORING",
          currentMonth: logResult.month,
          nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          results: [
            ...s.results,
            {
              date: logResult.date,
              month: logResult.month,
              ph: logResult.ph,
              viscosity: logResult.viscosity,
              appearance: logResult.appearance,
              notes: logResult.notes,
            },
          ],
        };
      }),
    );

    logResultMutation.mutate({
      status: logResult.appearance === "STABLE" ? "GOOD" : "REJECT",
      phase: "FINAL",
      notes: `Stability ${logResult.appearance} | pH: ${logResult.ph} | Visc: ${logResult.viscosity} | ${logResult.notes}`,
    });

    setShowLogResult(null);
    setLogResult({ date: new Date().toISOString().split("T")[0], month: 1, ph: "", viscosity: "", appearance: "STABLE", notes: "" });
  };

  const allStudies = [...(stabilityLogs || []), ...localStudies];

  return (
    <DashboardShell
      title="Stability"
      titleAccent="Testing"
      subtitle="Accelerated & real-time stability verification protocols"
      actions={
        <div className="flex gap-4">
          <DnaButton variant="outline" className="rounded-[14px] text-[12px]">
            <History className="mr-2 h-4 w-4" /> Stability Archives
          </DnaButton>
          <DnaButton
            variant="secondary"
            className="rounded-[14px] text-[12px]"
            onClick={() => setShowNewStudy(true)}
          >
            <Plus className="mr-2 h-5 w-5" /> Start New Study
          </DnaButton>
        </div>
      }
    >
      {/* Environmental Chamber Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard
          label="Chamber A: Accelerated"
          value="40°C"
          subValue="75% RH / Status: Operating within scientific threshold"
          icon={<Thermometer className="h-4 w-4" />}
        />
        <StatCard
          label="Chamber B: Real-Time"
          value="25°C"
          subValue="60% RH / Status: Stable"
          icon={<CloudRain className="h-4 w-4" />}
        />
        <DataCard
          title="Active Studies"
          className="bg-blue-600 text-white relative overflow-hidden"
          titleColor="text-blue-200"
        >
          <h3 className="text-4xl font-black text-white mt-2">
            {allStudies.length} <span className="text-lg font-light">Samples</span>
          </h3>
          <div className="flex gap-2">
            <DnaBadge status="default" className="bg-white/10 text-white border-none">Skin: 8</DnaBadge>
            <DnaBadge status="default" className="bg-white/10 text-white border-none">Color: 4</DnaBadge>
          </div>
        </DataCard>
      </div>

      {/* Stability Logs Table */}
      <TableWrapper>
        <table>
          <thead className="bg-[#F8FAFC]">
            <tr className="hover:bg-transparent border-[var(--border-color)]">
              <th className="py-6 pl-10 text-table-header">Study ID</th>
              <th className="text-table-header">Product / Formulation</th>
              <th className="text-table-header text-center">Chamber</th>
              <th className="text-table-header text-center">Interval</th>
              <th className="text-table-header">Next Test Gate</th>
              <th className="text-table-header text-center">Integrity Status</th>
              <th className="pr-10 text-right text-table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-slate-400" />
                  <span className="text-slate-400 text-sm">Loading studies...</span>
                </td>
              </tr>
            )}
            {!isLoading && allStudies.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <p className="text-slate-400 text-sm">No active stability studies</p>
                </td>
              </tr>
            )}
            {allStudies.map((log: any) => (
              <tr
                key={log.id}
                className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-[var(--border-color)]"
              >
                <td className="py-6 pl-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gray-100 text-gray-900 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                      <Timer className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 tracking-tight text-sm">{log.id}</span>
                      <span className="text-[11px] font-medium text-slate-400">Started: {log.startDate}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Beaker className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{log.product}</p>
                      <p className="text-[11px] font-medium text-slate-400">Batch: {log.batch}</p>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <DnaBadge status={log.chamber === "A" ? "info" : "default"}>
                    Chamber {log.chamber || "A"}
                  </DnaBadge>
                </td>
                <td className="text-center">
                  <DnaBadge status="default">{log.interval || "1M"}</DnaBadge>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <p className="font-medium text-slate-500 text-[11px]">{log.nextTest}</p>
                  </div>
                </td>
                <td className="text-center">
                  <DnaBadge status={log.status === "STABLE" ? "success" : "critical"}>
                    {log.status}
                  </DnaBadge>
                </td>
                <td className="pr-10 text-right">
                  <DnaButton
                    variant="outline"
                    className="h-9 px-4 text-[10px]"
                    onClick={() => {
                      setShowLogResult(log.id);
                      setLogResult({ date: new Date().toISOString().split("T")[0], month: (log.currentMonth || 1) + 1, ph: "", viscosity: "", appearance: "STABLE", notes: "" });
                    }}
                  >
                    Log Result <ChevronRight className="ml-2 h-3 w-3" />
                  </DnaButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      {/* New Stability Study Dialog */}
      <Dialog open={showNewStudy} onOpenChange={setShowNewStudy}>
        <DialogContent className="sm:max-w-[520px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-xl">
          <div className="p-6 bg-blue-600 text-white relative">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-black">New Stability Study</h3>
                <p className="text-blue-100 text-xs font-medium mt-0.5">Configure accelerated or real-time aging protocol</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Product / Formulation</Label>
              <DnaInput
                value={newStudy.product}
                onChange={(e) => setNewStudy((p) => ({ ...p, product: e.target.value }))}
                placeholder="Enter product name..."
                className="h-12 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Batch Reference</Label>
              <DnaInput
                value={newStudy.batch}
                onChange={(e) => setNewStudy((p) => ({ ...p, batch: e.target.value }))}
                placeholder="Batch number..."
                className="h-12 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Chamber</Label>
              <select
                value={newStudy.chamber}
                onChange={(e) => setNewStudy((p) => ({ ...p, chamber: e.target.value }))}
                className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Chamber A — 40°C / 75% RH (Accelerated)</option>
                <option value="B">Chamber B — 25°C / 60% RH (Real-Time)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Start Date</Label>
                <DnaInput
                  type="date"
                  value={newStudy.startDate}
                  onChange={(e) => setNewStudy((p) => ({ ...p, startDate: e.target.value }))}
                  className="h-12 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Test Interval</Label>
                <select
                  value={newStudy.interval}
                  onChange={(e) => setNewStudy((p) => ({ ...p, interval: e.target.value }))}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1M">1 Month</option>
                  <option value="3M">3 Months</option>
                  <option value="6M">6 Months</option>
                  <option value="12M">12 Months</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Notes</Label>
              <textarea
                value={newStudy.notes}
                onChange={(e) => setNewStudy((p) => ({ ...p, notes: e.target.value }))}
                className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Study objectives or special conditions..."
              />
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <DnaButton
              variant="outline"
              onClick={() => setShowNewStudy(false)}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Cancel
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={handleCreateStudy}
              disabled={createStudyMutation.isPending}
              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
            >
              {createStudyMutation.isPending ? "Creating..." : "Start Study"}
            </DnaButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Result Dialog */}
      <Dialog open={!!showLogResult} onOpenChange={(open) => !open && setShowLogResult(null)}>
        <DialogContent className="sm:max-w-[520px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-xl">
          <div className="p-6 bg-emerald-600 text-white relative">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-black">Log Test Result</h3>
                <p className="text-emerald-100 text-xs font-medium mt-0.5">Record stability test measurements</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Test Date</Label>
                <DnaInput
                  type="date"
                  value={logResult.date}
                  onChange={(e) => setLogResult((p) => ({ ...p, date: e.target.value }))}
                  className="h-12 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Month</Label>
                <DnaInput
                  type="number"
                  value={logResult.month}
                  onChange={(e) => setLogResult((p) => ({ ...p, month: Number(e.target.value) }))}
                  className="h-12 font-medium"
                  min={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">pH Value</Label>
                <DnaInput
                  value={logResult.ph}
                  onChange={(e) => setLogResult((p) => ({ ...p, ph: e.target.value }))}
                  placeholder="e.g. 6.8"
                  className="h-12 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Viscosity (cPs)</Label>
                <DnaInput
                  value={logResult.viscosity}
                  onChange={(e) => setLogResult((p) => ({ ...p, viscosity: e.target.value }))}
                  placeholder="e.g. 1200"
                  className="h-12 font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Appearance Verdict</Label>
              <div className="flex gap-2">
                {["STABLE", "DEGRADED", "UNSTABLE"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLogResult((p) => ({ ...p, appearance: opt }))}
                    className={`flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border-2 ${
                      logResult.appearance === opt
                        ? opt === "STABLE"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                          : opt === "DEGRADED"
                            ? "bg-amber-50 border-amber-500 text-amber-700"
                            : "bg-rose-50 border-rose-500 text-rose-700"
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Notes</Label>
              <textarea
                value={logResult.notes}
                onChange={(e) => setLogResult((p) => ({ ...p, notes: e.target.value }))}
                className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Observations..."
              />
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <DnaButton
              variant="outline"
              onClick={() => setShowLogResult(null)}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Cancel
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => handleLogResult(showLogResult!)}
              disabled={logResultMutation.isPending}
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
            >
              {logResultMutation.isPending ? "Submitting..." : "Log Result"}
            </DnaButton>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
