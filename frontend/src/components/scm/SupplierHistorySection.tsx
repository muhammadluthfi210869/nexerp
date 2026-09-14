"use client";

import React, { useState, useEffect } from "react";
import { Building2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface SupplierHistoryItem {
  supplierId: string;
  supplierName: string;
  firstSeenAt: string;
  lastPurchaseAt?: string;
  totalQtyPurchased: number;
}

interface Props {
  materialId: string;
}

export function SupplierHistorySection({ materialId }: Props) {
  const [history, setHistory] = useState<SupplierHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!materialId) return;
    setLoading(true);
    api.get(`/master/materials/${materialId}/supplier-history`)
      .then((res) => {
        setHistory(Array.isArray(res.data) ? res.data : res.data?.data || []);
      })
      .catch(() => {
        // silent fail
      })
      .finally(() => setLoading(false));
  }, [materialId]);

  if (loading) {
    return (
      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          Riwayat Supplier
        </div>
        <p className="text-xs text-slate-400 italic">Memuat...</p>
      </div>
    );
  }

  if (history.length === 0) return null;

  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
      <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5" />
        Riwayat Supplier
      </div>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.supplierId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{h.supplierName}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {h.lastPurchaseAt ? `Terakhir: ${h.lastPurchaseAt}` : `Pertama: ${h.firstSeenAt}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400">{h.totalQtyPurchased.toLocaleString("id-ID")}x</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
