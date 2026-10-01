"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, DnaButton, DnaInput } from "@/components/dna";
import type { SalesMember } from "../_types/crm-leads.types";

interface SalesConfigTabProps {
  salesLoading: boolean;
  editedSales: SalesMember[];
  isSavingSales: boolean;
  onSalesFieldChange: (index: number, field: keyof SalesMember, value: any) => void;
  onToggleSales: (index: number) => void;
  onSaveSalesConfig: () => void;
  onResetRotation: () => void;
}

export function SalesConfigTab({
  salesLoading,
  editedSales,
  isSavingSales,
  onSalesFieldChange,
  onToggleSales,
  onSaveSalesConfig,
  onResetRotation,
}: SalesConfigTabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">
            Cara Kerja Rotasi Server-Side Round-Robin:
          </h4>
          <p className="text-xs text-blue-600 mt-1 leading-relaxed">
            Setiap lead baru yang masuk dari formulir landing page akan dialokasikan secara bergilir ke sales WhatsApp yang berstatus aktif.
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pengaturan WhatsApp Sales</h3>
            <p className="text-xs text-slate-500">Kelola nomor telepon WhatsApp dan keaktifan sales</p>
          </div>
          <DnaButton
            variant="outline"
            onClick={onResetRotation}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Reset Counter
          </DnaButton>
        </div>

        <div className="p-5 space-y-4">
          {salesLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading data sales...</div>
          ) : (
            editedSales.map((member, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-slate-50/50 border border-slate-100 p-4 rounded-xl"
              >
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Sales</label>
                  <DnaInput
                    value={member.name}
                    onChange={(e) => onSalesFieldChange(i, "name", e.target.value)}
                    placeholder="Nama"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp (62...)</label>
                  <DnaInput
                    type="tel"
                    value={member.phone}
                    onChange={(e) => onSalesFieldChange(i, "phone", e.target.value.replace(/\D/g, ""))}
                    placeholder="62812..."
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                  <button
                    onClick={() => onToggleSales(i)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      member.active
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {member.active ? "â— Aktif Bertugas" : "â—‹ Cuti / Off"}
                  </button>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  {member.phone.startsWith("62") ? (
                    <span className="text-emerald-600 font-bold">âœ“ Valid (62)</span>
                  ) : (
                    <span className="text-rose-500 font-bold">âš ï¸ Gunakan 62</span>
                  )}
                </div>
              </div>
            ))
          )}

          {!salesLoading && (
            <div className="pt-2 flex justify-end">
              <DnaButton
                variant="primary"
                onClick={onSaveSalesConfig}
                disabled={isSavingSales}
              >
                {isSavingSales ? "Menyimpan..." : "Simpan Konfigurasi"}
              </DnaButton>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
