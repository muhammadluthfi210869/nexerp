"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, X, Package, DollarSign, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export interface GoodsItemOption {
  id: string;
  code?: string | null;
  name: string;
  unit: string;
  unitPrice: number;
  type?: string;
  stockQty?: number;
  category?: { id: string; name: string } | null;
}

export interface GoodsSelectProps {
  value?: string;
  onChange: (id: string, item?: GoodsItemOption) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  typeFilter?: string;
  categoryFilter?: string;
  required?: boolean;
}

export function GoodsSelect({
  value,
  onChange,
  placeholder = "Pilih atau cari barang / material (ketik kode 'BBK...', nama, kategori)...",
  label,
  error,
  disabled = false,
  className,
  typeFilter,
  categoryFilter,
  required = false,
}: GoodsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<GoodsItemOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    async function fetchItems() {
      try {
        setLoading(true);
        const res = await api.get<GoodsItemOption[]>("/master/materials/active");
        if (active && Array.isArray(res) && res.length > 0) {
          setItems(res);
        }
      } catch {
        try {
          const fallbackRes = await api.get<{ data: GoodsItemOption[] }>("/master/materials?limit=200");
          if (active && fallbackRes?.data && Array.isArray(fallbackRes.data)) {
            setItems(fallbackRes.data);
          }
        } catch {
          // ignore
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchItems();
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
    return items.find(i => i.id === value || i.code === value || i.name === value) || null;
  }, [value, items]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter(i => {
      if (typeFilter && typeFilter !== "ALL") {
        if (i.type !== typeFilter) return false;
      }
      if (categoryFilter && categoryFilter !== "ALL") {
        if (i.category?.id !== categoryFilter && i.category?.name !== categoryFilter) {
          return false;
        }
      }
      if (!q) return true;
      return (
        (i.code && i.code.toLowerCase().includes(q)) ||
        i.name.toLowerCase().includes(q) ||
        (i.category?.name && i.category.name.toLowerCase().includes(q)) ||
        i.unit.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, typeFilter, categoryFilter]);

  const handleSelect = (item: GoodsItemOption) => {
    onChange(item.id, item);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", undefined);
    setSearchQuery("");
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
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
          <Package className="w-4 h-4 text-purple-500 shrink-0" />
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              {selectedItem.code && (
                <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                  {selectedItem.code}
                </span>
              )}
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {selectedItem.name}
              </span>
              <span className="text-[10px] text-slate-500 font-normal shrink-0">
                ({formatRupiah(selectedItem.unitPrice)} / {selectedItem.unit})
              </span>
              {selectedItem.category?.name && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 shrink-0">
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
        <div className="absolute top-full left-0 mt-1 w-full min-w-[360px] bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik kode (BBK...), nama material, kategori..."
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
          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-slate-100/60 dark:divide-slate-800/60">
            {loading && items.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Memuat data barang...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada barang yang cocok dengan pencarian.
              </div>
            ) : (
              filtered.slice(0, 50).map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors",
                      isSelected
                        ? "bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {item.code && (
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {item.code}
                          </span>
                        )}
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </span>
                        {item.category?.name && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300">
                            {item.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatRupiah(item.unitPrice)} / {item.unit}
                        </span>
                        {item.stockQty !== undefined && (
                          <span>Stok: {Number(item.stockQty).toLocaleString()} {item.unit}</span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
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
