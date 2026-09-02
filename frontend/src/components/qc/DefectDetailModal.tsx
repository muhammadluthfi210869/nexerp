"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  Bug,
  FileText,
  Check,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DnaBadge } from "@/components/dna/DnaBadge";

const DEFECT_CATEGORIES = [
  "FISIK",
  "KIMIA",
  "MIKROBIOLOGI",
  "LABEL_DOKUMEN",
  "KEMASAN",
  "LAINNYA",
] as const;

const SEVERITY_OPTIONS = [
  { value: "MINOR", label: "Minor", description: "Cosmetic /不影响功能", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "MAJOR", label: "Major", description: "Affects function / quality", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "CRITICAL", label: "Critical", description: "Safety / regulatory risk", color: "bg-rose-100 text-rose-700 border-rose-200" },
] as const;

const DISPOSITION_OPTIONS = [
  "REWORK",
  "SCRAP",
  "RETURN_TO_VENDOR",
  "USE_AS_IS",
  "SORTING",
] as const;

interface DefectDetailData {
  defectCategory: string;
  defectType: string;
  defectLocation: string;
  severity: string;
  disposition: string;
  defectCause: string;
  correctiveAction: string;
}

interface DefectDetailModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DefectDetailData) => void;
}

export default function DefectDetailModal({
  open,
  onClose,
  onSubmit,
}: DefectDetailModalProps) {
  const [form, setForm] = useState<DefectDetailData>({
    defectCategory: "",
    defectType: "",
    defectLocation: "",
    severity: "",
    disposition: "",
    defectCause: "",
    correctiveAction: "",
  });

  const updateField = <K extends keyof DefectDetailData>(
    key: K,
    value: DefectDetailData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit(form);
    setForm({
      defectCategory: "",
      defectType: "",
      defectLocation: "",
      severity: "",
      disposition: "",
      defectCause: "",
      correctiveAction: "",
    });
    onClose();
  };

  const isValid =
    form.defectCategory &&
    form.defectType &&
    form.severity &&
    form.disposition;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-lg overflow-hidden border border-[var(--border-color)]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-50 bg-slate-900 text-white relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
                      Non-Conformance Report
                    </span>
                  </div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase">
                    Defect <span className="text-rose-500">Detail</span>
                  </h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    Root Cause & Disposition Recording
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-12 w-12 rounded-full hover:bg-white/10 text-white transition-all"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <Bug className="absolute -right-8 -bottom-8 h-44 w-44 text-white/5 rotate-12 pointer-events-none" />
            </div>

            {/* Body */}
            <div className="p-8 space-y-8 overflow-y-auto max-h-[65vh]">
              {/* Defect Category */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Defect Category *
                </Label>
                <Select
                  value={form.defectCategory}
                  onValueChange={(val) => updateField("defectCategory", val ?? "")}
                >
                  <SelectTrigger className="h-14 rounded-[16px] bg-slate-50 border border-[var(--border-color)] font-bold text-sm px-6 w-full">
                    <SelectValue placeholder="Select defect category..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-[16px] border border-[var(--border-color)] shadow-sm">
                    {DEFECT_CATEGORIES.map((cat) => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        className="h-12 font-bold text-sm"
                      >
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Defect Type & Location */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Defect Type *
                  </Label>
                  <Input
                    value={form.defectType}
                    onChange={(e) => updateField("defectType", e.target.value)}
                    placeholder="e.g. Crack, Dent, Color off..."
                    className="h-14 rounded-[16px] bg-slate-50 border border-[var(--border-color)] font-medium text-sm px-6"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Defect Location
                  </Label>
                  <Input
                    value={form.defectLocation}
                    onChange={(e) =>
                      updateField("defectLocation", e.target.value)
                    }
                    placeholder="e.g. Top seal, Label front..."
                    className="h-14 rounded-[16px] bg-slate-50 border border-[var(--border-color)] font-medium text-sm px-6"
                  />
                </div>
              </div>

              {/* Severity */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Severity *
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField("severity", opt.value)}
                      className={cn(
                        "relative p-4 rounded-[16px] border-2 text-left transition-all",
                        form.severity === opt.value
                          ? "border-slate-900 bg-slate-50 shadow-sm"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      )}
                    >
                      {form.severity === opt.value && (
                        <Check className="absolute top-2 right-2 h-4 w-4 text-slate-900" />
                      )}
                      <span className="block text-sm font-black uppercase tracking-tight mb-1">
                        {opt.label}
                      </span>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase leading-tight">
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disposition */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Disposition *
                </Label>
                <Select
                  value={form.disposition}
                  onValueChange={(val) => updateField("disposition", val ?? "")}
                >
                  <SelectTrigger className="h-14 rounded-[16px] bg-slate-50 border border-[var(--border-color)] font-bold text-sm px-6 w-full">
                    <SelectValue placeholder="Select disposition action..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-[16px] border border-[var(--border-color)] shadow-sm">
                    {DISPOSITION_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt}
                        value={opt}
                        className="h-12 font-bold text-sm"
                      >
                        {opt.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Defect Cause */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Root Cause Analysis
                </Label>
                <textarea
                  value={form.defectCause}
                  onChange={(e) => updateField("defectCause", e.target.value)}
                  rows={3}
                  placeholder="Describe the root cause of this defect..."
                  className="w-full p-5 bg-slate-50 border border-[var(--border-color)] rounded-[16px] font-medium text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-300 resize-none"
                />
              </div>

              {/* Corrective Action */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Corrective Action
                </Label>
                <textarea
                  value={form.correctiveAction}
                  onChange={(e) =>
                    updateField("correctiveAction", e.target.value)
                  }
                  rows={3}
                  placeholder="Describe the corrective action taken..."
                  className="w-full p-5 bg-slate-50 border border-[var(--border-color)] rounded-[16px] font-medium text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-300 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-50 bg-white flex flex-col gap-4">
              <div className="flex gap-4">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="flex-1 h-14 rounded-[2rem] font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!isValid}
                  onClick={handleSubmit}
                  className={cn(
                    "flex-[2] h-14 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all shadow-lg",
                    isValid
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 hover:scale-[1.02]"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <FileText className="h-5 w-5" />
                  Submit NCR
                </Button>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl flex items-center gap-3 border border-amber-100">
                <Info className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed italic">
                  Submitting this NCR will trigger a corrective action workflow
                  and notify the responsible department.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
