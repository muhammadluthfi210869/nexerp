"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SectionLabel } from "@/components/dna";

export default function KpiPreviewPage() {
  return (
    <DashboardShell
      title="KPI Card"
      titleAccent="Design"
      subtitle="Opsi B — Full Color + VISUAL_DNA compliant. Underperform → Red, Stable → Dark, On Track → Green."
    >
      <style>{`
        @keyframes kpi-pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.25); }
          50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
        }
        @keyframes kpi-dot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .kpi-underperform {
          animation: kpi-pulse-border 2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .kpi-dot {
          animation: kpi-dot-pulse 1.5s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
      `}</style>

      <div className="space-y-12">

        {/* ── INFO BAR ── */}
        <div className="flex items-center gap-4">
          <div className="w-1 h-6 bg-slate-900 rounded-full flex-shrink-0" />
          <div className="flex-1 grid grid-cols-3 gap-8 text-[9px]">
            <div>
              <span className="text-section-label text-rose-700">Underperform</span>
              <span className="block font-bold text-rose-600 mt-0.5">&lt;70% target — Red Value + Border + Pulse</span>
            </div>
            <div>
              <span className="text-section-label text-slate-700">Stable</span>
              <span className="block font-bold text-slate-600 mt-0.5">70–99% target — Dark Value + Standard Border</span>
            </div>
            <div>
              <span className="text-section-label text-emerald-700">On Track</span>
              <span className="block font-bold text-emerald-600 mt-0.5">&ge;100% target — Green Value + Border</span>
            </div>
          </div>
        </div>

        {/* ═══════════ KPI CARDS — OPSI B (FULL COLOR) ═══════════ */}
        <div className="grid grid-cols-3 gap-8">
          {/* ── UNDERPERFORM (57%) ── */}
          <div className="bento-card bg-rose-50/20 border-rose-300 p-8 space-y-4 kpi-underperform">
            <SectionLabel>Revenue</SectionLabel>
            <p className="text-primary-value text-rose-600 tabular-nums">Rp 850 Jt</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: '57%' }} />
              </div>
              <span className="text-[9px] font-black text-rose-600 tabular-nums">57%</span>
            </div>
            <div className="bg-[#FEF9C3] border border-[#FEF08A] text-[#854D0E] rounded-[16px] p-3 text-[9px] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] kpi-dot flex-shrink-0" />
              43% below target — review needed
            </div>
            <span className="text-micro-label text-rose-500/60 block">Target: Rp 1.500.000.000</span>
          </div>

          {/* ── STABLE (83%) ── */}
          <div className="bento-card p-8 space-y-4">
            <SectionLabel>Revenue</SectionLabel>
            <p className="text-primary-value text-brand-black tabular-nums">Rp 1.25 M</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full transition-all duration-300" style={{ width: '83%' }} />
              </div>
              <span className="text-[9px] font-black text-slate-700 tabular-nums">83%</span>
            </div>
            <span className="text-micro-label text-slate-400 block">Target: Rp 1.500.000.000</span>
          </div>

          {/* ── ON TRACK (112%) ── */}
          <div className="bento-card bg-emerald-50/20 border-emerald-200 p-8 space-y-4">
            <SectionLabel>Revenue</SectionLabel>
            <p className="text-primary-value text-emerald-600 tabular-nums">Rp 1.68 M</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: '100%' }} />
              </div>
              <span className="text-[9px] font-black text-emerald-600 tabular-nums">112%</span>
            </div>
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] rounded-[16px] p-3 text-[9px] font-bold flex items-center gap-1.5">
              &uarr; 12% vs last month
            </div>
            <span className="text-micro-label text-emerald-500/60 block">Target: Rp 1.500.000.000</span>
          </div>
        </div>

        {/* ═══════════ KPI CARDS — SECOND ROW: PRODUCTION ═══════════ */}
        <SectionLabel>SECOND ROW — PRODUCTION KPIs</SectionLabel>

        <div className="grid grid-cols-3 gap-8">
          {/* ── UNDERPERFORM: OEE 62% ── */}
          <div className="bento-card bg-rose-50/20 border-rose-300 p-8 space-y-4 kpi-underperform">
            <SectionLabel>OEE</SectionLabel>
            <p className="text-primary-value text-rose-600 tabular-nums">62.4%</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '62%' }} />
              </div>
              <span className="text-[9px] font-black text-rose-600 tabular-nums">62%</span>
            </div>
            <div className="bg-[#FEF9C3] border border-[#FEF08A] text-[#854D0E] rounded-[16px] p-3 text-[9px] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] kpi-dot flex-shrink-0" />
              23% below target — machine downtime detected
            </div>
            <span className="text-micro-label text-rose-500/60 block">Target: 85%</span>
          </div>

          {/* ── STABLE: Yield 92.1% ── */}
          <div className="bento-card p-8 space-y-4">
            <SectionLabel>Yield Rate</SectionLabel>
            <p className="text-primary-value text-brand-black tabular-nums">92.1%</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '92%' }} />
              </div>
              <span className="text-[9px] font-black text-slate-700 tabular-nums">92%</span>
            </div>
            <span className="text-micro-label text-slate-400 block">Target: 98%</span>
          </div>

          {/* ── ON TRACK: Output 108% ── */}
          <div className="bento-card bg-emerald-50/20 border-emerald-200 p-8 space-y-4">
            <SectionLabel>Output</SectionLabel>
            <p className="text-primary-value text-emerald-600 tabular-nums">12,450 pcs</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-[9px] font-black text-emerald-600 tabular-nums">108%</span>
            </div>
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] rounded-[16px] p-3 text-[9px] font-bold flex items-center gap-1.5">
              &uarr; 8% above target — all shifts running optimal
            </div>
            <span className="text-micro-label text-emerald-500/60 block">Target: 11,500 pcs</span>
          </div>
        </div>

        {/* ═══════════ SPEC REFERENCE TABLE ═══════════ */}
        <div className="bento-card p-8 space-y-5">
          <SectionLabel>OPSI B — VISUAL_DNA SPEC CHECKLIST</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB] border-b">
                  <th className="text-table-header text-slate-400 px-6 py-6 w-48">Element</th>
                  <th className="text-table-header text-slate-400 px-6 py-6 w-48">VISUAL_DNA Standard</th>
                  <th className="text-table-header text-slate-400 px-6 py-6">Applied Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {[
                  { el: "Card Radius",         spec: "24px (Standard)",                        actual: "bento-card = var(--card-radius) = 24px" },
                  { el: "Card Padding",        spec: "2rem (Standard)",                         actual: "p-8 = 2rem" },
                  { el: "Card Border",         spec: "1px solid var(--border-color)",            actual: "Under=rose-300, Stable=s-200, On=emerald-200" },
                  { el: "Card Shadow",         spec: "0 4px 6px -1px rgba(0,0,0,0.02)",          actual: "bento-card CSS class" },
                  { el: "Grid Gap",            spec: "2rem macro (between large cards)",         actual: "gap-8 = 2rem" },
                  { el: "KPI Label",           spec: "Section Label: 10px / 800w / 0.3em / UPPER",  actual: "text-section-label" },
                  { el: "KPI Value",           spec: "Primary Value: 32px / 900w / -0.02em",       actual: "text-primary-value" },
                  { el: "Value Tabular",       spec: "tabular-nums on all numbers",                actual: "tabular-nums class" },
                  { el: "Target Label",        spec: "Micro Label: 9px / 900w / 0.1em / UPPER",    actual: "text-micro-label" },
                  { el: "Progress Bar",        spec: "4px height",                               actual: "h-1 (4px)" },
                  { el: "Underperform Value",  spec: "Opsi B — Red colored value",               actual: "text-rose-600" },
                  { el: "On Track Value",      spec: "Opsi B — Green colored value",             actual: "text-emerald-600" },
                  { el: "Stable Value",        spec: "Opsi B — Dark colored value",              actual: "text-brand-black (#111827)" },
                  { el: "Underperform BG",     spec: "Subtle tint, not violating card-surface",   actual: "bg-rose-50/20 (20% opacity)" },
                  { el: "On Track BG",         spec: "Subtle tint",                              actual: "bg-emerald-50/20 (20% opacity)" },
                  { el: "Owner Insight (Red)", spec: "Warning: #FEF9C3 bg, #FEF08A border",      actual: "bg-[#FEF9C3] border-[#FEF08A] text-[#854D0E]" },
                  { el: "Owner Insight (Grn)", spec: "Success: #F0FDF4 bg, #DCFCE7 border",      actual: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]" },
                  { el: "Pulse Animation",     spec: "150-500ms scale (institutional ease)",      actual: "2s, cubic-bezier(0.22,1,0.36,1)" },
                  { el: "Red Dot Indicator",   spec: "7px dot with shadow + pulse",              actual: "w-1.5 h-1.5 rounded-full + pulse" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="text-[11px] font-bold text-slate-700 px-6 py-5">{row.el}</td>
                    <td className="text-[11px] font-bold text-slate-500 px-6 py-5">{row.spec}</td>
                    <td className="text-[11px] font-bold text-slate-500 px-6 py-5">{row.actual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
