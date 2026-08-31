"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Info } from "lucide-react";

export type KpiStatus = "GREEN" | "YELLOW" | "RED" | "NEUTRAL";
export type ComparisonDirection = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER" | "TARGET_RANGE" | "ZERO_TOLERANCE";
export type DataQuality = "OK" | "INSUFFICIENT_SAMPLE" | "NO_DATA" | "MISSING_DENOMINATOR";

export interface KpiCardProps {
  kpiId: string;
  displayName: string;
  value: number;
  unit: string;
  status: KpiStatus;
  target: number | null;
  warningThreshold: number | null;
  criticalThreshold: number | null;
  comparisonDirection: ComparisonDirection;
  benchmarkReference: string | null;
  sampleSize: number;
  dataQuality: DataQuality;
  sourceUpdatedAt: string | null;
  drillDown: string | null;
  reason?: string;
}

const STATUS_META: Record<KpiStatus, { label: string; bg: string; fg: string; border: string; Icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }> }> = {
  GREEN: { label: "On Track", bg: "var(--insight-success-bg, #ECFDF5)", fg: "var(--insight-success-text, #047857)", border: "var(--insight-success-border, #A7F3D0)", Icon: CheckCircle2 },
  YELLOW: { label: "Attention", bg: "var(--insight-warning-bg, #FFFBEB)", fg: "var(--insight-warning-text, #B45309)", border: "var(--insight-warning-border, #FCD34D)", Icon: AlertTriangle },
  RED: { label: "Action Needed", bg: "var(--alert-critical-bg, #FEF2F2)", fg: "#B91C1C", border: "var(--alert-critical-border, #FECACA)", Icon: XCircle },
  NEUTRAL: { label: "No Status", bg: "var(--color-muted, #F3F4F6)", fg: "var(--color-muted-foreground, #6B7280)", border: "var(--color-border, #E5E7EB)", Icon: HelpCircle },
};

function formatValue(value: number, unit: string): string {
  if (!Number.isFinite(value)) return "—";
  if (unit === "IDR") {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}k`;
    return `Rp ${value}`;
  }
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "days") return `${value.toFixed(1)} d`;
  if (unit === "hours") return `${value.toFixed(1)} h`;
  return `${value.toLocaleString("id-ID")} ${unit}`;
}

function formatTarget(t: number | null, dir: ComparisonDirection, unit: string): string {
  if (t === null) return "—";
  const prefix = dir === "LOWER_IS_BETTER" ? "≤" : dir === "HIGHER_IS_BETTER" ? "≥" : "≈";
  return `${prefix} ${formatValue(t, unit)}`;
}

export function KpiCard(props: KpiCardProps) {
  const meta = STATUS_META[props.status];
  const Icon = meta.Icon;
  const fresh = props.sourceUpdatedAt ? new Date(props.sourceUpdatedAt) : null;
  const stale = fresh ? (Date.now() - fresh.getTime()) > 24 * 3600 * 1000 : true;

  return (
    <div
      role="group"
      aria-label={`${props.displayName} KPI`}
      style={{
        background: "var(--color-card, #FFFFFF)",
        border: "1px solid var(--color-border, #E5E7EB)",
        borderRadius: 20,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 10, fontWeight: 950, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-text-muted, #6B7280)", margin: 0 }}>
          {props.displayName}
        </p>
        <span
          role="status"
          aria-label={`Status: ${meta.label}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            borderRadius: 999,
            background: meta.bg,
            color: meta.fg,
            border: `1px solid ${meta.border}`,
            fontSize: 9,
            fontWeight: 950,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          <Icon size={11} aria-hidden />
          {meta.label}
        </span>
      </div>

      <div>
        <p style={{ fontSize: 28, fontWeight: 950, color: "var(--color-text-main, #0F172A)", margin: 0, fontVariantNumeric: "tabular-nums" }}>
          {formatValue(props.value, props.unit)}
        </p>
        <p style={{ fontSize: 9, fontWeight: 800, color: "var(--color-text-muted, #6B7280)", margin: "4px 0 0 0" }}>
          Target {formatTarget(props.target, props.comparisonDirection, props.unit)}
          {props.warningThreshold !== null ? ` · Warning ${formatTarget(props.warningThreshold, props.comparisonDirection, props.unit)}` : ""}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9, color: "var(--color-text-muted, #6B7280)" }}>
        <span>n = {props.sampleSize}</span>
        <span>{props.dataQuality === "OK" ? "OK" : props.dataQuality}</span>
        <span title={fresh ? fresh.toLocaleString() : ""}>{fresh ? (stale ? "stale" : "fresh") : "no ts"}</span>
      </div>

      {props.drillDown && (
        <a
          href={props.drillDown}
          style={{
            fontSize: 9,
            fontWeight: 950,
            color: "var(--status-action, #2563EB)",
            textDecoration: "none",
            alignSelf: "flex-start",
          }}
        >
          Drill down →
        </a>
      )}
    </div>
  );
}