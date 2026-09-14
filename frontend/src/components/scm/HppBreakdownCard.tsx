"use client";

import { useState } from "react";
import { Calculator, Pencil, Check } from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface HppBreakdown {
  autoCalculatedHpp: number;
  manualOverrideHpp?: number;
  effectiveHpp: number;
  poCount: number;
  lastCalculatedAt: string;
}

interface Props {
  productId: string;
  initialData?: HppBreakdown;
}

export function HppBreakdownCard({ productId, initialData }: Props) {
  const [data, setData] = useState<HppBreakdown | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [editing, setEditing] = useState(false);
  const [overrideValue, setOverrideValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchHpp = async () => {
    try {
      const res = await api.get<{ data: HppBreakdown }>(`/master/materials/${productId}/hpp-breakdown`);
      setData(res.data?.data ?? null);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-3">
        <Calculator className="w-4 h-4 animate-spin" />
        <span className="text-sm">Memuat HPP...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-sm text-muted-foreground p-3">
        Belum ada data HPP.
        <button onClick={fetchHpp} className="ml-2 text-primary hover:underline">Muat ulang</button>
      </div>
    );
  }

  const handleSave = async () => {
    const val = parseFloat(overrideValue.replace(/[^\d]/g, ""));
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    try {
      await api.patch(`/master/materials/${productId}`, { manualOverrideHpp: val });
      setData(prev => prev ? { ...prev, manualOverrideHpp: val, effectiveHpp: val } : null);
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const effective = data.manualOverrideHpp ?? data.autoCalculatedHpp;
  const isOverridden = !!data.manualOverrideHpp;

  return (
    <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">HPP Effective</span>
        <span className="text-lg font-bold text-emerald-500">{formatRupiah(effective)}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Auto (dari {data.poCount} PO):</span>
          <span>{formatRupiah(data.autoCalculatedHpp)}</span>
        </div>
        {isOverridden && (
          <div className="flex justify-between text-xs text-amber-500">
            <span>Override manual:</span>
            <span>{formatRupiah(data.manualOverrideHpp!)}</span>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={overrideValue}
            onChange={e => setOverrideValue(e.target.value)}
            placeholder={formatRupiah(effective).replace("Rp", "").trim()}
            className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setEditing(true); setOverrideValue(String(data.manualOverrideHpp ?? data.autoCalculatedHpp)); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
        >
          <Pencil className="w-3 h-3" /> Override manual
        </button>
      )}
    </div>
  );
}
