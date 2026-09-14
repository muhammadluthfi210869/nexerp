"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export interface MasterCategoryOption {
  id: string;
  name: string;
  type: string;
  description?: string | null;
}

export interface CategorySelectProps {
  value?: string;
  onChange: (id: string, category?: MasterCategoryOption) => void;
  typeFilter?: "GOODS" | "CUSTOMER" | "SUPPLIER";
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function CategorySelect({
  value,
  onChange,
  typeFilter,
  placeholder = "Pilih kategori...",
  label,
  error,
  disabled = false,
  className,
  required = false,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<MasterCategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    async function fetchCategories() {
      try {
        setLoading(true);
        const url = typeFilter ? `/master/categories?type=${typeFilter}` : "/master/categories";
        const res = await api.get<MasterCategoryOption[]>(url);
        if (active && Array.isArray(res)) {
          setCategories(res);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchCategories();
    return () => {
      active = false;
    };
  }, [typeFilter]);

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
    return categories.find(c => c.id === value || c.name === value) || null;
  }, [value, categories]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(c => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [categories, searchQuery]);

  const handleSelect = (cat: MasterCategoryOption) => {
    onChange(cat.id, cat);
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
          <Tag className="w-4 h-4 text-amber-500 shrink-0" />
          {selectedItem ? (
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {selectedItem.name}
            </span>
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
        <div className="absolute top-full left-0 mt-1 w-full min-w-[280px] bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kategori..."
              className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100/60 dark:divide-slate-800/60">
            {loading && categories.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Memuat kategori...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Kategori tidak ditemukan.</div>
            ) : (
              filtered.map((cat) => {
                const isSelected = selectedItem?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelect(cat)}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors",
                      isSelected
                        ? "bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {cat.name}
                      </div>
                      {cat.description && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {cat.description}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
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
