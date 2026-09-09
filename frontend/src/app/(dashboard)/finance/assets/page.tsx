"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Building2,
  Plus,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Filter,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Layers,
  Wrench,
  TrendingDown
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
  DnaTabNav,
  useDnaToast,
  formatRupiah
} from "@/components/dna";

interface FixedAssetItem {
  id: string;
  assetCode: string; // e.g. AST-PRD-2024-001
  assetName: string;
  category: "MESIN_PABRIK" | "ALAT_LAB_QC" | "KENDARAAN" | "PERALATAN_KANTOR";
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLifeMonths: number; // e.g. 96 months (8 years)
  accumDepreciation: number;
  bookValue: number;
  location: string;
  department: string;
  status: "ACTIVE" | "UNDER_MAINTENANCE" | "DISPOSED";
}

const FALLBACK_ASSETS: FixedAssetItem[] = [
  {
    id: "ast-1",
    assetCode: "AST-PRD-2024-001",
    assetName: "Vacuum Homogenizer Mixer Vessel 500L (Stainless SUS316L)",
    category: "MESIN_PABRIK",
    acquisitionDate: "2024-01-15",
    acquisitionCost: 450000000,
    usefulLifeMonths: 96,
    accumDepreciation: 121875000,
    bookValue: 328125000,
    location: "Ruang Mixing Pabrik Lt 1",
    department: "Produksi Pabrik",
    status: "ACTIVE"
  },
  {
    id: "ast-2",
    assetCode: "AST-PRD-2024-002",
    assetName: "High-Speed Rotary Automatic Bottle Filling & Capping Line 2",
    category: "MESIN_PABRIK",
    acquisitionDate: "2024-03-20",
    acquisitionCost: 320000000,
    usefulLifeMonths: 96,
    accumDepreciation: 80000000,
    bookValue: 240000000,
    location: "Cleanroom Filling Kelas D",
    department: "Produksi Pabrik",
    status: "ACTIVE"
  },
  {
    id: "ast-3",
    assetCode: "AST-LAB-2024-005",
    assetName: "Digital Brookfield Viscometer DV2T + Incubator Stabilitas",
    category: "ALAT_LAB_QC",
    acquisitionDate: "2024-02-10",
    acquisitionCost: 110000000,
    usefulLifeMonths: 60,
    accumDepreciation: 56833333,
    bookValue: 53166667,
    location: "Lab R&D & Pengujian Mutu",
    department: "R&D & QA",
    status: "ACTIVE"
  }
];

