"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { DnaButton } from "../DnaButton";
import { X, AlertTriangle } from "lucide-react";

// ── Crud Modal ──
export function DnaCrudModal({
  open,
  isOpen,
  onClose,
  onOpenChange,
  title,
  subtitle,
  children,
  onSave,
  saveText = "Simpan",
  isSaving = false,
  size,
  maxWidth = "max-w-xl",
}: {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSave?: () => void;
  saveText?: string;
  isSaving?: boolean;
  size?: string;
  maxWidth?: string;
}) {
  const isVisible = open ?? isOpen ?? false;
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  if (!isVisible) return null;

  const widthClass = size === "lg" ? "max-w-3xl" : size === "xl" ? "max-w-5xl" : maxWidth;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-0">
      <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-h-[90vh] flex flex-col", widthClass)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">{children}</div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <DnaButton variant="secondary" onClick={handleClose} disabled={isSaving}>
            Batal
          </DnaButton>
          {onSave && (
            <DnaButton variant="primary" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : saveText}
            </DnaButton>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ──
export type DnaConfirmVariant = "primary" | "danger" | "warning" | "success";

export function DnaConfirmDialog({
  open,
  isOpen,
  onClose,
  onOpenChange,
  title,
  description,
  variant,
  confirmVariant = "primary",
  confirmText = "Konfirmasi",
  confirmTextRequired,
  onConfirm,
  isProcessing = false,
}: {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  variant?: DnaConfirmVariant | string;
  confirmVariant?: DnaConfirmVariant;
  confirmText?: string;
  confirmTextRequired?: string;
  onConfirm: () => void | Promise<void>;
  isProcessing?: boolean;
}) {
  const isVisible = open ?? isOpen ?? false;
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };
  const effectiveVariant = (variant as DnaConfirmVariant) || confirmVariant;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start space-x-3">
          <div
            className={cn(
              "p-2.5 rounded-xl border",
              effectiveVariant === "danger"
                ? "bg-rose-50 text-rose-600 border-rose-200/80"
                : effectiveVariant === "success"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200/80"
                : "bg-amber-50 text-amber-600 border-amber-200/80"
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
            <p className="text-[12px] text-slate-600 mt-1">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" onClick={handleClose} disabled={isProcessing}>
            Batal
          </DnaButton>
          <DnaButton
            variant={effectiveVariant === "danger" ? "danger" : "primary"}
            onClick={async () => {
              await onConfirm();
              handleClose();
            }}
            disabled={isProcessing}
          >
            {isProcessing ? "Memproses..." : confirmText}
          </DnaButton>
        </div>
      </div>
    </div>
  );
}

// ── Void Dialog ──
export function DnaVoidDialog({
  open,
  isOpen,
  onClose,
  onOpenChange,
  title = "Batalkan Dokumen",
  documentCode,
  documentTitle,
  onConfirm,
  onConfirmVoid,
  onVoid,
  isProcessing = false,
}: {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  documentCode?: string;
  documentTitle?: string;
  onConfirm?: (reason: string) => void | Promise<void>;
  onConfirmVoid?: (reason: string) => void | Promise<void>;
  onVoid?: (reason: string) => void;
  isProcessing?: boolean;
}) {
  const isVisible = open ?? isOpen ?? false;
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };
  const [reason, setReason] = useState("");

  if (!isVisible) return null;

  const handleExecuteVoid = async () => {
    if (onConfirm) await onConfirm(reason);
    if (onConfirmVoid) await onConfirmVoid(reason);
    if (onVoid) onVoid(reason);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {(documentCode || documentTitle) && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs">
            {documentCode} {documentTitle && `— ${documentTitle}`}
          </div>
        )}
        <p className="text-[12px] text-slate-500">
          Tindakan ini tidak dapat dibatalkan. Masukkan alasan pembatalan dokumen berikut:
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Tulis alasan pembatalan..."
          className="w-full p-3 text-[12px] rounded-lg border border-slate-200 focus:outline-hidden focus:border-rose-500 h-24"
        />

        <div className="flex items-center justify-end space-x-2 pt-2">
          <DnaButton variant="secondary" onClick={handleClose} disabled={isProcessing}>
            Kembali
          </DnaButton>
          <DnaButton
            variant="danger"
            disabled={!reason.trim() || isProcessing}
            onClick={handleExecuteVoid}
          >
            {isProcessing ? "Membatalkan..." : "Batalkan Dokumen"}
          </DnaButton>
        </div>
      </div>
    </div>
  );
}
