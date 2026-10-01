import React from "react";
import {
  Package,
  FlaskConical,
  Droplets,
  Box,
  ShieldCheck,
} from "lucide-react";
import { type QcParameter } from "@/components/qc/QcSignatureModal";

export type InspectionPhase = "INBOUND" | "MIXING" | "FILLING" | "PACKING" | "FINAL";

export interface PhaseConfig {
  id: InspectionPhase;
  label: string;
  icon: React.ElementType;
  description: string;
}

export const PHASES: PhaseConfig[] = [
  { id: "INBOUND", label: "Inbound", icon: Package, description: "Raw material receiving inspection" },
  { id: "MIXING", label: "Mixing", icon: FlaskConical, description: "Batch mixing parameters verification" },
  { id: "FILLING", label: "Filling", icon: Droplets, description: "Fill weight & seal integrity check" },
  { id: "PACKING", label: "Packing", icon: Box, description: "Packaging & labeling audit" },
  { id: "FINAL", label: "Final", icon: ShieldCheck, description: "Final product release verification" },
];

export type PassFail = "PASS" | "FAIL";

export const passFailOptions: PassFail[] = ["PASS", "FAIL"];

export interface InboundData {
  coaVerified: PassFail;
  organoleptic: PassFail;
  dimensionCheck: PassFail;
}

export interface MixingData {
  ph: number;
  viscosity: number;
  densityValue: number;
  homogenityPass: PassFail;
}

export interface FillingData {
  torqueValue: number;
  leakTestPass: PassFail;
  fillingWeight: number;
}

export interface PackingData {
  inkjetCheck: PassFail;
  sealingCheck: PassFail;
  labelingCheck: PassFail;
  expDateCheck: PassFail;
}

export type PhaseData = InboundData | MixingData | FillingData | PackingData;

export type Verdict = "PASS" | "REJECT" | "HOLD" | null;

export interface PhaseBreakdownStat {
  phase: string;
  passCount: number;
  rejectCount: number;
}

export interface PhaseBreakdownResponse {
  phases?: PhaseBreakdownStat[];
}

export interface DefectSubmitData {
  defectCategory: string;
  defectType: string;
  defectLocation: string;
  severity: string;
  disposition: string;
  defectCause: string;
  correctiveAction: string;
}

export interface SignSubmitData {
  pin: string;
  notes: string;
}

export interface NumpadConfig {
  label: string;
  unit: string;
  currentValue?: number;
}

export type { QcParameter };
