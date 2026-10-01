"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Input,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  DnaTableRow,
  DnaTd,
} from "@/components/dna";
import { MatrixRowProps } from "../_types/input.types";

export function MatrixRow({
  label,
  icon: Icon,
  platforms,
  field,
  matrix,
  setMatrix,
  onKeyDown,
  startIdx,
  prefix,
  important,
  accent,
  baseline,
  showCalc,
}: MatrixRowProps) {
  return (
    <DnaTableRow className="group hover:bg-slate-50 transition-colors even:bg-slate-50/20">
      <DnaTd className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm group-hover:border-blue-200 transition-all">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-slate-900 transition-colors">
            {label}
          </span>
        </div>
      </DnaTd>
      {platforms.map((p: string, i: number) => {
        const val = (matrix[p] as any)[field];
        const base = baseline?.find((b: any) => b.platform === p);
        const baseVal = base ? Number(base[field]) : null;

        // Outlier detection (5x higher than baseline)
        const isOutlier = baseVal !== null && baseVal > 0 && val > baseVal * 5;

        return (
          <DnaTd key={p} className="p-4 border-b border-slate-100 text-center">
            <div className="relative space-y-1.5">
              {prefix && (
                <span className="absolute left-4 top-[18px] -translate-y-1/2 text-[10px] font-bold text-slate-300">
                  {prefix}
                </span>
              )}
              <Input
                type="number"
                data-index={startIdx + i}
                value={val || ""}
                onChange={(e) =>
                  setMatrix({
                    ...matrix,
                    [p]: { ...matrix[p], [field]: Number(e.target.value) },
                  })
                }
                onKeyDown={(e) => onKeyDown(e, startIdx + i)}
                className={`
                    h-9 w-full border-slate-200 rounded-xl font-bold text-center transition-all text-[11px] tabular-nums
                    focus:ring-2 focus:ring-blue-100 focus:bg-white
                    ${important ? "bg-blue-50/50 text-blue-700" : "bg-white"}
                    ${isOutlier ? "ring-2 ring-orange-400 bg-orange-50" : ""}
                    ${accent || ""}
                    ${prefix ? "pl-8" : ""}
                  `}
              />

              {/* H-1 REFERENCE & LIVE CALCS */}
              <div className="flex items-center justify-between px-1">
                <div className="text-[10px] font-bold text-slate-400">
                  {baseVal !== null ? `H-1: ${baseVal.toLocaleString()}` : "-"}
                </div>
                {showCalc && val > 0 && (
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">
                    {showCalc(p)}
                  </div>
                )}
                {isOutlier && (
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-orange-600 text-white font-black text-[10px] uppercase">
                      High Variance Detected
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </DnaTd>
        );
      })}
    </DnaTableRow>
  );
}
