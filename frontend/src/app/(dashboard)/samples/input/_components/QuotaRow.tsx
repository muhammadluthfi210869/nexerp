"use client";

import React from "react";
import { Input } from "@/components/dna";
import { QuotaRowProps } from "../_types/input.types";

export function QuotaRow({ label, value, onChange, disabled }: QuotaRowProps) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
        disabled
          ? "bg-white/5 border-white/5 opacity-50"
          : "bg-white/5 border-white/10 hover:border-white/20"
      }`}
    >
      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
        {label}
      </span>
      <Input
        disabled={disabled}
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 h-8 bg-transparent border-none text-right font-black text-xl text-white outline-none focus:ring-0"
      />
    </div>
  );
}
