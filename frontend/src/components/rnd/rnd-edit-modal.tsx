"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel } from "./rnd-table-shared";

// ═══════════════════════════════════════════════════════════════
// FLOATING EDIT MODAL — Drawer dari kanan untuk edit detail
// ═══════════════════════════════════════════════════════════════

export type FieldConfig = {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "select" | "textarea";
  options?: readonly string[];
  min?: number;
  max?: number;
};

type FloatingEditModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig[];
  data: Record<string, any>;
  onSave: (key: string, value: any) => void;
  saving?: boolean;
};

export function FloatingEditModal({ open, onClose, title, fields, data, onSave, saving }: FloatingEditModalProps) {
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [localSaving, setLocalSaving] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  // Track last committed value per field to prevent duplicate saves
  const committedRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      setDraft({ ...data });
      committedRef.current = { ...data };
    }
  }, [open, data]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    if (open) setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const commitField = (key: string) => {
    const val = draft[key];
    // Compare against last committed value instead of props data
    if (val !== committedRef.current[key]) {
      setLocalSaving(prev => ({ ...prev, [key]: true }));
      committedRef.current = { ...committedRef.current, [key]: val };
      onSave(key, val);
      setTimeout(() => setLocalSaving(prev => ({ ...prev, [key]: false })), 300);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Panel */}
      <div ref={panelRef}
        className="relative w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 overflow-y-auto translate-x-0"
        style={{ transition: "transform 0.2s ease-out" }}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-900">{title}</h2>
            {saving && <span className="text-[9px] text-blue-500 font-bold">Menyimpan...</span>}
          </div>
          <button type="button" onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {fields.map(field => {
            const val = draft[field.key] ?? data[field.key] ?? "";
            const isSaving = localSaving[field.key];

            return (
              <div key={field.key}>
                <div className="flex items-center justify-between">
                  <FieldLabel>{field.label}</FieldLabel>
                  {isSaving && <span className="text-[8px] text-blue-500 font-bold animate-pulse">menyimpan...</span>}
                </div>

                {field.type === "text" && (
                  <input type="text" value={val} onChange={e => setDraft(p => ({ ...p, [field.key]: e.target.value }))}
                    onBlur={() => commitField(field.key)}
                    onKeyDown={e => { if (e.key === "Enter") commitField(field.key); }}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition" />
                )}

                {field.type === "date" && (
                  <input type="date" value={val} onChange={e => setDraft(p => ({ ...p, [field.key]: e.target.value }))}
                    onBlur={() => commitField(field.key)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition" />
                )}

                {field.type === "number" && (
                  <input type="number" min={field.min ?? 0} max={field.max ?? 999}
                    value={val} onChange={e => setDraft(p => ({ ...p, [field.key]: parseInt(e.target.value) || 0 }))}
                    onBlur={() => commitField(field.key)}
                    onKeyDown={e => { if (e.key === "Enter") commitField(field.key); }}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition" />
                )}

                {field.type === "select" && field.options && (
                  <select value={val} onChange={e => {
                    const newVal = e.target.value;
                    setDraft(p => ({ ...p, [field.key]: newVal }));
                    // Only save if actually changed from last committed value
                    if (newVal !== committedRef.current[field.key]) {
                      committedRef.current = { ...committedRef.current, [field.key]: newVal };
                      onSave(field.key, newVal);
                    }
                  }}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition cursor-pointer">
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}

                {field.type === "textarea" && (
                  <textarea value={val} rows={3}
                    onChange={e => setDraft(p => ({ ...p, [field.key]: e.target.value }))}
                    onBlur={() => commitField(field.key)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition resize-none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-5 py-2 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition">
            Tutup
          </button>
          <button type="button" onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition flex items-center gap-1.5">
            <Save size={14} /> Selesai
          </button>
        </div>
      </div>

    </div>
  );
}
