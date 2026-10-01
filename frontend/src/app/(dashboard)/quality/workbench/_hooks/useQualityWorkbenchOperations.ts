"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  InspectionPhase,
  InboundData,
  MixingData,
  FillingData,
  PackingData,
  Verdict,
  DefectSubmitData,
  SignSubmitData,
  NumpadConfig,
  PhaseBreakdownStat,
  PhaseBreakdownResponse,
  QcParameter,
} from "../_types/workbench.types";

export function useQualityWorkbenchOperations() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activePhase, setActivePhase] = useState<InspectionPhase>("INBOUND");
  const [stepLogId, setStepLogId] = useState(searchParams.get("step_log_id") || "");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadTarget, setNumpadTarget] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
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

  const { data: phaseBreakdown } = useQuery<PhaseBreakdownResponse>({
    queryKey: ["qc-phase-breakdown"],
    queryFn: async () => (await api.get("/qc/analytics/phase-breakdown")).data,
  });

  const activePhaseStats = phaseBreakdown?.phases?.find(
    (p: PhaseBreakdownStat) => p.phase === activePhase
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

  const handleSign = (signData: SignSubmitData) => {
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

  const handleDefectSubmit = (defectData: DefectSubmitData) => {
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

  const getNumpadProps = (): NumpadConfig => {
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

  const hasAllPass = getParameters().every((p) => p.status === "PASS");

  return {
    // State
    activePhase,
    setActivePhase,
    stepLogId,
    setStepLogId,
    showRejectDialog,
    setShowRejectDialog,
    showSignDialog,
    setShowSignDialog,
    showNumpad,
    setShowNumpad,
    numpadTarget,
    setNumpadTarget,
    verdict,
    setVerdict,
    rejectQty,
    setRejectQty,
    rejectCause,
    setRejectCause,
    defectCategory,
    setDefectCategory,
    showConfirmDialog,
    setShowConfirmDialog,
    inbound,
    setInbound,
    mixing,
    setMixing,
    filling,
    setFilling,
    packing,
    setPacking,
    // Queries & Mutations
    auditMutation,
    phaseBreakdown,
    activePhaseStats,
    // Handlers & Helpers
    handlePass,
    handleReject,
    handleHold,
    handleConfirmHold,
    handleSign,
    handleDefectSubmit,
    handleNumpadConfirm,
    openNumpad,
    getNumpadProps,
    getParameters,
    hasAllPass,
  };
}

export type UseQualityWorkbenchOperationsReturn = ReturnType<typeof useQualityWorkbenchOperations>;
