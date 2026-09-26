"use client";

/**
 * Client Lost & Churn Analysis — Commercial Front-End
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 14 & 107),
 * Menampilkan rincian Prospek Gagal (Sebelum Deal) dan Klien Churn (Setelah Delivery).
 */

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import {
  XCircle,
  AlertTriangle,
  DollarSign,
  Users,
  Phone,
  RefreshCw,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaDetailDrawer,
  DnaCell,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";

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

const REASON_LABELS: Record<string, { label: string; status: "critical" | "warning" | "neutral" | "success" }> = {
  PRICE_ISSUE: { label: "HPP Terlalu Tinggi", status: "critical" },
  MOQ_TOO_HIGH: { label: "MOQ Tidak Cocok", status: "warning" },
  QUALITY: { label: "Formula Kurang Pas", status: "critical" },
  GHOSTING: { label: "Klien Hilang Kontak", status: "neutral" },
  COMPETITOR: { label: "Pindah ke Maklon Lain", status: "warning" },
  NOT_READY: { label: "Klien Belum Siap Modal", status: "neutral" },
  OTHER: { label: "Alasan Lain", status: "neutral" },
};

function LostContent() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("prospects");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<LostProspectItem | null>(null);
  const [selectedChurn, setSelectedChurn] = useState<ChurnedClientItem | null>(null);

  const [prospects, setProspects] = useState<LostProspectItem[]>([]);
  const [churns, setChurns] = useState<ChurnedClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lostGroupRes, lostDealsRes, lostChurnRes] = await Promise.allSettled([
        api.get<any[]>("/bussdev/leads/group/lost"),
        api.get<any[]>("/crm/lost-deals"),
        api.get<any[]>("/bussdev/analytics/lost-churn"),
      ]);

      const prospectList: LostProspectItem[] = [];

      if (lostGroupRes.status === "fulfilled" && Array.isArray(lostGroupRes.value.data)) {
        for (const item of lostGroupRes.value.data) {
          prospectList.push({
            id: item.id || `lead-${Math.random()}`,
            brandName: item.brandName || item.clientName || "Brand",
            productName: item.productInterest || "Kustom Kosmetik",
            clientName: item.clientName || "Klien",
            phoneNo: item.phoneNo || item.phone || "",
            bdName: item.pic?.name || item.lastActionBy || "BusDev",
            estimatedValue: Number(item.estimatedValue || 0),
            sampleDate: item.updatedAt ? new Date(item.updatedAt).toISOString().slice(0, 10) : "-",
            sampleStatus: item.status || "LOST",
            lostReason: (item.lostReason as any) || "OTHER",
            lostNotes: item.notes || item.reason || "",
          });
        }
      }

      if (lostDealsRes.status === "fulfilled" && Array.isArray(lostDealsRes.value.data)) {
        for (const deal of lostDealsRes.value.data) {
          if (!prospectList.some((p) => p.id === deal.id || p.id === deal.leadId)) {
            prospectList.push({
              id: deal.id,
              brandName: deal.lead?.clientName || "Brand",
              productName: "Produk Maklon",
              clientName: deal.lead?.clientName || "Klien",
              phoneNo: "",
              bdName: "BusDev",
              estimatedValue: 0,
              sampleDate: deal.createdAt ? new Date(deal.createdAt).toISOString().slice(0, 10) : "-",
              sampleStatus: "LOST",
              lostReason: (deal.reason as any) || "OTHER",
              lostNotes: deal.notes || "",
            });
          }
        }
      }

      setProspects(prospectList);

      const churnList: ChurnedClientItem[] = [];
      if (lostChurnRes.status === "fulfilled" && Array.isArray(lostChurnRes.value.data)) {
        for (const c of lostChurnRes.value.data) {
          churnList.push({
            id: c.id || `churn-${Math.random()}`,
            clientName: c.brand || c.clientName || "Klien Maklon",
            brandName: c.brand || "Brand",
            phoneNo: c.phone || "",
            lifetimeValue: Number(c.lostValue || 0),
            totalOrders: c.totalOrders || 1,
            lastOrderDate: c.lastOrderDate || "-",
            inactivityMonths: c.inactivityMonths || 6,
            lastProductOrdered: c.lastProduct || "Sediaan Kosmetik",
            churnReason: c.reason || "Tidak ada repeat order",
          });
        }
      }
      setChurns(churnList);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data lost & churn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Global KPI calculations
  const totalLostCount = prospects.length;
  const totalChurnCount = churns.length;
  const totalLostValue = prospects.reduce((sum, p) => sum + p.estimatedValue, 0);

  const filteredProspects = useMemo(() => {
    if (!searchQuery.trim()) return prospects;
    const q = searchQuery.toLowerCase();
    return prospects.filter(
      (p) =>
        p.brandName.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q)
    );
  }, [prospects, searchQuery]);

  const filteredChurn = useMemo(() => {
    if (!searchQuery.trim()) return churns;
    const q = searchQuery.toLowerCase();
    return churns.filter(
      (c) =>
        c.brandName.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.lastProductOrdered.toLowerCase().includes(q)
    );
  }, [churns, searchQuery]);

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
            value: totalLostCount > 0 ? "HPP & MOQ" : "Belum Ada",
            subtitle: "Sensitivitas harga & kuantiti batch",
            trend: "Evaluasi R&D",
            icon: AlertTriangle,
            variant: "purple",
          },
        ]}
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <DnaButton size="sm" variant="outline" onClick={fetchData} className="gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </DnaButton>
        </div>
      )}

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
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Memuat data analisis pembatalan...
            </div>
          ) : activeTab === "prospects" ? (
            filteredProspects.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Belum ada data prospek batal tercatat di sistem.
              </div>
            ) : (
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <DnaTh className="py-3 px-3 w-[24%]">Brand & Produk</DnaTh>
                    <DnaTh className="py-3 px-3 w-[22%]">Pelanggan & Kontak</DnaTh>
                    <DnaTh className="py-3 px-3 w-[18%]">PIC BD & Tgl Sample</DnaTh>
                    <DnaTh className="py-3 px-3 w-[16%] text-right">Est. Value Deal</DnaTh>
                    <DnaTh className="py-3 px-3 w-[10%] text-center">Alasan Lost</DnaTh>
                    <DnaTh className="py-3 px-3 w-[10%] text-right">Aksi</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {filteredProspects.map((item) => {
                    const reason = REASON_LABELS[item.lostReason] || {
                      label: item.lostReason,
                      status: "neutral",
                    };
                    return (
                      <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <DnaTd className="py-3 px-3">
                          <p className="font-semibold text-slate-900 truncate">{item.brandName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{item.productName}</p>
                        </DnaTd>
                        <DnaTd className="py-3 px-3">
                          <p className="font-medium text-slate-800 truncate">{item.clientName}</p>
                          <p className="tabular-nums text-[11px] text-slate-400 truncate">{item.phoneNo || "—"}</p>
                        </DnaTd>
                        <DnaTd className="py-3 px-3">
                          <p className="text-slate-800 truncate">{item.bdName}</p>
                          <p className="tabular-nums text-[10px] text-slate-400">Sample: {item.sampleDate}</p>
                        </DnaTd>
                        <DnaTd className="py-3 px-3 text-right">
                          <p className="tabular-nums font-bold text-slate-900">{formatCurrency(item.estimatedValue)}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.sampleStatus}</p>
                        </DnaTd>
                        <DnaTd className="py-3 px-3 text-center">
                          <DnaCell.Badge label={reason.label} status={reason.status} />
                        </DnaTd>
                        <DnaTd className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            <DnaButton variant="ghost" size="sm" onClick={() => setSelectedProspect(item)}>
                              Detail
                            </DnaButton>
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })}
                </DnaTableBody>
              </DnaTable>
            )
          ) : filteredChurn.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Belum ada data klien dormant tercatat di sistem.
            </div>
          ) : (
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <DnaTh className="py-3 px-3 w-[25%]">Pelanggan & Brand</DnaTh>
                  <DnaTh className="py-3 px-3 w-[20%]">Total Order & Jeda</DnaTh>
                  <DnaTh className="py-3 px-3 w-[22%]">Order Terakhir & Produk</DnaTh>
                  <DnaTh className="py-3 px-3 w-[15%] text-right">Lifetime Value</DnaTh>
                  <DnaTh className="py-3 px-3 w-[8%] text-center">Status</DnaTh>
                  <DnaTh className="py-3 px-3 w-[10%] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredChurn.map((item) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-3">
                      <p className="font-semibold text-slate-900 truncate">{item.clientName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.brandName} • {item.phoneNo}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{item.totalOrders}x Order</p>
                      <p className="text-[10px] text-rose-600 font-bold">{item.inactivityMonths} Bulan Dormant</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-3">
                      <p className="tabular-nums text-slate-700">{item.lastOrderDate}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.lastProductOrdered}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-right">
                      <p className="tabular-nums font-bold text-emerald-600">{formatCurrency(item.lifetimeValue)}</p>
                      <p className="text-[10px] text-slate-400">Total Omset</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-center">
                      <DnaCell.Badge label="Dormant" status="critical" />
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        <DnaButton variant="ghost" size="sm" onClick={() => setSelectedChurn(item)}>
                          Detail
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
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
                <p className="font-bold text-rose-600 tabular-nums">{formatCurrency(selectedProspect.estimatedValue)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Status Terakhir:</span>
                <p className="font-semibold text-slate-800">{selectedProspect.sampleStatus}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Sample:</span>
                <p className="tabular-nums text-slate-700">{selectedProspect.sampleDate}</p>
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
                <p className="font-bold text-emerald-600 tabular-nums">{formatCurrency(selectedChurn.lifetimeValue)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Batch Dipesan:</span>
                <p className="font-bold text-slate-800">{selectedChurn.totalOrders}x Order</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Order Terakhir:</span>
                <p className="tabular-nums text-slate-800">{selectedChurn.lastOrderDate}</p>
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
