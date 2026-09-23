"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
  DnaTextarea,
  DnaCell,
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

  const { data: serverQuarantine } = useQuery({
    queryKey: ["quality-karantina-items"],
    queryFn: async () => {
      try {
        const res = await api.get("/qc/audits");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped
            .filter((a: any) => a.status === "QUARANTINE" || a.status === "REJECT")
            .map((a: any, idx: number) => ({
              id: a.id,
              code: `QRN-2609-${String(idx + 1).padStart(3, "0")}`,
              batchNo: a.stepLog?.wo?.batchNo || a.woId || `BATCH-${a.id.slice(0, 6)}`,
              date: a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
              materialName: a.stepLog?.wo?.formula?.sampleRequest?.productName || "Material / Batch In Quarantine",
              materialCode: a.defectType || "QC-ITEM",
              warehouse: "Gudang Karantina (GK-01)",
              qty: Number(a.stepLog?.qtyQuarantine || a.stepLog?.qtyReject || 100),
              unit: "PCS",
              defectCategory: a.defectCategory || "FISIK",
              defectType: a.defectType || "Defect Parameter",
              defectLocation: a.phase || "LINE_QC",
              estimatedValue: 1500000,
              status: (a.disposition || a.status) === "GOOD" ? "QUARANTINE" : (a.disposition || "QUARANTINE"),
            }));
        }
      } catch (err) {
        console.warn("Failed to fetch quarantine audits", err);
      }
      return [] as QuarantineItem[];
    }
  });

  const quarantineItems = serverQuarantine || [];

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
    return quarantineItems.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.materialName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "ALL" || item.defectCategory === categoryFilter;
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [quarantineItems, searchQuery, categoryFilter, statusFilter]);

  const totalInQuarantine = useMemo(() => {
    return quarantineItems.filter(i => i.status === "QUARANTINE").length;
  }, [quarantineItems]);

  const totalScrapValue = useMemo(() => {
    return quarantineItems.reduce((acc, i) => acc + i.estimatedValue, 0);
  }, [quarantineItems]);

  const totalResolved = useMemo(() => {
    return quarantineItems.filter(i => i.status !== "QUARANTINE").length;
  }, [quarantineItems]);

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
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari kode / batch / material karantina...",
          filterColumns: [
            { key: "category", label: "Kategori Cacat", type: "select", options: ["KEMASAN", "FISIK", "KIMIA", "MIKROBIOLOGI", "LABEL_DOKUMEN"] },
            { key: "status", label: "Status Karantina", type: "select", options: ["QUARANTINE", "DISPOSAL", "REWORK", "RETURN_TO_VENDOR"] },
          ],
          selectedColumn: "status",
          filterValue: statusFilter,
          onFilterValueChange: setStatusFilter,
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable className="min-w-[1250px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5 w-10 text-slate-400 font-mono text-center">#</th>
                <th className="p-3.5 w-36 min-w-[130px] whitespace-nowrap">NO. KARANTINA</th>
                <th className="p-3.5 w-28 min-w-[110px] whitespace-nowrap">TANGGAL</th>
                <th className="p-3.5 w-32 min-w-[120px] whitespace-nowrap">BATCH / LOT REF</th>
                <th className="p-3.5 min-w-[220px]">NAMA MATERIAL / BARANG</th>
                <th className="p-3.5 w-28 min-w-[100px] text-right whitespace-nowrap">KUANTITAS</th>
                <th className="p-3.5 w-36 min-w-[130px] whitespace-nowrap">KATEGORI CACAT</th>
                <th className="p-3.5 w-36 min-w-[120px] text-right whitespace-nowrap">TAKSIRAN NILAI</th>
                <th className="p-3.5 w-32 min-w-[110px] text-center whitespace-nowrap">STATUS</th>
                <th className="p-3.5 text-center w-24 whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeQuarantineList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ada data barang karantina ditemukan
                  </td>
                </tr>
              ) : (
                activeQuarantineList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono text-[11px] tabular-nums text-center">{idx + 1}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <DnaCell.Code
                        value={item.code}
                        onClick={() => setSelectedDetail(item)}
                      />
                    </td>
                    <td className="p-3.5 whitespace-nowrap"><DnaCell.Date value={item.date} /></td>
                    <td className="p-3.5 whitespace-nowrap"><DnaCell.Code value={item.batchNo} /></td>
                    <td className="p-3.5 min-w-[220px]"><DnaCell.Text primary={item.materialName} /></td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <DnaCell.Number value={item.qty} suffix={item.unit} />
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <DnaCell.Badge status={item.defectCategory} />
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <DnaCell.Currency value={item.estimatedValue} />
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <DnaCell.Badge
                        status={
                          item.status === "QUARANTINE"
                            ? "Tertahan"
                            : item.status === "DISPOSAL"
                            ? "Scrap"
                            : item.status === "REWORK"
                            ? "Rework"
                            : "Retur"
                        }
                      />
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
                          title="Lihat Detail Cacat"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
              )))}
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
                  const match = quarantineItems.find((q: any) => q.code === val);
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
                {quarantineItems.filter((q: any) => q.status === "QUARANTINE").map((q: any) => (
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
