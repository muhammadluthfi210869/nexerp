"use client";

/**
 * Client Lost & Churn Analysis — Commercial Front-End
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 14 & 107),
 * Menampilkan rincian Prospek Gagal (Sebelum Deal) dan Klien Churn (Setelah Delivery).
 *
 * Visual DNA Golden Reference:
 * - Light Enterprise Theme (bg-[#F8FAFC])
 * - DnaPageHeader with backLink { href, label }
 * - DnaKpiGrid with 4 interactive KPI cards (Prospek Lost, Klien Churn, Lost Value, Alasan Dominan)
 * - 2 Sub-tabel DnaDataTableCard (Section A & Section B)
 * - DnaCell.* primitives & DnaModal
 */

import React, { useState, useMemo, Suspense } from "react";
import {
  XCircle,
  AlertTriangle,
  Search,
  DollarSign,
  Users,
  Phone,
  TrendingDown,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaDetailDrawer,
  DnaCell,
  useDnaToast,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

export interface LostProspectItem {
  id: string;
  brandName: string;
  productName: string;
  clientName: string;
  phoneNo?: string;
  bdName: string;
  estimatedValue: number;
  sampleDate: string;
  sampleStatus: string;
  lostReason: "PRICE_ISSUE" | "MOQ_TOO_HIGH" | "QUALITY" | "GHOSTING" | "COMPETITOR" | "NOT_READY" | "OTHER";
  lostNotes?: string;
}

export interface ChurnedClientItem {
  id: string;
  clientName: string;
  brandName: string;
  phoneNo?: string;
  lifetimeValue: number;
  totalOrders: number;
  lastOrderDate: string;
  inactivityMonths: number;
  lastProductOrdered: string;
  churnReason: string;
}

const MOCK_PROSPECTS_LOST: LostProspectItem[] = [
  {
    id: "pl-1",
    brandName: "GlowVibe",
    productName: "Centella Soothing Gel 50ml",
    clientName: "PT Cantik Jelita",
    phoneNo: "081234112233",
    bdName: "Revita (BusDev 1)",
    estimatedValue: 35000000,
    sampleDate: "2026-07-15",
    sampleStatus: "SAMPLE_REVISION",
    lostReason: "PRICE_ISSUE",
    lostNotes: "Target budget HPP klien Rp 18.000/pcs sedangkan HPP produksi Rp 23.500/pcs",
  },
  {
    id: "pl-2",
    brandName: "AuraSkin",
    productName: "AHA BHA Peeling Serum 30ml",
    clientName: "dr. Maya Sp.KK",
    phoneNo: "085678445566",
    bdName: "Dimas (BusDev Lead)",
    estimatedValue: 50000000,
    sampleDate: "2026-08-01",
    sampleStatus: "SAMPLE_APPROVED",
    lostReason: "MOQ_TOO_HIGH",
    lostNotes: "Klien hanya minta MOQ 500 pcs untuk uji klinis awal, pabrik minimum 1.000 pcs",
  },
  {
    id: "pl-3",
    brandName: "DermaHerb",
    productName: "Brightening Face Wash 100ml",
    clientName: "CV Herbal Sentosa",
    phoneNo: "081987778899",
    bdName: "Revita (BusDev 1)",
    estimatedValue: 28000000,
    sampleDate: "2026-06-20",
    sampleStatus: "SAMPLE_PROCESS",
    lostReason: "GHOSTING",
    lostNotes: "Follow-up 3x via WhatsApp dan telepon tidak ada respon selama 45 hari",
  },
];

const MOCK_CHURNED_CLIENTS: ChurnedClientItem[] = [
  {
    id: "cc-1",
    clientName: "PT Aura Makmur Mandiri",
    brandName: "AuraWhite",
    phoneNo: "082299887766",
    lifetimeValue: 185000000,
    totalOrders: 4,
    lastOrderDate: "2025-11-10",
    inactivityMonths: 10,
    lastProductOrdered: "Body Lotion Tone Up 250ml",
    churnReason: "Brand beralih fokus ke produk fashion / apparel",
  },
  {
    id: "cc-2",
    clientName: "CV Pesona Estetika",
    brandName: "PesonaGlow",
    phoneNo: "081344556677",
    lifetimeValue: 92000000,
    totalOrders: 2,
    lastOrderDate: "2026-01-15",
    inactivityMonths: 8,
    lastProductOrdered: "Moisturizer Gel 30g",
    churnReason: "Pindah ke pabrik maklon kompetitor karena penawaran termin pembayaran Net 60",
  },
];

const REASON_LABELS: Record<string, { label: string; status: string }> = {
  PRICE_ISSUE: { label: "HPP Terlalu Tinggi", status: "cancel" },
  MOQ_TOO_HIGH: { label: "MOQ Terlalu Tinggi", status: "warning" },
  QUALITY: { label: "Kualitas / Karakteristik", status: "warning" },
  GHOSTING: { label: "Klien Tidak Merespons", status: "pending" },
  COMPETITOR: { label: "Pindah ke Kompetitor", status: "cancel" },
  NOT_READY: { label: "Modal / Belum Siap", status: "info" },
  OTHER: { label: "Alasan Lainnya", status: "neutral" },
};

function LostContent() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("prospects");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<LostProspectItem | null>(null);
  const [selectedChurn, setSelectedChurn] = useState<ChurnedClientItem | null>(null);

  // Global KPI calculations
  const totalLostCount = MOCK_PROSPECTS_LOST.length;
  const totalChurnCount = MOCK_CHURNED_CLIENTS.length;
  const totalLostValue = MOCK_PROSPECTS_LOST.reduce((sum, p) => sum + p.estimatedValue, 0);

  const filteredProspects = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_PROSPECTS_LOST;
    const q = searchQuery.toLowerCase();
    return MOCK_PROSPECTS_LOST.filter(
      (p) =>
        p.brandName.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredChurn = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_CHURNED_CLIENTS;
    const q = searchQuery.toLowerCase();
    return MOCK_CHURNED_CLIENTS.filter(
      (c) =>
        c.brandName.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.lastProductOrdered.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleReEngage = (name: string, phone?: string) => {
    if (phone) {
      window.open(
        `https://wa.me/${phone.replace(/\D/g, "")}?text=Halo%20${encodeURIComponent(
          name
        )},%20kami%20dari%20tim%20BusDev%20Dreamlab...`,
        "_blank"
      );
    } else {
      toast.info(`Menjadwalkan follow-up re-engagement untuk ${name}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      <DnaPageHeader
        title="CLIENT LOST & CHURN ANALYSIS"
        description="Pusat Analisis & Evaluasi Prospek Batal (Sebelum Deal) dan Klien Churn (Setelah Delivery) untuk penyesuaian strategi komersial."
        tabs={[
          { key: "prospects", label: "Prospek Batal (Lost Deal)", count: totalLostCount },
          { key: "churned", label: "Klien Churn (Dormant)", count: totalChurnCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 4 KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: "Prospek Batal (Lost Deal)",
            value: `${totalLostCount} Prospek`,
            subtitle: "Gagal pada tahap negosiasi / sample",
            trend: "Fase Pipeline",
            icon: XCircle,
            variant: "critical",
          },
          {
            label: "Klien Churn (Pasca Delivery)",
            value: `${totalChurnCount} Klien`,
            subtitle: "Tidak ada repeat order > 6 bulan",
            trend: "Dormant",
            icon: Users,
            variant: "amber",
          },
          {
            label: "Estimasi Omset Hilang",
            value: formatCurrency(totalLostValue),
            subtitle: "Potensi revenue gagal konversi",
            trend: "Opportunity Loss",
            icon: DollarSign,
            variant: "blue",
          },
          {
            label: "Alasan Utama Pembatalan",
            value: "HPP & MOQ",
            subtitle: "Sensitivitas harga & kuantiti batch",
            trend: "Evaluasi R&D",
            icon: AlertTriangle,
            variant: "purple",
          },
        ]}
      />

      {/* Unified Table Card */}
      <DnaDataTableCard
        count={activeTab === "prospects" ? filteredProspects.length : filteredChurn.length}
        totalItems={activeTab === "prospects" ? totalLostCount : totalChurnCount}
        toolbarProps={{
          searchPlaceholder: "Cari brand, nama klien, atau produk...",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
        }}
      >
        <div className="w-full">
          {activeTab === "prospects" ? (
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-[24%]">Brand & Produk</th>
                  <th className="py-3 px-3 w-[22%]">Pelanggan & Kontak</th>
                  <th className="py-3 px-3 w-[18%]">PIC BD & Tgl Sample</th>
                  <th className="py-3 px-3 w-[16%] text-right">Est. Value Deal</th>
                  <th className="py-3 px-3 w-[10%] text-center">Alasan Lost</th>
                  <th className="py-3 px-3 w-[10%] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProspects.map((item) => {
                  const reason = REASON_LABELS[item.lostReason] || {
                    label: item.lostReason,
                    status: "neutral",
                  };
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900 truncate">{item.brandName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.productName}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800 truncate">{item.clientName}</p>
                        <p className="font-mono text-[11px] text-slate-400 truncate">{item.phoneNo || "—"}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-slate-800 truncate">{item.bdName}</p>
                        <p className="font-mono text-[10px] text-slate-400">Sample: {item.sampleDate}</p>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <p className="font-mono font-bold text-slate-900">{formatCurrency(item.estimatedValue)}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.sampleStatus}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <DnaCell.Badge label={reason.label} status={reason.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <DnaButton variant="ghost" size="sm" onClick={() => setSelectedProspect(item)}>
                            Detail
                          </DnaButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-[25%]">Pelanggan & Brand</th>
                  <th className="py-3 px-3 w-[20%]">Total Order & Jeda</th>
                  <th className="py-3 px-3 w-[22%]">Order Terakhir & Produk</th>
                  <th className="py-3 px-3 w-[15%] text-right">Lifetime Value</th>
                  <th className="py-3 px-3 w-[8%] text-center">Status</th>
                  <th className="py-3 px-3 w-[10%] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChurn.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 truncate">{item.clientName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.brandName} • {item.phoneNo}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{item.totalOrders}x Order</p>
                      <p className="text-[10px] text-rose-600 font-bold">{item.inactivityMonths} Bulan Dormant</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-mono text-slate-700">{item.lastOrderDate}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.lastProductOrdered}</p>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <p className="font-mono font-bold text-emerald-600">{formatCurrency(item.lifetimeValue)}</p>
                      <p className="text-[10px] text-slate-400">Total Omset</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <DnaCell.Badge label="Dormant" status="critical" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        <DnaButton variant="ghost" size="sm" onClick={() => setSelectedChurn(item)}>
                          Detail
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DnaDataTableCard>

      {/* Drawer Detail Lost Prospect */}
      <DnaDetailDrawer
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        title={selectedProspect?.brandName || "Detail Pembatalan"}
        subtitle={selectedProspect ? `Klien: ${selectedProspect.clientName} • PIC: ${selectedProspect.bdName}` : undefined}
        badge={
          selectedProspect ? (
            <DnaCell.Badge
              label={REASON_LABELS[selectedProspect.lostReason]?.label || selectedProspect.lostReason}
              status={REASON_LABELS[selectedProspect.lostReason]?.status || "neutral"}
            />
          ) : undefined
        }
        actions={
          selectedProspect ? (
            <div className="flex items-center justify-between w-full">
              <DnaButton
                variant="outline"
                size="sm"
                onClick={() => handleReEngage(selectedProspect.clientName, selectedProspect.phoneNo)}
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Phone className="w-3.5 h-3.5" />
                Chat Re-Engagement WA
              </DnaButton>
              <DnaButton variant="secondary" onClick={() => setSelectedProspect(null)}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {selectedProspect && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Produk Target:</span>
                <p className="font-bold text-slate-800">{selectedProspect.productName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Potensi Omset:</span>
                <p className="font-bold text-rose-600 font-mono">{formatCurrency(selectedProspect.estimatedValue)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Status Terakhir:</span>
                <p className="font-semibold text-slate-800">{selectedProspect.sampleStatus}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Sample:</span>
                <p className="font-mono text-slate-700">{selectedProspect.sampleDate}</p>
              </div>
            </div>

            {selectedProspect.lostNotes && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Catatan Evaluasi BusDev
                </span>
                <p className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60 text-slate-800 leading-relaxed">
                  {selectedProspect.lostNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

      {/* Drawer Detail Churned Client */}
      <DnaDetailDrawer
        isOpen={!!selectedChurn}
        onClose={() => setSelectedChurn(null)}
        title={selectedChurn?.clientName || "Profil Klien Churn"}
        subtitle={selectedChurn ? `Brand: ${selectedChurn.brandName} • Dormant: ${selectedChurn.inactivityMonths} Bulan` : undefined}
        badge={
          selectedChurn ? (
            <DnaCell.Badge label={`${selectedChurn.inactivityMonths} Bulan Dormant`} status="critical" />
          ) : undefined
        }
        actions={
          selectedChurn ? (
            <div className="flex items-center justify-between w-full">
              <DnaButton
                variant="outline"
                size="sm"
                onClick={() => handleReEngage(selectedChurn.clientName, selectedChurn.phoneNo)}
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Phone className="w-3.5 h-3.5" />
                Kirim Promo Re-Aktivasi WA
              </DnaButton>
              <DnaButton variant="secondary" onClick={() => setSelectedChurn(null)}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {selectedChurn && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Lifetime Value:</span>
                <p className="font-bold text-emerald-600 font-mono">{formatCurrency(selectedChurn.lifetimeValue)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Batch Dipesan:</span>
                <p className="font-bold text-slate-800">{selectedChurn.totalOrders}x Order</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Order Terakhir:</span>
                <p className="font-mono text-slate-800">{selectedChurn.lastOrderDate}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Produk Terakhir:</span>
                <p className="font-semibold text-slate-800">{selectedChurn.lastProductOrdered}</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Indikasi Penyebab Dormancy
              </span>
              <p className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-slate-800 leading-relaxed">
                {selectedChurn.churnReason}
              </p>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </div>
  );
}

export default function LostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>}>
      <LostContent />
    </Suspense>
  );
}
