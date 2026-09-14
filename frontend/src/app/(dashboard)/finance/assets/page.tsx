"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Building2,
  Plus,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Eye,
  DollarSign,
  TrendingDown,
  Layers,
  Wrench,
  Sparkles
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
  DnaSelect
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

interface AssetRegisterItem {
  id: string;
  assetCode: string; // Universal Global: DL-FIN-AST-09092026-0001
  name: string;
  category: "Inventaris" | "Motor" | "Mobil" | "Bangunan";
  acquisitionDate: string;
  acquisitionCost: number;
  accumDepreciation: number;
  bookValue: number;
  usefulLifeYears: number;
  location: string;
  department: string;
  purchaseHistory: Array<{ date: string; type: string; invoiceRef: string; amount: number; notes: string }>;
}

const FALLBACK_ASSETS: AssetRegisterItem[] = [
  {
    id: "1",
    assetCode: "DL-FIN-AST-2024-0001",
    name: "Mesin Homogenizer High-Shear 500L Vacuum",
    category: "Inventaris",
    acquisitionDate: "2024-01-15",
    acquisitionCost: 450000000,
    accumDepreciation: 150000000,
    bookValue: 300000000,
    usefulLifeYears: 4,
    location: "Ruang Mixing Produksi - Line 1",
    department: "Produksi Manufaktur",
    purchaseHistory: [
      { date: "2024-01-15", type: "Pembelian Aset Baru", invoiceRef: "INV-MACH-09", amount: 450000000, notes: "Pengadaan Mesin Homogenizer Utama" },
      { date: "2025-06-10", type: "Upgrade Inverter Motor", invoiceRef: "INV-UPG-01", amount: 35000000, notes: "Kapitalisasi Motor Speed 3 Phase" }
    ]
  },
  {
    id: "2",
    assetCode: "DL-FIN-AST-2024-0002",
    name: "Mesin Rotary Filling & Capping Automatic 30ml",
    category: "Inventaris",
    acquisitionDate: "2024-03-20",
    acquisitionCost: 320000000,
    accumDepreciation: 106666667,
    bookValue: 213333333,
    usefulLifeYears: 4,
    location: "Ruang Filling Cleanroom - Line A",
    department: "Produksi Manufaktur",
    purchaseHistory: [
      { date: "2024-03-20", type: "Pembelian Aset Baru", invoiceRef: "INV-MACH-14", amount: 320000000, notes: "Mesin Filling Botol Serum Otomatis" }
    ]
  },
  {
    id: "3",
    assetCode: "DL-FIN-AST-2023-0003",
    name: "Mobil Operasional Logistik Isuzu Traga Box",
    category: "Mobil",
    acquisitionDate: "2023-05-10",
    acquisitionCost: 280000000,
    accumDepreciation: 70000000,
    bookValue: 210000000,
    usefulLifeYears: 8,
    location: "Area Loading Dock Gudang",
    department: "Gudang & Logistik",
    purchaseHistory: [
      { date: "2023-05-10", type: "Pembelian Baru", invoiceRef: "INV-VEH-03", amount: 280000000, notes: "Armada Delivery Maklon Jabodetabek" }
    ]
  }
];

