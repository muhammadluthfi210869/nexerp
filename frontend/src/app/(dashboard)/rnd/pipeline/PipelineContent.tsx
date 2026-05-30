"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DataCard, StatCard, DnaInput, TableWrapper } from "@/components/dna";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Beaker,
  FlaskConical,
  Package,
  Truck,
  PackageCheck,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ArrowRight,
  Clock,
  Search,
  Send,
  Loader2,
  FlaskConical as FlaskIcon,
} from "lucide-react";

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  QUEUE: { label: "Waitlist", color: "text-slate-600", bg: "bg-slate-100", icon: Inbox },
  FORMULATING: { label: "Formulating", color: "text-blue-600", bg: "bg-blue-50", icon: Beaker },
  LAB_TEST: { label: "Lab Test", color: "text-purple-600", bg: "bg-purple-50", icon: FlaskConical },
  READY_TO_SHIP: { label: "Ready to Ship", color: "text-amber-600", bg: "bg-amber-50", icon: Package },
  SHIPPED: { label: "Shipped", color: "text-indigo-600", bg: "bg-indigo-50", icon: Truck },
  RECEIVED: { label: "Received", color: "text-teal-600", bg: "bg-teal-50", icon: PackageCheck },
  CLIENT_REVIEW: { label: "Client Review", color: "text-orange-600", bg: "bg-orange-50", icon: Eye },
  APPROVED: { label: "Approved ✓", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
  REJECTED: { label: "Rejected ✗", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
};

const REVISION_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NOT_STARTED: { label: "Not Started", className: "bg-slate-100 text-slate-600 border border-slate-100" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-50 text-amber-600 border border-amber-100" },
  DONE: { label: "Done", className: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  CANCELLED: { label: "Cancelled", className: "bg-rose-50 text-rose-600 border border-rose-100" },
};

const STAGE_TRANSITIONS: Record<string, string[]> = {
  WAITING_FINANCE: ["QUEUE"],
  QUEUE: ["FORMULATING"],
  FORMULATING: ["LAB_TEST"],
  LAB_TEST: ["READY_TO_SHIP"],
  READY_TO_SHIP: ["SHIPPED"],
  SHIPPED: ["RECEIVED"],
  RECEIVED: ["CLIENT_REVIEW"],
  CLIENT_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

const TAB_STAGES: Record<string, string[]> = {
  lab: ["QUEUE", "FORMULATING", "LAB_TEST"],
  shipping: ["READY_TO_SHIP", "SHIPPED", "RECEIVED"],
  review: ["CLIENT_REVIEW", "APPROVED", "REJECTED"],
};

const TABS = [
  { key: "lab", label: "Active Lab", icon: FlaskIcon },
  { key: "shipping", label: "Shipping", icon: Package },
  { key: "review", label: "Review", icon: Eye },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PipelineContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("lab");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [targetStage, setTargetStage] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: samples } = useQuery<any[]>({
    queryKey: ["rnd-samples"],
    queryFn: async () => (await api.get("/rnd/samples")).data,
    staleTime: 10000,
  });

  const advanceMutation = useMutation({
    mutationFn: (data: { id: string; newStage: string; feedback: string }) =>
      api.patch(`/rnd/sample/${data.id}/advance`, {
        newStage: data.newStage,
        feedback: data.feedback,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
      toast.success("Stage advanced successfully.");
      setConfirmOpen(false);
      setNotes("");
      setSelectedSample(null);
      setTargetStage("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to advance stage");
    },
  });

  const getAgingDays = (date: string) => {
    const start = new Date(date).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  const handleAdvanceClick = (sample: any, stage: string) => {
    setSelectedSample(sample);
    setTargetStage(stage);
    setNotes("");
    setConfirmOpen(true);
  };

  const handleConfirmAdvance = () => {
    if (!selectedSample || !targetStage) return;
    advanceMutation.mutate({
      id: selectedSample.id,
      newStage: targetStage,
      feedback: notes,
    });
  };

  const filteredSamples = useMemo(() => {
    if (!samples) return [];
    const activeStages = TAB_STAGES[activeTab] || [];
    return samples.filter((s) => {
      const matchesStage = activeStages.includes(s.stage);
      if (!searchTerm) return matchesStage;
      const q = searchTerm.toLowerCase();
      return (
        matchesStage &&
        (s.productName?.toLowerCase().includes(q) ||
          s.sampleNumber?.toLowerCase().includes(q) ||
          s.lead?.clientName?.toLowerCase().includes(q) ||
          s.lead?.brandName?.toLowerCase().includes(q))
      );
    });
  }, [samples, activeTab, searchTerm]);

  const getCounts = () => {
    if (!samples) return { labCount: 0, shipCount: 0, reviewCount: 0, approvedCount: 0 };
    return {
      labCount: samples.filter((s) => TAB_STAGES.lab.includes(s.stage)).length,
      shipCount: samples.filter((s) => TAB_STAGES.shipping.includes(s.stage)).length,
      reviewCount: samples.filter((s) => TAB_STAGES.review.includes(s.stage)).length,
      approvedCount: samples.filter((s) => s.stage === "APPROVED").length,
    };
  };

  const { labCount, shipCount, reviewCount, approvedCount } = getCounts();

  return (
    <div className="min-h-[calc(100vh-var(--page-py)-var(--page-pb))]">
      <ModuleHeader
        title="R&D"
        titleAccent="Pipeline"
        subtitle="Sample development workflow & stage management"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="In Development"
          value={labCount}
          subValue="Active Lab"
          icon={<Beaker className="h-5 w-5" />}
        />
        <StatCard
          label="Ready to Ship"
          value={shipCount}
          subValue="Awaiting Dispatch"
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Review"
          value={reviewCount}
          subValue="Client Feedback"
          icon={<Eye className="h-5 w-5" />}
        />
        <StatCard
          label="Approved"
          value={approvedCount}
          subValue="Locked Deals"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      <DataCard noShadow>
        <div className="flex gap-0 border-b border-slate-200 -mx-8 px-8 mb-6">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                )}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-5">
          <DnaInput
            placeholder="Search samples..."
            className="h-10 w-72"
            icon={<Search />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
            {filteredSamples.length} sample{filteredSamples.length !== 1 ? "s" : ""}
          </span>
        </div>

        <TableWrapper>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-4 px-4 text-table-header text-slate-400 text-left">
                  Sample
                </th>
                <th className="py-4 px-4 text-table-header text-slate-400 text-center">
                  Stage
                </th>
                <th className="py-4 px-4 text-table-header text-slate-400 text-center">
                  Revision Status
                </th>
                <th className="py-4 px-4 text-table-header text-slate-400 text-center">
                  Aging
                </th>
                <th className="py-4 px-4 text-table-header text-slate-400 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="h-32 text-center text-slate-400 text-sm italic"
                  >
                    No samples in this stage.
                  </td>
                </tr>
              ) : (
                filteredSamples.map((sample) => {
                  const config = STAGE_CONFIG[sample.stage] || STAGE_CONFIG.QUEUE;
                  const StageIcon = config.icon;
                  const aging = getAgingDays(sample.requestedAt);
                  const validStages = STAGE_TRANSITIONS[sample.stage] || [];
                  const isTerminal = validStages.length === 0;

                  return (
                    <tr
                      key={sample.id}
                      className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                            {sample.productName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-[13px] tracking-tight">
                              {sample.productName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                              {sample.sampleNumber} •{" "}
                              {sample.lead?.brandName || sample.lead?.clientName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "rounded-lg px-3 py-1.5 font-black uppercase text-[9px] shadow-sm flex items-center gap-1.5 cursor-pointer mx-auto",
                                config.bg,
                                config.color
                              )}
                            >
                              <StageIcon className="h-3 w-3" />
                              {config.label}
                              <ChevronDown className="h-3 w-3 opacity-50" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-xl border-none shadow-sm p-2 bg-white min-w-[180px]">
                            {validStages.length === 0 ? (
                              <DropdownMenuItem disabled className="text-[9px] text-slate-400 font-medium">
                                No further stages
                              </DropdownMenuItem>
                            ) : (
                              validStages.map((stage) => {
                                const SIcon = STAGE_CONFIG[stage]?.icon || ArrowRight;
                                return (
                                  <DropdownMenuItem
                                    key={stage}
                                    onClick={() => handleAdvanceClick(sample, stage)}
                                    className="rounded-lg h-9 px-3 font-black uppercase text-[8px] hover:bg-blue-50 cursor-pointer flex justify-between"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <SIcon className="h-3 w-3 text-slate-400" />
                                      {STAGE_CONFIG[stage]?.label || stage}
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-blue-500" />
                                  </DropdownMenuItem>
                                );
                              })
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {sample.revisionStatus ? (
                          <span
                            className={cn(
                              "rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm",
                              REVISION_STATUS_CONFIG[sample.revisionStatus]?.className ||
                                "bg-slate-50 text-slate-600 border border-slate-100"
                            )}
                          >
                            {REVISION_STATUS_CONFIG[sample.revisionStatus]?.label ||
                              sample.revisionStatus}
                          </span>
                        ) : (
                          <span className="text-[11px] font-black text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Clock
                            className={cn(
                              "h-3 w-3",
                              aging > 7 ? "text-rose-500" : "text-slate-300"
                            )}
                          />
                          <span
                            className={cn(
                              "text-[11px] font-black",
                              aging > 7 ? "text-rose-600" : "text-slate-500"
                            )}
                          >
                            {aging}d
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {!isTerminal && (
                          <Button
                            onClick={() => {
                              const nextStage = validStages[0];
                              if (nextStage) handleAdvanceClick(sample, nextStage);
                            }}
                            className="h-8 px-4 rounded-xl font-black uppercase text-[9px] bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Send className="h-3 w-3 mr-1.5" />
                            Advance
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableWrapper>
      </DataCard>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <DialogTitle className="text-base font-black text-slate-900 uppercase tracking-tight truncate">
                {selectedSample?.productName || "Advance Stage"}
              </DialogTitle>
              <DialogDescription className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                Confirm stage advancement
              </DialogDescription>
            </div>

            <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-500 uppercase bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {selectedSample
                  ? STAGE_CONFIG[selectedSample.stage]?.label || selectedSample.stage
                  : "-"}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
              <span
                className={cn(
                  "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg",
                  STAGE_CONFIG[targetStage]?.bg || "bg-blue-100",
                  STAGE_CONFIG[targetStage]?.color || "text-blue-600"
                )}
              >
                {targetStage ? STAGE_CONFIG[targetStage]?.label || targetStage : "-"}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                Notes <span className="text-slate-300">(optional)</span>
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this stage change..."
                className="min-h-[60px] rounded-xl border-slate-200 bg-slate-50 text-xs font-black p-3 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="p-4 pt-0 flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmOpen(false);
                setNotes("");
                setSelectedSample(null);
                setTargetStage("");
              }}
              className="h-10 px-5 rounded-xl font-black uppercase text-[10px] text-slate-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAdvance}
              disabled={advanceMutation.isPending}
              className="h-10 px-5 rounded-xl font-black uppercase text-[10px] bg-blue-600 hover:bg-blue-700 text-white"
            >
              {advanceMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1.5" />
              )}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
