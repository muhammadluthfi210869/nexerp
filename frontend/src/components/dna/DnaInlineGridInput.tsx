"use client";

import React, { useRef, useEffect } from "react";
import { Plus, Trash2, Calculator, AlertCircle } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

export interface InlineGridColumn<T = any> {
  key: keyof T | string;
  header: string;
  type?: "text" | "number" | "select" | "custom";
  width?: string;
  placeholder?: string;
  align?: "left" | "center" | "right";
  readOnly?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  render?: (row: T, index: number, onChange: (val: any) => void) => React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
}

export interface DnaInlineGridInputProps<T = any> {
  columns: InlineGridColumn<T>[];
  rows: T[];
  onChangeRows: (newRows: T[]) => void;
  onAddRow: () => void;
  emptyRowTemplate?: () => T;
  calcRowTotal?: (row: T) => number;
  taxRatePercent?: number; // e.g. 11 for PPN 11%
  globalDiscountAmount?: number;
  additionalCostAmount?: number;
  currencySymbol?: string;
  maxRows?: number;
  title?: string;
  isReadOnly?: boolean;
}

export function DnaInlineGridInput<T extends Record<string, any>>({
  columns,
  rows,
  onChangeRows,
  onAddRow,
  emptyRowTemplate,
  calcRowTotal,
  taxRatePercent = 0,
  globalDiscountAmount = 0,
  additionalCostAmount = 0,
  currencySymbol = "Rp",
  maxRows = 100,
  title = "Rincian Item Transaksi",
  isReadOnly = false,
}: DnaInlineGridInputProps<T>) {
  const tableRef = useRef<HTMLTableElement>(null);

  const handleCellChange = (rowIndex: number, columnKey: string, value: any) => {
    const updated = [...rows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [columnKey]: value,
    };
    onChangeRows(updated);
  };

  const handleDeleteRow = (indexToDelete: number) => {
    if (rows.length <= 1) {
      if (emptyRowTemplate) {
        onChangeRows([emptyRowTemplate()]);
      }
      return;
    }
    onChangeRows(rows.filter((_, idx) => idx !== indexToDelete));
  };

  // Keyboard navigation: pressing Tab on last cell of last row adds a new row
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const isLastCol = colIndex === columns.length - 1;
      const isLastRow = rowIndex === rows.length - 1;
      if (isLastCol && isLastRow && !isReadOnly && rows.length < maxRows) {
        e.preventDefault();
        onAddRow();
        setTimeout(() => {
          // Focus the first input of the newly created row
          const table = tableRef.current;
          if (table) {
            const inputs = table.querySelectorAll<HTMLInputElement>("input, select");
            if (inputs.length > 0) {
              const lastRowInputs = Array.from(inputs).slice(-columns.length);
              lastRowInputs[0]?.focus();
            }
          }
        }, 50);
      }
    }
  };

  // Financial calculations
  const subtotal = rows.reduce((acc, row) => {
    if (calcRowTotal) return acc + (calcRowTotal(row) || 0);
    const qty = Number(row.qty || row.targetQty || row.target || 0);
    const price = Number(row.price || row.unitPrice || row.hpp || 0);
    const disc = Number(row.discount || 0);
    return acc + Math.max(0, qty * price - disc);
  }, 0);

  const taxableAmount = Math.max(0, subtotal - globalDiscountAmount);
  const taxAmount = (taxableAmount * taxRatePercent) / 100;
  const grandTotal = taxableAmount + taxAmount + additionalCostAmount;

  return (
    <div className="space-y-3">
      {/* ── HEADER WITH ROW COUNT & ADD BUTTON ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-800 text-[12px] uppercase tracking-wider">
            {title}
          </h4>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 tabular-nums">
            {rows.length} Baris
          </span>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={onAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11.5px] font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris (Tab di baris akhir)</span>
          </button>
        )}
      </div>

      {/* ── SPREADSHEET TABLE GRID ── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full text-left border-collapse text-[11.5px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold tracking-wider text-[10.5px]">
                <th className="p-2.5 w-10 text-center border-r border-slate-200 text-slate-400">#</th>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    style={{ width: col.width }}
                    className={cn(
                      "p-2.5 border-r border-slate-200 last:border-r-0 whitespace-nowrap",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      (!col.align || col.align === "left") && "text-left"
                    )}
                  >
                    {col.header}
                  </th>
                ))}
                {calcRowTotal && (
                  <th className="p-2.5 w-32 text-right border-r border-slate-200 whitespace-nowrap">
                    TOTAL (RP)
                  </th>
                )}
                {!isReadOnly && (
                  <th className="p-2.5 w-12 text-center text-slate-400">HAPUS</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, rowIdx) => {
                const rowTotal = calcRowTotal ? calcRowTotal(row) : null;
                return (
                  <tr key={rowIdx} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="p-2 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100 bg-slate-50/40">
                      {rowIdx + 1}
                    </td>

                    {columns.map((col, colIdx) => {
                      const val = row[col.key as string] ?? "";

                      if (col.render) {
                        return (
                          <td
                            key={String(col.key)}
                            className="p-1.5 border-r border-slate-100"
                          >
                            {col.render(row, rowIdx, (v) =>
                              handleCellChange(rowIdx, col.key as string, v)
                            )}
                          </td>
                        );
                      }

                      if (col.type === "select" && col.options) {
                        return (
                          <td
                            key={String(col.key)}
                            className="p-1 border-r border-slate-100"
                          >
                            <select
                              disabled={isReadOnly || col.readOnly}
                              value={val}
                              onChange={(e) =>
                                handleCellChange(rowIdx, col.key as string, e.target.value)
                              }
                              onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                              className="w-full h-8 px-2 bg-transparent focus:bg-white border border-transparent focus:border-blue-500 rounded-lg text-[11.5px] outline-none"
                            >
                              <option value="">Pilih...</option>
                              {col.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={String(col.key)}
                          className="p-1 border-r border-slate-100"
                        >
                          <input
                            type={col.type === "number" ? "number" : "text"}
                            disabled={isReadOnly || col.readOnly}
                            value={val}
                            placeholder={col.placeholder}
                            min={col.min}
                            max={col.max}
                            step={col.step}
                            onChange={(e) =>
                              handleCellChange(
                                rowIdx,
                                col.key as string,
                                col.type === "number"
                                  ? e.target.value === "" ? 0 : Number(e.target.value)
                                  : e.target.value
                              )
                            }
                            onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                            className={cn(
                              "w-full h-8 px-2 bg-transparent focus:bg-white border border-transparent focus:border-blue-500 rounded-lg text-[11.5px] outline-none transition-all",
                              col.align === "right" && "text-right tabular-nums",
                              col.align === "center" && "text-center",
                              col.readOnly && "bg-slate-50/50 cursor-not-allowed font-medium text-slate-600"
                            )}
                          />
                        </td>
                      );
                    })}

                    {calcRowTotal && (
                      <td className="p-2 text-right font-bold text-slate-900 tabular-nums border-r border-slate-100">
                        {formatRupiah(rowTotal || 0)}
                      </td>
                    )}

                    {!isReadOnly && (
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rowIdx)}
                          title="Hapus Baris"
                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FINANCIAL SUMMARY CARD (SUBTOTAL, TAX, GRAND TOTAL) ── */}
      <div className="flex justify-end pt-1">
        <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-[11.5px]">
          <div className="flex justify-between items-center text-slate-600">
            <span>Subtotal:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {formatRupiah(subtotal)}
            </span>
          </div>

          {globalDiscountAmount > 0 && (
            <div className="flex justify-between items-center text-slate-600">
              <span>Diskon Global:</span>
              <span className="font-bold text-rose-600 tabular-nums">
                - {formatRupiah(globalDiscountAmount)}
              </span>
            </div>
          )}

          {taxRatePercent > 0 && (
            <div className="flex justify-between items-center text-slate-600">
              <span>PPN ({taxRatePercent}%):</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {formatRupiah(taxAmount)}
              </span>
            </div>
          )}

          {additionalCostAmount > 0 && (
            <div className="flex justify-between items-center text-slate-600">
              <span>Biaya Tambahan / Ongkir:</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {formatRupiah(additionalCostAmount)}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-300 flex justify-between items-center font-black text-[13px] text-slate-900">
            <span>Grand Total:</span>
            <span className="text-blue-700 tabular-nums">
              {formatRupiah(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
