"use client";

import { cn } from "@/lib/utils";
import { TableWrapper, SectionLabel, DnaBadge } from "@/components/dna";

export function AuditTables({ audit }: { audit: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🧪 III.A AUDIT GRANULAR BAHAN BAKU */}
        <div className="space-y-4">
          <SectionLabel as="h3">🧪 III.A AUDIT GRANULAR BAHAN BAKU (SENSITIF & FEFO)</SectionLabel>
          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-table-header text-slate-400">NAMA MATERIAL / MASUK</th>
                    <th className="px-6 py-4 text-table-header text-slate-400 text-right">QTY (AV/BK)</th>
                    <th className="px-6 py-4 text-table-header text-slate-400 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {audit?.sensitiveMaterials?.map((inv: any, i: number) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{inv.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{inv.date}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-[12px] font-black text-brand-black tabular">{inv.qty}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <DnaBadge status={inv.status === 'FEFO_OK' ? 'success' : 'warning'}>{inv.status}</DnaBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </div>

        {/* 📦 III.B AUDIT GRANULAR BAHAN KEMAS */}
        <div className="space-y-4">
          <SectionLabel as="h3">📦 III.B AUDIT GRANULAR BAHAN KEMAS (DEGRADASI & STOK)</SectionLabel>
          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-table-header text-slate-400">NAMA KEMASAN / TIPE</th>
                    <th className="px-6 py-4 text-table-header text-slate-400 text-right">QTY (AV/BK)</th>
                    <th className="px-6 py-4 text-table-header text-slate-400 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {audit?.packagingStocks?.map((inv: any, i: number) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{inv.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">STOCK AUDIT</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-[12px] font-black text-brand-black tabular">{inv.qty}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <DnaBadge status={inv.status === 'STABLE' ? 'success' : 'critical'}>{inv.status}</DnaBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🧾 III.C SO FULFILLMENT */}
        <div className="space-y-4">
          <SectionLabel as="h3">🧾 III.C PEMENUHAN PESANAN (SO FULFILLMENT)</SectionLabel>
          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-table-header text-slate-400">CLIENT / NO. SO</th>
                    <th className="px-6 py-4 text-table-header text-slate-400 text-center">COMPLETION</th>
                    <th className="px-6 py-4 text-table-header text-slate-400 text-right">PROGRESS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {audit?.soFulfillment?.map((so: any, i: number) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{so.client}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{so.so}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <DnaBadge status={so.status === 'FULL' ? 'success' : 'warning'}>{so.status}</DnaBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "text-[12px] font-black tabular",
                            so.var < 0 ? 'text-rose-500' : 'text-emerald-500'
                          )}>{so.var > 0 ? `+${so.var}` : so.var}</span>
                          <span className="text-[10px] font-black text-blue-600">{so.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </div>

        {/* ⚠️ III.D AUDIT RISIKO & KERUGIAN */}
        <div className="space-y-4">
          <SectionLabel as="h3">⚠️ III.D AUDIT RISIKO & KERUGIAN (NON-SELLABLE)</SectionLabel>
          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-rose-50/50 border-b border-rose-100">
                    <th className="px-6 py-4 text-table-header text-rose-800">ITEM & SUMBER</th>
                    <th className="px-6 py-4 text-table-header text-rose-800">DETAIL AUDIT</th>
                    <th className="px-6 py-4 text-table-header text-rose-800 text-right">LOSS IMPACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {audit?.riskLoss?.map((risk: any, i: number) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-all cursor-default">
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-rose-600 transition-colors">{risk.item}</p>
                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">{risk.source}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{risk.detail}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-[12px] font-black text-rose-600 tabular italic">{risk.impact}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase">ACTION: {risk.action}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </div>
      </div>
    </div>
  );
}
