"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FlaskConical,
  Search,
  Plus,
  Eye,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaBadge,
  useDnaToast,
} from "@/components/dna";

interface ScheduleMixingItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  product: string;
  targetPcs: number;
  upscalePercent: number;
  upscaleResult: number;
  unit: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

const INITIAL_SCHEDULES: ScheduleMixingItem[] = [
  {
    id: "SCH-001",
    code: "SCH-MIX-2026-0001",
    date: "2026-09-17",
    batchRecord: "BR-2026-0001",
    salesOrder: "SO-202609-000004",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    targetPcs: 3000,
    upscalePercent: 10,
    upscaleResult: 330,
    unit: "kg",
    status: "SCHEDULED",
    notes: "Formula Day Cream SPF 30, homogenizer speed 3200 RPM, suhu 75C"
  },
  {
    id: "SCH-002",
    code: "SCH-MIX-2026-0002",
    date: "2026-09-18",
    batchRecord: "BR-2026-0002",
    salesOrder: "SO-202609-000005",
    customer: "K-Skin Men",
    product: "Facial Foam Charcoal 100ml",
    targetPcs: 5000,
    upscalePercent: 8,
    upscaleResult: 540,
    unit: "kg",
    status: "SCHEDULED",
    notes: "Pemanasan fasa minyak dan dispersi active charcoal homogen"
  },
  {
    id: "SCH-003",
    code: "SCH-MIX-2026-0003",
    date: "2026-09-14",
    batchRecord: "BR-2026-0003",
    salesOrder: "SO-202609-000008",
    customer: "Anita Aesthetics",
    product: "Moisturizer Gel Aloe 50gr",
    targetPcs: 1500,
    upscalePercent: 5,
    upscaleResult: 78.75,
    unit: "kg",
    status: "COMPLETED",
    notes: "Batch selesai dengan viskositas optimal sesuai spek R&D"
  }
];

export default function ScheduleMixingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Jadwal Mixing...</div>}>
      <ScheduleMixingContent />
    </Suspense>
  );
}

function ScheduleMixingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const { toast } = useDnaToast();

  const [schedules, setSchedules] = useState<ScheduleMixingItem[]>(INITIAL_SCHEDULES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedItem, setSelectedItem] = useState<ScheduleMixingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `SCH-MIX-2026-${String(schedules.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    batchRecord: "BR-2026-0001",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    targetPcs: 3000,
    nettoPerPcs: 100, // gr
    upscalePercent: 10,
    notes: ""
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  // Base Result = (targetPcs * nettoPerPcs) / 1000 in kg
  const baseResult = (formData.targetPcs * formData.nettoPerPcs) / 1000;
  // Upscale Result = baseResult * (1 + upscalePercent / 100)
  const calculatedUpscale = baseResult * (1 + formData.upscalePercent / 100);

  const filteredData = useMemo(() => {
    return schedules.filter(item => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchRecord.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [schedules, searchTerm, statusFilter]);

  const totalScheduled = schedules.filter(s => s.status === "SCHEDULED").length;
  const totalCompleted = schedules.filter(s => s.status === "COMPLETED").length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newSch: ScheduleMixingItem = {
      id: `SCH-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      batchRecord: formData.batchRecord,
      salesOrder: "SO-202609-000004",
      customer: formData.customer,
      product: formData.product,
      targetPcs: Number(formData.targetPcs),
      upscalePercent: Number(formData.upscalePercent),
      upscaleResult: Number(calculatedUpscale.toFixed(2)),
      unit: "kg",
      status: "SCHEDULED",
      notes: formData.notes
    };

    setSchedules([newSch, ...schedules]);
    setIsCreateOpen(false);
    toast({
      title: "Jadwal Mixing Dibuat",
      description: `SPK Jadwal Mixing ${newSch.code} berhasil disimpan.`,
      variant: "success"
    });
    if (actionParam === "create") {
      router.push("/schedule-mixing");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <DnaBadge status="warning">Terjadwal</DnaBadge>;
      case "IN_PROGRESS":
        return <DnaBadge status="info">Proses Mixing</DnaBadge>;
      case "COMPLETED":
        return <DnaBadge status="success">Selesai</DnaBadge>;
      case "CANCELLED":
        return <DnaBadge status="danger">Batal</DnaBadge>;
      default:
        return <DnaBadge status="default">{status}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Jadwal Pra-Produksi Mixing"
        description="Perencanaan dan penjadwalan proses peleburan, dispersi, dan homogenisasi formula bulk kosmetik"
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setIsCreateOpen(true);
              router.push("/schedule-mixing/create");
            }}
          >
            + Buat Jadwal Mixing
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Jadwal Mixing"
          value={schedules.length.toString()}
          icon={FlaskConical}
          variant="default"
          subtext="Akumulasi batch terjadwal"
        />
        <DnaStatCard
          title="Menunggu Eksekusi"
          value={totalScheduled.toString()}
          icon={Clock}
          variant="warning"
          subtext="Siap masuk bejana mixing"
        />
        <DnaStatCard
          title="Batch Selesai"
          value={totalCompleted.toString()}
          icon={CheckCircle2}
          variant="success"
          subtext="Lolos uji homogenitas QC"
        />
        <DnaStatCard
          title="Toleransi Upscale"
          value="5% - 10%"
          icon={TrendingUp}
          variant="info"
          subtext="Kompensasi dead volume mesin"
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode jadwal, batch, pelanggan, produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="SCHEDULED">Terjadwal</option>
            <option value="IN_PROGRESS">Proses</option>
            <option value="COMPLETED">Selesai</option>
          </select>
        </div>
      </div>

      {/* 1:1 Table (Exactly 10 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Jadwal Pra-Produksi Mixing">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Batch Record</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4 text-right">Target (PCS)</th>
                <th className="py-3 px-4 text-right">Hasil Upscale</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada jadwal mixing ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{item.code}</td>
                    <td className="py-3 px-4 text-slate-600">{item.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{item.batchRecord}</td>
                    <td className="py-3 px-4 text-slate-900 font-medium">{item.customer}</td>
                    <td className="py-3 px-4 text-slate-800">{item.product}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {item.targetPcs.toLocaleString()} PCS
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600">
                      {item.upscaleResult.toLocaleString()} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailOpen(true);
                          }}
                        >
                          Lihat
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Printer className="h-3.5 w-3.5 text-slate-600" />}
                          onClick={() => {
                            toast({
                              title: "Mencetak SPK Mixing",
                              description: `Mengunduh PDF SPK Mixing ${item.code}`,
                              variant: "info"
                            });
                          }}
                        >
                          Print
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail (1:1 Legacy G-SERP Modal Detail) */}
      <DnaModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Jadwal Mixing: ${selectedItem?.code || ""}`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Jadwal</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.code}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Batch Record</p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedItem.batchRecord}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Sales Order Ref</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.salesOrder}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Pelanggan</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.customer}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Produk</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.product}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Target Qty</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.targetPcs.toLocaleString()} PCS</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Hasil Upscale</p>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">{selectedItem.upscaleResult} {selectedItem.unit}</p>
              </div>
            </div>

            {selectedItem.notes && (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
                <span className="font-bold">Instruksi Khusus Mixing:</span> {selectedItem.notes}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Form Buat Jadwal (/schedule-mixing/create) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          if (actionParam === "create") {
            router.push("/schedule-mixing");
          }
        }}
        title="Buat Jadwal Pra-Produksi Mixing"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch Record *
              </label>
              <select
                value={formData.batchRecord}
                onChange={(e) => setFormData({ ...formData, batchRecord: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="BR-2026-0001">BR-2026-0001 (Farah Derma - Day Cream)</option>
                <option value="BR-2026-0002">BR-2026-0002 (K-Skin Men - Facial Foam)</option>
                <option value="BR-2026-0003">BR-2026-0003 (Anita Aesthetics - Aloe Gel)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Jadwal Mixing *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Qty (PCS) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.targetPcs}
                onChange={(e) => setFormData({ ...formData, targetPcs: Number(e.target.value) })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Netto per PCS (gr/ml) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.nettoPerPcs}
                onChange={(e) => setFormData({ ...formData, nettoPerPcs: Number(e.target.value) })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Result (Otomatis: Target × Netto)
              </label>
              <input
                type="text"
                readOnly
                value={`${baseResult.toFixed(2)} kg`}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-100 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upscale (%) *
              </label>
              <input
                type="number"
                min="0"
                max="50"
                required
                value={formData.upscalePercent}
                onChange={(e) => setFormData({ ...formData, upscalePercent: Number(e.target.value) })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-bold text-blue-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hasil Upscale Total Produksi (Otomatis: Base + Upscale)
              </label>
              <input
                type="text"
                readOnly
                value={`${calculatedUpscale.toFixed(2)} kg`}
                className="w-full text-xs border border-blue-200 rounded-lg p-2.5 bg-blue-50 font-bold text-blue-800 text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan & Instruksi Khusus Mixing
            </label>
            <textarea
              rows={2}
              placeholder="Instruksi suhu fasa air, kecepatan homogenizer, urutan bahan..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                if (actionParam === "create") {
                  router.push("/schedule-mixing");
                }
              }}
            >
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Jadwal Mixing
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
