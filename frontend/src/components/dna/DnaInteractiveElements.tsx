"use client";

import React, { useState, forwardRef } from "react";
import { cn, formatRupiah } from "@/lib/utils";
import { DnaInput } from "./DnaInput";
import { DnaButton } from "./DnaButton";
import { DnaModal } from "./DnaModal";
import { DnaBadge } from "./DnaBadge";
import { Switch as RawSwitch } from "@/components/ui/switch";
import {
  Search,
  Check,
  ChevronDown,
  Calendar,
  AlertTriangle,
  Printer,
  Download,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  X,
} from "lucide-react";

// ── Currency Input ──
export interface DnaCurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  value?: number;
  onChange?: (val: number) => void;
  onValueChange?: (val: number) => void;
  error?: string;
  helperText?: string;
}

export const DnaCurrencyInput = forwardRef<HTMLInputElement, DnaCurrencyInputProps>(
  ({ label, value = 0, onChange, onValueChange, error, helperText, className, ...props }, ref) => {
    const [displayVal, setDisplayVal] = useState<string>(value ? value.toLocaleString("id-ID") : "");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      const num = raw ? parseInt(raw, 10) : 0;
      setDisplayVal(num ? num.toLocaleString("id-ID") : "");
      onChange?.(num);
      onValueChange?.(num);
    };

    return (
      <div className={cn("flex flex-col space-y-1.5", className)}>
        {label && <label className="text-[12px] font-medium text-slate-700">{label}</label>}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">Rp</span>
          <input
            ref={ref}
            type="text"
            value={displayVal}
            onChange={handleChange}
            placeholder="0"
            className={cn(
              "w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white font-mono text-slate-900",
              "focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
              error && "border-rose-400 focus:border-rose-500"
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[11px] text-rose-500">{error}</span>}
        {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
      </div>
    );
  }
);
DnaCurrencyInput.displayName = "DnaCurrencyInput";

// ── Number Input ──
export interface DnaNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  unit?: string;
  error?: string;
  helperText?: string;
  onChange?: any;
  onValueChange?: (val: number) => void;
}

export const DnaNumberInput = forwardRef<HTMLInputElement, DnaNumberInputProps>(
  ({ label, unit, error, helperText, onChange, onValueChange, className, ...props }, ref) => (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      {label && <label className="text-[12px] font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          type="number"
          onChange={(e) => {
            onChange?.(e);
            onValueChange?.(parseFloat(e.target.value) || 0);
          }}
          className={cn(
            "w-full px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white font-mono text-slate-900",
            "focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
            unit && "pr-12",
            error && "border-rose-400 focus:border-rose-500"
          )}
          {...props}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 uppercase">
            {unit}
          </span>
        )}
      </div>
      {error && <span className="text-[11px] text-rose-500">{error}</span>}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  )
);
DnaNumberInput.displayName = "DnaNumberInput";

// ── Percentage Input ──
export const DnaPercentageInput = forwardRef<HTMLInputElement, DnaNumberInputProps>(
  ({ label, ...props }, ref) => <DnaNumberInput ref={ref} label={label} unit="%" max={100} min={0} step={0.01} {...props} />
);
DnaPercentageInput.displayName = "DnaPercentageInput";

// ── Date Picker ──
export interface DnaDatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  onChange?: ((val: string) => void) | ((e: React.ChangeEvent<HTMLInputElement>) => void) | any;
  onValueChange?: (val: string) => void;
}

export const DnaDatePicker = forwardRef<HTMLInputElement, DnaDatePickerProps>(
  ({ label, error, helperText, onChange, onValueChange, className, ...props }, ref) => (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      {label && <label className="text-[12px] font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          type="date"
          onChange={(e) => {
            if (typeof onChange === "function") {
              onChange(e.target.value);
            }
            onValueChange?.(e.target.value);
          }}
          className={cn(
            "w-full px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-900",
            "focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
            error && "border-rose-400 focus:border-rose-500"
          )}
          {...props}
        />
      </div>
      {error && <span className="text-[11px] text-rose-500">{error}</span>}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  )
);
DnaDatePicker.displayName = "DnaDatePicker";

// ── Searchable Select ──
export interface DnaSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  description?: string;
  badge?: string;
  badgeVariant?: string;
}

