"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  X,
  Building2,
  FileCheck,
  QrCode,
  Download,
  ShieldCheck,
} from "lucide-react";
import { cn, formatRupiah, terbilangRupiah } from "@/lib/utils";

export interface PrintCompanyInfo {
  name: string;
  legalName?: string;
  tagline?: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  npwp?: string;
  logoUrl?: string;
}

export interface PrintRecipientInfo {
  title?: string; // "Kepada Yth:" | "Vendor / Supplier:" | "Ditujukan Kepada:"
  name: string;
  companyName?: string;
  address?: string;
  phone?: string;
  npwp?: string;
  attention?: string;
}

export interface PrintTableColumn {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (row: any, index: number) => React.ReactNode;
}

export interface PrintSummaryRow {
  label: string;
  value: string | number;
  isBold?: boolean;
  isHighlight?: boolean;
  isCurrency?: boolean;
}

export interface PrintSignature {
  title: string; // e.g. "Dibuat Oleh", "Diperiksa Oleh", "Disetujui Oleh", "Penerima"
  name?: string;
  role?: string;
  date?: string;
  isSigned?: boolean;
}

export interface DnaPrintDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string; // e.g. "FAKTUR PENJUALAN", "PURCHASE ORDER", "SURAT JALAN"
  documentNumber: string;
  statusBadge?: {
    label: string;
    variant?: "success" | "warning" | "critical" | "neutral";
  };
  date: string;
  dueDate?: string;
  companyInfo?: PrintCompanyInfo;
  recipientInfo: PrintRecipientInfo;
  metaFields?: Array<{ label: string; value: string | React.ReactNode }>;
  columns: PrintTableColumn[];
  items: Array<Record<string, any>>;
  summaryRows?: PrintSummaryRow[];
  totalAmountForTerbilang?: number;
  customTerbilang?: string;
  notes?: string | string[];
  termsAndConditions?: string[];
  signatures?: PrintSignature[];
  qrVerificationCode?: string;
  stampBadge?: string; // e.g. "LUNAS", "VOID", "SAMPLE ONLY"
  paperMode?: "A4" | "THERMAL" | "HALF_LETTER";
  orientation?: "portrait" | "landscape";
  customSections?: React.ReactNode;
  children?: React.ReactNode;
}

const DEFAULT_COMPANY: PrintCompanyInfo = {
  name: "PT AUREON INOVASI PRATAMA",
  legalName: "NEX ERP Enterprise Hub",
  address: "Kawasan Industri MM2100, Blok C-12, Cikarang Barat",
  city: "Bekasi, Jawa Barat 17530",
  phone: "+62 21 8990 1234",
  email: "finance@aureon-erp.com",
  npwp: "01.234.567.8-412.000",
};

