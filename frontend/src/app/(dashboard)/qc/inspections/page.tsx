"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  ClipboardCheck,
  FlaskConical,
  Package,
  Archive,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaButton, DnaBadge, DnaInput } from "@/components/dna";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TableWrapper } from "@/components/dna/TableWrapper";

const QC_STAGE_META: Record<string, { icon: React.ReactNode; label: string; params: string[] }> = {
  inbound: {
    icon: <ClipboardCheck className="h-4 w-4" />,
    label: "Inbound",
    params: ["COA Document", "Integrity Packing", "Labeling Check"],
  },
  bulk: {
    icon: <FlaskConical className="h-4 w-4" />,
    label: "Bulk",
    params: ["pH Value", "Viscosity", "Organoleptic"],
  },
  filling: {
    icon: <Package className="h-4 w-4" />,
    label: "Filling",
    params: ["Sampling Volume", "Sealing Check"],
  },
  final: {
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Final",
    params: ["Sampling Weight (±1%)", "Inkjet Coding", "Barcode Scan"],
  },
  retention: {
    icon: <Archive className="h-4 w-4" />,
    label: "Retention",
    params: ["Sample Saved", "Rack Location", "Expiry Match"],
  },
};

const STAGE_TO_PHASE: Record<string, string> = {
  inbound: "INBOUND",
  bulk: "MIXING",
  filling: "FILLING",
  final: "FINAL",
  retention: "FINAL",
};

const PARAM_FIELD_MAP: Record<string, string> = {
  "COA Document": "coaVerified",
  "Integrity Packing": "sealingCheck",
  "Labeling Check": "labelingCheck",
  "pH Value": "ph",
  Viscosity: "viscosity",
  Organoleptic: "organoleptic",
  "Sampling Volume": "fillingWeight",
  "Sealing Check": "sealingCheck",
  "Sampling Weight (±1%)": "fillingWeight",
  "Inkjet Coding": "labelingCheck",
  "Barcode Scan": "labelingCheck",
  "Sample Saved": "expDateCheck",
  "Rack Location": "expDateCheck",
  "Expiry Match": "expDateCheck",
};

