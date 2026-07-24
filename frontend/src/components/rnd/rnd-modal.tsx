"use client";

import React, { useEffect, useCallback } from "react";
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
// TOAST — Notifikasi sementara (auto-dismiss)
// ═══════════════════════════════════════════════════════════════

type ToastType = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

const toastListeners: Set<(toast: ToastItem) => void> = new Set();

export function toast(type: ToastType, message: string) {
  const item: ToastItem = { id: Date.now().toString() + Math.random(), type, message };
  toastListeners.forEach((fn) => fn(item));
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-500" />,
  error: <AlertCircle size={16} className="text-rose-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  info: <Info size={16} className="text-blue-500" />,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50",
  error: "border-rose-200 bg-rose-50",
  warning: "border-amber-200 bg-amber-50",
  info: "border-blue-200 bg-blue-50",
};

export function ToastContainer() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (toast: ToastItem) => {
      setItems((prev) => [...prev, toast]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    toastListeners.add(handler);
    return () => { toastListeners.delete(handler); };
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {items.map((item) => (
        <div key={item.id}
          className={cn(
            "flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg animate-in slide-in-from-right-2 fade-in duration-200",
            TOAST_STYLES[item.type]
          )}>
          {TOAST_ICONS[item.type]}
          <p className="text-[12px] font-semibold text-slate-800 flex-1 leading-snug">{item.message}</p>
          <button type="button" onClick={() => remove(item.id)}
            className="p-0.5 rounded hover:bg-black/5 text-slate-400 hover:text-slate-600 transition flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONFIRM MODAL — Konfirmasi aksi oleh user
// ═══════════════════════════════════════════════════════════════

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
};

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = "Hapus", cancelLabel = "Batal", variant = "danger", loading }: ConfirmModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            variant === "danger" ? "bg-rose-50" : "bg-blue-50"
          )}>
            <AlertTriangle size={20} className={variant === "danger" ? "text-rose-500" : "text-blue-500"} />
          </div>
          <div>
            <h3 className="text-[13px] font-black text-slate-900">{title}</h3>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition disabled:opacity-50">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className={cn(
              "px-4 py-2 rounded-lg text-[11px] font-bold text-white transition flex items-center gap-1.5 disabled:opacity-50",
              variant === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
            )}>
            {loading ? (
              <><span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> Memproses...</>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}