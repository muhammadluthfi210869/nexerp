"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  FlaskConical,
  Droplets,
  Box,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ClipboardList,
  ScanLine,
  Hash,
  PauseCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { DataCard } from "@/components/dna/DataCard";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaInput } from "@/components/dna/DnaInput";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaBadge } from "@/components/dna/DnaBadge";
import DefectDetailModal from "@/components/qc/DefectDetailModal";
import QcSignatureModal, { QcParameter } from "@/components/qc/QcSignatureModal";
import QcNumpad from "@/components/qc/QcNumpad";

type InspectionPhase = "INBOUND" | "MIXING" | "FILLING" | "PACKING" | "FINAL";

interface PhaseConfig {
  id: InspectionPhase;
  label: string;
  icon: React.ElementType;
  description: string;
}

const PHASES: PhaseConfig[] = [
  { id: "INBOUND", label: "Inbound", icon: Package, description: "Raw material receiving inspection" },
  { id: "MIXING", label: "Mixing", icon: FlaskConical, description: "Batch mixing parameters verification" },
  { id: "FILLING", label: "Filling", icon: Droplets, description: "Fill weight & seal integrity check" },
  { id: "PACKING", label: "Packing", icon: Box, description: "Packaging & labeling audit" },
  { id: "FINAL", label: "Final", icon: ShieldCheck, description: "Final product release verification" },
];

type PassFail = "PASS" | "FAIL";

interface InboundData {
  coaVerified: PassFail;
  organoleptic: PassFail;
  dimensionCheck: PassFail;
}

interface MixingData {
  ph: number;
  viscosity: number;
  densityValue: number;
  homogenityPass: PassFail;
}

interface FillingData {
  torqueValue: number;
  leakTestPass: PassFail;
  fillingWeight: number;
}

interface PackingData {
  inkjetCheck: PassFail;
  sealingCheck: PassFail;
  labelingCheck: PassFail;
  expDateCheck: PassFail;
}

type PhaseData = InboundData | MixingData | FillingData | PackingData;

const passFailOptions: PassFail[] = ["PASS", "FAIL"];

