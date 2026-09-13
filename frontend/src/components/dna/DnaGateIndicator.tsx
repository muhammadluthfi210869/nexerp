"use client";

import React from "react";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { DnaBadge } from "./DnaBadge";
import { DnaButton } from "./DnaButton";
import { cn } from "@/lib/utils";

export type DnaGateStatus = "PASSED" | "PENDING" | "BLOCKED";
export type DnaGate = "G1" | "G2" | "G3";

export interface DnaGateRecommendation {
  reason: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface DnaGateIndicatorProps {
  gate: DnaGate;
  status: DnaGateStatus;
  label?: string;
  description?: string;
  verifiedByName?: string;
  verifiedAt?: string | Date;
  /** D3 — Decision Support extension. Shows recommended unblock / mitigation
   *  action and (optionally) a button to open the decision modal. */
  recommendations?: DnaGateRecommendation[];
  className?: string;
}

const GATE_FULL: Record<DnaGate, string> = {
  G1: "Gate 1 (Sample)",
  G2: "Gate 2 (Production)",
  G3: "Gate 3 (Delivery)",
};

const STATUS_CONFIG: Record<
  DnaGateStatus,
  { badgeStatus: "success" | "warning" | "critical"; icon: typeof CheckCircle2; pulse: boolean }
> = {
  PASSED: { badgeStatus: "success", icon: CheckCircle2, pulse: false },
  PENDING: { badgeStatus: "warning", icon: Clock, pulse: true },
  BLOCKED: { badgeStatus: "critical", icon: Lock, pulse: false },
};

export function DnaGateIndicator({
  gate,
  status,
  label,
  description,
  verifiedByName,
  verifiedAt,
  recommendations,
  className,
}: DnaGateIndicatorProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const display = label ?? `${gate} ${status}`;
  const when = verifiedAt ? new Date(verifiedAt).toLocaleString("id-ID") : null;
  const recs = recommendations ?? [];
  const hasRecs = recs.length > 0;

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      <DnaBadge status={cfg.badgeStatus}>
        <Icon className={cn("h-3 w-3", cfg.pulse && "animate-pulse")} />
        {display}
      </DnaBadge>
      {(description || verifiedByName || when) && (
        <div className="text-[10px] text-slate-500 leading-tight max-w-xs">
          {description && <div className="font-semibold">{description}</div>}
          {(verifiedByName || when) && (
            <div className="opacity-80">
              {verifiedByName && <>Verified by {verifiedByName}</>}
              {verifiedByName && when && <> · </>}
              {when}
            </div>
          )}
        </div>
      )}
      {hasRecs && (
        <div className="text-[10px] text-slate-600 leading-tight max-w-xs mt-0.5">
          <div className="font-semibold text-rose-700">
            {status === "BLOCKED" ? "Why blocked:" : "Mitigasi:"}
          </div>
          <ul className="space-y-0.5 mt-0.5">
            {recs.slice(0, 3).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-slate-400">•</span>
                <span className="flex-1">{r.reason}</span>
                {r.actionLabel && r.onAction && (
                  <DnaButton
                    size="sm"
                    variant="outline"
                    onClick={r.onAction}
                    className="h-5 px-2 text-[10px]"
                  >
                    {r.actionLabel}
                  </DnaButton>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const DnaGateLabel = GATE_FULL;