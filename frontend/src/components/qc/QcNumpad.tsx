"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, Eraser, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QcNumpadProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  label: string;
  unit: string;
  currentValue?: number;
}

export default function QcNumpad({
  open,
  onClose,
  onConfirm,
  label,
  unit,
  currentValue,
}: QcNumpadProps) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (open) {
      setDisplay(currentValue !== undefined ? String(currentValue) : "");
    }
  }, [open, currentValue]);

  const handleDigit = (digit: string) => {
    setDisplay((prev) => {
      if (digit === "." && prev.includes(".")) return prev;
      if (prev.length >= 10) return prev;
      return prev + digit;
    });
  };

  const handleBackspace = () => {
    setDisplay((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDisplay("");
  };

  const handleConfirm = () => {
    const parsed = parseFloat(display);
    if (!isNaN(parsed)) {
      onConfirm(parsed);
    }
    onClose();
  };

  const numericDisplay = display || "0";
  const isZero = display === "" || parseFloat(display) === 0;

  const keys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    [".", "0", "⌫"],
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Display */}
            <div className="p-8 bg-slate-900 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {label}
                </span>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-5xl font-black tracking-tight transition-all",
                      isZero ? "text-slate-600" : "text-white"
                    )}
                  >
                    {numericDisplay}
                  </span>
                  <span className="text-lg font-bold text-slate-400 mb-1">
                    {unit}
                  </span>
                </div>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-wider text-slate-300"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            </div>

            {/* Numpad Grid */}
            <div className="p-6 bg-white">
              <div className="grid grid-cols-3 gap-3 mb-3">
                {keys.flat().map((key) => {
                  if (key === "⌫") {
                    return (
                      <button
                        key={key}
                        onClick={handleBackspace}
                        className="h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-all flex items-center justify-center text-slate-600"
                      >
                        <Delete className="h-6 w-6" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={key}
                      onClick={() => handleDigit(key)}
                      className={cn(
                        "h-16 rounded-2xl font-bold text-2xl transition-all active:scale-95",
                        key === "."
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                          : "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm"
                      )}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all font-bold text-sm uppercase tracking-wider text-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={display === "" || display === "."}
                  className={cn(
                    "h-14 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                    display === "" || display === "."
                      ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 active:scale-[0.98]"
                  )}
                >
                  <Check className="h-5 w-5" />
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
