"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { STATUS_STYLES, PROGRESS_COLORS, TYPOGRAPHY } from "./rnd-constants";

// ═══════════════════════════════════════════════════════════════
// INLINE EDIT — Klik teks → jadi input, Enter simpan, Escape batal
// ═══════════════════════════════════════════════════════════════

type InlineTextProps = {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
  type?: "text" | "date";
  bold?: boolean;
};

export function InlineText({ value, onSave, placeholder = "—", className, type = "text", bold }: InlineTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); if (type === "text") ref.current.select(); } }, [editing, type]);

  const commit = () => { setEditing(false); if (draft !== value) onSave(draft); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <input ref={ref} type={type === "date" ? "date" : "text"} value={draft}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        className="w-full h-7 rounded-md border border-blue-200 bg-blue-50 px-2 text-[12px] font-semibold text-slate-900 outline-none ring-2 ring-blue-100" />
    );
  }

  const display = type === "date" && value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : value;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
      className={cn("block min-h-7 w-full rounded-md px-2 py-1 text-left transition hover:bg-blue-50 focus:outline-none", bold ? "font-bold text-slate-900" : "font-semibold text-slate-700", !value && "text-slate-300 italic", className)}>
      <span className="block truncate text-[12px]">{display || placeholder}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// INLINE SELECT — Klik → dropdown, pilih → simpan instan
// ═══════════════════════════════════════════════════════════════

type InlineSelectProps = {
  value: string;
  options: readonly string[];
  onSave: (val: string) => void;
  variant?: "text" | "badge";
  className?: string;
};

export function InlineSelect({ value, options, onSave, variant = "text", className }: InlineSelectProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const commit = (next: string) => {
    setEditing(false);
    if (next !== value) onSave(next);
  };

  if (editing) {
    return (
      <select ref={ref} value={draft}
        onChange={e => { setDraft(e.target.value); commit(e.target.value); }}
        onBlur={() => setEditing(false)}
        className="h-7 rounded-md border border-blue-200 bg-blue-50 px-2 text-[12px] font-bold text-slate-900 outline-none ring-2 ring-blue-100 cursor-pointer">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
      className={cn("min-h-7 rounded-md px-2 py-1 text-left transition hover:bg-blue-50 focus:outline-none w-full", className)}
      title={value || "Klik untuk isi"}>
      {value ? (
        variant === "badge" ? (
          <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap", STATUS_STYLES[value] || "bg-slate-50 border-slate-200 text-slate-600")}>
            {value}
          </span>
        ) : (
          <span className="text-[12px] font-semibold text-slate-700">{value}</span>
        )
      ) : (
        <span className="text-[12px] text-slate-300 italic">—</span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// INLINE NUMBER — Klik → input number
// ═══════════════════════════════════════════════════════════════

type InlineNumberProps = {
  value: number;
  onSave: (val: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

export function InlineNumber({ value, onSave, min = 0, max = 999, className }: InlineNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(String(value ?? 0)); }, [value]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  const commit = () => {
    const next = Math.min(max, Math.max(min, parseInt(draft, 10) || 0));
    setEditing(false);
    if (next !== value) onSave(next);
  };

  if (editing) {
    return (
      <input ref={ref} type="number" min={min} max={max} value={draft}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="h-7 w-16 rounded-md border border-blue-200 bg-blue-50 px-2 text-center text-[12px] font-bold outline-none ring-2 ring-blue-100" />
    );
  }

  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); setDraft(String(value)); setEditing(true); }}
      className="h-7 min-w-10 rounded-md px-2 text-[12px] font-bold tabular-nums text-slate-700 transition hover:bg-blue-50">
      {value ?? 0}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// INLINE PROGRESS — Klik progress bar → dropdown 0/25/50/75/100%
// ═══════════════════════════════════════════════════════════════

type InlineProgressProps = {
  value: number;
  onSave: (val: number) => void;
};

export function InlineProgress({ value, onSave }: InlineProgressProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);
  const STEPS = [0, 25, 50, 75, 100];

  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  if (editing) {
    return (
      <select ref={ref} value={value}
        onChange={e => { onSave(parseInt(e.target.value)); setEditing(false); }}
        onBlur={() => setEditing(false)} autoFocus
        className="h-7 w-14 rounded-md border border-blue-200 bg-blue-50 px-1 text-[10px] font-bold outline-none cursor-pointer">
        {STEPS.map(p => <option key={p} value={p}>{p}%</option>)}
      </select>
    );
  }

  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="flex items-center gap-1.5 min-w-[56px] h-7 px-1 rounded-md hover:bg-blue-50 transition">
      <div className="w-8 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-1.5 rounded-full transition-all", PROGRESS_COLORS(value))}
          style={{ width: value + "%" }} />
      </div>
      <span className="text-[9px] font-bold tabular-nums text-slate-500">{value}%</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// INLINE TEXTAREA — Untuk detail block
// ═══════════════════════════════════════════════════════════════

type InlineTextareaProps = {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  label?: string;
};

export function InlineTextarea({ value, onSave, placeholder = "Klik untuk isi...", label }: InlineTextareaProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const commit = () => { setEditing(false); if (draft !== value) onSave(draft); };

  if (editing) {
    return (
      <div>
        {label && <span className={TYPOGRAPHY.label + " mb-1 block"}>{label}</span>}
        <textarea ref={ref} value={draft} rows={3}
          onChange={e => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === "Escape") { setDraft(value); setEditing(false); } if ((e.ctrlKey || e.metaKey) && e.key === "Enter") commit(); }}
          className="w-full resize-none rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] leading-5 text-slate-900 outline-none ring-2 ring-blue-100" />
      </div>
    );
  }

  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
      className={cn("w-full rounded-md border border-transparent px-3 py-2 text-left text-[12px] leading-5 text-slate-700 transition hover:border-blue-100 hover:bg-blue-50", !value && "text-slate-300 italic")}>
      {value || placeholder}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// FLOATING QUICK SELECT — Klik → dropdown di dekat tombol
// ═══════════════════════════════════════════════════════════════

type FloatingQuickSelectProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  options: readonly string[] | string[];
  value: string;
  onSelect: (val: string) => void;
  /** Color map for badge-style options */
  colorMap?: Record<string, string>;
  /** Posisi anchor (getBoundingClientRect dari tombol trigger) */
  anchorRect?: DOMRect;
};