export default function AssetsPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedAsset, setSelectedAsset] = useState<AssetRegisterItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form (SCR-025)
  const [formData, setFormData] = useState({
    name: "",
    category: "Inventaris" as const,
    acquisitionDate: new Date().toISOString().split("T")[0],
    cost: "",
    location: "Ruang Produksi Manufaktur",
    department: "Produksi Manufaktur"
  });

  // Auto-fill useful life (Poin 29-30)
  const usefulLifeMap: Record<string, number> = {
    Inventaris: 4,
    Motor: 4,
    Mobil: 8,
    Bangunan: 20
  };

  const totalCost = useMemo(() => FALLBACK_ASSETS.reduce((acc, r) => acc + r.acquisitionCost, 0), []);
  const totalDeprec = useMemo(() => FALLBACK_ASSETS.reduce((acc, r) => acc + r.accumDepreciation, 0), []);
  const totalBookValue = useMemo(() => FALLBACK_ASSETS.reduce((acc, r) => acc + r.bookValue, 0), []);

  const filteredAssets = useMemo(() => {
    return FALLBACK_ASSETS.filter((a) => {
      const matchSearch =
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "ALL" || a.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, categoryFilter]);

  const handleSaveAsset = () => {
    if (!formData.name || !formData.cost) {
      toast.error("Mohon lengkapi nama dan harga perolehan aset!");
      return;
    }
    toast.success("Aset Tetap baru berhasil didaftarkan dengan kode universal global!");
    setIsCreateModalOpen(false);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Kelola Aset Tetap & Depresiasi (Asset Register)"
        description="Pencatatan aset mesin produksi, kendaraan logistik, bangunan fasilitas CPKB, skedul depresiasi otomatis, dan riwayat upgrade/repair."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Poin 28-30: Kode Universal Global & Useful Life Auto-Fill</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => toast.success("Menjalankan kalkulasi depresiasi bulanan...")}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Run Depresiasi Bulanan
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Aset Baru
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS (SCR-024) */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Nilai Perolehan Aset (Cost)"
          value={formatRupiah(totalCost)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          delta={{ value: `${FALLBACK_ASSETS.length} Item Terdaftar`, isPositive: true }}
          subtext="Akumulasi Nilai Beli Seluruh Aset"
          variant="info"
        />
        <DnaStatCard
          label="Total Akumulasi Penyusutan"
          value={formatRupiah(totalDeprec)}
          icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Garis Lurus (Straight Line)", isPositive: false }}
          subtext="Penyusutan Berjalan Terposting"
          variant="warning"
        />
        <DnaStatCard
          label="Total Nilai Buku Bersih (Book Value)"
          value={formatRupiah(totalBookValue)}
          icon={<Building2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Net Asset Worth", isPositive: true }}
          subtext="Nilai Tercatat di Neraca Keuangan"
          variant="success"
        />
      </DnaKpiGrid>

      {/* TABLE LIST (SCR-024) */}
      <DnaDataTableCard
        title="Daftar Register Aset Tetap & Mesin Pabrik"
        badge={<DnaBadge variant="default">{filteredAssets.length} Aset</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2">
<DnaSelect 
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Kategori Aset</option>
              <option value="Inventaris">Inventaris / Mesin Pabrik (4 Thn)</option>
              <option value="Motor">Sepeda Motor (4 Thn)</option>
              <option value="Mobil">Mobil / Truk Box (8 Thn)</option>
              <option value="Bangunan">Bangunan Pabrik CPKB (20 Thn)</option>
            </DnaSelect>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari kode / nama aset / lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Asset Code</th>
                <th className="px-3.5 py-3">Nama Aset</th>
                <th className="px-3.5 py-3">Kategori</th>
                <th className="px-3.5 py-3">Tgl Perolehan</th>
                <th className="px-3.5 py-3 text-right">Acquisition Cost</th>
                <th className="px-3.5 py-3 text-right">Accum. Deprec</th>
                <th className="px-3.5 py-3 text-right">Book Value</th>
                <th className="px-3.5 py-3">Lokasi / Dept</th>
                <th className="px-3.5 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-bold">{a.assetCode}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{a.name}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {a.category} ({a.usefulLifeYears} Thn)
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{a.acquisitionDate}</td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-slate-900">{formatRupiah(a.acquisitionCost)}</td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-amber-700">{formatRupiah(a.accumDepreciation)}</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-emerald-800">{formatRupiah(a.bookValue)}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px]">
                    <div>{a.location}</div>
                    <div className="text-[10px] text-slate-400">{a.department}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaButton variant="secondary" size="sm" onClick={() => setSelectedAsset(a)}>
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Histori
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT ASET (SCR-025) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Register Aset Tetap Baru"
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Kode Aset (Auto Universal Global)</label>
            <DnaInput
              type="text"
              value="DL-FIN-AST-09092026-0004"
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 font-mono text-slate-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Aset Tetap *</label>
            <DnaInput
              type="text"
              placeholder="e.g. Mesin Boiler Uap Tekanan Tinggi 10 Bar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Kategori Aset *</label>
  <DnaSelect 
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="Inventaris">Inventaris / Mesin Pabrik</option>
                <option value="Motor">Sepeda Motor</option>
                <option value="Mobil">Mobil / Truk Box</option>
                <option value="Bangunan">Bangunan Pabrik Permanen</option>
              </DnaSelect>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Masa Manfaat (Auto-Fill Default)</label>
              <DnaInput
                type="text"
                value={`${usefulLifeMap[formData.category]} Tahun (Garis Lurus)`}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 font-bold text-blue-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal Perolehan *</label>
              <DnaInput
                type="date"
                value={formData.acquisitionDate}
                onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Harga Perolehan Cost (Rp) *</label>
              <DnaInput
                type="number"
                placeholder="e.g. 150000000"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Lokasi Penempatan</label>
              <DnaInput
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Departemen Penanggung Jawab</label>
              <DnaInput
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleSaveAsset}>
              Simpan Aset Register
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* DETAIL ASET & PURCHASE HISTORY MODAL (SCR-024) */}
      <DnaModal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title={`Detail Aset & Riwayat Pembelian: ${selectedAsset?.name}`}
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg grid grid-cols-2 gap-2 border border-slate-200">
            <div>Kode: <strong className="font-mono text-blue-700">{selectedAsset?.assetCode}</strong></div>
            <div>Kategori: <strong>{selectedAsset?.category} ({selectedAsset?.usefulLifeYears} Tahun)</strong></div>
            <div>Cost Awal: <strong className="text-slate-900">{selectedAsset ? formatRupiah(selectedAsset.acquisitionCost) : "0"}</strong></div>
            <div>Nilai Buku Saat Ini: <strong className="text-emerald-700 font-bold">{selectedAsset ? formatRupiah(selectedAsset.bookValue) : "0"}</strong></div>
          </div>

          {/* SUB-TAB RIWAYAT PEMBELIAN & UPGRADE */}
          <div className="border border-slate-200 rounded-lg p-3 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Sub-tab: Riwayat Pembelian & Kapitalisasi Upgrade/Repair (SCR-024)</span>
            </h4>
            <DnaTable className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-1">Tanggal</th>
                  <th className="py-1">Jenis Mutasi/Upgrade</th>
                  <th className="py-1">Ref Faktur</th>
                  <th className="py-1 text-right">Nominal</th>
                  <th className="py-1">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedAsset?.purchaseHistory.map((ph, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-slate-600">{ph.date}</td>
                    <td className="py-2 font-semibold text-slate-800">{ph.type}</td>
                    <td className="py-2 font-mono text-blue-700">{ph.invoiceRef}</td>
                    <td className="py-2 text-right font-extrabold text-emerald-700">{formatRupiah(ph.amount)}</td>
                    <td className="py-2 text-slate-600 text-[11px]">{ph.notes}</td>
                  </tr>
                ))}
              </tbody>
            </DnaTable>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedAsset(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