export default function QCWorkbenchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activePhase, setActivePhase] = useState<InspectionPhase>("INBOUND");
  const [stepLogId, setStepLogId] = useState(searchParams.get("step_log_id") || "");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadTarget, setNumpadTarget] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"PASS" | "REJECT" | "HOLD" | null>(null);
  const [rejectQty, setRejectQty] = useState(0);
  const [rejectCause, setRejectCause] = useState("");
  const [defectCategory, setDefectCategory] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [inbound, setInbound] = useState<InboundData>({
    coaVerified: "PASS",
    organoleptic: "PASS",
    dimensionCheck: "PASS",
  });

  const [mixing, setMixing] = useState<MixingData>({
    ph: 7,
    viscosity: 0,
    densityValue: 0,
    homogenityPass: "PASS",
  });

  const [filling, setFilling] = useState<FillingData>({
    torqueValue: 0,
    leakTestPass: "PASS",
    fillingWeight: 0,
  });

  const [packing, setPacking] = useState<PackingData>({
    inkjetCheck: "PASS",
    sealingCheck: "PASS",
    labelingCheck: "PASS",
    expDateCheck: "PASS",
  });

  const auditMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post("/qc/audits", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("QC Audit Recorded", {
        description: `Audit #${data.id} has been submitted successfully.`,
      });
      router.refresh();
    },
    onError: (err: any) => {
      toast.error("Audit Submission Failed", {
        description: err.response?.data?.message || "Please check your connection and try again.",
      });
    },
  });

  const { data: phaseBreakdown } = useQuery({
    queryKey: ["qc-phase-breakdown"],
    queryFn: async () => (await api.get("/qc/analytics/phase-breakdown")).data,
  });

  const activePhaseStats = (phaseBreakdown as any)?.phases?.find(
    (p: any) => p.phase === activePhase
  );

  const handlePass = () => {
    setVerdict("PASS");
    setShowSignDialog(true);
  };

  const handleReject = () => {
    setVerdict("REJECT");
    setShowRejectDialog(true);
  };

  const handleHold = () => {
    setVerdict("HOLD");
    setShowConfirmDialog(true);
  };

  const handleConfirmHold = () => {
    const basePayload: Record<string, unknown> = {
      stepLogId: stepLogId || undefined,
      status: "HOLD",
      stage: activePhase,
      rejectQty,
      rejectCause,
      defectCategory,
      notes: `QC HOLD - ${rejectCause}`,
    };
    auditMutation.mutate(basePayload);
    setShowConfirmDialog(false);
  };

  const handleSign = (signData: { pin: string; notes: string }) => {
    const basePayload: Record<string, unknown> = {
      stepLogId: stepLogId || undefined,
      status: verdict,
      pin: signData.pin,
      notes: verdict === "REJECT" 
        ? `${signData.notes}\n\nReject Qty: ${rejectQty}\nReject Cause: ${rejectCause}\nDefect Category: ${defectCategory}`
        : signData.notes,
      stage: activePhase,
    };

    switch (activePhase) {
      case "INBOUND":
        basePayload.coaVerified = inbound.coaVerified;
        basePayload.organoleptic = inbound.organoleptic;
        basePayload.dimensionCheck = inbound.dimensionCheck;
        break;
      case "MIXING":
        basePayload.ph = mixing.ph;
        basePayload.viscosity = mixing.viscosity;
        basePayload.densityValue = mixing.densityValue;
        basePayload.homogenityPass = mixing.homogenityPass;
        break;
      case "FILLING":
        basePayload.torqueValue = filling.torqueValue;
        basePayload.leakTestPass = filling.leakTestPass;
        basePayload.fillingWeight = filling.fillingWeight;
        break;
      case "PACKING":
        basePayload.inkjetCheck = packing.inkjetCheck;
        basePayload.sealingCheck = packing.sealingCheck;
        basePayload.labelingCheck = packing.labelingCheck;
        basePayload.expDateCheck = packing.expDateCheck;
        break;
      case "FINAL":
        basePayload.coaVerified = inbound.coaVerified;
        basePayload.organoleptic = inbound.organoleptic;
        break;
    }

    auditMutation.mutate(basePayload);
  };

  const handleDefectSubmit = (defectData: { defectCategory: string; defectType: string; defectLocation: string; severity: string; disposition: string; defectCause: string; correctiveAction: string }) => {
    const basePayload: Record<string, unknown> = {
      stepLogId: stepLogId || undefined,
      status: "REJECTED",
      stage: activePhase,
      ...defectData,
    };

    auditMutation.mutate(basePayload);
  };

  const handleNumpadConfirm = (value: number) => {
    switch (numpadTarget) {
      case "ph":
        setMixing((prev) => ({ ...prev, ph: value }));
        break;
      case "viscosity":
        setMixing((prev) => ({ ...prev, viscosity: value }));
        break;
      case "densityValue":
        setMixing((prev) => ({ ...prev, densityValue: value }));
        break;
      case "torqueValue":
        setFilling((prev) => ({ ...prev, torqueValue: value }));
        break;
      case "fillingWeight":
        setFilling((prev) => ({ ...prev, fillingWeight: value }));
        break;
    }
  };

  const openNumpad = (target: string) => {
    setNumpadTarget(target);
    setShowNumpad(true);
  };

  const getNumpadProps = () => {
    switch (numpadTarget) {
      case "ph":
        return { label: "pH Value", unit: "pH", currentValue: mixing.ph };
      case "viscosity":
        return { label: "Viscosity", unit: "cPs", currentValue: mixing.viscosity };
      case "densityValue":
        return { label: "Density", unit: "g/mL", currentValue: mixing.densityValue };
      case "torqueValue":
        return { label: "Torque", unit: "Nm", currentValue: filling.torqueValue };
      case "fillingWeight":
        return { label: "Fill Weight", unit: "g", currentValue: filling.fillingWeight };
      default:
        return { label: "Value", unit: "" };
    }
  };

  const getParameters = (): QcParameter[] => {
    switch (activePhase) {
      case "INBOUND":
        return [
          { label: "COA Verified", value: inbound.coaVerified, range: "PASS", status: inbound.coaVerified },
          { label: "Organoleptic", value: inbound.organoleptic, range: "PASS", status: inbound.organoleptic },
          { label: "Dimension Check", value: inbound.dimensionCheck, range: "PASS", status: inbound.dimensionCheck },
        ];
      case "MIXING":
        return [
          { label: "pH Level", value: String(mixing.ph), range: "6.5 - 7.5", status: mixing.ph >= 6.5 && mixing.ph <= 7.5 ? "PASS" : "FAIL" },
          { label: "Viscosity", value: `${mixing.viscosity} cPs`, range: "Spec Limit", status: mixing.viscosity > 0 ? "PASS" : "FAIL" },
          { label: "Density", value: `${mixing.densityValue} g/mL`, range: "Spec Limit", status: mixing.densityValue > 0 ? "PASS" : "FAIL" },
          { label: "Homogenity", value: mixing.homogenityPass, range: "PASS", status: mixing.homogenityPass },
        ];
      case "FILLING":
        return [
          { label: "Torque", value: `${filling.torqueValue} Nm`, range: "Spec Limit", status: filling.torqueValue > 0 ? "PASS" : "FAIL" },
          { label: "Leak Test", value: filling.leakTestPass, range: "PASS", status: filling.leakTestPass },
          { label: "Fill Weight", value: `${filling.fillingWeight} g`, range: "Spec Limit", status: filling.fillingWeight > 0 ? "PASS" : "FAIL" },
        ];
      case "PACKING":
        return [
          { label: "Inkjet Check", value: packing.inkjetCheck, range: "PASS", status: packing.inkjetCheck },
          { label: "Sealing Check", value: packing.sealingCheck, range: "PASS", status: packing.sealingCheck },
          { label: "Labeling Check", value: packing.labelingCheck, range: "PASS", status: packing.labelingCheck },
          { label: "Exp Date Check", value: packing.expDateCheck, range: "PASS", status: packing.expDateCheck },
        ];
      case "FINAL":
        return [
          { label: "COA Verified", value: inbound.coaVerified, range: "PASS", status: inbound.coaVerified },
          { label: "Organoleptic", value: inbound.organoleptic, range: "PASS", status: inbound.organoleptic },
        ];
      default:
        return [];
    }
  };

  const renderPassFailSelect = (
    label: string,
    value: PassFail,
    onChange: (val: PassFail) => void
  ) => (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </Label>
      <div className="flex gap-2">
        {passFailOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border-2",
              value === opt
                ? opt === "PASS"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                  : "bg-rose-50 border-rose-500 text-rose-700"
                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
            )}
          >
            {opt === "PASS" ? (
              <span className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> PASS
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <XCircle className="h-4 w-4" /> FAIL
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderNumericInput = (
    label: string,
    value: number,
    unit: string,
    target: string
  ) => (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </Label>
      <button
        type="button"
        onClick={() => openNumpad(target)}
        className="flex items-center justify-between w-full h-14 px-6 rounded-xl bg-slate-50 border border-[var(--border-color)] hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
      >
        <span className="text-lg font-bold tabular-nums text-slate-900">
          {value}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">{unit}</span>
          <span className="text-[9px] font-black uppercase text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Tap to edit
          </span>
        </span>
      </button>
    </div>
  );

  const hasAllPass = getParameters().every((p) => p.status === "PASS");

  return (
    <DashboardShell title="QC" titleAccent="WORKBENCH">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Phase Selector */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-2xl p-1.5 border border-[var(--border-color)] shadow-sm">
          {PHASES.map((phase) => {
            const Icon = phase.icon;
            const isActive = activePhase === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => setActivePhase(phase.id)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  isActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {phase.label}
              </button>
            );
          })}
        </div>

        {/* Phase Context Info Bar */}
        {stepLogId && (
          <div className="mb-8 p-4 rounded-2xl bg-slate-50 border border-[var(--border-color)] flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step Log</span>
              <span className="text-xs font-bold font-mono text-slate-900">{stepLogId}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phase</span>
              <DnaBadge status="info" className="text-[8px]">{activePhase}</DnaBadge>
            </div>
            {activePhaseStats && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">This Phase</span>
                <span className="text-xs font-bold text-emerald-600">{activePhaseStats.passCount} passed</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-red-500">{activePhaseStats.rejectCount} rejected</span>
                <span className="text-[9px] text-slate-400">this month</span>
              </div>
            )}
          </div>
        )}

        {/* Step Log ID Input */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ScanLine className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Step Log ID
              </span>
            </div>
            <DnaInput
              value={stepLogId}
              onChange={(e) => setStepLogId(e.target.value)}
              placeholder="Auto from URL or paste here..."
              className="max-w-md h-10 font-medium text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main: Parameter Inputs */}
          <div className="lg:col-span-2 space-y-8">
            <DataCard className="overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between -mx-8 -mt-8 mb-0" style={{ marginLeft: -32, marginRight: -32, marginTop: -32 }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[var(--border-color)] flex items-center justify-center shadow-sm">
                    {React.createElement(PHASES.find((p) => p.id === activePhase)!.icon, {
                      className: "h-5 w-5 text-slate-700",
                    })}
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">
                      {activePhase} Inspection
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {PHASES.find((p) => p.id === activePhase)!.description}
                    </p>
                  </div>
                </div>
                <DnaBadge status="info">{activePhase}</DnaBadge>
              </div>
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* INBOUND */}
                    {activePhase === "INBOUND" && (
                      <div className="space-y-5">
                        {renderPassFailSelect("COA Verified", inbound.coaVerified, (v) =>
                          setInbound((prev) => ({ ...prev, coaVerified: v }))
                        )}
                        {renderPassFailSelect("Organoleptic (Color / Odor / Texture)", inbound.organoleptic, (v) =>
                          setInbound((prev) => ({ ...prev, organoleptic: v }))
                        )}
                        {renderPassFailSelect("Dimension Check", inbound.dimensionCheck, (v) =>
                          setInbound((prev) => ({ ...prev, dimensionCheck: v }))
                        )}
                      </div>
                    )}

                    {/* MIXING */}
                    {activePhase === "MIXING" && (
                      <div className="grid grid-cols-2 gap-5">
                        {renderNumericInput("pH Value", mixing.ph, "pH", "ph")}
                        {renderNumericInput("Viscosity", mixing.viscosity, "cPs", "viscosity")}
                        {renderNumericInput("Density", mixing.densityValue, "g/mL", "densityValue")}
                        <div className="col-span-2">
                          {renderPassFailSelect("Homogenity Pass", mixing.homogenityPass, (v) =>
                            setMixing((prev) => ({ ...prev, homogenityPass: v }))
                          )}
                        </div>
                      </div>
                    )}

                    {/* FILLING */}
                    {activePhase === "FILLING" && (
                      <div className="grid grid-cols-2 gap-5">
                        {renderNumericInput("Torque Value", filling.torqueValue, "Nm", "torqueValue")}
                        {renderNumericInput("Fill Weight", filling.fillingWeight, "g", "fillingWeight")}
                        <div className="col-span-2">
                          {renderPassFailSelect("Leak Test", filling.leakTestPass, (v) =>
                            setFilling((prev) => ({ ...prev, leakTestPass: v }))
                          )}
                        </div>
                      </div>
                    )}

                    {/* PACKING */}
                    {activePhase === "PACKING" && (
                      <div className="grid grid-cols-2 gap-5">
                        {renderPassFailSelect("Inkjet Coding Check", packing.inkjetCheck, (v) =>
                          setPacking((prev) => ({ ...prev, inkjetCheck: v }))
                        )}
                        {renderPassFailSelect("Sealing Integrity Check", packing.sealingCheck, (v) =>
                          setPacking((prev) => ({ ...prev, sealingCheck: v }))
                        )}
                        {renderPassFailSelect("Labeling Check", packing.labelingCheck, (v) =>
                          setPacking((prev) => ({ ...prev, labelingCheck: v }))
                        )}
                        {renderPassFailSelect("Expiration Date Check", packing.expDateCheck, (v) =>
                          setPacking((prev) => ({ ...prev, expDateCheck: v }))
                        )}
                      </div>
                    )}

                    {/* FINAL */}
                    {activePhase === "FINAL" && (
                      <div className="space-y-5">
                        {renderPassFailSelect("COA Verified", inbound.coaVerified, (v) =>
                          setInbound((prev) => ({ ...prev, coaVerified: v }))
                        )}
                        {renderPassFailSelect("Organoleptic (Color / Odor / Texture)", inbound.organoleptic, (v) =>
                          setInbound((prev) => ({ ...prev, organoleptic: v }))
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </DataCard>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <DnaButton
                onClick={handleReject}
                disabled={auditMutation.isPending}
                variant="danger"
                className="flex-1 h-16 rounded-2xl text-xs tracking-widest"
              >
                <XCircle className="h-5 w-5" />
                Reject / NCR
              </DnaButton>
              <DnaButton
                onClick={handleHold}
                disabled={auditMutation.isPending}
                variant="outline"
                className="h-16 rounded-2xl border-2 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 tracking-widest px-6"
              >
                <PauseCircle className="h-5 w-5" />
                HOLD
              </DnaButton>
              <DnaButton
                onClick={handlePass}
                disabled={auditMutation.isPending || !hasAllPass}
                variant="primary"
                className={cn(
                  "flex-[2] h-16 rounded-2xl text-sm tracking-widest shadow-lg",
                  hasAllPass
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-[1.02]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                <CheckCircle2 className="h-5 w-5" />
                {auditMutation.isPending ? "Submitting..." : "PASS & Sign Off"}
              </DnaButton>
            </div>
          </div>

          {/* Sidebar: Summary */}
          <div className="space-y-6">
            <DataCard
              title="Parameter Summary"
              dotColor="bg-slate-400"
              className="space-y-3"
              noShadow
            >
                {getParameters().map((param, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-[11px] font-bold text-slate-600">
                      {param.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tabular-nums text-slate-900">
                        {param.value}
                      </span>
                      <DnaBadge
                        status={param.status === "PASS" ? "success" : "critical"}
                        className="text-[8px] px-2 py-0.5"
                      >
                        {param.status}
                      </DnaBadge>
                    </div>
                  </div>
                ))}
                <div className="pt-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Overall
                  </span>
                  <DnaBadge
                    status={hasAllPass ? "success" : "critical"}
                    className="px-3 py-1"
                  >
                    {hasAllPass ? "ALL PASS" : "FAIL DETECTED"}
                  </DnaBadge>
                </div>
            </DataCard>

            <DataCard
              title="Audit Info"
              dotColor="bg-emerald-400"
              titleColor="text-white/60"
              className="bg-slate-900 text-white overflow-hidden relative"
              noShadow
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Stage</span>
                  <DnaBadge status="info" className="text-[8px]">{activePhase}</DnaBadge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Step Log</span>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">
                    {stepLogId || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Endpoint</span>
                  <span className="text-[9px] font-bold text-blue-300 font-mono">POST /qc/audits</span>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed italic">
                    "All QC data is timestamped and encrypted. Audit trail is immutable once submitted."
                  </p>
                </div>
              </div>
            </DataCard>
          </div>
        </div>
      </div>

      {/* Defect Detail Modal */}
      <DefectDetailModal
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onSubmit={handleDefectSubmit}
      />

      {/* HOLD Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-xl">
          <div className="p-6 bg-amber-500 text-white relative">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-black">QC HOLD - Confirmation Required</h3>
                <p className="text-amber-100 text-xs font-medium mt-0.5">Hold this batch pending review</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Reject Quantity (pcs)</Label>
              <DnaInput
                type="number"
                value={rejectQty}
                onChange={(e) => setRejectQty(Number(e.target.value))}
                className="h-12 font-bold text-lg"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Defect Category</Label>
              <select
                value={defectCategory}
                onChange={(e) => setDefectCategory(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select category...</option>
                <option value="COSMETIC">Cosmetic Defect</option>
                <option value="FUNCTIONAL">Functional Defect</option>
                <option value="CONTAMINATION">Contamination</option>
                <option value="PACKAGING">Packaging Issue</option>
                <option value="LABELING">Labeling Error</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Reject Cause</Label>
              <textarea
                value={rejectCause}
                onChange={(e) => setRejectCause(e.target.value)}
                className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Describe the root cause of rejection..."
              />
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-[10px] font-bold text-amber-700 uppercase">
                This will hold the batch and notify the production team for review.
              </p>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <DnaButton
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Cancel
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={handleConfirmHold}
              disabled={auditMutation.isPending || !rejectCause}
              className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200"
            >
              {auditMutation.isPending ? "Submitting..." : "Confirm HOLD"}
            </DnaButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Modal */}
      <QcSignatureModal
        open={showSignDialog}
        onClose={() => setShowSignDialog(false)}
        onSign={handleSign}
        batchId={stepLogId || "MANUAL"}
        stage={activePhase}
        parameters={getParameters()}
      />

      {/* Numpad */}
      <QcNumpad
        open={showNumpad}
        onClose={() => setShowNumpad(false)}
        onConfirm={handleNumpadConfirm}
        {...getNumpadProps()}
        currentValue={getNumpadProps().currentValue ?? 0}
      />
    </DashboardShell>
  );
}
