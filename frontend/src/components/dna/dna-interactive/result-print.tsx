"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { DnaButton } from "../DnaButton";
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Check,
  ChevronDown,
  X,
} from "lucide-react";

// ── Result Modal ──
export function DnaResultModal({
  open,
  isOpen,
  onClose,
  onOpenChange,
  status = "success",
  title,
  subtitle,
  message,
  description,
  documentCode,
  summaryItems,
  errorList,
  onPrint,
  onPrintPdf,
  onViewDetail,
  onCreateAnother,
  onBackToList,
}: {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  status?: "success" | "error";
  title: string;
  subtitle?: string;
  message?: string;
  description?: string;
  documentCode?: string;
  summaryItems?: Array<{ label: string; value: string }>;
  errorList?: string[];
  onPrint?: () => void;
  onPrintPdf?: () => void;
  onViewDetail?: () => void;
  onCreateAnother?: () => void;
  onBackToList?: () => void;
}) {
  const isVisible = open ?? isOpen ?? false;
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };
  const effectiveDesc = description || subtitle || message;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
        <div
          className={cn(
            "w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl",
            status === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
          )}
        >
          {status === "success" ? "✓" : "✕"}
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>
          {effectiveDesc && <p className="text-[12px] text-slate-500 mt-1">{effectiveDesc}</p>}
          {documentCode && <div className="mt-2 font-mono text-xs font-semibold text-blue-600">{documentCode}</div>}
        </div>

        {summaryItems && summaryItems.length > 0 && (
          <div className="text-left bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs">
            {summaryItems.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-slate-400">{item.label}:</span>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {errorList && errorList.length > 0 && (
          <div className="text-left bg-rose-50 p-3 rounded-lg border border-rose-100 space-y-1 text-xs text-rose-700">
            {errorList.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        )}

        <div className="space-y-2 pt-2">
          {(onPrint || onPrintPdf) && (
            <DnaButton variant="outline" className="w-full" onClick={onPrint || onPrintPdf}>
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Cetak Bukti
            </DnaButton>
          )}
          {onViewDetail && (
            <DnaButton variant="secondary" className="w-full" onClick={onViewDetail}>
              Lihat Detail Dokumen
            </DnaButton>
          )}
          {onCreateAnother && (
            <DnaButton variant="primary" className="w-full" onClick={onCreateAnother}>
              Buat Dokumen Baru
            </DnaButton>
          )}
          <DnaButton variant="ghost" className="w-full" onClick={onBackToList || handleClose}>
            Tutup
          </DnaButton>
        </div>
      </div>
    </div>
  );
}

// ── Print Modal & Items ──
export interface DnaPrintSignature {
  role?: string;
  title?: string;
  name: string;
  date?: string;
}

export function DnaPrintModal({
  open,
  isOpen,
  onClose,
  onOpenChange,
  title = "Cetak Dokumen",
  documentTitle,
  documentNumber,
  documentDate,
  companyLetterhead,
  recipientInfo,
  items,
  notes,
  signatures,
  children,
}: {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  documentTitle?: string;
  documentNumber?: string;
  documentDate?: string;
  companyLetterhead?: { name: string; address?: string; phone?: string };
  recipientInfo?: { title?: string; name: string; address?: string; phone?: string };
  items?: any[];
  notes?: string;
  signatures?: DnaPrintSignature[];
  children?: React.ReactNode;
}) {
  const isVisible = open ?? isOpen ?? false;
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-900">{documentTitle || title}</h3>
          <div className="flex items-center space-x-2">
            <DnaButton variant="primary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" /> Cetak Sekarang
            </DnaButton>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50 print:bg-white space-y-6">
          {companyLetterhead && (
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{companyLetterhead.name}</h2>
                {companyLetterhead.address && <p className="text-xs text-slate-500">{companyLetterhead.address}</p>}
                {companyLetterhead.phone && <p className="text-xs text-slate-500">Telp: {companyLetterhead.phone}</p>}
              </div>
              {documentNumber && (
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-slate-800">{documentNumber}</div>
                  {documentDate && <div className="text-xs text-slate-400">{documentDate}</div>}
                </div>
              )}
            </div>
          )}

          {recipientInfo && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Tujuan / Penerima:</span>
              <div className="font-bold text-slate-800">{recipientInfo.name}</div>
              {recipientInfo.address && <div className="text-slate-600">{recipientInfo.address}</div>}
            </div>
          )}

          {children}

          {notes && (
            <div className="text-xs text-slate-600 italic border-l-2 border-slate-300 pl-3">
              Catatan: {notes}
            </div>
          )}

          {signatures && signatures.length > 0 && (
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-6 text-center text-xs">
              {signatures.map((sig, i) => (
                <div key={i} className="space-y-12">
                  <span className="text-slate-500">{sig.role}</span>
                  <div>
                    <div className="font-bold text-slate-900 underline">{sig.name}</div>
                    {sig.date && <div className="text-[10px] text-slate-400">{sig.date}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface DnaPrintItem {
  id?: string;
  code?: string;
  description?: string;
  qty?: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
  label?: string;
  value?: React.ReactNode;
}

export function DnaPrintItem({ label, value }: { label?: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 text-[12px]">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function DnaPrintSignature({
  role,
  title,
  name,
  date,
}: {
  role?: string;
  title?: string;
  name: string;
  date?: string;
}) {
  const displayRole = title || role;
  return (
    <div className="text-center w-40 pt-4">
      <div className="text-[11px] text-slate-500 uppercase">{displayRole}</div>
      <div className="h-16 border-b border-slate-300 my-2" />
      <div className="text-[12px] font-semibold text-slate-900">{name}</div>
      {date && <div className="text-[10px] text-slate-400">{date}</div>}
    </div>
  );
}

// ── Export Button ──
export function DnaExportButton({
  onExportExcel,
  onExportPdf,
  onExport,
  label = "Export",
}: {
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onExport?: (type: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <DnaButton variant="secondary" size="sm" onClick={() => setOpen(!open)}>
        <Download className="h-3.5 w-3.5 mr-1.5" />
        {label}
        <ChevronDown className="h-3 w-3 ml-1 text-slate-400" />
      </DnaButton>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 space-y-0.5">
          {(onExportExcel || onExport) && (
            <button
              type="button"
              onClick={() => {
                onExportExcel?.() || onExport?.("excel");
                setOpen(false);
              }}
              className="w-full flex items-center px-2.5 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50 rounded-lg text-left border-none bg-transparent cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 mr-2" />
              Excel (.xlsx)
            </button>
          )}
          {(onExportPdf || onExport) && (
            <button
              type="button"
              onClick={() => {
                onExportPdf?.() || onExport?.("pdf");
                setOpen(false);
              }}
              className="w-full flex items-center px-2.5 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50 rounded-lg text-left border-none bg-transparent cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-rose-600 mr-2" />
              PDF Document
            </button>
          )}
        </div>
      )}
    </div>
  );
}
