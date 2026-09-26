"use client";

import React from "react";
import { cn, formatRupiah } from "@/lib/utils";
import { DnaButton } from "../DnaButton";
import { Plus, Trash2, Check } from "lucide-react";

// ── Line Items Table ──
export interface DnaLineItem {
  id: string;
  itemId?: string;
  itemCode?: string;
  name?: string;
  itemName?: string;
  qty: number;
  unit: string;
  price?: number;
  unitPrice?: number;
  discount?: number;
  discountPercent?: number;
  isTaxable?: boolean;
  total?: number;
}

export function DnaLineItemsTable({
  items,
  onChange,
  onItemsChange,
  itemOptions,
  ppnRate,
  readOnly = false,
}: {
  items: DnaLineItem[];
  onChange?: (items: DnaLineItem[]) => void;
  onItemsChange?: (items: DnaLineItem[]) => void;
  itemOptions?: any[];
  ppnRate?: number;
  readOnly?: boolean;
}) {
  const triggerChange = (next: DnaLineItem[]) => {
    onChange?.(next);
    onItemsChange?.(next);
  };

  const handleAdd = () => {
    const newItem: DnaLineItem = {
      id: "line-" + Date.now(),
      name: "",
      qty: 1,
      unit: "pcs",
      price: 0,
      discount: 0,
      total: 0,
    };
    triggerChange([...items, newItem]);
  };

  const handleRemove = (index: number) => {
    triggerChange(items.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, field: keyof DnaLineItem, val: any) => {
    const next = [...items];
    const item = { ...next[index], [field]: val };
    item.total = (item.qty || 0) * (item.price || 0) - (item.discount || 0);
    next[index] = item;
    triggerChange(next);
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-left text-[12px]">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
          <tr>
            <th className="px-3 py-2.5">Item / Deskripsi</th>
            <th className="px-3 py-2.5 w-24">Kuantitas</th>
            <th className="px-3 py-2.5 w-20">Satuan</th>
            <th className="px-3 py-2.5 w-32">Harga Satuan</th>
            <th className="px-3 py-2.5 w-28">Diskon (Rp)</th>
            <th className="px-3 py-2.5 w-36 text-right">Total</th>
            {!readOnly && <th className="px-2 py-2.5 w-12 text-center" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td className="p-2">
                {readOnly ? (
                  <span className="font-medium text-slate-900">{item.name}</span>
                ) : (
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleChangeItem(idx, "name", e.target.value)}
                    placeholder="Nama barang / jasa"
                    className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2">
                {readOnly ? (
                  <span className="font-mono">{item.qty}</span>
                ) : (
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => handleChangeItem(idx, "qty", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-[12px] font-mono border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2">
                {readOnly ? (
                  <span>{item.unit}</span>
                ) : (
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => handleChangeItem(idx, "unit", e.target.value)}
                    className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2">
                {readOnly ? (
                  <span className="font-mono">{formatRupiah(item.price || item.unitPrice || 0)}</span>
                ) : (
                  <input
                    type="number"
                    value={item.price ?? item.unitPrice ?? 0}
                    onChange={(e) => handleChangeItem(idx, "price", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-[12px] font-mono border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2">
                {readOnly ? (
                  <span className="font-mono">{formatRupiah(item.discount || 0)}</span>
                ) : (
                  <input
                    type="number"
                    value={item.discount || 0}
                    onChange={(e) => handleChangeItem(idx, "discount", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-[12px] font-mono border border-slate-200 rounded-md"
                  />
                )}
              </td>
              <td className="p-2 text-right font-mono font-semibold text-slate-900">
                {formatRupiah(item.total || 0)}
              </td>
              {!readOnly && (
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <DnaButton variant="secondary" size="sm" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Baris
          </DnaButton>
          <div className="text-[13px] font-semibold text-slate-900 pr-3">
            Grand Total: {formatRupiah(items.reduce((acc, i) => acc + (i.total || 0), 0))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Workflow Bar ──
export interface DnaWorkflowStage {
  key: string;
  label: string;
  description?: string;
  status?: "completed" | "current" | "pending";
}

export interface DnaWorkflowBarProps {
  stages: DnaWorkflowStage[];
  currentStageKey?: string;
  currentStage?: string;
  onStageClick?: (stageKey: string) => void;
  isVoided?: boolean;
  isVoid?: boolean;
  voidReason?: string;
}

export function DnaWorkflowBar({
  stages,
  currentStageKey,
  currentStage,
  onStageClick,
  isVoided,
  isVoid,
  voidReason,
}: DnaWorkflowBarProps) {
  const activeKey = currentStageKey || currentStage;
  const voidActive = isVoided || isVoid;
  const activeIdx = stages.findIndex((s) => s.key === activeKey || s.label === activeKey);

  return (
    <div className="space-y-2">
      {voidActive && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded text-[10px]">
              Dibatalkan / Void
            </span>
            <span>{voidReason || "Dokumen / Work Order ini telah dibatalkan."}</span>
          </div>
        </div>
      )}
      <div className="flex items-center space-x-2 py-3 px-4 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        {stages.map((stage, idx) => {
          const isCurrent = activeIdx >= 0 ? idx === activeIdx : stage.status === "current";
          const isCompleted = activeIdx >= 0 ? idx < activeIdx : stage.status === "completed";
          return (
            <React.Fragment key={stage.key || idx}>
              <div
                onClick={() => onStageClick?.(stage.key)}
                className={cn(
                  "flex items-center space-x-2 shrink-0",
                  onStageClick && "cursor-pointer hover:opacity-80"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                    isCompleted && "bg-emerald-600 text-white",
                    isCurrent && !voidActive && "bg-blue-600 text-white ring-4 ring-blue-100",
                    isCurrent && voidActive && "bg-rose-600 text-white ring-4 ring-rose-100",
                    !isCompleted && !isCurrent && "bg-slate-100 text-slate-400"
                  )}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div>
                  <span
                    className={cn(
                      "text-[12px] block",
                      isCurrent ? "font-semibold text-blue-600" : "font-medium text-slate-700"
                    )}
                  >
                    {stage.label}
                  </span>
                  {stage.description && (
                    <span className="text-[10px] text-slate-400 block">{stage.description}</span>
                  )}
                </div>
              </div>
              {idx < stages.length - 1 && <div className="h-0.5 w-6 bg-slate-200 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
