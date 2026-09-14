"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, X, Building2, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export interface SupplierItem {
  id: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  city?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
}

export interface SupplierSelectProps {
  value?: string;
  onChange: (id: string, supplier?: SupplierItem) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  categoryFilter?: string;
  required?: boolean;
}

export function SupplierSelect({
  value,
  onChange,
  placeholder = "Pilih atau cari supplier / vendor (nama, kontak PIC, kota)...",
  label,
  error,
  disabled = false,
  className,
  categoryFilter,
  required = false,
}: SupplierSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    async function fetchSuppliers() {
      try {
        setLoading(true);
        const res = await api.get<SupplierItem[]>("/master/suppliers/active");
        if (active && Array.isArray(res) && res.length > 0) {
          setSuppliers(res);
        }
      } catch {
        try {
          const fallbackRes = await api.get<any[]>("/master/suppliers");
          if (active && Array.isArray(fallbackRes)) {
            setSuppliers(fallbackRes);
          }
        } catch {
          // ignore
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchSuppliers();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    return suppliers.find(s => s.id === value || s.name === value) || null;
  }, [value, suppliers]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return suppliers.filter(s => {
      if (categoryFilter && categoryFilter !== "ALL") {
        if (s.categoryId !== categoryFilter && s.category?.name !== categoryFilter) {
          return false;
        }
      }
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contact && s.contact.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.category?.name && s.category.name.toLowerCase().includes(q))
      );
    });
  }, [suppliers, searchQuery, categoryFilter]);

  const handleSelect = (supplier: SupplierItem) => {
    onChange(supplier.id, supplier);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", undefined);
    setSearchQuery("");
  };

  return (
    <div className={cn("relative w-full text-left", className)} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Box */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        className={cn(
          "w-full min-h-[38px] px-3 py-1.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer bg-white dark:bg-[#0c1322]",
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/10 dark:ring-blue-500/20 shadow-sm"
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
          disabled && "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50",
          error && "border-rose-500 focus:ring-rose-500/20"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {selectedItem.name}
              </span>
              {selectedItem.contact && (
                <span className="text-[10px] text-slate-500 font-normal truncate">
                  (PIC: {selectedItem.contact})
                </span>
              )}
              {selectedItem.category?.name && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                  {selectedItem.category.name}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedItem && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200",
              isOpen && "transform rotate-180 text-blue-500"
            )}
          />
        </div>
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[320px] bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama supplier, PIC, kota..."
              className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100/60 dark:divide-slate-800/60">
            {loading && suppliers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Memuat data supplier...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada supplier yang cocok dengan pencarian.
              </div>
            ) : (
              filtered.slice(0, 50).map((supplier) => {
                const isSelected = selectedItem?.id === supplier.id;
                return (
                  <div
                    key={supplier.id}
                    onClick={() => handleSelect(supplier)}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors",
                      isSelected
                        ? "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {supplier.name}
                        </span>
                        {supplier.category?.name && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {supplier.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        {supplier.contact && <span>PIC: {supplier.contact}</span>}
                        {supplier.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {supplier.phone}
                          </span>
                        )}
                        {supplier.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {supplier.city}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[10px] text-rose-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}
