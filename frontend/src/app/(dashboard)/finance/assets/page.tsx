"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaCell,
  DnaCrudModal,
  DnaInput,
  DnaCurrencyInput,
  DnaConfirmDialog,
  formatRupiah,
} from "@/components/dna";
import { Plus, Landmark, Truck, Wrench, Building, History, ArrowRightLeft, Trash2 } from "lucide-react";

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: "INVENTARIS" | "MOTOR" | "MOBIL" | "BANGUNAN";
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLifeMonths: number;
  accumulatedDepreciation: number;
  bookValue: number;
  location: string;
  department: string;
  status: "ACTIVE" | "TRANSFERRED" | "DISPOSED";
  purchaseHistory: {
    date: string;
    type: string;
    refInvoice: string;
    amount: number;
    notes: string;
  }[];
}

const DEFAULT_LIFE: Record<string, number> = {
  INVENTARIS: 48, // 4 tahun
  MOTOR: 48,      // 4 tahun
  MOBIL: 96,      // 8 tahun
  BANGUNAN: 240,  // 20 tahun
};

const SAMPLE_ASSETS: Asset[] = [
  {
    id: "ast-1",
    assetCode: "DL-FIN-AST-2026-0001",
    name: "Mesin Homogenizer High Shear 500L",
    category: "INVENTARIS",
    acquisitionDate: "2024-01-15",
    acquisitionCost: 380000000,
    usefulLifeMonths: 48,
    accumulatedDepreciation: 190000000,
    bookValue: 190000000,
    location: "Ruang Produksi Lantai 1",
    department: "Produksi",
    status: "ACTIVE",
    purchaseHistory: [
      { date: "2024-01-15", type: "Pembelian Baru", refInvoice: "INV-SUP-2024-0012", amount: 380000000, notes: "Perolehan awal unit homogenizer" },
      { date: "2025-06-10", type: "Upgrade Rotor Stator", refInvoice: "INV-SUP-2025-0144", amount: 25000000, notes: "Peningkatan kapasitas putaran hingga 3500 RPM" },
    ],
  },
  {
    id: "ast-2",
    assetCode: "DL-FIN-AST-2026-0002",
    name: "Truk Box Isuzu Giga Pengiriman Kosmetik",
    category: "MOBIL",
    acquisitionDate: "2023-05-20",
    acquisitionCost: 450000000,
    usefulLifeMonths: 96,
    accumulatedDepreciation: 140625000,
    bookValue: 309375000,
    location: "Gudang Logistik",
    department: "Logistik",
    status: "ACTIVE",
    purchaseHistory: [
      { date: "2023-05-20", type: "Pembelian Baru", refInvoice: "INV-AUTO-2023-99", amount: 450000000, notes: "Armada pengiriman finish good" },
    ],
  },
  {
    id: "ast-3",
    assetCode: "DL-FIN-AST-2026-0003",
    name: "Gedung Pabrik & Cleanroom CPKB",
    category: "BANGUNAN",
    acquisitionDate: "2022-01-01",
    acquisitionCost: 2500000000,
    usefulLifeMonths: 240,
    accumulatedDepreciation: 520833333,
    bookValue: 1979166667,
    location: "Kawasan Industri",
    department: "Operasional Pabrik",
    status: "ACTIVE",
    purchaseHistory: [
      { date: "2022-01-01", type: "Perolehan Awal", refInvoice: "NOTARIS-2022-001", amount: 2500000000, notes: "Bangunan permanen berizin CPKB BPOM" },
    ],
  },
];

