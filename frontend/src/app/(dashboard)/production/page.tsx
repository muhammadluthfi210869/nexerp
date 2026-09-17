"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Factory,
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Eye,
  Layers,
  ArrowRight,
  FlaskConical,
  Package,
  Boxes,
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
} from "@/components/dna";

interface ProductionRealizationRow {
  id: string;
  date: string;
  realizationNo: string;
  scheduleCode: string;
  stage: "MIXING" | "FILLING" | "PACKAGING";
  customer: string;
  product: string;
  qty: number;
  status: "PROSES" | "SELESAI" | "PENDING";
  operator: string;
  notes?: string;
}

const INITIAL_REALIZATIONS: ProductionRealizationRow[] = [
  {
    id: "r1",
    date: "2026-09-20",
    realizationNo: "RLZ-MIX-2026-0001",
    scheduleCode: "SCH-MIX-2026-0001",
    stage: "MIXING",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    qty: 157,
    status: "SELESAI",
    operator: "Ahmad Fauzi",
    notes: "Pengolahan ruahan 157.2 Kg lolos uji viskositas & pH"
  },
  {
    id: "r2",
    date: "2026-09-20",
    realizationNo: "RLZ-FIL-2026-0001",
    scheduleCode: "SCH-FIL-2026-0001",
    stage: "FILLING",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    qty: 2980,
    status: "PROSES",
    operator: "Budi Santoso",
    notes: "Pengisian pot acrylic 50g jar, batch 1 berjalan lancar"
  },
  {
    id: "r3",
    date: "2026-09-20",
    realizationNo: "RLZ-PKG-2026-0001",
    scheduleCode: "SCH-PKG-2026-0001",
    stage: "PACKAGING",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30 (BJD)",
    qty: 2970,
    status: "PROSES",
    operator: "Rina Marlina",
    notes: "Pelabelan hologram & inner box 6-pack conveyor"
  },
  {
    id: "r4",
    date: "2026-09-19",
    realizationNo: "RLZ-MIX-2026-0002",
    scheduleCode: "SCH-MIX-2026-0002",
    stage: "MIXING",
    customer: "Glow Skin Official",
    product: "Brightening Serum",
    qty: 155,
    status: "SELESAI",
    operator: "Ahmad Fauzi",
    notes: "Selesai ruahan serum jernih homogen"
  },
  {
    id: "r5",
    date: "2026-09-21",
    realizationNo: "RLZ-FIL-2026-0002",
    scheduleCode: "SCH-FIL-2026-0002",
    stage: "FILLING",
    customer: "Glow Skin Official",
    product: "Brightening Serum",
    qty: 4975,
    status: "SELESAI",
    operator: "Budi Santoso",
    notes: "Filling botol dropper 30ml selesai"
  }
];

