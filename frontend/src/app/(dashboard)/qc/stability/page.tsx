"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  FlaskConical,
  Calendar,
  ChevronRight,
  Timer,
  History,
  Beaker,
  Thermometer,
  CloudRain,
  ClipboardCheck,
  Plus,
  Loader2,
} from "lucide-react";
import {
  OperationalDataTable,
  OperationalInput,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
  getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalDate } from "@/lib/operational-formatters";
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
  const [search, setSearch] = useState("");
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

  const filtered = useMemo(() => {
    if (!search) return allStudies;
    const q = search.toLowerCase();
    return allStudies.filter((s: any) =>
      (s.product || "").toLowerCase().includes(q) ||
      (s.batch || "").toLowerCase().includes(q) ||
      (s.id || "").toLowerCase().includes(q)
    );
  }, [allStudies, search]);

  const stableCount = allStudies.filter((s: any) => s.status === "STABLE").length;
  const monitoringCount = allStudies.filter((s: any) => s.status === "MONITORING").length;

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Study ID",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-blue-50 text-blue-600">
              <Timer className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-slate-900">{row.original.id}</span>
              <span className="text-[11px] text-slate-500">Started: {formatOperationalDate(row.original.startDate)}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "product",
        header: "Product / Formulation",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-slate-100 text-slate-500">
              <Beaker className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-slate-900">{row.original.product}</span>
              <span className="text-[11px] text-slate-500">Batch: {row.original.batch}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "chamber",
        header: () => <div className="text-center">Chamber</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-center">
            <span className="operational-status-badge is-info">
              Chamber {row.original.chamber || "A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "interval",
        header: () => <div className="text-center">Interval</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-center">
            <span className="operational-status-badge is-neutral">{row.original.interval || "1M"}</span>
          </div>
        ),
      },
      {
        accessorKey: "nextTest",
        header: "Next Test Gate",
        cell: ({ getValue }: { getValue: () => string }) => (
          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700 tabular-nums">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatOperationalDate(getValue()) || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Integrity Status</div>,
        cell: ({ row }: { row: { original: any } }) => {
          const s = row.original.status;
          const tone = s === "STABLE" ? "success" : s === "MONITORING" ? "pending" : "danger";
          return (
            <div className="flex justify-center">
              <span className={`operational-status-badge is-${tone}`}>
                {getOperationalStatusLabel(s)}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-end">
            <button
              type="button"
              className="operational-button is-secondary h-8 px-3 text-[11px]"
              onClick={() => {
                setShowLogResult(row.original.id);
                setLogResult({ date: new Date().toISOString().split("T")[0], month: (row.original.currentMonth || 1) + 1, ph: "", viscosity: "", appearance: "STABLE", notes: "" });
              }}
            >
              Log Result
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalPageShell
      title="Stability Testing"
      subtitle="Accelerated & real-time stability verification protocols"
      actions={
        <div className="flex items-center gap-2">
          <button type="button" className="operational-button is-secondary">
            <History className="h-4 w-4" />
            <span>Stability Archives</span>
          </button>
          <button
            type="button"
            className="operational-button is-primary"
            onClick={() => setShowNewStudy(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Start New Study</span>
          </button>
        </div>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Chamber A: Accelerated"
            value="40°C"
            helper="75% RH · Operating within scientific threshold"
            icon={<Thermometer className="h-4 w-4" />}
            tone="red"
          />
          <OperationalMetricCard
            label="Chamber B: Real-Time"
            value="25°C"
            helper="60% RH · Stable"
            icon={<CloudRain className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Active Studies"
            value={allStudies.length}
            helper={`${stableCount} stabil · ${monitoringCount} monitoring`}
            icon={<FlaskConical className="h-4 w-4" />}
            tone="purple"
          />
        </OperationalMetricGrid>

        <OperationalPanel>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <OperationalInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari study, product, atau batch..."
              className="max-w-sm"
            />
          </div>
        </OperationalPanel>

        <OperationalDataTable
          data={filtered as any}
          columns={columns as any}
          getRowId={(row: any) => row.id}
          loading={isLoading}
          searchPlaceholder="Cari study..."
        />
      </div>

      {/* New Stability Study Dialog */}
      <Dialog open={showNewStudy} onOpenChange={setShowNewStudy}>
        <DialogContent className="sm:max-w-[520px] rounded-xl border border-slate-200 bg-white p-0">
          <div className="bg-blue-600 p-5 text-white">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-6 w-6" />
              <div>
                <h3 className="text-[16px] font-semibold">New Stability Study</h3>
                <p className="mt-0.5 text-[11px] font-medium text-blue-100">Configure accelerated or real-time aging protocol</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="operational-field">
              <span>Product / Formulation</span>
              <input
                value={newStudy.product}
                onChange={(e) => setNewStudy((p) => ({ ...p, product: e.target.value }))}
                placeholder="Enter product name..."
                className="h-9"
              />
            </div>
            <div className="operational-field">
              <span>Batch Reference</span>
              <input
                value={newStudy.batch}
                onChange={(e) => setNewStudy((p) => ({ ...p, batch: e.target.value }))}
                placeholder="Batch number..."
                className="h-9"
              />
            </div>
            <div className="operational-field">
              <span>Chamber</span>
              <select
                value={newStudy.chamber}
                onChange={(e) => setNewStudy((p) => ({ ...p, chamber: e.target.value }))}
                className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 font-medium text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Chamber A — 40°C / 75% RH (Accelerated)</option>
                <option value="B">Chamber B — 25°C / 60% RH (Real-Time)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="operational-field">
                <span>Start Date</span>
                <input
                  type="date"
                  value={newStudy.startDate}
                  onChange={(e) => setNewStudy((p) => ({ ...p, startDate: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="operational-field">
                <span>Test Interval</span>
                <select
                  value={newStudy.interval}
                  onChange={(e) => setNewStudy((p) => ({ ...p, interval: e.target.value }))}
                  className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 font-medium text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1M">1 Month</option>
                  <option value="3M">3 Months</option>
                  <option value="6M">6 Months</option>
                  <option value="12M">12 Months</option>
                </select>
              </div>
            </div>
            <div className="operational-field">
              <span>Notes</span>
              <textarea
                value={newStudy.notes}
                onChange={(e) => setNewStudy((p) => ({ ...p, notes: e.target.value }))}
                className="min-h-24 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-medium text-[12px] text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Study objectives or special conditions..."
              />
            </div>
          </div>
          <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-4">
            <button
              type="button"
              className="operational-button is-secondary flex-1 h-10"
              onClick={() => setShowNewStudy(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="operational-button is-primary flex-1 h-10"
              onClick={handleCreateStudy}
              disabled={createStudyMutation.isPending}
            >
              {createStudyMutation.isPending ? "Creating..." : "Start Study"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Result Dialog */}
      <Dialog open={!!showLogResult} onOpenChange={(open) => !open && setShowLogResult(null)}>
        <DialogContent className="sm:max-w-[520px] rounded-xl border border-slate-200 bg-white p-0">
          <div className="bg-emerald-600 p-5 text-white">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-6 w-6" />
              <div>
                <h3 className="text-[16px] font-semibold">Log Test Result</h3>
                <p className="mt-0.5 text-[11px] font-medium text-emerald-100">Record stability test measurements</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="operational-field">
                <span>Test Date</span>
                <input
                  type="date"
                  value={logResult.date}
                  onChange={(e) => setLogResult((p) => ({ ...p, date: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="operational-field">
                <span>Month</span>
                <input
                  type="number"
                  value={logResult.month}
                  onChange={(e) => setLogResult((p) => ({ ...p, month: Number(e.target.value) }))}
                  className="h-9"
                  min={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="operational-field">
                <span>pH Value</span>
                <input
                  value={logResult.ph}
                  onChange={(e) => setLogResult((p) => ({ ...p, ph: e.target.value }))}
                  placeholder="e.g. 6.8"
                  className="h-9"
                />
              </div>
              <div className="operational-field">
                <span>Viscosity (cPs)</span>
                <input
                  value={logResult.viscosity}
                  onChange={(e) => setLogResult((p) => ({ ...p, viscosity: e.target.value }))}
                  placeholder="e.g. 1200"
                  className="h-9"
                />
              </div>
            </div>
            <div className="operational-field">
              <span>Appearance Verdict</span>
              <div className="flex gap-2">
                {["STABLE", "DEGRADED", "UNSTABLE"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLogResult((p) => ({ ...p, appearance: opt }))}
                    className={`flex-1 h-9 rounded-md font-bold text-[11px] uppercase tracking-wider transition-all border ${
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
            <div className="operational-field">
              <span>Notes</span>
              <textarea
                value={logResult.notes}
                onChange={(e) => setLogResult((p) => ({ ...p, notes: e.target.value }))}
                className="min-h-20 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-medium text-[12px] text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Observations..."
              />
            </div>
          </div>
          <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-4">
            <button
              type="button"
              className="operational-button is-secondary flex-1 h-10"
              onClick={() => setShowLogResult(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="operational-button is-primary flex-1 h-10"
              onClick={() => handleLogResult(showLogResult!)}
              disabled={logResultMutation.isPending}
            >
              {logResultMutation.isPending ? "Submitting..." : "Log Result"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
