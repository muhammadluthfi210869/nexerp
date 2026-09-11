"use client";

import React from "react";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { DnaBadge } from "./DnaBadge";
import { cn } from "@/lib/utils";

export type DnaGateStatus = "PASSED" | "PENDING" | "BLOCKED";
export type DnaGate = "G1" | "G2" | "G3";

export interface DnaGateIndicatorProps {
  gate: DnaGate;
  status: DnaGateStatus;
  label?: string;
  description?: string;
  verifiedByName?: string;
  verifiedAt?: string | Date;
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
  className,
}: DnaGateIndicatorProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const display = label ?? `${gate} ${status}`;
  const when = verifiedAt ? new Date(verifiedAt).toLocaleString("id-ID") : null;

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
    </div>
  );
}

export const DnaGateLabel = GATE_FULL;