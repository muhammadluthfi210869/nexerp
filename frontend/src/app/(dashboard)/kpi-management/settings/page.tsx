"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Plus,
  ShieldAlert,
  Search,
  CheckCircle2,
  Lock,
  Edit3,
  Calendar
} from "lucide-react";
import { MOCK_SETTINGS_CONFIG } from "@/components/kpi-management/mock-data";
import { KpiNavTabs } from "@/components/kpi-management/KpiManagementComponents";
import { KPISettingsConfig } from "@/types/kpi-management";

export default function KpiSettingsPage() {
  const [configs, setConfigs] = useState<KPISettingsConfig[]>(MOCK_SETTINGS_CONFIG);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConfigs = configs.filter((c) =>
    c.kpiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
              KPI Target & Formula Configuration
            </h1>
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3" /> AUTHORIZED ONLY
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1">
            Pengaturan definisi KPI, bobot, target per periode, dan batas kontribusi maksimal ter-efektifkan.
          </p>
        </div>

        <button
          onClick={() => alert("Modal Konfigurasi KPI Baru dapat dikoneksikan ke backend API.")}
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Definisi KPI</span>
        </button>
      </div>

      {/* ── 2. ROUTE TABS ── */}
      <KpiNavTabs />

      {/* ── 3. NOTICE BANNER ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block">Aturan Pengubahan Target & Bobot KPI:</strong>
          <span>
            Setiap perubahan target dan formula bersifat <em>effective-dated</em> (berlaku mulai tanggal efektif tertentu) dan <strong>tidak akan mengubah data historis</strong> pencapaian KPI periode sebelumnya.
          </span>
        </div>
      </div>

      {/* ── 4. FILTER BAR ── */}
      <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari definisi KPI atau divisi..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      {/* ── 5. CONFIGURATION TABLE ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500" /> Matriks Konfigurasi KPI Aktif
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Total {filteredConfigs.length} Konfigurasi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Nama KPI</th>
                <th className="px-4 py-3">Departemen</th>
                <th className="px-4 py-3">Formulasi</th>
                <th className="px-4 py-3 text-center">Target</th>
                <th className="px-4 py-3 text-center">Bobot (%)</th>
                <th className="px-4 py-3 text-center">Min Threshold</th>
                <th className="px-4 py-3 text-center">Max Cap Contribution</th>
                <th className="px-4 py-3">Berlaku Mulai</th>
                <th className="px-4 py-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredConfigs.map((cfg) => (
                <tr key={cfg.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{cfg.kpiName}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{cfg.departmentName}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">{cfg.calcType}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">{cfg.target} {cfg.unit}</td>
                  <td className="px-4 py-3 text-center font-bold font-mono text-blue-700">{cfg.weight}%</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600">{cfg.minThreshold}%</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">{cfg.maxContribution}%</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{cfg.effectiveFrom}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert(`Edit konfigurasi KPI ${cfg.kpiName}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
