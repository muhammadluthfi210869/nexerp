"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SectionLabel } from "@/components/dna";

export default function KpiPreviewPage() {
  return (
    <DashboardShell
      title="KPI Card"
      titleAccent="Design"
      subtitle="3 opsi visual untuk KPI threshold indicator — border, warna, dan glow."
    >
      <style>{`
        @keyframes kpi-pulse-a {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.25); }
          50% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
        }
        @keyframes kpi-pulse-b {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3); }
          50% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
        }
        @keyframes kpi-pulse-c {
          0%, 100% { box-shadow: inset 0 0 0 0 rgba(220, 38, 38, 0.06); }
          50% { box-shadow: inset 0 0 0 2px rgba(220, 38, 38, 0.12); }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div className="space-y-12">

        {/* ── INFO BANNER ── */}
        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 grid grid-cols-3 gap-8 text-[10px]">
          <div>
            <p className="font-black text-slate-700 uppercase tracking-widest mb-1">Underperform</p>
            <p className="font-bold text-rose-600">&lt; 70% target → Red + Pulse</p>
          </div>
          <div>
            <p className="font-black text-slate-700 uppercase tracking-widest mb-1">Stable</p>
            <p className="font-bold text-slate-900">70% – 99% target → Dark / Neutral</p>
          </div>
          <div>
            <p className="font-black text-slate-700 uppercase tracking-widest mb-1">On Track</p>
            <p className="font-bold text-emerald-600">≥ 100% target → Green</p>
          </div>
        </div>

        {/* ═══════════════════ OPSI A ═══════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 bg-blue-600 rounded-full" />
            <div>
              <SectionLabel>OPSI A: BORDER-ONLY (RECOMMENDED)</SectionLabel>
              <p className="text-[9px] font-bold text-slate-400">Value tetap hitam. Border + indicator dot sebagai sinyal. Insight muncul hanya saat underperform.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* UNDER */}
            <div className="bg-white border border-rose-300 rounded-[24px] p-6 space-y-3" style={{ animation: 'kpi-pulse-a 2s ease-in-out infinite' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Revenue</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" style={{ animation: 'dot-pulse 1.5s ease-in-out infinite' }} />
              </div>
              <p className="text-[32px] font-black tracking-[-0.02em] text-[#111827] tabular">Rp 850 Jt</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: '57%' }} />
                </div>
                <span className="text-[9px] font-black text-rose-600 tabular">57%</span>
              </div>
              <p className="text-[9px] font-bold text-rose-600 flex items-center gap-1">⚠ 43% below target — review needed</p>
              <p className="text-[8px] font-bold text-slate-400 tracking-tight">Target: Rp 1.5 M</p>
            </div>

            {/* STABLE */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Revenue</span>
              </div>
              <p className="text-[32px] font-black tracking-[-0.02em] text-[#111827] tabular">Rp 1.25 M</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 rounded-full" style={{ width: '83%' }} />
                </div>
                <span className="text-[9px] font-black text-slate-700 tabular">83%</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400">Target: Rp 1.5 M</p>
            </div>

            {/* ON TRACK */}
            <div className="bg-white border border-emerald-200 rounded-[24px] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Revenue</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[32px] font-black tracking-[-0.02em] text-[#111827] tabular">Rp 1.68 M</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-[9px] font-black text-emerald-600 tabular">112%</span>
              </div>
              <p className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">↑ 12% vs last month</p>
              <p className="text-[8px] font-bold text-slate-400">Target: Rp 1.5 M</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════ OPSI B ═══════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 bg-amber-500 rounded-full" />
            <div>
              <SectionLabel>OPSI B: FULL COLOR</SectionLabel>
              <p className="text-[9px] font-bold text-slate-400">Value + border + background semuanya berwarna. Paling mencolok — cocok untuk alert-critical.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* UNDER */}
            <div className="bg-rose-50/70 border border-rose-300 rounded-[24px] p-6 space-y-3" style={{ animation: 'kpi-pulse-b 2s ease-in-out infinite' }}>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-700">Revenue</span>
              <p className="text-[32px] font-black tracking-[-0.02em] text-rose-600 tabular">Rp 850 Jt</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-rose-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '57%' }} />
                </div>
                <span className="text-[9px] font-black text-rose-600 tabular">57%</span>
              </div>
              <p className="text-[9px] font-bold text-rose-600">⚠ 43% below target</p>
              <p className="text-[8px] font-bold text-rose-500/70">Target: Rp 1.5 M</p>
            </div>

            {/* STABLE */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Revenue</span>
              <p className="text-[32px] font-black tracking-[-0.02em] text-slate-900 tabular">Rp 1.25 M</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 rounded-full" style={{ width: '83%' }} />
                </div>
                <span className="text-[9px] font-black text-slate-700 tabular">83%</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400">Target: Rp 1.5 M</p>
            </div>

            {/* ON TRACK */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-[24px] p-6 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Revenue</span>
              <p className="text-[32px] font-black tracking-[-0.02em] text-emerald-600 tabular">Rp 1.68 M</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-[9px] font-black text-emerald-600 tabular">112%</span>
              </div>
              <p className="text-[9px] font-bold text-emerald-600">↑ 12% vs last month</p>
              <p className="text-[8px] font-bold text-emerald-500/70">Target: Rp 1.5 M</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════ OPSI C ═══════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 bg-purple-500 rounded-full" />
            <div>
              <SectionLabel>OPSI C: SUBTLE GLOW</SectionLabel>
              <p className="text-[9px] font-bold text-slate-400">Background tipis berwarna + border subtle. Value hitam tetap readable. Paling premium.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* UNDER */}
            <div className="bg-rose-50/30 border border-rose-200 rounded-[24px] p-6 space-y-3" style={{ animation: 'kpi-pulse-c 2s ease-in-out infinite' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-700">Revenue</span>
                <span className="w-2 h-2 rounded-full bg-rose-400" style={{ animation: 'dot-pulse 1.5s ease-in-out infinite' }} />
              </div>
              <p className="text-[32px] font-black tracking-[-0.02em] text-[#111827] tabular">Rp 850 Jt</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-rose-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: '57%' }} />
                </div>
                <span className="text-[9px] font-black text-rose-600 tabular">57%</span>
              </div>
              <p className="text-[9px] font-bold text-rose-600">⚠ 43% below target</p>
              <p className="text-[8px] font-bold text-rose-500/60">Target: Rp 1.5 M</p>
            </div>

            {/* STABLE */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Revenue</span>
              <p className="text-[32px] font-black tracking-[-0.02em] text-[#111827] tabular">Rp 1.25 M</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 rounded-full" style={{ width: '83%' }} />
                </div>
                <span className="text-[9px] font-black text-slate-700 tabular">83%</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400">Target: Rp 1.5 M</p>
            </div>

            {/* ON TRACK */}
            <div className="bg-emerald-50/30 border border-emerald-200 rounded-[24px] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Revenue</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[32px] font-black tracking-[-0.02em] text-[#111827] tabular">Rp 1.68 M</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-emerald-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-[9px] font-black text-emerald-600 tabular">112%</span>
              </div>
              <p className="text-[9px] font-bold text-emerald-600">↑ 12% vs last month</p>
              <p className="text-[8px] font-bold text-emerald-500/60">Target: Rp 1.5 M</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════ PERBANDINGAN ═══════════════════ */}
        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 space-y-5">
          <SectionLabel>PERBANDINGAN OPSI</SectionLabel>
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-table-header text-slate-400 pb-3 w-32">Aspek</th>
                <th className="text-table-header text-slate-400 pb-3">Opsi A — Border Only</th>
                <th className="text-table-header text-slate-400 pb-3">Opsi B — Full Color</th>
                <th className="text-table-header text-slate-400 pb-3">Opsi C — Subtle Glow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="py-3 font-black text-slate-700 uppercase tracking-widest pr-4">Value Color</td><td className="py-3 font-bold text-slate-600">Always black (#111827)</td><td className="py-3 font-bold text-slate-600">Red / Dark / Green</td><td className="py-3 font-bold text-slate-600">Always black (#111827)</td></tr>
              <tr><td className="py-3 font-black text-slate-700 uppercase tracking-widest pr-4">Underperform</td><td className="py-3 font-bold text-slate-600">Border rose-300 + pulse</td><td className="py-3 font-bold text-slate-600">Border + bg + value red</td><td className="py-3 font-bold text-slate-600">Bg rose-50/30 + border subtle</td></tr>
              <tr><td className="py-3 font-black text-slate-700 uppercase tracking-widest pr-4">On Track</td><td className="py-3 font-bold text-slate-600">Border emerald-200 + green dot</td><td className="py-3 font-bold text-slate-600">Border + bg + value green</td><td className="py-3 font-bold text-slate-600">Bg emerald-50/30 + green dot</td></tr>
              <tr><td className="py-3 font-black text-slate-700 uppercase tracking-widest pr-4">Stable</td><td className="py-3 font-bold text-slate-600">No indicator, clean look</td><td className="py-3 font-bold text-slate-600">No indicator, clean look</td><td className="py-3 font-bold text-slate-600">No indicator, clean look</td></tr>
              <tr><td className="py-3 font-black text-slate-700 uppercase tracking-widest pr-4">Alert Level</td><td className="py-3 font-bold text-slate-600">Subtle — professional</td><td className="py-3 font-bold text-slate-600">Striking — urgent feel</td><td className="py-3 font-bold text-slate-600">Minimal — premium feel</td></tr>
              <tr><td className="py-3 font-black text-slate-700 uppercase tracking-widest pr-4">Readability</td><td className="py-3 font-bold text-slate-600">⭐⭐⭐</td><td className="py-3 font-bold text-slate-600">⭐⭐</td><td className="py-3 font-bold text-slate-600">⭐⭐⭐</td></tr>
              <tr><td className="py-3 font-black text-slate-700 uppercase tracking-widest pr-4">Color Coding Code</td><td className="py-3 font-mono text-[9px] text-slate-600">border-rose-300 + dot</td><td className="py-3 font-mono text-[9px] text-slate-600">bg-rose-50 + value rose-600</td><td className="py-3 font-mono text-[9px] text-slate-600">bg-rose-50/30 + dot</td></tr>
            </tbody>
          </table>
        </div>

      </div>
    </DashboardShell>
  );
}
