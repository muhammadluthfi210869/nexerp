"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { DnaButton } from "../DnaButton";

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
