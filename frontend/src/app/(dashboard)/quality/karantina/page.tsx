"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  RotateCcw,
  Undo2,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Eye,
  Plus,
  FileSpreadsheet,
  Printer,
  Upload,
  Layers,
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
  DnaModal,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect,
  DnaTextarea
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

interface QuarantineItem {
  id: string;
  code: string;
  batchNo: string;
  date: string;
  materialName: string;
  materialCode: string;
  warehouse: string;
  qty: number;
  unit: string;
  defectCategory: "KEMASAN" | "FISIK" | "KIMIA" | "MIKROBIOLOGI" | "LABEL_DOKUMEN";
  defectType: string;
  defectLocation: string;
  estimatedValue: number;
  status: "QUARANTINE" | "DISPOSAL" | "REWORK" | "RETURN_TO_VENDOR";
  executedAt?: string;
  lossAccount?: string;
  evidenceUrl?: string;
}

const FALLBACK_QUARANTINE: QuarantineItem[] = [
  {
    id: "1",
    code: "QRN-2609-001",
    batchNo: "LOT-KMS-2609-012",
    date: "2026-09-08",
    materialName: "Botol Kaca Serum 30ml Amber Pipet",
    materialCode: "KMS-BTL-030A",
    warehouse: "Gudang Karantina Barat (GK-01)",
    qty: 50,
    unit: "PCS",
    defectCategory: "KEMASAN",
    defectType: "Botol Kaca Retak & Bocor",
    defectLocation: "Pallet B-03 Baris 2",
    estimatedValue: 450000,
    status: "QUARANTINE"
  },
  {
    id: "2",
    code: "QRN-2609-002",
    batchNo: "LOT-RAW-2608-041",
    date: "2026-09-05",
    materialName: "Ekstrak Centella Asiatica 10% Liquid",
    materialCode: "RAW-ECA-010L",
    warehouse: "Gudang Karantina Cold Storage (GK-02)",
    qty: 5,
    unit: "KG",
    defectCategory: "KIMIA",
    defectType: "Warna Keruh Mengendap (Off-spec R&D)",
    defectLocation: "Drum C-01",
    estimatedValue: 6250000,
    status: "DISPOSAL",
    executedAt: "2026-09-07",
    lossAccount: "5190 - Biaya Kerugian Produksi & Scrap",
    evidenceUrl: "BA-QC-2609-01.pdf"
  },
  {
    id: "3",
    code: "QRN-2609-003",
    batchNo: "BATCH-FIL-2608-099",
    date: "2026-09-03",
    materialName: "Sunscreen Glow Gel SPF 50 Tube 30ml",
    materialCode: "BSJ-SGG-050T",
    warehouse: "Gudang Karantina Produksi (GK-03)",
    qty: 120,
    unit: "TUBE",
    defectCategory: "FISIK",
    defectType: "Sealing Ekor Tube Miring 2mm",
    defectLocation: "Filling Line 2",
    estimatedValue: 3600000,
    status: "REWORK",
    executedAt: "2026-09-04",
    lossAccount: "5190 - Biaya Kerugian Produksi & Scrap"
  },
  {
    id: "4",
    code: "QRN-2609-004",
    batchNo: "LOT-KMS-2608-072",
    date: "2026-08-30",
    materialName: "Inner Box Hologram Serum Retinol 30ml",
    materialCode: "KMS-BOX-030H",
    warehouse: "Gudang Karantina Kemasan (GK-01)",
    qty: 500,
    unit: "PCS",
    defectCategory: "LABEL_DOKUMEN",
    defectType: "Salah Nomor Notifikasi BPOM Cetak",
    defectLocation: "Pallet A-01",
    estimatedValue: 1250000,
    status: "RETURN_TO_VENDOR",
    executedAt: "2026-09-01"
  }
];

export default function QuarantinePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Modul Karantina...</div>}>
      <QuarantineContent />
    </Suspense>
  );
}

function QuarantineContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<QuarantineItem | null>(null);

  // Form Resolusi Karantina (SCR-EKSEPSI-002)
  const [resolveForm, setResolveForm] = useState({
    refCode: "QRN-2609-001",
    materialName: "Botol Kaca Serum 30ml Amber Pipet",
    qty: 50,
    unit: "PCS",
    action: "Pemusnahan (Disposal)",
    lossAccount: "5190 - Biaya Kerugian Produksi & Scrap",
    evidenceNote: "BA-DISP-2609-001",
    justification: "50 unit botol retak benturan ekspedisi, tidak dapat dirework."
  });

  const activeQuarantineList = useMemo(() => {
    return FALLBACK_QUARANTINE.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.materialName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "ALL" || item.defectCategory === categoryFilter;
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [searchQuery, categoryFilter, statusFilter]);

  const totalInQuarantine = useMemo(() => {
    return FALLBACK_QUARANTINE.filter(i => i.status === "QUARANTINE").length;
  }, []);

  const totalScrapValue = useMemo(() => {
    return FALLBACK_QUARANTINE.reduce((acc, i) => acc + i.estimatedValue, 0);
  }, []);

  const totalResolved = useMemo(() => {
    return FALLBACK_QUARANTINE.filter(i => i.status !== "QUARANTINE").length;
  }, []);

  const handleExecuteResolution = () => {
    toast.success(`Resolusi Karantina ${resolveForm.refCode} berhasil dieksekusi via ${resolveForm.action}!`);
    setIsResolveModalOpen(false);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Gudang Karantina & Resolusi Reject"
        description="Pengelolaan isolasi bahan baku, ruahan, dan produk jadi gagal QC. Eksekusi pemusnahan (disposal), olah ulang (rework), atau retur supplier untuk mencegah nilai mati persediaan."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Dokumen Input Eksepsi: Resolusi Reject (Role: Head of Manufacture)</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Berita Acara
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsResolveModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Eksekusi Resolusi Reject
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Item Aktif Tertahan di Karantina"
          value={`${totalInQuarantine} Batch`}
          icon={<ShieldAlert className="w-6 h-6 text-rose-600" />}
          delta={{ value: "Isolasi Fisik Aktif", isPositive: false }}
          subtext="Menunggu Berita Acara keputusan tindakan"
          variant="danger"
        />
        <DnaStatCard
          label="Taksiran Nilai Scrap & Kerugian"
          value={formatRupiah(totalScrapValue)}
          icon={<Flame className="w-6 h-6 text-amber-600" />}
          delta={{ value: "Alokasi Akun Beban 5190", isPositive: false }}
          subtext="Akumulasi potensi kerugian material cacat"
          variant="warning"
        />
        <DnaStatCard
          label="Resolusi Selesai Dieksekusi"
          value={`${totalResolved} Batch`}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
          delta={{ value: "100% Cleared dari Neraca", isPositive: true }}
          subtext="Dieksekusi via Scrap / Rework / Retur Vendor"
          variant="success"
        />
      </DnaKpiGrid>

      {/* DATA TABLE */}
      <DnaDataTableCard
        title="Daftar Antrean & Riwayat Barang Karantina"
        badge={<DnaBadge variant="default">{activeQuarantineList.length} Item</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari kode/batch/material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <DnaSelect
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              className="text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">Semua Kategori Cacat</option>
              <option value="KEMASAN">Kemasan</option>
              <option value="FISIK">Fisik</option>
              <option value="KIMIA">Kimiawi</option>
              <option value="MIKROBIOLOGI">Mikrobiologi</option>
              <option value="LABEL_DOKUMEN">Label / Dokumen</option>
            </DnaSelect>
            <DnaSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="QUARANTINE">Menunggu Eksekusi</option>
              <option value="DISPOSAL">Pemusnahan (Scrap)</option>
              <option value="REWORK">Olah Ulang (Rework)</option>
              <option value="RETURN_TO_VENDOR">Retur Supplier</option>
            </DnaSelect>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">#</th>
                <th className="px-3.5 py-3">No. Karantina</th>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3">Batch / Lot Ref</th>
                <th className="px-3.5 py-3">Nama Material / Barang</th>
                <th className="px-3.5 py-3 text-right">Qty</th>
                <th className="px-3.5 py-3">Satuan</th>
                <th className="px-3.5 py-3">Kategori Cacat</th>
                <th className="px-3.5 py-3 text-right">Taksiran Nilai</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeQuarantineList.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-3.5 py-2.5 font-mono text-rose-700 font-bold">{item.code}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{item.date}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-700 font-medium">{item.batchNo}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{item.materialName}</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">{item.qty}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 font-medium">{item.unit}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {item.defectCategory}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-800">
                    {formatRupiah(item.estimatedValue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        item.status === "QUARANTINE"
                          ? "danger"
                          : item.status === "DISPOSAL"
                          ? "warning"
                          : "success"
                      }
                    >
                      {item.status === "QUARANTINE"
                        ? "TERTAHAN"
                        : item.status === "DISPOSAL"
                        ? "SCRAP"
                        : item.status === "REWORK"
                        ? "REWORK"
                        : "RETUR"}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedDetail(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Lihat Detail Cacat"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {item.status === "QUARANTINE" && (
                        <button
                          onClick={() => {
                            setResolveForm({
                              refCode: item.code,
                              materialName: item.materialName,
                              qty: item.qty,
                              unit: item.unit,
                              action: "Pemusnahan (Disposal)",
                              lossAccount: "5190 - Biaya Kerugian Produksi & Scrap",
                              evidenceNote: `BA-${item.code}`,
                              justification: `Cacat ${item.defectType} pada ${item.defectLocation}`
                            });
                            setIsResolveModalOpen(true);
                          }}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Eksekusi Resolusi"
                        >
                          <Flame className="w-3 h-3" />
                          Resolusi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* MODAL FORM RESOLUSI REJECT (SPEC: ekspansi-eksepsi.md Section 2) */}
      <DnaModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Form Resolusi Karantina / Reject (Role: Head of Manufacture)"
        size="lg"
      >
        <div className="space-y-3.5 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 leading-relaxed">
            <strong>Protokol Eksepsi Karantina:</strong> Eksekusi barang reject wajib mencatat akun beban kerugian scrap agar saldo persediaan di neraca tetap akurat dan tidak menumpuk nilai aset mati.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">No. Ref QC / Batch Karantina *</label>
              <DnaSelect
                value={resolveForm.refCode}
                onChange={(val) => {
                  const match = FALLBACK_QUARANTINE.find(q => q.code === val);
                  if (match) {
                    setResolveForm({
                      ...resolveForm,
                      refCode: match.code,
                      materialName: match.materialName,
                      qty: match.qty,
                      unit: match.unit
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold"
              >
                {FALLBACK_QUARANTINE.filter(q => q.status === "QUARANTINE").map(q => (
                  <option key={q.id} value={q.code}>
                    {q.code} — {q.batchNo} ({q.materialName})
                  </option>
                ))}
              </DnaSelect>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tindakan Eksekusi *</label>
              <DnaSelect
                value={resolveForm.action}
                onChange={(val) => setResolveForm({ ...resolveForm, action: val })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-rose-800"
              >
                <option value="Pemusnahan (Disposal)">Pemusnahan (Disposal) — Masuk Akun Beban Kerugian</option>
                <option value="Olah Ulang (Rework)">Olah Ulang (Rework) — Formulasi Ulang di Mixing</option>
                <option value="Retur ke Supplier">Retur ke Supplier — Pengembalian via SCM</option>
              </DnaSelect>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Nama Barang / Material (Readonly)</label>
              <DnaInput
                type="text"
                value={resolveForm.materialName}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Qty Tertahan (Readonly)</label>
              <DnaInput
                type="text"
                value={`${resolveForm.qty} ${resolveForm.unit}`}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Akun Kerugian (CoA) *</label>
              <DnaSelect
                value={resolveForm.lossAccount}
                onChange={(val) => setResolveForm({ ...resolveForm, lossAccount: val })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="5190 - Biaya Kerugian Produksi & Scrap">5190 - Biaya Kerugian Produksi & Scrap</option>
                <option value="5110 - Beban Pokok Bahan Baku">5110 - Beban Pokok Bahan Baku</option>
                <option value="6190 - Beban Operasional Lainnya">6190 - Beban Operasional Lainnya</option>
              </DnaSelect>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">No. Berita Acara / Bukti Eksekusi</label>
              <DnaInput
                type="text"
                placeholder="e.g. BA-DISP-2609-001"
                value={resolveForm.evidenceNote}
                onChange={(e) => setResolveForm({ ...resolveForm, evidenceNote: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Alasan Justifikasi & Catatan Lapangan *</label>
            <DnaTextarea
              rows={2}
              placeholder="Jelaskan alasan pemusnahan atau tindakan yang diambil..."
              value={resolveForm.justification}
              onChange={(e) => setResolveForm({ ...resolveForm, justification: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsResolveModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleExecuteResolution}>
              Simpan & Eksekusi Scrap
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* DETAIL MODAL */}
      <DnaModal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title={`Detail Investigasi Cacat: ${selectedDetail?.code}`}
        size="md"
      >
        <div className="space-y-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Material / Batch:</span>
              <strong className="text-slate-800">{selectedDetail?.materialName} ({selectedDetail?.batchNo})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gudang Karantina:</span>
              <strong className="text-slate-800">{selectedDetail?.warehouse}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kuantitas Cacat:</span>
              <strong className="text-rose-700 font-bold">{selectedDetail?.qty} {selectedDetail?.unit}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jenis Cacat:</span>
              <strong className="text-slate-800">{selectedDetail?.defectType}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lokasi Temuan:</span>
              <strong className="text-slate-800">{selectedDetail?.defectLocation}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-900 font-bold">Taksiran Nilai Scrap:</span>
              <strong className="text-rose-700 font-black text-sm">
                {selectedDetail ? formatRupiah(selectedDetail.estimatedValue) : "0"}
              </strong>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedDetail(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