export default function QCInspectionsPage() {
  const [activeTab, setActiveTab] = useState("inbound");
  const [search, setSearch] = useState("");
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [paramResults, setParamResults] = useState<Record<string, "GOOD" | "REJECT" | null>>({});
  const [inspectionNotes, setInspectionNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: pendingItems, isLoading } = useQuery({
    queryKey: ["qc-pending"],
    queryFn: async () => {
      const res = await api.get("/qc/workbench");
      return (res.data || []).map((a: any) => ({
        id: a.id,
        source: a.stepLogId ? a.stepLogId.substring(0, 12).toUpperCase() : a.inventoryId ? "INBOUND" : "MANUAL",
        batch: a.materialBatchNo || a.id.substring(0, 8).toUpperCase(),
        material: a.notes || a.defectType || "Pending Inspection",
        supplier: a.supplierId || "—",
        stage: (a.phase || "inbound").toLowerCase(),
        date: new Date(a.createdAt).toISOString().split("T")[0],
        priority: a.severity === "CRITICAL" ? "HIGH" : a.severity === "MAJOR" ? "MEDIUM" : "LOW",
      }));
    },
    staleTime: 30_000,
  });

  const auditMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post("/qc/audits", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Inspection submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["qc-pending"] });
      queryClient.invalidateQueries({ queryKey: ["qc-report"] });
      setParamResults({});
      setInspectionNotes("");
      setSelectedPendingId(null);
    },
    onError: (err: any) => {
      toast.error("Submission failed", {
        description: err.response?.data?.message || "Check connection and retry",
      });
    },
  });

  const handleParamClick = (param: string, result: "GOOD" | "REJECT") => {
    setParamResults((prev) => ({
      ...prev,
      [param]: prev[param] === result ? null : result,
    }));
  };

  const handleReset = () => {
    setParamResults({});
    setInspectionNotes("");
  };

  const handleSubmit = () => {
    const params = QC_STAGE_META[activeTab]?.params || [];
    const hasAnyResult = params.some((p) => paramResults[p]);
    if (!hasAnyResult) {
      toast.error("Select at least one parameter result");
      return;
    }

    const anyNok = params.some((p) => paramResults[p] === "REJECT");
    const payload: Record<string, unknown> = {
      status: anyNok ? "REJECT" : "GOOD",
      phase: STAGE_TO_PHASE[activeTab] || activeTab.toUpperCase(),
      notes: inspectionNotes,
    };

    for (const param of params) {
      const field = PARAM_FIELD_MAP[param];
      const result = paramResults[param];
      if (result && field) {
        payload[field] = result === "GOOD" ? "PASS" : "FAIL";
      }
    }

    auditMutation.mutate(payload);
  };

  const filtered = (pendingItems || []).filter(
    (i: any) =>
      i.stage === activeTab &&
      (search === "" ||
        i.material.toLowerCase().includes(search.toLowerCase()) ||
        i.batch.toLowerCase().includes(search.toLowerCase())),
  );

  const priorityColor = (p: string) => {
    if (p === "HIGH") return "critical" as const;
    if (p === "MEDIUM") return "warning" as const;
    return "default" as const;
  };

  return (
    <DashboardShell
      title="Inspeksi"
      titleAccent="QC"
      subtitle="Per-Stage Quality Inspection — Inbound, Bulk, Filling, Final, Retention"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100">
            {Object.entries(QC_STAGE_META).map(([key, meta]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all gap-2"
              >
                {meta.icon}
                {meta.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <DnaInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari batch / material..."
                icon={<Search className="h-4 w-4" />}
                className="w-64"
              />
            </div>
          </div>
        </div>

        {Object.entries(QC_STAGE_META).map(([key, meta]) => (
          <TabsContent key={key} value={key} className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="col-span-2 rounded-[24px] border border-[var(--border-color)] shadow-sm overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {meta.label} Inspection — Parameters
                  </h3>
                  <DnaBadge status="info">{meta.params.length} Checks</DnaBadge>
                </div>
                <div className="p-6 space-y-4">
                  {meta.params.map((param, i) => {
                    const result = paramResults[param];
                    return (
                      <div key={i} className="flex items-center justify-between p-4 rounded-[24px] bg-slate-50 border border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">{param}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleParamClick(param, "GOOD")}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-2",
                              result === "GOOD"
                                ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600",
                            )}
                          >
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </button>
                          <button
                            type="button"
                            onClick={() => handleParamClick(param, "REJECT")}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-2",
                              result === "REJECT"
                                ? "bg-rose-50 border-rose-500 text-rose-700"
                                : "bg-white border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-600",
                            )}
                          >
                            <XCircle className="h-3 w-3" /> NOK
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-4 flex justify-end gap-3">
                    <DnaButton variant="outline" size="md" onClick={handleReset}>
                      Reset
                    </DnaButton>
                    <DnaButton
                      variant="secondary"
                      className="gap-2"
                      onClick={handleSubmit}
                      disabled={auditMutation.isPending}
                    >
                      {auditMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      {auditMutation.isPending ? "Submitting..." : "Submit Inspection"}
                    </DnaButton>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--border-color)] shadow-sm p-6 bg-white">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Inspection Notes</h3>
                <textarea
                  placeholder="Catatan inspektur..."
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  className="w-full h-32 p-4 rounded-[24px] border border-[var(--border-color)] bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-3 w-3 text-blue-500" />
                    Hasil akan tercatat di QCAudit
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    FAIL trigger auto RejectExecution
                  </div>
                </div>
              </div>
            </div>

            <TableWrapper>
              <table className="table-dense">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="text-table-header text-slate-400 py-4 px-4">ID</th>
                    <th className="text-table-header text-slate-400 py-4 px-4">Source</th>
                    <th className="text-table-header text-slate-400 py-4 px-4">Batch</th>
                    <th className="text-table-header text-slate-400 py-4 px-4">Material / Product</th>
                    <th className="text-table-header text-slate-400 py-4 px-4">Date</th>
                    <th className="text-table-header text-slate-400 py-4 px-4">Priority</th>
                    <th className="text-table-header text-slate-400 py-4 px-4">Status</th>
                    <th className="text-table-header text-slate-400 py-4 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                        Loading inspections...
                      </td>
                    </tr>
                  )}
                  {!isLoading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                        No pending {meta.label} inspections
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    filtered.map((item: any) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50"
                      >
                        <td className="py-3 px-4 font-black text-slate-900 text-xs tabular-nums">
                          {item.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{item.source}</td>
                        <td className="py-3 px-4 font-black text-slate-900 text-xs tabular-nums">{item.batch}</td>
                        <td className="py-3 px-4 font-black text-slate-900 text-xs uppercase">{item.material}</td>
                        <td className="py-3 px-4 text-slate-400">{item.date}</td>
                        <td className="py-3 px-4">
                          <DnaBadge status={priorityColor(item.priority)}>{item.priority}</DnaBadge>
                        </td>
                        <td>
                          <DnaBadge status="warning">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            PENDING
                          </DnaBadge>
                        </td>
                        <td className="pr-4 text-right">
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedPendingId(selectedPendingId === item.id ? null : item.id)
                            }
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {selectedPendingId === item.id ? "Inspecting..." : "Inspect"}
                          </DnaButton>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </TableWrapper>
          </TabsContent>
        ))}
      </Tabs>
    </DashboardShell>
  );
}