export function FloatingQuickSelect({ open, onClose, title, options, value, onSelect, colorMap, anchorRect }: FloatingQuickSelectProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Track anchor ID to recalculate position on scroll
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open || !anchorRect) {
      setPosition(null);
      return;
    }

    const calculate = () => {
      // anchorRect comes from getBoundingClientRect which is already relative to viewport
      // On scroll, we need to re-query - but we don't have the element reference
      // Since anchorRect is a snapshot, we store initial position and keep it stable
      setPosition({
        top: Math.min(anchorRect.bottom + 4, window.innerHeight - 320),
        left: Math.min(anchorRect.left, window.innerWidth - 290),
      });
    };

    calculate();

    // Recalculate on scroll to keep position relative to anchor
    const handleScroll = () => {
      // Close dropdown on scroll to avoid stale positioning
      onClose();
    };

    // Use capture phase to catch all scroll events
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [open, anchorRect, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  // Posisi stabil — jika scroll terjadi, dropdown akan menutup
  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 999,
      }
    : anchorRect
    ? {
        position: 'fixed',
        top: Math.min(anchorRect.bottom + 4, window.innerHeight - 320),
        left: Math.min(anchorRect.left, window.innerWidth - 290),
        zIndex: 999,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
      };

  return (
    <div ref={ref} style={style}
      className="w-[240px] rounded-xl border border-slate-200 bg-white shadow-xl shadow-black/10 p-1.5 animate-in fade-in zoom-in duration-100 origin-top-left">
      <div className="px-2.5 py-1.5 border-b border-slate-100 mb-0.5">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      </div>
      <div className="max-h-[260px] overflow-y-auto space-y-0.5">
        {options.map(opt => {
          const isActive = opt === value;
          return (
            <button key={opt} type="button"
              onClick={() => { onSelect(opt); onClose(); }}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-[12px] font-bold transition flex items-center gap-2",
                isActive
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                  : "text-slate-700 hover:bg-slate-50"
              )}>
              {colorMap?.[opt] ? (
                <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap", colorMap[opt])}>
                  {opt}
                </span>
              ) : (
                <span>{opt}</span>
              )}
              {isActive && <span className="ml-auto text-blue-500 text-[14px]">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SAVE INDICATOR
// ═══════════════════════════════════════════════════════════════

export function SaveDot({ active }: { active?: boolean }) {
  return <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", active ? "bg-blue-500 animate-pulse" : "bg-transparent")} />;
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap", STATUS_STYLES[status] || "bg-slate-50 border-slate-200 text-slate-600")}>
      {status || "-"}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// FIELD LABEL
// ═══════════════════════════════════════════════════════════════

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className={TYPOGRAPHY.label + " mb-1"}>{children}</p>;
}
