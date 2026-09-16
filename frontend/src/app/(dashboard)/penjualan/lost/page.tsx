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
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans">
      <DnaPageHeader
        title="Client Lost & Churn Analysis"
        description="Pusat Analisis & Evaluasi Prospek Batal (Sebelum Deal) dan Klien Churn (Setelah Delivery)"
        backLink={{ href: "/bussdev/client-manager", label: "Client Manager" }}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <TrendingDown className="w-3.5 h-3.5" />
            LOST INTELLIGENCE
          </span>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-6">
        {/* 4 KPI Cards */}
        <DnaKpiGrid
          columns={4}
          items={[
            {
              label: "PROSPEK BATAL (LOST DEAL)",
              value: `${totalLostCount} Prospek`,
              subtext: "Gagal pada tahap negosiasi / sample",
              icon: XCircle,
              status: "critical",
            },
            {
              label: "KLIEN CHURN (PASCA DELIVERY)",
              value: `${totalChurnCount} Klien`,
              subtext: "Tidak ada order > 6 bulan",
              icon: Users,
              status: "warning",
            },
            {
              label: "ESTIMASI OMSET HILANG",
              value: formatCurrency(totalLostValue),
              subtext: "Potensi revenue gagal konversi",
              icon: DollarSign,
              status: "neutral",
            },
            {
              label: "ALASAN UTAMA PEMBATALAN",
              value: "HPP & MOQ",
              subtext: "Sensitivitas harga & kuantiti",
              icon: AlertTriangle,
              status: "purple",
            },
          ]}
        />

        {/* Toolbar Search */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="w-80">
            <DnaInput
              placeholder="Cari brand, nama klien, produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="text-xs font-bold text-slate-400">
            Menganalisis data kegagalan deal untuk evaluasi strategi BusDev
          </div>
        </div>

        {/* SECTION A: Lost Sebelum Deal (Prospect Gagal) */}
        <DnaDataTableCard
          title="Section A: Prospek Batal Sebelum Deal (Pipeline Fail)"
          count={filteredProspects.length}
        >
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                <th className="p-3 w-10 text-center">NO</th>
                <th className="p-3">BRAND & PRODUK</th>
                <th className="p-3">PELANGGAN</th>
                <th className="p-3">PIC BD</th>
                <th className="p-3 text-right">EST. VALUE DEAL</th>
                <th className="p-3">TGL SAMPLE</th>
                <th className="p-3 text-center">STATUS SAMPLE</th>
                <th className="p-3 text-center">STATUS LOST</th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map((item, idx) => {
                const reason = REASON_LABELS[item.lostReason] || {
                  label: item.lostReason,
                  status: "neutral",
                };
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedProspect(item)}
                    className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 cursor-pointer group text-xs"
                  >
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{item.brandName}</td>
                    <td className="p-3 text-slate-800 whitespace-nowrap">{item.clientName}</td>
                    <td className="p-3 text-slate-700 whitespace-nowrap">{item.bdName}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(item.estimatedValue)}
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap font-mono">{item.sampleDate}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.sampleStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <DnaCell.Badge label={reason.label} status={reason.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DnaDataTableCard>

        {/* SECTION B: Klien Churn (Setelah Delivery) */}
        <DnaDataTableCard
          title="Section B: Klien Churn Pasca Delivery (Dormant > 6 Bulan)"
          count={filteredChurn.length}
        >
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                <th className="p-3 w-10 text-center">NO</th>
                <th className="p-3">NAMA PELANGGAN</th>
                <th className="p-3 text-right">LIFETIME VALUE</th>
                <th className="p-3 text-center">TOTAL TRANSAKSI</th>
                <th className="p-3">TGL TERAKHIR ORDER</th>
                <th className="p-3 text-center">JEDA TIDAK ORDER</th>
                <th className="p-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredChurn.map((item, idx) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedChurn(item)}
                  className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 cursor-pointer group text-xs"
                >
                  <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{item.clientName}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.lifetimeValue)}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-800 text-xs whitespace-nowrap">
                    {item.totalOrders}x Order
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap font-mono">{item.lastOrderDate}</td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                      {item.inactivityMonths} Bulan
                    </span>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <DnaCell.Badge label="Dormant" status="danger" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DnaDataTableCard>
      </div>

      {/* Modal Detail Lost Prospect */}
      {selectedProspect && (
        <DnaModal
          isOpen={true}
          onClose={() => setSelectedProspect(null)}
          title={`Detail Pembatalan — ${selectedProspect.brandName}`}
          subtitle={`Klien: ${selectedProspect.clientName} • PIC: ${selectedProspect.bdName}`}
          size="md"
          footer={
            <div className="flex justify-between items-center w-full">
              <DnaButton
                variant="outline"
                size="sm"
                onClick={() => handleReEngage(selectedProspect.clientName, selectedProspect.phoneNo)}
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Phone className="w-3.5 h-3.5" />
                Chat Re-Engagement WA
              </DnaButton>
              <DnaButton variant="ghost" size="sm" onClick={() => setSelectedProspect(null)}>
                Tutup
              </DnaButton>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Produk Target:</span>
                <p className="font-bold text-slate-800">{selectedProspect.productName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Potensi Omset:</span>
                <p className="font-bold text-rose-600">{formatCurrency(selectedProspect.estimatedValue)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status Terakhir:</span>
                <p className="font-bold text-slate-800">{selectedProspect.sampleStatus}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Kategori Alasan:</span>
                <p className="font-bold text-slate-800">{selectedProspect.lostReason}</p>
              </div>
            </div>

            {selectedProspect.lostNotes && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Catatan Evaluasi BusDev
                </h4>
                <p className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-slate-800 leading-relaxed">
                  {selectedProspect.lostNotes}
                </p>
              </div>
            )}
          </div>
        </DnaModal>
      )}

      {/* Modal Detail Churned Client */}
      {selectedChurn && (
        <DnaModal
          isOpen={true}
          onClose={() => setSelectedChurn(null)}
          title={`Profil Klien Churn — ${selectedChurn.clientName}`}
          subtitle={`Brand: ${selectedChurn.brandName} • Dormant: ${selectedChurn.inactivityMonths} Bulan`}
          size="md"
          footer={
            <div className="flex justify-between items-center w-full">
              <DnaButton
                variant="outline"
                size="sm"
                onClick={() => handleReEngage(selectedChurn.clientName, selectedChurn.phoneNo)}
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Phone className="w-3.5 h-3.5" />
                Kirim Promo Re-Aktivasi WA
              </DnaButton>
              <DnaButton variant="ghost" size="sm" onClick={() => setSelectedChurn(null)}>
                Tutup
              </DnaButton>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Lifetime Value:</span>
                <p className="font-bold text-emerald-600">{formatCurrency(selectedChurn.lifetimeValue)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Batch Dipesan:</span>
                <p className="font-bold text-slate-800">{selectedChurn.totalOrders}x Order</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Order Terakhir:</span>
                <p className="font-bold text-slate-800">{selectedChurn.lastOrderDate}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Produk Terakhir:</span>
                <p className="font-bold text-slate-800">{selectedChurn.lastProductOrdered}</p>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Indikasi Penyebab Dormancy
              </h4>
              <p className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-slate-800 leading-relaxed">
                {selectedChurn.churnReason}
              </p>
            </div>
          </div>
        </DnaModal>
      )}
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
