'use client';

import React, { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useDigimarAll, useDigimarSocket } from './hooks/useDigimar';
import { SummaryCards } from './components/SummaryCards';
import { PaidAdsTable } from './components/PaidAdsTable';
import { CpaChart } from './components/CpaChart';
import { InstagramSection } from './components/InstagramSection';
import { TikTokSection } from './components/TikTokSection';
import { BestContentTable } from './components/BestContentTable';
import { CalendarView } from './components/CalendarView';
import { QueryLoading } from '@/components/query-states';

export function ToribioDashboardClient() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const { data, isLoading, error } = useDigimarAll(
    selectedMonth !== 'all' ? selectedMonth : undefined
  );

  // WebSocket real-time
  useDigimarSocket(selectedMonth !== 'all' ? selectedMonth : undefined);

  // Loading state
  if (isLoading) {
    return (
      <DashboardShell
        title="Toribio Digital Marketing"
        subtitle="Loading dashboard..."
      >
        <div className="flex items-center justify-center h-64">
          <QueryLoading />
        </div>
      </DashboardShell>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardShell
        title="Toribio Digital Marketing"
        subtitle="Dashboard tidak tersedia"
      >
        <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[20px] p-6 text-center">
          <p className="text-[#DC2626] font-black text-[11px] uppercase tracking-[0.14em]">Gagal memuat data dashboard</p>
          <p className="text-sm text-[#DC2626] mt-1 opacity-70">
            Pastikan backend menyala dan Google Sheet bisa diakses
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-6 py-2.5 bg-[#DC2626] text-white rounded-[12px] text-[10px] font-black uppercase tracking-[0.1em] hover:bg-[#B91C1C] transition"
          >
            Coba Lagi
          </button>
        </div>
      </DashboardShell>
    );
  }

  // Empty state
  if (!data) {
    return (
      <DashboardShell
        title="Toribio Digital Marketing"
        subtitle="Belum ada data"
      >
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-[11px] font-black uppercase tracking-[0.2em]">Belum ada data untuk ditampilkan</p>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] mt-2 opacity-60">Isi Google Sheet terlebih dahulu</p>
        </div>
      </DashboardShell>
    );
  }

  const { summary, weekly, paidAds, content, months } = data;

  return (
    <DashboardShell
      title="Toribio Digital Marketing"
      subtitle="Real-time dashboard dari Google Sheet"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-[11px] font-semibold border border-gray-200 rounded-[12px] px-4 py-2 bg-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Semua Bulan</option>
            {months?.map((m: string) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#059669] bg-[#ECFDF5] px-3 py-1.5 rounded-[8px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
            Auto-refresh
          </span>
        </div>
      }
    >
      {/* ── Summary Cards — 3 atas + 2 bawah ── */}
      <section className="rounded-[24px] border border-gray-100 bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">Ringkasan</p>
        <div className="space-y-5">
          <SummaryCards
            paidAds={paidAds}
            igTracker={summary?.instagram}
            ttTracker={summary?.tiktok}
            selectedMonth={selectedMonth}
          />
        </div>
      </section>

      {/* ── Paid Ads + CPA Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-[24px] border border-gray-100 bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">Paid Ads</p>
          <PaidAdsTable rows={paidAds?.rows || []} />
        </section>
        <section className="rounded-[24px] border border-gray-100 bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">CPA per Bulan</p>
          <CpaChart rows={paidAds?.rows || []} />
        </section>
      </div>

      {/* ── Instagram ── */}
      <section className="rounded-[24px] border border-gray-100 bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Instagram</p>
        </div>
        <InstagramSection
          tracker={summary?.instagram || []}
          storiesKpi={summary?.storiesKpi?.instagram || []}
          weekly={weekly?.rows || []}
          bestContent={content?.bestContent || []}
        />
      </section>

      {/* ── TikTok ── */}
      <section className="rounded-[24px] border border-gray-100 bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#111827]" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">TikTok</p>
        </div>
        <TikTokSection
          tracker={summary?.tiktok || []}
          storiesKpi={summary?.storiesKpi?.tiktok || []}
          weekly={weekly?.rows || []}
          bestContent={content?.bestContent || []}
        />
      </section>

      {/* ── Best Content ── */}
      <section className="rounded-[24px] border border-gray-100 bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">🔥 Best Performing Content</p>
        <BestContentTable rows={content?.rows || []} />
      </section>

      {/* ── Calendar View ── */}
      <section className="rounded-[24px] border border-gray-100 bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">📅 Content Calendar</p>
        <CalendarView rows={content?.rows || []} />
      </section>
    </DashboardShell>
  );
}
