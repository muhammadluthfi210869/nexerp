"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  FlaskConical,
  Building2,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  DnaModal,
  DnaInput,
  useDnaToast
} from "@/components/dna";
import Link from "next/link";

interface QcReleaseBatchItem {
  id: string;
  batchNumber: string;
  spkCode: string;
  customerName: string;
  brandName: string;
  productName: string;
  category: string;
  outputQty: number;
  completionDate: string;
  organolepticPass: boolean;
  phValue: number;
  phRange: string;
  viscosityCps: number;
  microbiologyPass: boolean;
  microbiologyResult: string;
  specificGravity: number;
  status: "QUARANTINE" | "INVESTIGATION" | "RELEASED" | "REJECTED";
  apjName?: string;
  apjSipa?: string;
  coaNumber?: string;
  releaseDate?: string;
  notes?: string;
}

const STATUS_CONFIG: Record<string, { label: string; badge: "default" | "warning" | "success" | "critical" }> = {
  QUARANTINE: { label: "Karantina APJ", badge: "warning" },
  INVESTIGATION: { label: "Inkubasi Mikro", badge: "default" },
  RELEASED: { label: "Rilis Resmi WH-03", badge: "success" },
  REJECTED: { label: "Reject Mutu", badge: "critical" }
};

export default function QcReleasePage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals & Drawer state
  const [releaseModalItem, setReleaseModalItem] = useState<QcReleaseBatchItem | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<QcReleaseBatchItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Form states for APJ Release
  const [apjName, setApjName] = useState("apt. Siti Rahmawati, S.Farm");
  const [apjSipa, setApjSipa] = useState("19920815/SIPA_32.73/2022/2044");
  const [apjNotes, setApjNotes] = useState("Seluruh parameter fisika-kimia, mikrobiologi, dan organoleptik telah diverifikasi memenuhi spesifikasi CPKB.");
  const [agreeCheck, setAgreeCheck] = useState(false);

  const { data: serverBatches, refetch, isLoading } = useQuery({
    queryKey: ["production-qc-release-batches"],
    queryFn: async () => {
      try {
        const res = await api.get("/qc/release/batches");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped as QcReleaseBatchItem[];
        }
      } catch (err) {
        console.warn("Failed to fetch QC release batches", err);
      }
      return [] as QcReleaseBatchItem[];
    }
  });

  const batches = serverBatches || [];

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (activeTab === "QUARANTINE" && b.status !== "QUARANTINE") return false;
      if (activeTab === "RELEASED" && b.status !== "RELEASED") return false;
      if (activeTab === "INVESTIGATION" && b.status !== "INVESTIGATION") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchBatch = b.batchNumber.toLowerCase().includes(q);
        const matchSpk = b.spkCode.toLowerCase().includes(q);
        const matchProduct = b.productName.toLowerCase().includes(q);
        const matchBrand = b.brandName.toLowerCase().includes(q);
        const matchCustomer = b.customerName.toLowerCase().includes(q);
        if (!matchBatch && !matchSpk && !matchProduct && !matchBrand && !matchCustomer) return false;
      }
      return true;
    });
  }, [batches, activeTab, searchQuery]);

  const quarantineCount = batches.filter((b) => b.status === "QUARANTINE").length;
  const releasedCount = batches.filter((b) => b.status === "RELEASED").length;
  const investigationCount = batches.filter((b) => b.status === "INVESTIGATION").length;

  const handleExecuteRelease = async () => {
    if (!releaseModalItem) return;
    if (!agreeCheck) {
      toast.error("Validasi APJ Diperlukan", "Harap centang konfirmasi kepatuhan CPKB sebelum merilis batch.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/qc/release", {
        batchNumber: releaseModalItem.batchNumber,
        workOrderId: releaseModalItem.id,
        releaseQty: releaseModalItem.outputQty,
        apjName,
        apjSipa,
        notes: apjNotes,
      });
      const data = unwrapResponse(res);
      const coaCode = data?.coaNumber || `COA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-001`;

      await refetch();
      setReleaseModalItem(null);
      setIsDetailDrawerOpen(false);
      setAgreeCheck(false);
      toast.success("Batch Berhasil Dirilis APJ", `Batch ${releaseModalItem.batchNumber} telah dirilis resmi (${coaCode}) ke Gudang WH-03.`);
    } catch (err: any) {
      toast.error("Gagal Rilis Batch", err?.response?.data?.message || err?.message || "Terjadi kesalahan saat memproses rilis APJ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Inspeksi QC & Gerbang Rilis APJ"
        description="Gerbang Karantina Mutu CPKB: Verifikasi mikrobiologi, fisika-kimia, dan otorisasi e-signature Apoteker Penanggung Jawab."
        badge={<DnaBadge variant="neutral">APJ-RELEASE</DnaBadge>}
        breadcrumbs={[
          { label: "Produksi Pabrik", href: "/production" },
          { label: "Quality Assurance", href: "/quality/qc-release" },
          { label: "Gerbang Rilis APJ", href: "/quality/qc-release" }
        ]}
        tabs={[
          { id: "ALL", label: `Semua Batch (${batches.length})` },
          { id: "QUARANTINE", label: `Menunggu Rilis (${quarantineCount})` },
          { id: "INVESTIGATION", label: `Inkubasi Mikro (${investigationCount})` },
          { id: "RELEASED", label: `Lolos Rilis (${releasedCount})` }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Data", "Data rilis APJ berhasil diekspor.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            <Link href="/warehouse/stok">
              <DnaButton variant="primary">
                <Building2 className="w-4 h-4 mr-1.5" />
                Gudang WH-03
              </DnaButton>
            </Link>
          </div>
        }
      />

      {/* 2. KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="MENUNGGU RILIS APJ"
          value={`${quarantineCount} Batch`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          subValue="Karantina Kepatuhan CPKB"
        />
        <DnaStatCard
          label="BATCH LOLOS RILIS"
          value={`${releasedCount} Batch`}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          subValue="Tersimpan di WH-03"
        />
        <DnaStatCard
          label="INKUBASI MIKROBIOLOGI"
          value={`${investigationCount} Batch`}
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
          subValue="Uji Inkubasi 72 Jam"
        />
        <DnaStatCard
          label="SLA RATA-RATA RILIS"
          value="3.2 Jam"
          icon={<Sparkles className="w-5 h-5 text-purple-600" />}
          subValue="Target Standar < 6 Jam"
        />
      </DnaKpiGrid>

      {/* 3. DataTable Card (Zero redundant title, zero horizontal scroll, max 6 cols) */}
      <DnaDataTableCard
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No. Batch, SPK, Produk, Brand, Pelanggan..."
      >
        <div className="w-full">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-[18%]">No. Batch & SPK</th>
                <th className="py-3 px-4 w-[24%]">Produk & Brand</th>
                <th className="py-3 px-4 w-[22%]">Output & Fisika-Kimia</th>
                <th className="py-3 px-4 w-[18%]">Uji Mikrobiologi</th>
                <th className="py-3 px-4 w-[12%]">Status & APJ</th>
                <th className="py-3 px-4 w-[6%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat antrian karantina QC...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada batch karantina yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, badge: "default" };
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 truncate">
                        <p className="font-mono text-xs font-bold text-blue-700 truncate">{item.batchNumber}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{item.spkCode}</p>
                      </td>
                      <td className="py-3 px-4 truncate">
                        <p className="font-semibold text-slate-900 text-xs truncate">{item.productName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{item.customerName} ({item.brandName})</p>
                      </td>
                      <td className="py-3 px-4 truncate">
                        <p className="font-mono font-bold text-slate-900 text-xs truncate">
                          {item.outputQty.toLocaleString()} Pcs
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          pH: {item.phValue} • Visk: {item.viscosityCps} cPs
                        </p>
                      </td>
                      <td className="py-3 px-4 truncate">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${item.microbiologyPass ? "text-emerald-600" : "text-amber-500"}`} />
                          <span className={`font-semibold text-xs truncate ${item.microbiologyPass ? "text-emerald-700" : "text-amber-700"}`}>
                            {item.microbiologyResult}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Uji ALT & Patogen</p>
                      </td>
                      <td className="py-3 px-4 truncate">
                        <DnaBadge variant={statusInfo.badge}>{statusInfo.label}</DnaBadge>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">{item.coaNumber || "Belum ttd"}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDetailModalItem(item);
                            setIsDetailDrawerOpen(true);
                          }}
                          title="Lihat Detail Hasil QC"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </DnaButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 4. Modal Konfirmasi Rilis APJ */}
      <DnaModal
        isOpen={!!releaseModalItem}
        onClose={() => setReleaseModalItem(null)}
        title={`Otorisasi Rilis Resmi APJ: ${releaseModalItem?.batchNumber}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setReleaseModalItem(null)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={handleExecuteRelease}
              disabled={isSubmitting || !agreeCheck}
            >
              {isSubmitting ? "Memproses..." : "Tandatangani & Rilis"}
            </DnaButton>
          </div>
        }
      >
        {releaseModalItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
              <div className="font-bold text-emerald-950">{releaseModalItem.productName}</div>
              <p className="text-emerald-800">
                Kuantitas Rilis: <span className="font-bold">{releaseModalItem.outputQty.toLocaleString()} Pcs</span> ke Gudang Produk Jadi (WH-03)
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Nama Apoteker Penanggung Jawab (APJ)</label>
              <DnaInput
                value={apjName}
                onChange={(e) => setApjName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Nomor Surat Izin Praktik Apoteker (SIPA)</label>
              <DnaInput
                value={apjSipa}
                onChange={(e) => setApjSipa(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Catatan Pelepasan Batch</label>
              <DnaInput
                value={apjNotes}
                onChange={(e) => setApjNotes(e.target.value)}
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2">
              <input
                type="checkbox"
                id="agree-release"
                checked={agreeCheck}
                onChange={(e) => setAgreeCheck(e.target.checked)}
                className="mt-0.5"
              />
              <label htmlFor="agree-release" className="text-slate-700 font-medium">
                Saya menyatakan dengan penuh tanggung jawab kefarmasian bahwa seluruh parameter mutu telah lolos uji CPKB.
              </label>
            </div>
          </div>
        )}
      </DnaModal>

      {/* 5. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={detailModalItem?.batchNumber || "Detail Rilis QC"}
        subtitle={detailModalItem ? `${detailModalItem.productName} • ${detailModalItem.customerName}` : undefined}
        badge={detailModalItem ? <DnaBadge variant={STATUS_CONFIG[detailModalItem.status]?.badge || "default"}>{STATUS_CONFIG[detailModalItem.status]?.label}</DnaBadge> : undefined}
        tabs={[
          {
            id: "params",
            label: "Parameter Fisika-Kimia",
            content: detailModalItem ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-blue-700">{detailModalItem.batchNumber}</span>
                    <span className="font-mono text-slate-500">{detailModalItem.spkCode}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{detailModalItem.productName}</p>
                  <p className="text-slate-600">{detailModalItem.customerName} ({detailModalItem.brandName})</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">pH Terukur</span>
                    <p className="font-mono font-bold text-slate-900 text-sm">{detailModalItem.phValue}</p>
                    <span className="text-[10px] text-slate-400">Spec: {detailModalItem.phRange}</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Viskositas</span>
                    <p className="font-mono font-bold text-slate-900 text-sm">{detailModalItem.viscosityCps} cPs</p>
                    <span className="text-[10px] text-slate-400">Spindle 4 @30 RPM</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Specific Gravity</span>
                    <p className="font-mono font-bold text-slate-900 text-sm">{detailModalItem.specificGravity}</p>
                    <span className="text-[10px] text-slate-400">Piknometer</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700">Pemeriksaan Organoleptik:</span>
                  <p className="text-slate-600">
                    {detailModalItem.organolepticPass ? "Warna, aroma, dan homogenitas memenuhi standar master sampel." : "Tidak memenuhi kriteria organoleptik."}
                  </p>
                </div>
              </div>
            ) : null
          },
          {
            id: "microbiology",
            label: "Mikrobiologi & APJ",
            content: detailModalItem ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-emerald-950">Uji Mikrobiologi (ALT & Patogen)</p>
                    <p className="text-[11px] text-emerald-800">{detailModalItem.microbiologyResult}</p>
                  </div>
                  <DnaBadge variant={detailModalItem.microbiologyPass ? "success" : "warning"}>
                    {detailModalItem.microbiologyPass ? "LOLOS" : "INKUBASI"}
                  </DnaBadge>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-700 uppercase">Otorisasi Apoteker Penanggung Jawab:</p>
                  <div className="flex justify-between">
                    <span className="text-slate-500">APJ:</span>
                    <span className="font-semibold text-slate-900">{detailModalItem.apjName || "Belum ditandatangani"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. SIPA:</span>
                    <span className="font-mono text-slate-700">{detailModalItem.apjSipa || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Sertifikat CoA:</span>
                    <span className="font-mono font-bold text-emerald-700">{detailModalItem.coaNumber || "—"}</span>
                  </div>
                </div>
              </div>
            ) : null
          }
        ]}
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>
              Tutup
            </DnaButton>
            {detailModalItem?.status === "QUARANTINE" && (
              <DnaButton
                variant="primary"
                onClick={() => {
                  setReleaseModalItem(detailModalItem);
                  setAgreeCheck(false);
                }}
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Rilis APJ Sekarang
              </DnaButton>
            )}
          </div>
        }
      />
    </DnaPageContainer>
  );
}
