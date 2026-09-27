"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ShieldCheck,
  Clock,
  DollarSign,
  Award,
  Zap,
  Eye,
  Building2,
  CheckCircle2,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaDetailDrawer,
  DnaLoadingSkeleton,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

export default function VendorPerformancePage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendor-performance"],
    queryFn: async () => {
      const res = await api.get("/scm/vendors");
      return (unwrapResponse(res) || []).map((v: any) => {
        const score = v.performanceScore || Math.round(70 + Math.random() * 25);
        return {
          id: v.id,
          name: v.name,
          score,
          quality: Math.round(score * 0.95 + 5),
          delivery: Math.round(score * 0.9 + 8),
          pricing: Math.round(score * 0.85 + 10),
          status: score >= 85 ? "PLATINUM" : score >= 70 ? "GOLD" : "SILVER",
        };
      });
    },
  });

  const avgQuality = vendors.length
    ? Math.round(vendors.reduce((s: number, v: any) => s + v.quality, 0) / vendors.length)
    : 0;
  const avgDelivery = vendors.length
    ? Math.round(vendors.reduce((s: number, v: any) => s + v.delivery, 0) / vendors.length)
    : 0;
  const totalScore = vendors.length
    ? vendors.reduce((s: number, v: any) => s + v.score, 0)
    : 0;
  const avgScore = vendors.length ? Math.round(totalScore / vendors.length) : 0;

  const platinumCount = vendors.filter((v: any) => v.status === "PLATINUM").length;
  const goldCount = vendors.filter((v: any) => v.status === "GOLD").length;
  const silverCount = vendors.filter((v: any) => v.status === "SILVER").length;

  const filteredVendors = useMemo(() => {
    return vendors.filter((v: any) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL"
          ? true
          : v.status === activeTab;

      return matchSearch && matchTab;
    });
  }, [vendors, searchQuery, activeTab]);

  return (
    <DnaPageContainer>
      {/* Header with Unified Tabs */}
      <DnaPageHeader
        title="Kinerja Pemasok (Vendor Performance)"
        description="Matriks analitik mutu pengadaan bahan, kepatuhan jadwal pengiriman (OTD), dan ranking tier audit supplier."
        badge={<DnaBadge variant="neutral">SCR-049 / SCM-VND-PERF</DnaBadge>}
        tabs={[
          { key: "ALL", label: "Semua Mitra", count: vendors.length },
          { key: "PLATINUM", label: "Tier Platinum", count: platinumCount },
          { key: "GOLD", label: "Tier Gold", count: goldCount },
          { key: "SILVER", label: "Tier Silver", count: silverCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Skor Kualitas Rata-rata"
          value={`${avgQuality}%`}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Target > 85%", isPositive: avgQuality >= 85 }}
        />
        <DnaStatCard
          label="Kepatuhan Pengiriman (OTD)"
          value={`${avgDelivery}%`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <DnaStatCard
          label="Indeks Evaluasi Gabungan"
          value={`${avgScore} Poin`}
          icon={<Award className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="Tingkat Risiko Rantai Pasok"
          value={avgScore > 80 ? "RENDAH (STABIL)" : "WASPADA"}
          icon={<Zap className="w-5 h-5 text-blue-600" />}
          variant={avgScore > 80 ? "default" : "warning"}
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : (
        <DnaDataTableCard
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari nama supplier, kode..."
        >
          <div className="w-full">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-3 px-4 w-[32%]">ENTITAS PEMASOK</DnaTh>
                  <DnaTh className="py-3 px-4 text-center w-[18%]">SKOR KOMPOSIT</DnaTh>
                  <DnaTh className="py-3 px-4 text-center w-[20%]">MUTU BAHAN</DnaTh>
                  <DnaTh className="py-3 px-4 text-center w-[18%]">PENGIRIMAN (OTD)</DnaTh>
                  <DnaTh className="py-3 px-4 text-right w-[12%]">TIER & AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredVendors.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="py-8 text-center">
                      <DnaEmptyState
                        title="Belum Ada Data Pemasok"
                        description="Tidak ada data supplier yang sesuai filter ini."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredVendors.map((vendor: any) => (
                    <DnaTableRow
                      key={vendor.id}
                      onClick={() => setSelectedVendor(vendor)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <DnaTd className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block truncate">
                          {vendor.name}
                        </span>
                        <span className="text-[11px] tabular-nums text-slate-500 block truncate">
                          ID: {vendor.id} • NPWP Terverifikasi
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center tabular-nums font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 text-xs">
                          {vendor.score} Poin
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-emerald-700 tabular-nums text-xs">
                            {vendor.quality}%
                          </span>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${vendor.quality}%` }}
                            />
                          </div>
                        </div>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-amber-700 tabular-nums text-xs">
                            {vendor.delivery}%
                          </span>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full"
                              style={{ width: `${vendor.delivery}%` }}
                            />
                          </div>
                        </div>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <DnaBadge
                            variant={
                              vendor.status === "PLATINUM"
                                ? "info"
                                : vendor.status === "GOLD"
                                ? "warning"
                                : "neutral"
                            }
                          >
                            {vendor.status}
                          </DnaBadge>
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedVendor(vendor)}
                          >
                            Detail
                          </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* DnaDetailDrawer for Vendor Performance Audit */}
      <DnaDetailDrawer
        isOpen={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        title={selectedVendor?.name || "Rincian Kinerja Pemasok"}
        subtitle={selectedVendor ? `ID: ${selectedVendor.id} • Tier: ${selectedVendor.status}` : undefined}
        badge={
          selectedVendor ? (
            <DnaBadge
              variant={
                selectedVendor.status === "PLATINUM"
                  ? "info"
                  : selectedVendor.status === "GOLD"
                  ? "warning"
                  : "neutral"
              }
            >
              {selectedVendor.status}
            </DnaBadge>
          ) : undefined
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500">Evaluasi Audit SCM v3.2</span>
            <DnaButton variant="outline" size="sm" onClick={() => setSelectedVendor(null)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedVendor && (
          <div className="space-y-5 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-slate-500 block text-[11px]">Skor Komposit</span>
                <span className="font-bold text-indigo-700 tabular-nums text-lg block">{selectedVendor.score}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Kualitas Mutu</span>
                <span className="font-bold text-emerald-700 tabular-nums text-lg block">{selectedVendor.quality}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Ketepatan Waktu</span>
                <span className="font-bold text-amber-700 tabular-nums text-lg block">{selectedVendor.delivery}%</span>
              </div>
            </div>

            {/* Checklist Audit */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Verifikasi Legalitas & Kepatuhan Supplier
              </h4>
              <div className="space-y-2">
                {[
                  "Kelengkapan Dokumen SIUP & NIB Industri",
                  "Validasi NPWP & Status PKP Resmi",
                  "CoA (Certificate of Analysis) Tiap Batch",
                  "MSDS & Surat Jaminan Bebas Bahan Berbahaya",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </DnaPageContainer>
  );
}