export default function FixedAssetsPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<FixedAssetItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCat, setFormCat] = useState<"MESIN_PABRIK" | "ALAT_LAB_QC" | "KENDARAAN" | "PERALATAN_KANTOR">("MESIN_PABRIK");
  const [formCost, setFormCost] = useState<number>(100000000);
  const [formYears, setFormYears] = useState<number>(8);
  const [formLocation, setFormLocation] = useState("Ruang Mixing Pabrik Lt 1");
  const [formDept, setFormDept] = useState("Produksi Pabrik");

  const { data: serverData } = useQuery({
    queryKey: ["finance-fixed-assets"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/assets");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map
        }
      } catch (err) {
        console.warn("Using fallback fixed assets", err);
      }
      return FALLBACK_ASSETS;
    }
  });

  const assetList = serverData || FALLBACK_ASSETS;

  const filteredList = useMemo(() => {
    return assetList.filter((item) => {
      if (activeTab !== "ALL" && item.category !== activeTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.assetCode.toLowerCase().includes(q);
        const matchName = item.assetName.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchLoc) return false;
      }
      return true;
    });
  }, [assetList, activeTab, searchQuery]);

  const totalAcquisition = assetList.reduce((acc, a) => acc + a.acquisitionCost, 0);
  const totalBookValue = assetList.reduce((acc, a) => acc + a.bookValue, 0);
  const totalAccumDeprec = assetList.reduce((acc, a) => acc + a.accumDepreciation, 0);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formCost <= 0) {
      toast.error("Validasi Gagal", "Harap isi nama aset dan nilai perolehan.");
      return;
    }

    const newItem: FixedAssetItem = {
      id: `ast-${Date.now()}`,
      assetCode: `AST-PRD-2026-${String(assetList.length + 10).padStart(3, "0")}`,
      assetName: formName,
      category: formCat,
      acquisitionDate: new Date().toISOString().slice(0, 10),
      acquisitionCost: Number(formCost),
      usefulLifeMonths: formYears * 12,
      accumDepreciation: 0,
      bookValue: Number(formCost),
      location: formLocation,
      department: formDept,
      status: "ACTIVE"
    };

    assetList.unshift(newItem);
    setIsCreateModalOpen(false);
    toast.success("Aset Tetap Terdaftar", `Aset ${newItem.assetCode} (${newItem.assetName}) telah didaftarkan ke register aset.`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Aset Tetap & Skedul Depresiasi"
        subtitle="Register aktiva tetap manufaktur, mesin bejana homogenizer, alat lab R&D, dan kalkulasi otomatis penyusutan garis lurus"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Fixed Assets & Depreciation</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Daftarkan Aset Baru
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Nilai Perolehan Aset"
          value={formatRupiah(totalAcquisition)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: "Historical Cost", isPositive: true }}
          variant="blue"
        />
        <DnaStatCard
          label="Total Nilai Buku (Book Value)"
          value={formatRupiah(totalBookValue)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          subtext="Net Asset Value"
          variant="success"
        />
        <DnaStatCard
          label="Akumulasi Depresiasi"
          value={formatRupiah(totalAccumDeprec)}
          icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
          subtext="Metode Garis Lurus (Straight Line)"
          variant="warning"
        />
        <DnaStatCard
          label="Total Unit Aset Aktif"
          value={`${assetList.length} Unit`}
          icon={<Boxes className="w-5 h-5 text-purple-600" />}
          subtext="Mesin Pabrik & Alat Lab"
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Register Aset Tetap Perusahaan"
        badge={
          <DnaBadge variant="default">
            {filteredList.length} Unit Aset
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Kategori", badge: assetList.length },
                { id: "MESIN_PABRIK", label: "Mesin Pabrik", badge: assetList.filter((a) => a.category === "MESIN_PABRIK").length },
                { id: "ALAT_LAB_QC", label: "Alat Lab R&D", badge: assetList.filter((a) => a.category === "ALAT_LAB_QC").length }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Kode Aset, Nama, Lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Kode Aset</th>
                <th className="px-3.5 py-3">Nama Aset & Spesifikasi</th>
                <th className="px-3.5 py-3">Kategori</th>
                <th className="px-3.5 py-3">Tgl Perolehan</th>
                <th className="px-3.5 py-3 text-right">Nilai Perolehan</th>
                <th className="px-3.5 py-3 text-right">Akum. Depresiasi</th>
                <th className="px-3.5 py-3 text-right">Nilai Buku</th>
                <th className="px-3.5 py-3">Lokasi & Dept</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3.5 py-3 font-mono font-bold text-blue-900">{item.assetCode}</td>
                  <td className="px-3.5 py-3 font-semibold text-slate-900 max-w-[220px] truncate" title={item.assetName}>
                    {item.assetName}
                  </td>
                  <td className="px-3.5 py-3">
                    <DnaBadge variant="info">
                      {item.category.replace(/_/g, " ")}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-3 text-slate-700">{item.acquisitionDate}</td>
                  <td className="px-3.5 py-3 text-right font-semibold text-slate-900">
                    {formatRupiah(item.acquisitionCost)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-medium text-amber-700">
                    {formatRupiah(item.accumDepreciation)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-extrabold text-emerald-800">
                    {formatRupiah(item.bookValue)}
                  </td>
                  <td className="px-3.5 py-3 text-slate-700">
                    <div className="font-medium">{item.location}</div>
                    <div className="text-[10px] text-slate-400">{item.department}</div>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <DnaButton variant="secondary" size="sm" onClick={() => setDetailItem(item)}>
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL DAFTARKAN ASET BARU */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Daftarkan Aset Tetap Baru"
        size="lg"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Aset & Spesifikasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Vacuum Homogenizer Mixer 500L SUS316L"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Aset</label>
              <select
                value={formCat}
                onChange={(e) => setFormCat(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
              >
                <option value="MESIN_PABRIK">Mesin Pabrik (Mixing/Filling/Packing)</option>
                <option value="ALAT_LAB_QC">Alat Lab & Instrumen Pengujian QC</option>
                <option value="KENDARAAN">Kendaraan Operasional & Truk Logistik</option>
                <option value="PERALATAN_KANTOR">Peralatan Server & Komputer Kantor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nilai Perolehan / Beli (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                required
                value={formCost}
                onChange={(e) => setFormCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-blue-900 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Masa Manfaat (Tahun)</label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={formYears}
                onChange={(e) => setFormYears(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Departemen Penanggung Jawab</label>
              <input
                type="text"
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Fisik Penempatan</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Aset Tetap
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL DETAIL ASET */}
      <DnaModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={`Detail Aset: ${detailItem?.assetCode}`}
        size="md"
      >
        {detailItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">{detailItem.assetName}</div>
              <div className="text-slate-500">
                Lokasi: <strong>{detailItem.location}</strong> ({detailItem.department})
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-white border border-slate-200 rounded-lg text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Nilai Beli</div>
                <div className="font-bold text-slate-900">{formatRupiah(detailItem.acquisitionCost)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Akum. Depresiasi</div>
                <div className="font-bold text-amber-700">{formatRupiah(detailItem.accumDepreciation)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Nilai Buku</div>
                <div className="font-extrabold text-emerald-800">{formatRupiah(detailItem.bookValue)}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <DnaButton variant="primary" size="sm" onClick={() => setDetailItem(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
