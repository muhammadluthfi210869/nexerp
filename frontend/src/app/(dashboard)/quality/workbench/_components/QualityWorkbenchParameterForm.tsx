import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label, DataCard, DnaBadge } from "@/components/dna";
import {
  InspectionPhase,
  PHASES,
  PassFail,
  passFailOptions,
  InboundData,
  MixingData,
  FillingData,
  PackingData,
} from "../_types/workbench.types";

interface QualityWorkbenchParameterFormProps {
  activePhase: InspectionPhase;
  inbound: InboundData;
  setInbound: React.Dispatch<React.SetStateAction<InboundData>>;
  mixing: MixingData;
  setMixing: React.Dispatch<React.SetStateAction<MixingData>>;
  filling: FillingData;
  setFilling: React.Dispatch<React.SetStateAction<FillingData>>;
  packing: PackingData;
  setPacking: React.Dispatch<React.SetStateAction<PackingData>>;
  onOpenNumpad: (target: string) => void;
}

export function QualityWorkbenchParameterForm({
  activePhase,
  inbound,
  setInbound,
  mixing,
  setMixing,
  filling,
  setFilling,
  packing,
  setPacking,
  onOpenNumpad,
}: QualityWorkbenchParameterFormProps) {
  const currentPhaseConfig = PHASES.find((p) => p.id === activePhase);

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
        onClick={() => onOpenNumpad(target)}
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

  return (
    <DataCard className="overflow-hidden">
      <div
        className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between -mx-8 -mt-8 mb-0"
        style={{ marginLeft: -32, marginRight: -32, marginTop: -32 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-[var(--border-color)] flex items-center justify-center shadow-sm">
            {currentPhaseConfig &&
              React.createElement(currentPhaseConfig.icon, {
                className: "h-5 w-5 text-slate-700",
              })}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">
              {activePhase} Inspection
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {currentPhaseConfig?.description}
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
                {renderPassFailSelect(
                  "Organoleptic (Color / Odor / Texture)",
                  inbound.organoleptic,
                  (v) => setInbound((prev) => ({ ...prev, organoleptic: v }))
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
                {renderPassFailSelect(
                  "Organoleptic (Color / Odor / Texture)",
                  inbound.organoleptic,
                  (v) => setInbound((prev) => ({ ...prev, organoleptic: v }))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DataCard>
  );
}
