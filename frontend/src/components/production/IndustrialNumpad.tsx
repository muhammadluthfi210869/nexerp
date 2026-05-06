"use client";

import React, { useState } from "react";
import { X, Delete, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumpadProps {
  value: string;
  onChange: (val: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  label: string;
  unit?: string;
  isPassword?: boolean;
}

export function IndustrialNumpad({ value, onChange, onConfirm, onClose, label, unit, isPassword }: NumpadProps) {
  const handleKey = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) onChange(value + '.');
    } else {
      if (value.length < 10) onChange(value + key);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-[#d4af37]/30 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(212,175,55,0.1)]">
        <div className="flex justify-between items-start mb-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] mb-1">Input Target</span>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">{label}</h3>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-rose-500/20 transition-all">
            <X className="w-6 h-6 text-white/40" />
          </button>
        </div>

        {/* Display */}
        <div className="h-24 bg-black rounded-3xl border border-white/10 flex items-center px-8 justify-between mb-10">
          <span className="text-4xl font-black italic tracking-tighter tabular-nums text-[#d4af37]">
            {isPassword ? "•".repeat(value.length) : (value || "0")}<span className="animate-pulse ml-1 opacity-50">|</span>
          </span>
          <span className="text-sm font-black uppercase text-white/20 tracking-widest">{unit}</span>
        </div>

        {/* Keys */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'backspace'].map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key.toString())}
              className={cn(
                "h-20 rounded-2xl text-2xl font-black transition-all active:scale-90 flex items-center justify-center border",
                key === 'backspace' 
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
                  : "bg-white/[0.03] border-white/10 text-white hover:bg-white/10"
              )}
            >
              {key === 'backspace' ? <Delete className="w-8 h-8" /> : key}
            </button>
          ))}
        </div>

        <button 
          onClick={onConfirm}
          className="w-full h-24 mt-8 rounded-[2rem] bg-[#d4af37] text-black font-black italic uppercase text-xl shadow-[0_20px_40px_rgba(212,175,55,0.2)] hover:bg-[#c09d2e] transition-all flex items-center justify-center gap-4"
        >
          CONFIRM DATA <Check className="w-8 h-8 stroke-[3px]" />
        </button>
      </div>
    </div>
  );
}