export default function AssetRegisterPage() {
  const [assets, setAssets] = useState<Asset[]>(SAMPLE_ASSETS);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);

  const totalCost = assets.reduce((acc, a) => acc + a.acquisitionCost, 0);
  const totalDeprec = assets.reduce((acc, a) => acc + a.accumulatedDepreciation, 0);
  const totalBook = assets.reduce((acc, a) => acc + a.bookValue, 0);

  const [form, setForm] = useState({
    name: "",
    category: "INVENTARIS" as "INVENTARIS" | "MOTOR" | "MOBIL" | "BANGUNAN",
    acquisitionDate: new Date().toISOString().split("T")[0],
    acquisitionCost: 0,
    location: "Pabrik Utama",
    department: "Produksi",
  });

  const handleCreate = () => {
    const nextSeq = String(assets.length + 1).padStart(4, "0");
    const assetCode = `DL-FIN-AST-2026-${nextSeq}`;
    const usefulLifeMonths = DEFAULT_LIFE[form.category];

    const newAsset: Asset = {
      id: "ast-" + Date.now(),
      assetCode,
      name: form.name,
      category: form.category,
      acquisitionDate: form.acquisitionDate,
      acquisitionCost: form.acquisitionCost,
      usefulLifeMonths,
      accumulatedDepreciation: 0,
      bookValue: form.acquisitionCost,
      location: form.location,
      department: form.department,
      status: "ACTIVE",
      purchaseHistory: [
        {
          date: form.acquisitionDate,
          type: "Perolehan Awal",
          refInvoice: "AUTO-PO-" + nextSeq,
          amount: form.acquisitionCost,
          notes: "Registrasi aset tetap baru",
        },
      ],
    };

    setAssets([newAsset, ...assets]);
    setIsModalOpen(false);
  };

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Kelola Aset Tetap (Fixed Asset Register)"
        subtitle="Registrasi aset kapital, histori perbaikan/upgrade, dan skedul penyusutan garis lurus (Poin 30-33)"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Aset Tetap" }]}
        actions={
          <DnaButton variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> + Registrasi Aset Baru
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Nilai Perolehan Aset"
          value={formatRupiah(totalCost)}
          variant="blue"
          icon={<Landmark className="h-4 w-4" />}
          delta={{ value: `${assets.length} Unit Terdaftar`, isPositive: true }}
        />
        <DnaStatCard
          label="Akumulasi Penyusutan"
          value={formatRupiah(totalDeprec)}
          variant="amber"
          icon={<Wrench className="h-4 w-4" />}
          delta={{ value: "Metode Garis Lurus", isPositive: false }}
        />
        <DnaStatCard
          label="Nilai Buku Bersih (Book Value)"
          value={formatRupiah(totalBook)}
          variant="emerald"
          icon={<Building className="h-4 w-4" />}
          delta={{ value: "Posisi Neraca Aktif", isPositive: true }}
        />
        <DnaStatCard
          label="Aset Aktif Beroperasi"
          value={`${assets.filter((a) => a.status === "ACTIVE").length} Unit`}
          variant="slate"
          delta={{ value: "100% Kondisi Baik", isPositive: true }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari kode universal aset, nama mesin, atau lokasi..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Kode Aset Universal</th>
                <th className="px-4 py-3">Nama Aset & Lokasi</th>
                <th className="px-4 py-3">Kategori & Masa Manfaat</th>
                <th className="px-4 py-3">Tgl Perolehan</th>
                <th className="px-4 py-3 text-right">Biaya Perolehan</th>
                <th className="px-4 py-3 text-right">Akum. Depresiasi</th>
                <th className="px-4 py-3 text-right">Nilai Buku</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((ast) => (
                <tr key={ast.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <DnaCell.Code value={ast.assetCode} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{ast.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {ast.location} • Dept: {ast.department}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1.5">
                      <DnaBadge variant={ast.category === "BANGUNAN" ? "purple" : ast.category === "MOBIL" ? "blue" : "emerald"}>
                        {ast.category}
                      </DnaBadge>
                      <span className="text-[11px] text-slate-500">
                        ({ast.usefulLifeMonths / 12} Thn)
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{ast.acquisitionDate}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                    {formatRupiah(ast.acquisitionCost)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                    {formatRupiah(ast.accumulatedDepreciation)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    {formatRupiah(ast.bookValue)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaButton variant="secondary" size="sm" onClick={() => setSelectedAssetForDetail(ast)}>
                      <History className="h-3.5 w-3.5 mr-1" /> Histori & Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Buat Aset */}
      <DnaCrudModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Registrasi Aset Tetap Baru"
        subtitle="Format kode otomatis universal berkelanjutan: DL-FIN-AST-2026-XXXX (Poin 30-33)"
        onSave={handleCreate}
        saveText="Daftarkan Aset"
      >
        <div className="space-y-4">
          <DnaInput
            label="Nama Aset / Mesin *"
            placeholder="Misal: Tangki Emulsifier 1000L"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-slate-700">Kategori Aset (Auto Masa Manfaat) *</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as "INVENTARIS" | "MOTOR" | "MOBIL" | "BANGUNAN",
                  })
                }
                className="w-full mt-1.5 px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white"
              >
                <option value="INVENTARIS">Inventaris / Mesin (4 Tahun)</option>
                <option value="MOTOR">Sepeda Motor Operasional (4 Tahun)</option>
                <option value="MOBIL">Mobil / Truk Pengiriman (8 Tahun)</option>
                <option value="BANGUNAN">Bangunan Pabrik Permanen (20 Tahun)</option>
              </select>
            </div>
            <DnaInput
              label="Tanggal Perolehan *"
              type="date"
              value={form.acquisitionDate}
              onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}
            />
          </div>

          <DnaCurrencyInput
            label="Nilai Perolehan (Cost) *"
            value={form.acquisitionCost}
            onChange={(val) => setForm({ ...form, acquisitionCost: val })}
          />

          <div className="grid grid-cols-2 gap-3">
            <DnaInput
              label="Lokasi Penempatan"
              placeholder="Misal: Gudang Finished Goods"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <DnaInput
              label="Departemen Pengguna"
              placeholder="Misal: Logistik"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
        </div>
      </DnaCrudModal>

      {/* Modal Detail & Histori Pembelian */}
      {selectedAssetForDetail && (
        <DnaCrudModal
          open={!!selectedAssetForDetail}
          onOpenChange={() => setSelectedAssetForDetail(null)}
          title={`Detail Aset & Histori: ${selectedAssetForDetail.assetCode}`}
          subtitle={selectedAssetForDetail.name}
          saveText="Tutup"
          onSave={() => setSelectedAssetForDetail(null)}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[12px]">
              <div>
                <span className="text-slate-400 block">Kategori</span>
                <span className="font-semibold text-slate-800">{selectedAssetForDetail.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Masa Manfaat</span>
                <span className="font-semibold text-slate-800">{selectedAssetForDetail.usefulLifeMonths / 12} Tahun</span>
              </div>
              <div>
                <span className="text-slate-400 block">Nilai Buku Saat Ini</span>
                <span className="font-bold text-emerald-700">{formatRupiah(selectedAssetForDetail.bookValue)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-[13px] font-bold text-slate-900 mb-2">
                Sub-Tab: Riwayat Pembelian & Upgrade Kapitalisasi (Poin 30)
              </h4>
              <table className="w-full text-left text-[12px] border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Tanggal</th>
                    <th className="p-2.5">Jenis Transaksi</th>
                    <th className="p-2.5">No Faktur Pembelian</th>
                    <th className="p-2.5 text-right">Nominal</th>
                    <th className="p-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedAssetForDetail.purchaseHistory.map((h, i) => (
                    <tr key={i}>
                      <td className="p-2.5">{h.date}</td>
                      <td className="p-2.5 font-medium">{h.type}</td>
                      <td className="p-2.5 font-mono text-blue-600">{h.refInvoice}</td>
                      <td className="p-2.5 text-right font-mono">{formatRupiah(h.amount)}</td>
                      <td className="p-2.5 text-slate-500">{h.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DnaCrudModal>
      )}
    </DnaPageContainer>
  );
}
