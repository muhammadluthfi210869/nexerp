"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Edit3,
  ExternalLink,
  Clock,
  Building2,
  FileText,
  Activity,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

export interface InspectionMetric {
  label: string;
  value: string | number;
  subtext?: string;
  isCurrency?: boolean;
  variant?: "neutral" | "brand" | "success" | "warning" | "critical";
  icon?: React.ReactNode;
}

export interface InspectionRefDoc {
  label: string;
  code: string;
  href?: string;
  onClick?: () => void;
}

export interface InspectionTab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  content: React.ReactNode;
}

export interface DnaInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; // e.g. "Faktur Penjualan", "Purchase Order", "Work Order"
  documentCode: string; // e.g. "INV-2026-09-001"
  statusBadge: React.ReactNode;
  subtitle?: string; // e.g. "Customer: PT Cantik Jelita • Dibuat: 29 Sep 2026"
  metrics?: InspectionMetric[];
  referenceDocuments?: InspectionRefDoc[];
  tabs?: InspectionTab[];
  children?: React.ReactNode; // fallback if tabs not used
  onPrint?: () => void;
  onEdit?: () => void;
  primaryAction?: {
    label: string;
    variant?: "primary" | "success" | "danger" | "warning";
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryActions?: React.ReactNode;
  maxWidthClass?: string; // defaults to max-w-4xl
}

export function DnaInspectionModal({
  isOpen,
  onClose,
  title,
  documentCode,
  statusBadge,
  subtitle,
  metrics = [],
  referenceDocuments = [],
  tabs = [],
  children,
  onPrint,
  onEdit,
  primaryAction,
  secondaryActions,
  maxWidthClass = "max-w-4xl",
}: DnaInspectionModalProps) {
  const [activeTabKey, setActiveTabKey] = useState<string>(
    tabs.length > 0 ? tabs[0].key : ""
  );
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(documentCode);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  const activeTabContent = tabs.find((t) => t.key === activeTabKey)?.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200">
      <div
        className={cn(
          "bg-white rounded-2xl shadow-2xl border border-slate-200 w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh]",
          maxWidthClass
        )}
      >
        {/* ══ 1. TOP HEADER (3-SECOND SCAN) ══ */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-[15.5px]">
                  {title}
                </h3>
                <div className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-lg text-[11.5px] font-mono font-bold">
                  <span>{documentCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Salin Nomor Dokumen"
                    className="p-0.5 hover:text-blue-900 rounded cursor-pointer border-none bg-transparent"
                  >
                    {hasCopiedCode ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-blue-500" />
                    )}
                  </button>
                </div>
                {statusBadge}
              </div>
              {subtitle && (
                <p className="text-[11.5px] text-slate-500 mt-0.5 leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11.5px] font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" /> Cetak
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="h-8 px-3 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 text-[11.5px] font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Ubah
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 border-none bg-transparent cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══ 2. DEEP LINK REFERENCE PILLS (JIKA ADA) ══ */}
        {referenceDocuments.length > 0 && (
          <div className="px-6 py-2 bg-blue-50/40 border-b border-blue-100/60 flex items-center gap-2 flex-wrap text-[11px]">
            <span className="text-slate-500 font-medium">Relasi Dokumen:</span>
            {referenceDocuments.map((refDoc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={refDoc.onClick}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 font-semibold rounded-md shadow-2xs transition-colors cursor-pointer group"
              >
                <span>
                  {refDoc.label}: <strong>{refDoc.code}</strong>
                </span>
                <ExternalLink className="w-2.5 h-2.5 text-blue-400 group-hover:text-blue-700" />
              </button>
            ))}
          </div>
        )}

        {/* ══ 3. HERO 4-METRIC SUMMARY CARDS (ABOVE-THE-FOLD) ══ */}
        {metrics.length > 0 && (
          <div className="p-6 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-xl border text-[11px] flex flex-col justify-between",
                  m.variant === "brand" &&
                    "bg-blue-50/70 border-blue-200 text-blue-900",
                  m.variant === "success" &&
                    "bg-emerald-50/70 border-emerald-200 text-emerald-900",
                  m.variant === "warning" &&
                    "bg-amber-50/70 border-amber-200 text-amber-900",
                  m.variant === "critical" &&
                    "bg-rose-50/70 border-rose-200 text-rose-900",
                  (!m.variant || m.variant === "neutral") &&
                    "bg-slate-50 border-slate-200 text-slate-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                    {m.label}
                  </span>
                  {m.icon}
                </div>
                <div className="mt-1">
                  <span className="font-black text-[14.5px] tabular-nums text-slate-900 block leading-tight">
                    {typeof m.value === "number" && m.isCurrency
                      ? formatRupiah(m.value)
                      : m.value}
                  </span>
                  {m.subtext && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {m.subtext}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ 4. TAB NAVIGATION (JIKA MENGGUNAKAN TABS) ══ */}
        {tabs.length > 0 && (
          <div className="px-6 border-b border-slate-200 flex items-center gap-1 shrink-0 mt-2">
            {tabs.map((tab) => {
              const isActive = activeTabKey === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTabKey(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-bold border-b-2 transition-all cursor-pointer",
                    isActive
                      ? "border-blue-600 text-blue-700 bg-blue-50/40"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                        isActive
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ══ 5. MAIN CONTENT SCROLL AREA ══ */}
        <div className="p-6 overflow-y-auto space-y-5 text-[12px] custom-scrollbar flex-1">
          {tabs.length > 0 ? activeTabContent : children}
        </div>

        {/* ══ 6. STICKY DOCKED ACTION FOOTER ══ */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">{secondaryActions}</div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-[12px] border border-slate-200 cursor-pointer transition-colors"
            >
              Tutup Window
            </button>

            {primaryAction && (
              <button
                type="button"
                disabled={primaryAction.disabled || primaryAction.loading}
                onClick={primaryAction.onClick}
                className={cn(
                  "h-9 px-5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-xs border-none cursor-pointer",
                  primaryAction.variant === "danger" &&
                    "bg-rose-600 hover:bg-rose-700 text-white",
                  primaryAction.variant === "success" &&
                    "bg-emerald-600 hover:bg-emerald-700 text-white",
                  primaryAction.variant === "warning" &&
                    "bg-amber-600 hover:bg-amber-700 text-white",
                  (!primaryAction.variant ||
                    primaryAction.variant === "primary") &&
                    "bg-blue-600 hover:bg-blue-700 text-white",
                  (primaryAction.disabled || primaryAction.loading) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                {primaryAction.icon}
                <span>
                  {primaryAction.loading
                    ? "Memproses..."
                    : primaryAction.label}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
