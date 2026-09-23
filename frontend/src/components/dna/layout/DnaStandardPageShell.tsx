"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DnaPageHeader, type DnaPageTabItem } from "./DnaPageHeader";
import { DnaKpiGrid, type DnaKpiCardItem } from "./DnaKpiGrid";
import { DnaDataTableCard } from "../table/DnaDataTableCard";
import type { DnaTableToolbarProps } from "../table/DnaTableToolbar";
import type { DnaPaginationProps } from "../table/DnaPagination";

export interface DnaStandardPageShellProps {
  /** Judul Halaman (e.g., "SURAT JALAN (DELIVERY ORDERS)") */
  title: string;
  /** Subtitle atau deskripsi singkat di bawah judul */
  subtitle?: string;
  /** Modul atau status badge di samping judul */
  badge?: React.ReactNode;
  /** Link kembali opsional */
  backLink?: {
    href: string;
    label: string;
  };
  /** Sub-navbar Tab di kanan atas sejajar judul halaman (DNA-004) */
  tabs?: DnaPageTabItem[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  /** Tombol aksi cepat tambahan di header kanan atas */
  headerActions?: React.ReactNode;

  /** 3-4 Kartu ringkasan KPI di atas tabel (opsional) */
  kpiCards?: DnaKpiCardItem[];

  /** Props untuk toolbar terpadu di dalam card tabel (DNA-003) */
  toolbarProps?: DnaTableToolbarProps;

  /** Props untuk pagination di footer card tabel */
  paginationProps?: DnaPaginationProps;

  /** Konten tabel atau form operasional */
  children?: React.ReactNode;

  /** Slot alternatif untuk konten tabel jika menggunakan named slot */
  table?: React.ReactNode;

  /** Banner notifikasi atau alert global di atas header */
  alertBanner?: React.ReactNode;

  /** Dialog atau modal yang dirender di level halaman */
  modals?: React.ReactNode;

  className?: string;
}

/**
 * DnaStandardPageShell — Template Layout Emas Kanonikal NEX ERP
 *
 * Mengadopsi 100% pola /visual-dna/golden-reference:
 * 1. Header kiri (Judul, Subtitle, Badge)
 * 2. Navbar / Sub-nav tab kanan atas sejajar judul (DNA-004)
 * 3. Grid ringkasan KPI (3-4 card) di atas tabel
 * 4. Card Tabel Terpadu: Toolbar (Search, Filter kolom, Date picker, Action button)
 *    menyatu dalam 1 card dengan tabel, jarak rapat 8-12px (DNA-003)
 * 5. Pagination terpadu di bagian footer card
 */
export function DnaStandardPageShell({
  title,
  subtitle,
  badge,
  backLink,
  tabs,
  activeTab,
  onTabChange,
  headerActions,
  kpiCards,
  toolbarProps,
  paginationProps,
  children,
  table,
  alertBanner,
  modals,
  className,
}: DnaStandardPageShellProps) {
  const tableContent = children || table;

  return (
    <div className={cn("space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen", className)}>
      {/* 1. Global Alert Banner jika ada */}
      {alertBanner}

      {/* 2. Header Halaman + Sub-Navbar Kanan Atas (DNA-004) */}
      <DnaPageHeader
        title={title}
        subtitle={subtitle}
        badge={badge}
        backLink={backLink}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        actions={headerActions}
      />

      {/* 3. Grid KPI Summary jika disediakan */}
      {kpiCards && kpiCards.length > 0 && <DnaKpiGrid cards={kpiCards} />}

      {/* 4. Card Tabel Terpadu (Toolbar + Tabel + Pagination dalam 1 Card) (DNA-003) */}
      {tableContent && (
        toolbarProps ? (
          <DnaDataTableCard toolbarProps={toolbarProps} paginationProps={paginationProps}>
            {tableContent}
          </DnaDataTableCard>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">{tableContent}</div>
          </div>
        )
      )}

      {/* 5. Modals & Dialogs */}
      {modals}
    </div>
  );
}
