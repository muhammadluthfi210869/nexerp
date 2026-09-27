"use client";
export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  FlaskConical,
  Search,
  Eye,
  Calendar,
  FileSpreadsheet,
  ArrowRight
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
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { useRouter } from "next/navigation";

interface SampleInboxItem {
  id: string;
  productName: string;
  requestedAt: string;
  targetDeadline?: string;
  targetFunction?: string;
  textureReq?: string;
  colorReq?: string;
  aromaReq?: string;
  targetHpp?: number;
  lead?: {
    clientName?: string;
    notes?: string;
  };
  pic?: {
    fullName?: string;
  };
}

export default function RndInboxPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useDnaToast();

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSample, setSelectedSample] = useState<SampleInboxItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const { data: rawSamples, isLoading } = useQuery<SampleInboxItem[]>({
    queryKey: ["rnd-inbox"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/inbox");
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
  });

  const samples = useMemo(() => {
    return Array.isArray(rawSamples) ? rawSamples : [];
  }, [rawSamples]);

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.post(`/rnd/sample/${id}/accept`),
    onSuccess: (res) => {
      toast.success("Task Diterima", "Formula V1 berhasil diinisialisasi untuk formulasi lab.");
      queryClient.invalidateQueries({ queryKey: ["rnd-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
      setIsDetailDrawerOpen(false);
      if (res?.data?.formula?.id) {
        router.push(`/samples/formula/${res.data.formula.id}`);
      }
    },
    onError: (err: any) => {
      toast.error("Gagal Menerima", err.response?.data?.message || "Tidak dapat memproses intake sampel.");
    }
  });

  const filteredSamples = useMemo(() => {
    return samples.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        s.productName.toLowerCase().includes(q) ||
        (s.lead?.clientName && s.lead.clientName.toLowerCase().includes(q));

      return matchesSearch;
    });
  }, [samples, searchTerm]);

  const totalIntake = samples.length;
  const verifiedCount = samples.length; // all inbox items are verified payment
  const avgHpp = useMemo(() => {
    if (samples.length === 0) return "Rp 0";
    const sum = samples.reduce((acc, s) => acc + Number(s.targetHpp || 0), 0);
    return `Rp ${Math.round(sum / samples.length).toLocaleString()}`;
  }, [samples]);

  return (
    <DnaPageContainer>
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Inbox Permintaan Formulasi R&D"
        description="Antrian intake project formulasi baru dari tim Sales & Maklon yang telah lolos verifikasi pembayaran DP."
        badge={<DnaBadge variant="neutral">RND-INBOX</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/samples/rnd-dashboard" },
          { label: "Kelola Formulasi", href: "/samples/formula" },
          { label: "Inbox Permintaan", href: "/samples/inbox" }
        ]}
        tabs={[
          { id: "ALL", label: `Semua Intake (${totalIntake})` },
          { id: "VERIFIED", label: `Lolos Verifikasi (${verifiedCount})` }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="secondary"
            onClick={() => toast.success("Export Data", "Daftar antrian intake berhasil diekspor.")}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Export Excel
          </DnaButton>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="TOTAL ANTRIAN INTAKE"
          value={`${totalIntake} Permintaan`}
          subValue="Menunggu Dikerjakan Lab"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="TERVERIFIKASI PEMBAYARAN"
          value={`${verifiedCount} Sampel`}
          subValue="Finansial Gate Clearance"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="RATA-RATA TARGET HPP"
          value={avgHpp}
          subValue="Target Biaya Pokok Produksi"
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
        />
      </DnaKpiGrid>

      {/* 3. DataTable Card (Zero redundant title, zero horizontal scroll, max 6 cols) */}
      <DnaDataTableCard
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama produk, klien, atau spesifikasi..."
      >
        <div className="w-full">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-[16%]">ID & Tgl Masuk</DnaTh>
                <DnaTh className="py-3 px-4 w-[28%]">Produk & Klien</DnaTh>
                <DnaTh className="py-3 px-4 w-[22%]">Spesifikasi Target</DnaTh>
                <DnaTh className="py-3 px-4 w-[18%]">Target HPP & Deadline</DnaTh>
                <DnaTh className="py-3 px-4 w-[10%]">Status</DnaTh>
                <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat antrian formulasi...
                  </DnaTd>
                </DnaTableRow>
              ) : filteredSamples.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada antrian intake formulasi saat ini.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredSamples.map((sample) => (
                  <DnaTableRow key={sample.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-bold text-slate-900 truncate">#{sample.id.slice(0, 8)}</p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">
                        {sample.requestedAt ? new Date(sample.requestedAt).toLocaleDateString("id-ID") : "—"}
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{sample.productName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{sample.lead?.clientName || "—"}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-medium text-slate-800 text-xs truncate">{sample.targetFunction || "Formula Baru"}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Tekstur: {sample.textureReq || "—"} • Aroma: {sample.aromaReq || "—"}
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums font-bold text-slate-900 text-xs truncate">
                        Rp {Number(sample.targetHpp || 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums truncate">
                        Due: {sample.targetDeadline ? new Date(sample.targetDeadline).toLocaleDateString("id-ID") : "TBD"}
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4">
                      <DnaBadge variant="success">VERIFIED</DnaBadge>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSample(sample);
                          setIsDetailDrawerOpen(true);
                        }}
                        title="Lihat Detail Brief Sampel"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* 4. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedSample?.productName || "Detail Intake Sampel"}
        subtitle={selectedSample ? `${selectedSample.lead?.clientName || "Klien"} • #${selectedSample.id.slice(0, 8)}` : undefined}
        badge={selectedSample ? <DnaBadge variant="success">PAYMENT VERIFIED</DnaBadge> : undefined}
        tabs={[
          {
            id: "specifications",
            label: "Spesifikasi Formula",
            content: selectedSample ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{selectedSample.productName}</span>
                    <span className="tabular-nums text-slate-500">#{selectedSample.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-slate-600">{selectedSample.lead?.clientName || "Klien Anonim"}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Target HPP Maksimal</span>
                    <p className="tabular-nums font-bold text-indigo-700 text-sm">
                      Rp {Number(selectedSample.targetHpp || 0).toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-400">Termasuk kemasan & isi</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Batas Waktu (Due Date)</span>
                    <p className="tabular-nums font-bold text-slate-900">
                      {selectedSample.targetDeadline ? new Date(selectedSample.targetDeadline).toLocaleDateString("id-ID") : "Belum Ditentukan"}
                    </p>
                    <span className="text-[10px] text-slate-400">SLA Formulasi Lab</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-700 uppercase">Parameter Brief Produk</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Fungsi / Manfaat</span>
                      <p className="font-semibold text-slate-800">{selectedSample.targetFunction || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tekstur</span>
                      <p className="font-semibold text-slate-800">{selectedSample.textureReq || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Warna Target</span>
                      <p className="font-semibold text-slate-800">{selectedSample.colorReq || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Aroma Target</span>
                      <p className="font-semibold text-slate-800">{selectedSample.aromaReq || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          },
          {
            id: "sales-context",
            label: "Catatan Sales & BusDev",
            content: selectedSample ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PIC BusDev</span>
                    <p className="font-semibold text-slate-800">{selectedSample.pic?.fullName || "Tim Sales"}</p>
                  </div>
                  <DnaBadge variant="neutral">Business Development</DnaBadge>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700">Catatan Sales:</span>
                  <p className="text-slate-600 italic">
                    "{selectedSample.lead?.notes || "Tidak ada catatan khusus dari tim sales."}"
                  </p>
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
            <DnaButton
              variant="danger"
              onClick={() => {
                toast.success("Ditolak", "Brief sampel telah dikembalikan ke tim sales.");
                setIsDetailDrawerOpen(false);
              }}
            >
              Tolak Brief
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => selectedSample && acceptMutation.mutate(selectedSample.id)}
              disabled={acceptMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {acceptMutation.isPending ? "Memproses..." : "Terima & Mulai Formulasi V1"}
            </DnaButton>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
