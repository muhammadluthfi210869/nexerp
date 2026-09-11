"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, X, Building2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { MASTER_COA_LIST, type CoaAccountItem } from "@/lib/coa-utils";
import { api } from "@/lib/api";

export interface CoaSelectProps {
  value?: string;
  onChange: (code: string, account?: CoaAccountItem) => void;
  typeFilter?: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" | ("ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE")[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
}

const TYPE_COLORS: Record<string, { badge: string; text: string }> = {
  ASSET: { badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800", text: "text-blue-600" },
  LIABILITY: { badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800", text: "text-rose-600" },
  EQUITY: { badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800", text: "text-purple-600" },
  REVENUE: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800", text: "text-emerald-600" },
  EXPENSE: { badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800", text: "text-amber-600" },
};

export function CoaSelect({
  value,
  onChange,
  typeFilter,
  placeholder = "Pilih atau cari COA (ketik nomor '1', 'bank', 'gaji')...",
  label,
  error,
  disabled = false,
  className,
  required = false,
}: CoaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accounts, setAccounts] = useState<CoaAccountItem[]>(MASTER_COA_LIST);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Attempt to fetch fresh accounts from backend API with fallback
  useEffect(() => {
    let active = true;
    async function fetchAccounts() {
      try {
        const res = await api.get<CoaAccountItem[]>("/v1/finance/accounts");
        if (active && Array.isArray(res) && res.length > 0) {
          setAccounts(res);
        }
      } catch (err) {
        // Fallback to MASTER_COA_LIST already set
      }
    }
    fetchAccounts();
    return () => {
      active = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter accounts by type and search query
  const filteredAccounts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return accounts.filter((acc) => {
      // Type filtering
      if (typeFilter) {
        if (Array.isArray(typeFilter)) {
          if (!typeFilter.includes(acc.type)) return false;
        } else {
          if (acc.type !== typeFilter) return false;
        }
      }

      if (!q) return true;

      // Match code prefix or name content
      return (
        acc.code.toLowerCase().includes(q) ||
        acc.name.toLowerCase().includes(q) ||
        (acc.reportGroup && acc.reportGroup.toLowerCase().includes(q))
      );
    });
  }, [accounts, typeFilter, searchQuery]);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.code === value);
  }, [accounts, value]);

  const handleSelect = (acc: CoaAccountItem) => {
    onChange(acc.code, acc);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  return (
    <div className={cn("relative flex flex-col gap-1.5 w-full", className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        className={cn(
          "w-full min-h-[42px] px-3.5 py-2 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium",
          "flex items-center justify-between gap-2 cursor-pointer select-none transition-all shadow-sm",
          isOpen
            ? "border-blue-500 ring-4 ring-blue-500/10 shadow-md"
            : error
            ? "border-rose-400 bg-rose-50/20"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
          disabled && "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
        )}
      >
        {selectedAccount ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className={cn(
                "px-2 py-0.5 font-mono text-xs font-bold rounded-md border shrink-0",
                TYPE_COLORS[selectedAccount.type]?.badge || "bg-slate-100 text-slate-700"
              )}
            >
              {selectedAccount.code}
            </span>
            <span className="truncate text-slate-900 dark:text-slate-100 font-medium">
              {selectedAccount.name}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">
            {placeholder}
          </span>
        )}

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedAccount && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Hapus pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </div>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-[calc(100%+6px)] left-0 w-full z-50 bg-white dark:bg-slate-900",
            "border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden",
            "animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col max-h-[380px]"
          )}
        >
          {/* Real-time Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik kode (misal: '1', '1151') atau nama akun..."
                className={cn(
                  "w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                  "rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
                  "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                )}
              />
            </div>
          </div>

          {/* Quick Category Hints */}
          <div className="px-3 py-1.5 bg-slate-100/60 dark:bg-slate-800/40 text-[10px] text-slate-500 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <span>Ditemukan: <strong>{filteredAccounts.length}</strong> akun</span>
            <span className="font-mono text-[9px] text-slate-400">1: Aset | 2: Kewajiban | 3: Ekuitas | 4: Sales | 5: HPP | 6: Beban | 7: Lainnya</span>
          </div>

          {/* Account Options List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1 flex-1">
            {filteredAccounts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Tidak ada akun COA yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredAccounts.map((acc) => {
                const isSelected = acc.code === value;
                const colors = TYPE_COLORS[acc.type] || { badge: "bg-slate-100 text-slate-700", text: "text-slate-600" };
                const isHeader = !acc.parentCode;

                return (
                  <div
                    key={acc.code}
                    onClick={() => handleSelect(acc)}
                    className={cn(
                      "group px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs",
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200",
                      isHeader && "bg-slate-50/40 dark:bg-slate-900/40 font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span
                        className={cn(
                          "px-2 py-0.5 font-mono text-[11px] font-bold rounded border shrink-0",
                          colors.badge
                        )}
                      >
                        {acc.code}
                      </span>
                      <div className="flex flex-col truncate">
                        <span className="truncate">{acc.name}</span>
                        {acc.reportGroup && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            {acc.reportGroup} · {acc.normalBalance === 'DEBIT' ? 'Debet' : 'Kredit'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[10px] font-semibold text-rose-500 mt-0.5">{error}</p>}
    </div>
  );
}