export function DnaPrintDocument({
  isOpen,
  onClose,
  documentType,
  documentNumber,
  statusBadge,
  date,
  dueDate,
  companyInfo = DEFAULT_COMPANY,
  recipientInfo,
  metaFields = [],
  columns,
  items,
  summaryRows = [],
  totalAmountForTerbilang,
  customTerbilang,
  notes,
  termsAndConditions,
  signatures = [
    { title: "Dibuat Oleh", name: "Staff Administrasi", role: "Operator" },
    { title: "Diperiksa Oleh", name: "Supervisor", role: "Section Head" },
    { title: "Disetujui Oleh", name: "Manager Keuangan", role: "Finance Head" },
    { title: "Diterima Oleh", name: "...................", role: "Penerima" },
  ],
  qrVerificationCode,
  stampBadge,
  paperMode = "A4",
  orientation = "portrait",
  customSections,
  children,
}: DnaPrintDocumentProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute("data-dna-print-active", "true");
      document.body.style.overflow = "hidden";
    } else {
      document.body.removeAttribute("data-dna-print-active");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.removeAttribute("data-dna-print-active");
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const terbilangText =
    customTerbilang ||
    (totalAmountForTerbilang !== undefined
      ? terbilangRupiah(totalAmountForTerbilang)
      : null);

  const modalContent = (
    <div id="dna-print-document-modal" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 md:p-6 overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible">
      {/* ── DEDICATED PRINT STYLESHEET WITH @PAGE ORIENTATION ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${paperMode} ${orientation};
                margin: 8mm;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body > *:not(#dna-print-document-modal) {
                display: none !important;
              }
              .no-print {
                display: none !important;
              }
              #dna-print-document-modal {
                position: static !important;
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
                display: block !important;
              }
              .dna-printable-container {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                min-height: auto !important;
              }
            }
          `,
        }}
      />
      {/* ── PREVIEW WINDOW CONTAINER ── */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:m-0 print:p-0 print:w-full print:max-w-none print:overflow-visible">
        {/* ── TOP ACTION BAR (HIDDEN IN ACTUAL PRINT) ── */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[14px]">
                Pratinjau Cetak Dokumen Resmi
              </h3>
              <p className="text-[11px] text-slate-400">
                Format standar A4 &bull; {documentType} &bull; {documentNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Sekarang (Ctrl+P)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── DOCUMENT BODY (THIS IS WHAT GETS PRINTED) ── */}
        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-100 flex justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
          <div
            ref={printAreaRef}
            className={cn(
              "dna-printable-container relative bg-white w-full p-8 md:p-10 shadow-md md:rounded-lg text-slate-900 text-[11px] leading-relaxed flex flex-col justify-between border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0",
              orientation === "landscape"
                ? "max-w-[297mm] min-h-[210mm]"
                : "max-w-[210mm] min-h-[297mm]"
            )}
          >
            {stampBadge && (
              <div className="absolute top-28 right-12 pointer-events-none select-none z-20 print:block">
                <div className="border-[3.5px] border-rose-600 text-rose-600 font-black text-2xl tracking-widest px-6 py-1 rounded-lg -rotate-12 uppercase opacity-90 shadow-sm bg-white/70">
                  {stampBadge}
                </div>
              </div>
            )}
            {/* ══ 1. OFFICIAL COMPANY LETTERHEAD (KOP SURAT) ══ */}
            <div>
              <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900 gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0 print:border print:border-black">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="font-black text-[17px] tracking-tight text-slate-900 uppercase">
                      {companyInfo.name}
                    </h1>
                    <p className="text-[10px] font-medium text-slate-600 max-w-sm leading-tight mt-0.5">
                      {companyInfo.address}, {companyInfo.city}
                    </p>
                    <div className="flex items-center gap-3 text-[9.5px] text-slate-500 mt-1">
                      <span>Telp: {companyInfo.phone}</span>
                      <span>&bull;</span>
                      <span>Email: {companyInfo.email}</span>
                      {companyInfo.npwp && (
                        <>
                          <span>&bull;</span>
                          <span className="font-semibold">
                            NPWP: {companyInfo.npwp}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block font-black text-[16px] tracking-wider text-slate-900 uppercase">
                    {documentType}
                  </span>
                  <div className="text-[12px] font-bold text-blue-700 print:text-black tabular-nums mt-0.5">
                    No: {documentNumber}
                  </div>
                  {statusBadge && (
                    <div className="mt-1">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-[9.5px] font-black uppercase border",
                          statusBadge.variant === "success" &&
                            "bg-emerald-50 text-emerald-800 border-emerald-300",
                          statusBadge.variant === "warning" &&
                            "bg-amber-50 text-amber-800 border-amber-300",
                          statusBadge.variant === "critical" &&
                            "bg-rose-50 text-rose-800 border-rose-300",
                          (!statusBadge.variant ||
                            statusBadge.variant === "neutral") &&
                            "bg-slate-100 text-slate-800 border-slate-300"
                        )}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ══ 2. METADATA & RECIPIENT GRID ══ */}
              <div className="grid grid-cols-2 gap-6 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[10.5px] print:bg-transparent print:border-slate-300 print:p-2">
                {/* Recipient */}
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    {recipientInfo.title || "Ditujukan Kepada:"}
                  </span>
                  <div className="font-bold text-slate-900 text-[12px]">
                    {recipientInfo.name}
                  </div>
                  {recipientInfo.companyName && (
                    <div className="font-semibold text-slate-700">
                      {recipientInfo.companyName}
                    </div>
                  )}
                  {recipientInfo.address && (
                    <div className="text-slate-600 text-[10px] leading-snug">
                      {recipientInfo.address}
                    </div>
                  )}
                  {recipientInfo.phone && (
                    <div className="text-slate-500 text-[9.5px]">
                      Telp: {recipientInfo.phone}
                    </div>
                  )}
                  {recipientInfo.npwp && (
                    <div className="text-slate-500 text-[9.5px]">
                      NPWP: {recipientInfo.npwp}
                    </div>
                  )}
                  {recipientInfo.attention && (
                    <div className="text-slate-700 text-[9.5px] font-medium pt-0.5">
                      Attn: {recipientInfo.attention}
                    </div>
                  )}
                </div>

                {/* Metadata Fields */}
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between gap-2 border-b border-slate-200/70 pb-1">
                    <span className="text-slate-500 font-medium">
                      Tanggal Dokumen:
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {date}
                    </span>
                  </div>
                  {dueDate && (
                    <div className="flex justify-between gap-2 border-b border-slate-200/70 pb-1">
                      <span className="text-slate-500 font-medium">
                        Jatuh Tempo:
                      </span>
                      <span className="font-bold text-rose-700 print:text-black tabular-nums">
                        {dueDate}
                      </span>
                    </div>
                  )}
                  {metaFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between gap-2 border-b border-slate-200/70 pb-1 last:border-none"
                    >
                      <span className="text-slate-500 font-medium">
                        {field.label}:
                      </span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ══ 3. LINE ITEMS TABLE ══ */}
              <div className="my-4 border border-slate-300 rounded-lg overflow-hidden print:rounded-none">
                <table className="w-full text-left border-collapse text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[9.5px] print:bg-slate-200">
                      <th className="p-2 w-8 text-center border-r border-slate-300">
                        #
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          style={{ width: col.width }}
                          className={cn(
                            "p-2 border-r border-slate-300 last:border-r-0",
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center",
                            (!col.align || col.align === "left") && "text-left"
                          )}
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="p-6 text-center text-slate-400 italic"
                        >
                          Tidak ada rincian baris data.
                        </td>
                      </tr>
                    ) : (
                      items.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="border-b border-slate-200 last:border-none print:border-slate-300"
                        >
                          <td className="p-2 text-center text-slate-500 font-mono border-r border-slate-200 print:border-slate-300">
                            {rowIdx + 1}
                          </td>
                          {columns.map((col) => {
                            const val = row[col.key];
                            return (
                              <td
                                key={col.key}
                                className={cn(
                                  "p-2 border-r border-slate-200 last:border-r-0 print:border-slate-300",
                                  col.align === "right" &&
                                    "text-right tabular-nums",
                                  col.align === "center" && "text-center",
                                  (!col.align || col.align === "left") &&
                                    "text-left"
                                )}
                              >
                                {col.render ? col.render(row, rowIdx) : val}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ══ OPTIONAL CUSTOM SECTIONS (CPKB FORMULA, CPP, LINE CLEARANCE) ══ */}
              {(customSections || children) && (
                <div className="my-4 space-y-4">
                  {customSections || children}
                </div>
              )}

              {/* ══ 4. SUMMARY & TERBILANG BLOCK ══ */}
              <div className="print-summary-block grid grid-cols-1 md:grid-cols-2 gap-4 my-4 items-start">
                {/* Left: Terbilang & Notes */}
                <div className="space-y-2.5">
                  {terbilangText && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] print:bg-transparent print:border-slate-300">
                      <span className="font-bold text-slate-700 block uppercase text-[8.5px] tracking-wider">
                        Terbilang:
                      </span>
                      <p className="font-semibold text-slate-900 italic mt-0.5">
                        # {terbilangText} #
                      </p>
                    </div>
                  )}

                  {notes && (
                    <div className="text-[9.5px] text-slate-600">
                      <strong className="font-bold block text-slate-800">
                        Catatan:
                      </strong>
                      {Array.isArray(notes) ? (
                        <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5">
                          {notes.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-0.5">{notes}</p>
                      )}
                    </div>
                  )}

                  {termsAndConditions && termsAndConditions.length > 0 && (
                    <div className="text-[8.5px] text-slate-500 leading-tight">
                      <strong className="font-semibold block text-slate-700">
                        Syarat & Ketentuan:
                      </strong>
                      <ol className="list-decimal pl-3 space-y-0.5 mt-0.5">
                        {termsAndConditions.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Right: Financial Totals */}
                {summaryRows.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10.5px] space-y-1.5 print:bg-transparent print:border-slate-300">
                    {summaryRows.map((s, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex justify-between items-center py-0.5",
                          s.isHighlight &&
                            "border-t-2 border-slate-900 pt-1.5 font-bold text-[12px] text-slate-900"
                        )}
                      >
                        <span
                          className={cn(
                            s.isBold ? "font-bold text-slate-900" : "text-slate-600"
                          )}
                        >
                          {s.label}:
                        </span>
                        <span
                          className={cn(
                            "tabular-nums",
                            s.isBold && "font-bold text-slate-900",
                            s.isHighlight && "text-blue-800 print:text-black font-black"
                          )}
                        >
                          {typeof s.value === "number" && s.isCurrency
                            ? formatRupiah(s.value)
                            : s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ══ 5. SIGNATURE & VERIFICATION MATRIX ══ */}
            <div className="print-signature-block mt-8 pt-4 border-t border-slate-200 print:border-slate-300">
              <div className="grid grid-cols-4 gap-4 text-center text-[10px]">
                {signatures.map((sig, idx) => (
                  <div key={idx} className="flex flex-col justify-between h-28">
                    <span className="font-bold text-slate-600 uppercase tracking-wider text-[9px]">
                      {sig.title}
                    </span>
                    <div className="flex flex-col items-center">
                      <div className="w-full border-b border-slate-400 mb-1" />
                      <span className="font-bold text-slate-900 text-[10.5px]">
                        {sig.name || "( .......................... )"}
                      </span>
                      {sig.role && (
                        <span className="text-[9px] text-slate-500">
                          {sig.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Security & Verification Footer */}
              <div className="mt-6 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 print:text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Dokumen ini sah dan diterbitkan secara digital oleh NEX ERP
                    Enterprise System.
                  </span>
                </div>
                <div className="tabular-nums">
                  Dicetak pada: {new Date().toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
