"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROVINCES,
  getFilteredCities,
  getFilteredDistricts,
} from "@/lib/indonesian-addresses";

export interface CascadingAddressProps {
  provinsi: string;
  kota: string;
  kecamatan: string;
  onProvinsiChange: (val: string) => void;
  onKotaChange: (val: string) => void;
  onKecamatanChange: (val: string) => void;
  className?: string;
}

export function CascadingAddress({
  provinsi,
  kota,
  kecamatan,
  onProvinsiChange,
  onKotaChange,
  onKecamatanChange,
  className,
}: CascadingAddressProps) {
  const cities = provinsi ? getFilteredCities(provinsi) : [];
  const districts = kota ? getFilteredDistricts(kota) : [];

  return (
    <div className={`grid grid-cols-3 gap-4 ${className ?? ""}`}>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
          Provinsi <span className="text-red-500">*</span>
        </label>
        <Select
          value={provinsi}
          onValueChange={(val) => {
            onProvinsiChange(val ?? "");
            onKotaChange("");
            onKecamatanChange("");
          }}
        >
          <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-full">
            <SelectValue placeholder="Pilih Provinsi" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-60 overflow-y-auto">
            {PROVINCES.map((p) => (
              <SelectItem key={p.code} value={p.code} className="text-xs font-bold uppercase">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
          Kota / Kab. <span className="text-red-500">*</span>
        </label>
        <Select
          value={kota}
          onValueChange={(val) => {
            onKotaChange(val ?? "");
            onKecamatanChange("");
          }}
          disabled={!provinsi}
        >
          <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-full">
            <SelectValue placeholder={provinsi ? "Pilih Kota" : "Pilih Provinsi dulu"} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-60 overflow-y-auto">
            {cities.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-xs font-bold uppercase">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
          Kecamatan <span className="text-red-500">*</span>
        </label>
        <Select
          value={kecamatan}
          onValueChange={(val) => onKecamatanChange(val ?? "")}
          disabled={!kota}
        >
          <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-full">
            <SelectValue placeholder={kota ? "Pilih Kecamatan" : "Pilih Kota dulu"} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-60 overflow-y-auto">
            {districts.map((d) => (
              <SelectItem key={d.code} value={d.code} className="text-xs font-bold uppercase">
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
