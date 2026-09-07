"use client";

/**
 * MasterPageShell — Reusable shell for consolidated master pages
 *
 * Per user feedback (Batch 6.3): legacy ERP punya Gudang + Kelola Gudang
 * as 2 separate pages. Kita consolidated jadi 1 page dengan 2 tabs:
 *   - Tab 1: DAFTAR (list view, read-only)
 *   - Tab 2: KELOLA (CRUD with Add/Edit/Delete)
 *
 * Pattern reusable untuk SEMUA master pages:
 *   - /master/barang (Daftar Barang | Kelola Barang)
 *   - /master/categories (Daftar Kategori | Kelola Kategori)
 *   - /master/vendors (Daftar Vendor | Kelola Vendor)
 *   - /master/suppliers (Daftar Supplier | Kelola Supplier)
 *   - /master/customers (Daftar Customer | Kelola Customer)
 *   - /master/personnel (Daftar Pegawai | Kelola Pegawai)
 *   - /master/users (Daftar User | Kelola User)
 *
 * Reduces sidebar menu items: 1 master = 1 menu (instead of 2).
 */

import React from "react";
import { DnaPageHeader } from "./layout/DnaPageHeader";
import { DnaStatCard } from "./DnaStatCard";
import { DnaInput } from "./DnaInput";

export type MasterStatItem = {
  variant: "neutral" | "blue" | "emerald" | "rose" | "amber" | "sky" | "slate";
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
};

export type MasterTab = {
  key: string;
  label: string;
  count: number;
};

export interface MasterPageShellProps {
  /** Page title (e.g., "GUDANG", "BARANG") */
  title: string;
  /** Badge untuk title (e.g., "WAREHOUSE") */
  badge?: React.ReactNode;
  /** Subtitle di bawah title */
  subtitle?: string;
  /** Two tab configs */
  tabs: [MasterTab, MasterTab]; // tuple — exactly 2
  /** Currently active tab key */
  activeTab: string;
  /** Tab change handler */
  onTabChange: (key: string) => void;
  /** 4 KPI cards */
  stats: [MasterStatItem, MasterStatItem, MasterStatItem, MasterStatItem];
  /** Search query state */
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  /** Tab 1 content (Daftar list view) */
  daftarContent: React.ReactNode;
  /** Tab 2 content (Kelola CRUD with Add button) */
  kelolaContent: React.ReactNode;
}

/**
 * Shell that renders the standard structure for consolidated master pages.
 * Each master page passes its own daftarContent and kelolaContent.
 */
export function MasterPageShell({
  title,
  badge,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  stats,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari...",
  daftarContent,
  kelolaContent,
}: MasterPageShellProps) {
  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* 1. Page Header dengan 2 tabs (Daftar + Kelola) */}
      <DnaPageHeader
        title={title}
        badge={badge}
        subtitle={subtitle}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* 2. KPI Cards — 4 stats konsisten di kedua tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((s, idx) => (
          <DnaStatCard
            key={idx}
            variant={s.variant}
            label={s.label}
            value={s.value}
            subtext={s.subtext}
            icon={s.icon}
          />
        ))}
      </div>

      {/* 3. Search Toolbar (shared by both tabs) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center gap-2">
        <DnaInput
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 md:max-w-sm"
        />
      </div>

      {/* 4. Tab Content — Daftar (list) atau Kelola (CRUD) */}
      {activeTab === tabs[0].key && daftarContent}
      {activeTab === tabs[1].key && kelolaContent}
    </div>
  );
}