export interface DnaSearchableSelectProps {
  label?: string;
  options: DnaSelectOption[];
  value?: string | number | null;
  onChange?: (val: string) => void;
  onValueChange?: (val: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  minSearchChars?: number;
}

export function DnaSearchableSelect({
  label,
  options,
  value,
  onChange,
  onValueChange,
  placeholder = "Pilih opsi...",
  disabled = false,
  className,
  error,
  helperText,
  required,
  minSearchChars,
}: DnaSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = options.find((o) => o.value === value);
  const filtered = options.filter(
    (o) => o.label.toLowerCase().includes(query.toLowerCase()) || (o.sublabel && o.sublabel.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className={cn("flex flex-col space-y-1.5 relative", className)}>
      {label && (
        <label className="text-[12px] font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white text-left",
          open && "ring-2 ring-blue-100 border-blue-500",
          disabled && "bg-slate-50 cursor-not-allowed opacity-75",
          error && "border-rose-400"
        )}
      >
        <span className={cn(selectedOption ? "text-slate-900" : "text-slate-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {helperText && <span className="text-[11px] text-slate-400">{helperText}</span>}

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-1 max-h-60 overflow-y-auto">
          <div className="relative mb-2">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md border border-slate-200 focus:outline-hidden focus:border-blue-500"
              autoFocus
            />
          </div>
          {filtered.length === 0 ? (
            <div className="text-[12px] text-slate-400 py-3 text-center">Tidak ada hasil</div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange?.(String(opt.value));
                  onValueChange?.(opt.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] text-left hover:bg-slate-50 transition-colors",
                  opt.value === value && "bg-blue-50/60 text-blue-700 font-medium"
                )}
              >
                <div>
                  <div className="text-slate-800 font-medium">{opt.label}</div>
                  {opt.sublabel && <div className="text-[11px] text-slate-400">{opt.sublabel}</div>}
                </div>
                {opt.value === value && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </button>
            ))
          )}
        </div>
      )}
      {error && <span className="text-[11px] text-rose-500">{error}</span>}
    </div>
  );
}

// ── Switch ──
export interface DnaSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const DnaSwitch = ({
  checked = false,
  onChange,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}: DnaSwitchProps) => {
  const handleChange = (newVal: boolean) => {
    onChange?.(newVal);
    onCheckedChange?.(newVal);
  };

  if (!label) {
    return (
      <RawSwitch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <label className={cn("flex items-start gap-3 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed", className)}>
      <RawSwitch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={disabled}
        className="mt-0.5"
      />
      <div>
        <div className="text-[13px] font-medium text-slate-800">{label}</div>
        {description && <div className="text-[11px] text-slate-400 mt-0.5">{description}</div>}
      </div>
    </label>
  );
};

// ── Form Section ──
export function DnaFormSection({
  title,
  subtitle,
  description,
  icon,
  badge,
  columns,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  columns?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 shadow-2xs", className)}>
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
            {(subtitle || description) && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle || description}</p>}
          </div>
        </div>
        {badge}
      </div>
      <div className={cn("space-y-3", columns && `grid grid-cols-1 md:grid-cols-${columns} gap-4 space-y-0`)}>
        {children}
      </div>
    </div>
  );
}

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

// ── Line Items Table ──
export interface DnaLineItem {
  id: string;
  itemId?: string;
  itemCode?: string;
  name?: string;
  itemName?: string;
  qty: number;
  unit: string;
  price?: number;
  unitPrice?: number;
  discount?: number;
  discountPercent?: number;
  isTaxable?: boolean;
  total?: number;
}

