"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Package,
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
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

interface SchedulePackagingItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  product: string;
  targetPcs: number;
  secondaryPackaging: string;
  packagingQty: number;
  creator: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

const INITIAL_SCHEDULES: SchedulePackagingItem[] = [];

export default function SchedulePackagingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Jadwal Packaging...</div>}>
      <SchedulePackagingContent />
    </Suspense>
  );
}

function SchedulePackagingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const { toast } = useDnaToast();

  const { data: serverSchedules } = useQuery({
    queryKey: ["production-schedules-packaging"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules?stage=PACKING");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped.map((item: any, idx: number) => ({
            id: item.id || `SCH-${idx}`,
            code: item.scheduleNumber || `SCH-PKG-2026-${String(idx + 1).padStart(4, "0")}`,
            date: item.startTime ? String(item.startTime).slice(0, 10) : new Date().toISOString().slice(0, 10),
            batchRecord: item.workOrder?.woNumber || "BR-2026-0001",
            salesOrder: item.workOrder?.lead?.clientName || "SO-202609-000004",
            customer: item.workOrder?.lead?.clientName || "Farah Derma Clinic",
            product: item.workOrder?.lead?.brandName || "Day Cream SPF 30",
            targetPcs: Number(item.targetQty) || 3000,
            secondaryPackaging: item.notes || "Dus Inner Box Day Cream",
            packagingQty: Number(item.targetQty) || 3050,
            creator: "Operator Packaging",
            status: item.status || "SCHEDULED",
            notes: item.notes || "",
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch packaging schedules", err);
      }
      return [];
    },
  });

  const [localSchedules, setLocalSchedules] = useState<SchedulePackagingItem[]>([]);
  const schedules = useMemo(() => {
    return [...localSchedules, ...(serverSchedules || [])];
  }, [localSchedules, serverSchedules]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedItem, setSelectedItem] = useState<SchedulePackagingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `SCH-PKG-2026-${String(schedules.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    batchRecord: "BR-2026-0001",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    targetPcs: 3000,
    secondaryPackaging: "Dus Inner Box Day Cream",
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
    const newSch: SchedulePackagingItem = {
      id: `SCH-PKG-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      batchRecord: formData.batchRecord,
      salesOrder: "SO-202609-000004",
      customer: formData.customer,
      product: formData.product,
      targetPcs: Number(formData.targetPcs),
      secondaryPackaging: formData.secondaryPackaging,
      packagingQty: Number(formData.packagingQty),
      creator: "Super Admin",
      status: "SCHEDULED",
      notes: formData.notes
    };

    setLocalSchedules([newSch, ...localSchedules]);
    setIsCreateOpen(false);
    toast({
      title: "Jadwal Packaging Dibuat",
      description: `SPK Jadwal Packaging ${newSch.code} berhasil disimpan.`,
      variant: "success"
    });
    if (actionParam === "create") {
      router.push("/schedule-packaging");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <DnaBadge variant="warning">Terjadwal</DnaBadge>;
      case "IN_PROGRESS":
        return <DnaBadge variant="info">Proses Packaging</DnaBadge>;
      case "COMPLETED":
        return <DnaBadge variant="success">Selesai</DnaBadge>;
      default:
        return <DnaBadge variant="default">{status}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Jadwal Pra-Produksi Packaging"
        description="Perencanaan pengemasan sekunder, pelabelan batch exp date, sealing shrink wrap, dan packing kardus karton"
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setIsCreateOpen(true);
              router.push("/schedule-packaging/create");
            }}
          >
            + Buat Jadwal Packaging
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Jadwal Packaging"
          value={schedules.length.toString()}
          icon={Package}
          variant="default"
          subtext="Batch terjadwal masuk packing line"
        />
        <DnaStatCard
          title="Menunggu Finishing"
          value={totalScheduled.toString()}
          icon={Clock}
          variant="warning"
          subtext="Inner box & master box siap"
        />
        <DnaStatCard
          title="Selesai Dikemas (BJD)"
          value={totalCompleted.toString()}
          icon={CheckCircle2}
          variant="success"
          subtext="Tersimpan di gudang barang jadi"
        />
        <DnaStatCard
          title="Kepatuhan Segel & Barcode"
          value="100%"
          icon={Sparkles}
          variant="info"
          subtext="Verifikasi nomor notifikasi BPOM"
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
      <DnaDataTableCard title="Daftar Jadwal Pra-Produksi Packaging">
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-12 text-center">#</DnaTh>
                <DnaTh className="py-3 px-4">Kode</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal</DnaTh>
                <DnaTh className="py-3 px-4">Batch Record</DnaTh>
                <DnaTh className="py-3 px-4">Pelanggan</DnaTh>
                <DnaTh className="py-3 px-4">Produk</DnaTh>
                <DnaTh className="py-3 px-4 text-right">Target (PCS)</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Status</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada jadwal packaging ditemukan
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-3 px-4 font-semibold text-blue-600">{item.code}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.date}</DnaTd>
                    <DnaTd className="py-3 px-4 font-medium text-slate-800">{item.batchRecord}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-900 font-medium">{item.customer}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-800">{item.product}</DnaTd>
                    <DnaTd className="py-3 px-4 text-right font-bold text-slate-900">
                      {item.targetPcs.toLocaleString()} PCS
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center">{getStatusBadge(item.status)}</DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
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
                              title: "Mencetak SPK Packaging",
                              description: `Mengunduh PDF SPK Packaging ${item.code}`,
                              variant: "info"
                            });
                          }}
                        >
                          Print
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

      {/* Modal Detail (1:1 Legacy G-SERP Modal Detail) */}
      <DnaModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Jadwal Packaging: ${selectedItem?.code || ""}`}
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

            {/* Sub-table Kemasan Sekunder */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Rincian Kebutuhan Kemasan Sekunder
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                      <DnaTh className="py-2.5 px-3">Nama Kemasan</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Qty Dibutuhkan</DnaTh>
                      <DnaTh className="py-2.5 px-3">Catatan</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    <DnaTableRow>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-400">1</DnaTd>
                      <DnaTd className="py-2.5 px-3 font-medium text-slate-800">{selectedItem.secondaryPackaging}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-600">pcs</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-bold text-blue-600">
                        {selectedItem.packagingQty.toLocaleString()}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-slate-500">Termasuk safety allowance 1.5%</DnaTd>
                    </DnaTableRow>
                  </DnaTableBody>
                </DnaTable>
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

      {/* Modal Form Buat Jadwal (/schedule-packaging/create) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          if (actionParam === "create") {
            router.push("/schedule-packaging");
          }
        }}
        title="Buat Jadwal Pra-Produksi Packaging"
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
                Tanggal Jadwal Packaging *
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
                Kemasan Sekunder / Dus *
              </label>
              <select
                value={formData.secondaryPackaging}
                onChange={(e) => setFormData({ ...formData, secondaryPackaging: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Dus Inner Box Day Cream">Dus Inner Box Day Cream</option>
                <option value="Dus Master Box Corrugated 24-in-1">Dus Master Box Corrugated 24-in-1</option>
                <option value="Dus Satuan Aloe Vera + Leaflet">Dus Satuan Aloe Vera + Leaflet</option>
                <option value="Shrink Film POF 19 Micron">Shrink Film POF 19 Micron</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Qty Kemasan Sekunder Dibutuhkan
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
              Catatan & Instruksi Khusus Packaging
            </label>
            <textarea
              rows={2}
              placeholder="Instruksi cetak exp date, posisi stiker barcode, segel shrink..."
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
                  router.push("/schedule-packaging");
                }
              }}
            >
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Jadwal Packaging
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
