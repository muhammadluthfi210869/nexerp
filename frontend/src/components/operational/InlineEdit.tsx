"use client";

// R3 Gate 3 — Inline Edit for routine fields only.
// NOT for consequential transitions (approve, lock, ship, pay).
// Save on Enter / blur. Show inline Saving / Saved / Error states.
// Keep typed value on API failure (no data loss).

import React, { useEffect, useRef, useState } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";

export interface InlineEditProps {
  value: string | number;
  type?: "text" | "number" | "date";
  onSave: (next: string | number) => Promise<{ ok: boolean; error?: string }>;
  ariaLabel: string;
  placeholder?: string;
  /** Validation: empty value rejected (default false). */
  required?: boolean;
}

export function InlineEdit({ value, type = "text", onSave, ariaLabel, placeholder, required }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | number>(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = async () => {
    if (String(draft) === String(value)) {
      setEditing(false);
      return;
    }
    if (required && (draft === "" || draft == null)) {
      setError("Required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await onSave(draft);
      if (result.ok) {
        setSavedAt(Date.now());
        setEditing(false);
      } else {
        setError(result.error || "Save failed");
        // Keep draft so user can retry; do not silently revert.
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(value);
    setError(null);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        aria-label={`${ariaLabel} (click to edit)`}
        onClick={() => { setEditing(true); setError(null); setSavedAt(null); }}
        style={{
          background: "transparent",
          border: "1px dashed transparent",
          padding: "4px 6px",
          borderRadius: 6,
          cursor: "text",
          color: "var(--color-text-main, #0F172A)",
          font: "inherit",
          textAlign: "left",
          minHeight: 32,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.border = "1px dashed var(--color-border, #E5E7EB)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.border = "1px dashed transparent"; }}
      >
        {value || <span style={{ color: "var(--color-text-muted, #6B7280)" }}>{placeholder ?? "—"}</span>}
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <input
        ref={ref as any}
        type={type}
        aria-label={ariaLabel}
        value={String(draft ?? "")}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); cancel(); }
        }}
        onBlur={() => { if (!saving) commit(); }}
        style={{
          padding: "4px 6px",
          border: "1px solid var(--status-action, #2563EB)",
          borderRadius: 6,
          background: "var(--color-card, #FFFFFF)",
          color: "var(--color-text-main, #0F172A)",
          font: "inherit",
          minHeight: 32,
        }}
      />
      {saving && <Loader2 size={12} className="animate-spin" aria-label="Saving" />}
      {!saving && error && (
        <>
          <AlertCircle size={12} color="#B91C1C" aria-label={error} />
          <span style={{ color: "#B91C1C", fontSize: 10 }}>{error}</span>
        </>
      )}
      {!saving && !error && savedAt && (
        <Check size={12} color="#047857" aria-label="Saved" />
      )}
    </span>
  );
}