export function DnaLineItemsTable({
  items,
  onChange,
  onItemsChange,
  itemOptions,
  ppnRate,
  readOnly = false,
}: {
  items: DnaLineItem[];
  onChange?: (items: DnaLineItem[]) => void;
  onItemsChange?: (items: DnaLineItem[]) => void;
  itemOptions?: any[];
  ppnRate?: number;
  readOnly?: boolean;
}) {
  const triggerChange = (next: DnaLineItem[]) => {
    onChange?.(next);
    onItemsChange?.(next);
  };

  const handleAdd = () => {
    const newItem: DnaLineItem = {
      id: "line-" + Date.now(),
      name: "",
      qty: 1,
      unit: "pcs",
      price: 0,
      discount: 0,
      total: 0,
    };
    triggerChange([...items, newItem]);
  };

  const handleRemove = (index: number) => {
    triggerChange(items.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, field: keyof DnaLineItem, val: any) => {
    const next = [...items];
    const item = { ...next[index], [field]: val };
    item.total = (item.qty || 0) * (item.price || 0) - (item.discount || 0);
    next[index] = item;
    triggerChange(next);
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-left text-[12px]">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
          <tr>
            <th className="px-3 py-2.5">Item / Deskripsi</th>
            <th className="px-3 py-2.5 w-24">Kuantitas</th>
            <th className="px-3 py-2.5 w-20">Satuan</th>
            <th className="px-3 py-2.5 w-32">Harga Satuan</th>
            <th className="px-3 py-2.5 w-28">Diskon (Rp)</th>
            <th className="px-3 py-2.5 w-36 text-right">Total</th>
            {!readOnly && <th className="px-2 py-2.5 w-12 text-center" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td className="p-2">
                {readOnly ? (
                  <span className="font-medium text-slate-900">{item.name}</span>
                ) : (
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleChangeItem(idx, "name", e.target.value)}
                    placeholder="Nama barang / jasa"
                    className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2">
                {readOnly ? (
                  <span className="font-mono">{item.qty}</span>
                ) : (
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => handleChangeItem(idx, "qty", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-[12px] font-mono border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2">
                {readOnly ? (
                  <span>{item.unit}</span>
                ) : (
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => handleChangeItem(idx, "unit", e.target.value)}
                    className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2">
                {readOnly ? (
                  <span className="font-mono">{formatRupiah(item.price || item.unitPrice || 0)}</span>
                ) : (
                  <input
                    type="number"
                    value={item.price ?? item.unitPrice ?? 0}
                    onChange={(e) => handleChangeItem(idx, "price", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-[12px] font-mono border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2">
                {readOnly ? (
                  <span className="font-mono">{formatRupiah(item.discount || 0)}</span>
                ) : (
                  <input
                    type="number"
                    value={item.discount || 0}
                    onChange={(e) => handleChangeItem(idx, "discount", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-[12px] font-mono border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2 text-right font-mono font-semibold text-slate-900">
                {formatRupiah(item.total || 0)}
              </td>
              {!readOnly && (
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <DnaButton variant="secondary" size="sm" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Baris
          </DnaButton>
          <div className="text-[13px] font-semibold text-slate-900 pr-3">
            Grand Total: {formatRupiah(items.reduce((acc, i) => acc + (i.total || 0), 0))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Workflow Bar ──
export interface DnaWorkflowStage {
  key: string;
  label: string;
  description?: string;
  status?: "completed" | "current" | "pending";
}

export interface DnaWorkflowBarProps {
  stages: DnaWorkflowStage[];
  currentStageKey?: string;
  currentStage?: string;
  onStageClick?: (stageKey: string) => void;
  isVoided?: boolean;
  isVoid?: boolean;
  voidReason?: string;
}

export function DnaWorkflowBar({
  stages,
  currentStageKey,
  currentStage,
  onStageClick,
  isVoided,
  isVoid,
  voidReason,
}: DnaWorkflowBarProps) {
  const activeKey = currentStageKey || currentStage;
  const voidActive = isVoided || isVoid;
  const activeIdx = stages.findIndex((s) => s.key === activeKey || s.label === activeKey);

  return (
    <div className="space-y-2">
      {voidActive && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded text-[10px]">
              Dibatalkan / Void
            </span>
            <span>{voidReason || "Dokumen / Work Order ini telah dibatalkan."}</span>
          </div>
        </div>
      )}
      <div className="flex items-center space-x-2 py-3 px-4 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        {stages.map((stage, idx) => {
          const isCurrent = activeIdx >= 0 ? idx === activeIdx : stage.status === "current";
          const isCompleted = activeIdx >= 0 ? idx < activeIdx : stage.status === "completed";
          return (
            <React.Fragment key={stage.key || idx}>
              <div
                onClick={() => onStageClick?.(stage.key)}
                className={cn(
                  "flex items-center space-x-2 shrink-0",
                  onStageClick && "cursor-pointer hover:opacity-80"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                    isCompleted && "bg-emerald-600 text-white",
                    isCurrent && !voidActive && "bg-blue-600 text-white ring-4 ring-blue-100",
                    isCurrent && voidActive && "bg-rose-600 text-white ring-4 ring-rose-100",
                    !isCompleted && !isCurrent && "bg-slate-100 text-slate-400"
                  )}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div>
                  <span
                    className={cn(
                      "text-[12px] block",
                      isCurrent ? "font-semibold text-blue-600" : "font-medium text-slate-700"
                    )}
                  >
                    {stage.label}
                  </span>
                  {stage.description && (
                    <span className="text-[10px] text-slate-400 block">{stage.description}</span>
                  )}
                </div>
              </div>
              {idx < stages.length - 1 && <div className="h-0.5 w-6 bg-slate-200 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Toast Hook ──
export function useDnaToast() {
  const toastFns = {
    success: (title: string, desc?: string) => {
      console.log("[TOAST_SUCCESS]", title, desc);
    },
    error: (title: string, desc?: string) => {
      console.error("[TOAST_ERROR]", title, desc);
    },
    warning: (title: string, desc?: string) => {
      console.warn("[TOAST_WARNING]", title, desc);
    },
    info: (title: string, desc?: string) => {
      console.info("[TOAST_INFO]", title, desc);
    },
  };

  const showToast = (props: {
    type: "success" | "error" | "warning" | "info" | string;
    title: string;
    message?: string;
  }) => {
    const fn = (toastFns as any)[props.type] || toastFns.info;
    fn(props.title, props.message);
  };

  return {
    ...toastFns,
    toast: toastFns,
    showToast,
  };
}

// ── Cascading Address ──
export function DnaCascadingAddress({
  province,
  provinsi,
  city,
  kota,
  district,
  kecamatan,
  address,
  onChange,
  onProvinsiChange,
  onKotaChange,
  onKecamatanChange,
  disabled = false,
}: {
  province?: string;
  provinsi?: string;
  city?: string;
  kota?: string;
  district?: string;
  kecamatan?: string;
  address?: string;
  onChange?: (val: { province: string; city: string; district: string; address: string }) => void;
  onProvinsiChange?: (v: any) => void;
  onKotaChange?: (v: any) => void;
  onKecamatanChange?: (v: any) => void;
  disabled?: boolean;
}) {
  const [val, setVal] = useState({
    province: province || provinsi || "",
    city: city || kota || "",
    district: district || kecamatan || "",
    address: address || "",
  });

  const handleChange = (field: string, text: string) => {
    const next = { ...val, [field]: text };
    setVal(next);
    onChange?.(next);
    if (field === "province") onProvinsiChange?.(text);
    if (field === "city") onKotaChange?.(text);
    if (field === "district") onKecamatanChange?.(text);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label className="text-[12px] font-medium text-slate-700">Provinsi</label>
        <input
          type="text"
          disabled={disabled}
          value={val.province}
          onChange={(e) => handleChange("province", e.target.value)}
          placeholder="Jawa Barat"
          className="w-full mt-1 px-3 py-2 text-[12px] rounded-lg border border-slate-200"
        />
      </div>
      <div>
        <label className="text-[12px] font-medium text-slate-700">Kota / Kabupaten</label>
        <input
          type="text"
          disabled={disabled}
          value={val.city}
          onChange={(e) => handleChange("city", e.target.value)}
          placeholder="Kota Bandung"
          className="w-full mt-1 px-3 py-2 text-[12px] rounded-lg border border-slate-200"
        />
      </div>
      <div>
        <label className="text-[12px] font-medium text-slate-700">Kecamatan</label>
        <input
          type="text"
          disabled={disabled}
          value={val.district}
          onChange={(e) => handleChange("district", e.target.value)}
          placeholder="Coblong"
          className="w-full mt-1 px-3 py-2 text-[12px] rounded-lg border border-slate-200"
        />
      </div>
      <div className="md:col-span-3">
        <label className="text-[12px] font-medium text-slate-700">Alamat Lengkap</label>
        <textarea
          disabled={disabled}
          value={val.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Nama jalan, nomor gedung, RT/RW, dsb"
          className="w-full mt-1 px-3 py-2 text-[12px] rounded-lg border border-slate-200 h-16"
        />
      </div>
    </div>
  );
}

// ── Info Card ──
export function DnaInfoCard({
  title,
  subtitle,
  description,
  items,
  children,
  badge,
  action,
  variant,
  icon: Icon,
  className,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  items?: Array<{ label: string; value: string }>;
  children?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "blue" | "emerald" | "amber" | "rose" | "purple" | "slate";
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const variantStyles = {
    blue: "bg-blue-50/50 border-blue-200/80 text-blue-900",
    emerald: "bg-emerald-50/50 border-emerald-200/80 text-emerald-900",
    amber: "bg-amber-50/50 border-amber-200/80 text-amber-900",
    rose: "bg-rose-50/50 border-rose-200/80 text-rose-900",
    purple: "bg-purple-50/50 border-purple-200/80 text-purple-900",
    slate: "bg-slate-50/50 border-slate-200/80 text-slate-900",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-2xs space-y-3",
        variant ? variantStyles[variant] : "bg-white border-slate-200/80",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-current shrink-0" />}
          <h4 className="text-[14px] font-semibold text-current">{title}</h4>
          {badge}
        </div>
        {action}
      </div>
      {(subtitle || description) && (
        <p className="text-[12px] opacity-80 leading-relaxed">
          {description || subtitle}
        </p>
      )}
      {items && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
          {items.map((it, i) => (
            <div key={i} className="flex justify-between py-1 border-b border-slate-100">
              <span className="opacity-70">{it.label}:</span>
              <span className="font-semibold">{it.value}</span>
            </div>
          ))}
        </div>
      )}
      {children && <div className="text-[12px] pt-1">{children}</div>}
    </div>
  );
}

export function DnaCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  children,
  className,
  dotColor,
  titleColor,
}: {
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  dotColor?: string;
  titleColor?: string;
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden", className)}>
      {(title || subtitle || Icon || badge || actions || dotColor) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center space-x-2.5">
            {dotColor && <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />}
            {Icon && (
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && <h3 className={cn("text-[14px] font-bold", titleColor || "text-slate-900")}>{title}</h3>}
              {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {badge}
          </div>
          {actions}
        </div>
      )}
      {children && <div className="p-5">{children}</div>}
    </div>
  );
}

// ── Radio Group ──
export function DnaRadioGroup({
  label,
  value,
  onChange,
  onValueChange,
  options,
  name,
  required,
  className,
}: {
  label?: string;
  value?: string | number;
  onChange?: (val: string) => void;
  onValueChange?: (val: any) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  name?: string;
  required?: boolean;
  className?: string;
}) {
  const handleChange = (val: string) => {
    onChange?.(val);
    onValueChange?.(val);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-[12px] font-medium text-slate-700 block mb-1">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
            value === opt.value
              ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500"
              : "border-slate-200 bg-white hover:bg-slate-50"
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => handleChange(opt.value)}
            className="mt-1 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-xs font-semibold text-slate-900">{opt.label}</div>
            {opt.description && <div className="text-[11px] text-slate-500 mt-0.5">{opt.description}</div>}
          </div>
        </label>
      ))}
    </div>
  );
}

// ── Sticky Footer ──
export interface DnaStickyFooterProps {
  children?: React.ReactNode;
  className?: string;
  isFixed?: boolean;
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  saveDraftLabel?: string;
  submitLabel?: string;
}

export function DnaStickyFooter({
  children,
  className,
  isFixed = true,
  onCancel,
  onSaveDraft,
  onSubmit,
  cancelLabel = "Batal",
  saveDraftLabel = "Simpan Draft",
  submitLabel = "Simpan & Lanjutkan",
}: DnaStickyFooterProps) {
  return (
    <div
      className={cn(
        isFixed ? "sticky bottom-0 left-0 right-0 z-40" : "relative",
        "bg-white/95 backdrop-blur-xs border-t border-slate-200 py-3 px-6 flex items-center justify-between shadow-lg",
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          <div>
            {onCancel && (
              <DnaButton variant="secondary" onClick={onCancel}>
                {cancelLabel}
              </DnaButton>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onSaveDraft && (
              <DnaButton variant="secondary" onClick={onSaveDraft}>
                {saveDraftLabel}
              </DnaButton>
            )}
            {onSubmit && (
              <DnaButton variant="primary" onClick={onSubmit}>
                {submitLabel}
              </DnaButton>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Toast Provider ──
export function DnaToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