export default function ProductionDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [selectedRealization, setSelectedRealization] = useState<ProductionRealizationRow | null>(null);

  const filteredRealizations = useMemo(() => {
    return INITIAL_REALIZATIONS.filter((row) => {
      const matchSearch =
        row.realizationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.scheduleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.customer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStage = filterStage === "ALL" || row.stage === filterStage;
      return matchSearch && matchStage;
    });
  }, [searchTerm, filterStage]);

  // Exact 4 KPI cards matching legacy G-SERP:
  // "0 Jadwal Mixing (Proses); 0 Jadwal Filling (Proses); 0 Jadwal Packaging (Proses); 0 Produksi Selesai (Bulan Ini)"
  const kpiMixingProses = INITIAL_REALIZATIONS.filter((r) => r.stage === "MIXING" && r.status === "PROSES").length;
  const kpiFillingProses = INITIAL_REALIZATIONS.filter((r) => r.stage === "FILLING" && r.status === "PROSES").length;
  const kpiPackagingProses = INITIAL_REALIZATIONS.filter((r) => r.stage === "PACKAGING" && r.status === "PROSES").length;
  const kpiSelesaiBulanIni = INITIAL_REALIZATIONS.filter((r) => r.status === "SELESAI").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <DnaPageHeader
          title="D. Produksi"
          subtitle="Dasbor Operasional & Realisasi Jalur Produksi Kosmetik (Mixing, Filling, Packaging)"
        />
        <div className="flex items-center gap-2">
          <Link href="/production/schedule-calendar">
            <DnaButton variant="secondary" size="sm">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Kalender Jadwal
            </DnaButton>
          </Link>
          <Link href="/production/realization-calendar">
            <DnaButton variant="secondary" size="sm">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Kalender Realisasi
            </DnaButton>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards Matching 1:1 Legacy G-SERP */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Jadwal Mixing (Proses)"
          value={`${kpiMixingProses} Jadwal`}
          subtext="Sedang berjalan di bejana"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="Jadwal Filling (Proses)"
          value={`${kpiFillingProses} Jadwal`}
          subtext="Sedang berjalan di line filling"
          icon={<Package className="w-5 h-5 text-purple-600" />}
        />
        <DnaStatCard
          label="Jadwal Packaging (Proses)"
          value={`${kpiPackagingProses} Jadwal`}
          subtext="Sedang berjalan di line kemas"
          icon={<Boxes className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="Produksi Selesai (Bulan Ini)"
          value={`${kpiSelesaiBulanIni} Batch`}
          subtext="Lolos verifikasi realisasi"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* Navigation Quicklinks to 3 Production Stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/production/mixing"
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Produksi Mixing
              </div>
              <div className="text-[11px] text-slate-500">Pengolahan formula ruahan</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          href="/production/filling"
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-purple-500 hover:shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Produksi Filling
              </div>
              <div className="text-[11px] text-slate-500">Pengisian ke kemasan primer</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
        </Link>

        <Link
          href="/production/packaging"
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Produksi Packaging
              </div>
              <div className="text-[11px] text-slate-500">Pengemasan sekunder & master box</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </Link>
      </div>

      {/* Table: Tanggal, No Realisasi, Kode Jadwal, Status, Aksi (Exact 1:1 Legacy Columns) */}
      <DnaDataTableCard
        title="Daftar Realisasi Produksi"
        description="Ringkasan aktivitas realisasi produksi pabrik pada semua lini per hari ini"
        actions={
          <div className="flex items-center gap-2">
            <div className="w-64">
              <DnaInput
                placeholder="Cari no realisasi, jadwal, produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Tahap</option>
              <option value="MIXING">Mixing</option>
              <option value="FILLING">Filling</option>
              <option value="PACKAGING">Packaging</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3">No Realisasi</th>
                <th className="px-3.5 py-3">Kode Jadwal</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRealizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3.5 py-8 text-center text-slate-400">
                    Tidak ada catatan realisasi produksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredRealizations.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3 text-slate-700 whitespace-nowrap">{row.date}</td>
                    <td className="px-3.5 py-3 font-semibold text-slate-800 font-mono">{row.realizationNo}</td>
                    <td className="px-3.5 py-3 font-mono text-blue-600">{row.scheduleCode}</td>
                    <td className="px-3.5 py-3 text-center">
                      <DnaBadge variant={row.status === "SELESAI" ? "success" : "primary"}>
                        {row.status}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedRealization(row)}
                        className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* DETAIL MODAL REALISASI */}
      <DnaModal
        isOpen={!!selectedRealization}
        onClose={() => setSelectedRealization(null)}
        title="Detail Realisasi Produksi"
        size="md"
      >
        {selectedRealization && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">No Realisasi</span>
                <span className="font-bold font-mono text-slate-800">{selectedRealization.realizationNo}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Tanggal</span>
                <span className="font-medium text-slate-800">{selectedRealization.date}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Kode Jadwal</span>
                <span className="font-mono text-blue-600 font-semibold">{selectedRealization.scheduleCode}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Tahap Produksi</span>
                <span className="font-semibold text-slate-800">{selectedRealization.stage}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg col-span-2">
                <span className="text-slate-400 block">Produk & Pelanggan</span>
                <span className="font-bold text-slate-900">{selectedRealization.product}</span>
                <span className="text-slate-500 block text-[11px]">{selectedRealization.customer}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Realisasi Qty</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {selectedRealization.qty.toLocaleString()} {selectedRealization.stage === "MIXING" ? "Kg" : "PCS"}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Status</span>
                <DnaBadge variant={selectedRealization.status === "SELESAI" ? "success" : "primary"}>
                  {selectedRealization.status}
                </DnaBadge>
              </div>
            </div>

            {selectedRealization.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-semibold text-slate-700 block mb-0.5">Catatan:</span>
                <span className="text-slate-600">{selectedRealization.notes}</span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <DnaButton variant="secondary" size="sm" onClick={() => setSelectedRealization(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </div>
  );
}
