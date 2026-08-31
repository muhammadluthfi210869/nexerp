"use client";

// R3 Gate 3 — Quick Add interaction pattern (spreadsheet-fast).
// Used for high-frequency, low-risk record creation (BusDev Buku Tamu, R&D daily
// tracking, Production actuals, QC repetitive measurements where appropriate).
// Behavior:
//   - click `+` or press Enter → POST → row appears immediately
//   - form remains visible; transient fields reset
//   - contextual / auto-derived fields stay
//   - focus returns to first logical input
//   - on API failure: typed values preserved, inline error displayed

import React, { useState, useRef, useEffect } from "react";
import { Plus, AlertCircle, Check, Loader2 } from "lucide-react";

export interface QuickAddField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number;
  /** When true, this field is not cleared after successful save (contextual default). */
  sticky?: boolean;
}

export interface QuickAddBarProps {
  fields: QuickAddField[];
  onSubmit: (values: Record<string, string | number>) => Promise<{ ok: boolean; error?: string; record?: unknown }>;
  submitLabel?: string;
}

export function QuickAddBar({ fields, onSubmit, submitLabel = "Add" }: QuickAddBarProps) {
  const initial: Record<string, string | number> = {};
  for (const f of fields) {
    initial[f.name] = f.defaultValue ?? "";
  }
  const [values, setValues] = useState<Record<string, string | number>>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const firstInputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, [lastSavedAt]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    // Required-field validation — but DO NOT clear typed values on failure.
    const missing = fields.filter(f => f.required && (values[f.name] === "" || values[f.name] == null));
    if (missing.length > 0) {
      setError(`Missing: ${missing.map(m => m.label).join(", ")}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit(values);
      if (result.ok) {
        setLastSavedAt(Date.now());
        // Reset transient fields; keep sticky defaults.
        const reset: Record<string, string | number> = {};
        for (const f of fields) {
          reset[f.name] = f.sticky ? (f.defaultValue ?? "") : "";
        }
        setValues(reset);
      } else {
        setError(result.error || "Save failed");
        // On failure: KEEP typed values. Do not clear.
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Quick add"
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        padding: 12,
        background: "var(--color-card, #FFFFFF)",
        border: "1px solid var(--color-border, #E5E7EB)",
        borderRadius: 12,
        flexWrap: "wrap",
      }}
    >
      {fields.map((f, idx) => {
        const isFirst = idx === 0;
        const commonStyle: React.CSSProperties = {
          padding: "8px 10px",
          border: "1px solid var(--color-border, #E5E7EB)",
          borderRadius: 8,
          background: "var(--color-card, #FFFFFF)",
          color: "var(--color-text-main, #0F172A)",
          fontSize: 12,
          minWidth: 120,
          fontFamily: "inherit",
        };
        return (
          <label key={f.name} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 9, fontWeight: 950, color: "var(--color-text-muted, #6B7280)", textTransform: "uppercase" }}>
            <span>{f.label}{f.required ? " *" : ""}</span>
            {f.type === "select" ? (
              <select
                ref={isFirst ? (firstInputRef as any) : undefined}
                aria-label={f.label}
                value={String(values[f.name] ?? "")}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                onKeyDown={handleKeyDown}
                style={commonStyle}
              >
                <option value="">—</option>
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                ref={isFirst ? (firstInputRef as any) : undefined}
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                inputMode={f.type === "number" ? "decimal" : undefined}
                aria-label={f.label}
                placeholder={f.placeholder}
                value={String(values[f.name] ?? "")}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: f.type === "number" ? e.target.value : e.target.value }))}
                onKeyDown={handleKeyDown}
                style={commonStyle}
                required={f.required}
              />
            )}
          </label>
        );
      })}
      <button
        type="submit"
        disabled={submitting}
        aria-label={submitLabel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: submitting ? "var(--color-muted, #F3F4F6)" : "var(--status-action, #2563EB)",
          color: "#FFFFFF",
          fontSize: 11,
          fontWeight: 950,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          cursor: submitting ? "wait" : "pointer",
          minHeight: 44, // touch target
        }}
      >
        {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        {submitLabel}
      </button>

      {error && (
        <div role="alert" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#B91C1C", fontSize: 11, fontWeight: 800 }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}
      {!error && lastSavedAt && (
        <div aria-live="polite" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#047857", fontSize: 11, fontWeight: 800 }}>
          <Check size={12} />
          Saved
        </div>
      )}
    </form>
  );
}