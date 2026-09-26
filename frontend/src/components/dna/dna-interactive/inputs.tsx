"use client";

import React, { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Switch as RawSwitch } from "@/components/ui/switch";
import { ChevronDown, Search, Check } from "lucide-react";

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
