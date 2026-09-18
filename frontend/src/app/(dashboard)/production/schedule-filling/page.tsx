"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Pipette,
  Search,
  Plus,
  Eye,
  Printer,
  Calendar,
  Layers,
  Sparkles,
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

interface ScheduleFillingItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  product: string;
  targetPcs: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  primaryPackaging: string;
  packagingQty: number;
  creator: string;
  notes?: string;
}

const INITIAL_SCHEDULES: ScheduleFillingItem[] = [
  {
    id: "SCH-FIL-001",
    code: "SCH-FIL-2026-0001",
    date: "2026-09-19",
    batchRecord: "BR-2026-0001",
    salesOrder: "SO-202609-000004",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    targetPcs: 3000,
    primaryPackaging: "Pot Akrilik 15gr Putih",
    packagingQty: 3050,
    creator: "Super Admin",
    status: "SCHEDULED",
    notes: "Filling steril pot akrilik dengan toleransi overfill 0.2 gr"
  },
  {
    id: "SCH-FIL-002",
    code: "SCH-FIL-2026-0002",
    date: "2026-09-20",
    batchRecord: "BR-2026-0002",
    salesOrder: "SO-202609-000005",
    customer: "K-Skin Men",
    product: "Facial Foam Charcoal 100ml",
    targetPcs: 5000,
    primaryPackaging: "Tube Plastik 100ml Matte",
    packagingQty: 5100,
    creator: "Super Admin",
    status: "SCHEDULED",
    notes: "Filling piston nozzle 4-head dan ultrasonic tube sealer"
  },
  {
    id: "SCH-FIL-003",
    code: "SCH-FIL-2026-0003",
    date: "2026-09-15",
    batchRecord: "BR-2026-0003",
    salesOrder: "SO-202609-000008",
    customer: "Anita Aesthetics",
    product: "Moisturizer Gel Aloe 50gr",
    targetPcs: 1500,
    primaryPackaging: "Jar Kaca 50gr Frost",
    packagingQty: 1520,
    creator: "Operator Filling",
    status: "COMPLETED",
    notes: "Lolos uji kebocoran vacuum chamber"
  }
];

export default function ScheduleFillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Jadwal Filling...</div>}>
      <ScheduleFillingContent />
    </Suspense>
  );
}

function ScheduleFillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const { toast } = useDnaToast();

  const [schedules, setSchedules] = useState<ScheduleFillingItem[]>(INITIAL_SCHEDULES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedItem, setSelectedItem] = useState<ScheduleFillingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `SCH-FIL-2026-${String(schedules.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    batchRecord: "BR-2026-0001",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    targetPcs: 3000,
    primaryPackaging: "Pot Akrilik 15gr Putih",
    packagingQty: 3050,
    notes: ""
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

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
    const newSch: ScheduleFillingItem = {
      id: `SCH-FIL-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      batchRecord: formData.batchRecord,
      salesOrder: "SO-202609-000004",
      customer: formData.customer,
      product: formData.product,
      targetPcs: Number(formData.targetPcs),
      primaryPackaging: formData.primaryPackaging,
      packagingQty: Number(formData.packagingQty),
      creator: "Super Admin",
      status: "SCHEDULED",
      notes: formData.notes
    };

    setSchedules([newSch, ...schedules]);
    setIsCreateOpen(false);
    toast({
      title: "Jadwal Filling Dibuat",
      description: `SPK Jadwal Filling ${newSch.code} berhasil disimpan.`,
      variant: "success"
    });
    if (actionParam === "create") {
      router.push("/schedule-filling");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <DnaBadge status="warning">Terjadwal</DnaBadge>;
      case "IN_PROGRESS":
        return <DnaBadge status="info">Proses Filling</DnaBadge>;
      case "COMPLETED":
        return <DnaBadge status="success">Selesai</DnaBadge>;
      default:
        return <DnaBadge status="default">{status}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Jadwal Pra-Produksi Filling"
        description="Perencanaan pengisian cairan / cream formula ke dalam kemasan primer (botol, pot, tube, jar)"
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setIsCreateOpen(true);
              router.push("/schedule-filling/create");
            }}
          >
            + Buat Jadwal Filling
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Jadwal Filling"
          value={schedules.length.toString()}
          icon={Pipette}
          variant="default"
          subtext="Batch terjadwal masuk lini filling"
        />
        <DnaStatCard
          title="Menunggu Pengisian"
          value={totalScheduled.toString()}
          icon={Clock}
          variant="warning"
          subtext="Kemasan primer siap di conveyor"
        />
        <DnaStatCard
          title="Selesai Diisi"
          value={totalCompleted.toString()}
          icon={CheckCircle2}
          variant="success"
          subtext="Siap lanjut ke lini packaging"
        />
        <DnaStatCard
          title="Presisi Nozzle Mesin"
          value="99.8%"
          icon={Sparkles}
          variant="info"
          subtext="Toleransi volume isi standar BPOM"
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

      {/* 1:1 Table (Exactly 9 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Jadwal Pra-Produksi Filling">
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
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada jadwal filling ditemukan
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
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {item.targetPcs.toLocaleString()} PCS
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
                              title: "Mencetak SPK Filling",
                              description: `Mengunduh PDF SPK Filling ${item.code}`,
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
        title={`Detail Jadwal Filling: ${selectedItem?.code || ""}`}
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
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Target Qty (PCS)</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.targetPcs.toLocaleString()} PCS</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Dibuat Oleh</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.creator}</p>
              </div>
            </div>

            {/* Sub-table Kemasan Primer */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Rincian Kebutuhan Kemasan Primer
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Nama Kemasan</th>
                      <th className="py-2.5 px-3 text-center">Satuan</th>
                      <th className="py-2.5 px-3 text-right">Qty Dibutuhkan</th>
                      <th className="py-2.5 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 text-center text-slate-400">1</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{selectedItem.primaryPackaging}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">pcs</td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                        {selectedItem.packagingQty.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">Termasuk safety allowance 1.5%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {selectedItem.notes && (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
                <span className="font-bold">Instruksi Khusus:</span> {selectedItem.notes}
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

      {/* Modal Form Buat Jadwal (/schedule-filling/create) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          if (actionParam === "create") {
            router.push("/schedule-filling");
          }
        }}
        title="Buat Jadwal Pra-Produksi Filling"
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
                Tanggal Jadwal Filling *
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
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData({ ...formData, targetPcs: val, packagingQty: Math.ceil(val * 1.02) });
                }}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kemasan Primer *
              </label>
              <select
                value={formData.primaryPackaging}
                onChange={(e) => setFormData({ ...formData, primaryPackaging: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Pot Akrilik 15gr Putih">Pot Akrilik 15gr Putih</option>
                <option value="Tube Plastik 100ml Matte">Tube Plastik 100ml Matte</option>
                <option value="Jar Kaca 50gr Frost">Jar Kaca 50gr Frost</option>
                <option value="Botol Dropper Amber 20ml">Botol Dropper Amber 20ml</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Qty Kemasan Dibutuhkan (Termasuk Buffer 2%)
              </label>
              <input
                type="number"
                required
                value={formData.packagingQty}
                onChange={(e) => setFormData({ ...formData, packagingQty: Number(e.target.value) })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-bold text-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan & Instruksi Khusus Filling
            </label>
            <textarea
              rows={2}
              placeholder="Instruksi nozzle filling, pembersihan pipa transfer, suhu bulk..."
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
                  router.push("/schedule-filling");
                }
              }}
            >
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Jadwal Filling
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
