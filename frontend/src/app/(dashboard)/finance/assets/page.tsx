"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Building2,
  Plus,
  Printer,
  Search,
  Eye,
  DollarSign,
  TrendingDown,
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
  DnaDetailDrawer,
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

function AssetsContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedAsset, setSelectedAsset] = useState<AssetRegisterItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

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

  const { data: assetsRaw = [] } = useQuery({
    queryKey: ["finance-assets-register"],
    queryFn: async (): Promise<any[]> => {
      try {
        const res = await api.get("/finance/fixed-assets");
        return unwrapResponse<any[]>(res) || [];
      } catch {
        const res2 = await api.get("/finance/assets");
        return unwrapResponse<any[]>(res2) || [];
      }
    },
  });

  const assets: AssetRegisterItem[] = useMemo(() => {
    return (assetsRaw || []).map((a: any) => ({
      id: a.id,
      assetCode: a.code || `AST-${a.id?.slice(0, 8)}`,
      name: a.name || "Aset Tetap",
      category: (a.category || "Inventaris") as any,
      acquisitionDate: a.acquisitionDate ? new Date(a.acquisitionDate).toISOString().split("T")[0] : "",
      acquisitionCost: Number(a.acquisitionCost || a.cost || 0),
      accumDepreciation: Number(a.accumDepreciation || 0),
      bookValue: Number(a.bookValue || (Number(a.acquisitionCost || 0) - Number(a.accumDepreciation || 0))),
      usefulLifeYears: Number(a.usefulLifeYears || 4),
      location: a.location || "-",
      department: a.department || "-",
      purchaseHistory: a.purchaseHistory || [],
    }));
  }, [assetsRaw]);

  const totalCost = useMemo(() => assets.reduce((acc, r) => acc + r.acquisitionCost, 0), [assets]);
  const totalDeprec = useMemo(() => assets.reduce((acc, r) => acc + r.accumDepreciation, 0), [assets]);
  const totalBookValue = useMemo(() => assets.reduce((acc, r) => acc + r.bookValue, 0), [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchSearch =
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "ALL" || a.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [assets, searchQuery, categoryFilter]);

  const createAssetMutation = useMutation({
    mutationFn: async () => {
      return api.post("/finance/fixed-assets", {
        assetName: formData.name,
        assetCategory: formData.category,
        acquisitionDate: formData.acquisitionDate,
        acquisitionCost: Number(formData.cost),
        usefulLife: (usefulLifeMap[formData.category] || 4) * 12,
        location: formData.location,
        department: formData.department,
      });
    },
    onSuccess: () => {
      toast.success("Aset Tetap baru berhasil didaftarkan ke database!");
      queryClient.invalidateQueries({ queryKey: ["finance-assets-register"] });
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        category: "Inventaris",
        acquisitionDate: new Date().toISOString().split("T")[0],
        cost: "",
        location: "Ruang Produksi Manufaktur",
        department: "Produksi Manufaktur",
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mendaftarkan aset tetap.");
    },
  });

  const handleSaveAsset = () => {
    if (!formData.name || !formData.cost) {
      toast.error("Mohon lengkapi nama dan harga perolehan aset!");
      return;
    }
    createAssetMutation.mutate();
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Kelola Aset Tetap & Depresiasi (Asset Register)"
        description="Pencatatan aset mesin produksi, kendaraan logistik, bangunan fasilitas CPKB, skedul depresiasi otomatis, dan riwayat upgrade/repair."
        tabs={[
          { id: "ALL", label: "Semua Kategori" },
          { id: "Inventaris", label: "Inventaris & Mesin (4 Thn)" },
          { id: "Motor", label: "Motor (4 Thn)" },
          { id: "Mobil", label: "Mobil / Truk (8 Thn)" },
          { id: "Bangunan", label: "Bangunan CPKB (20 Thn)" }
        ]}
        activeTab={categoryFilter}
        onTabChange={setCategoryFilter}
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
          delta={{ value: `${assets.length} Item Terdaftar`, isPositive: true }}
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
        customToolbar={
          <div className="flex items-center justify-between w-full">
            <div className="relative w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari kode, nama aset, atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-semibold text-slate-800">{filteredAssets.length}</span> aset
            </div>
          </div>
        }
      >
        <DnaTable className="w-full text-left border-collapse text-xs table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-3.5 py-3 w-[20%]">Asset Code & Tgl</th>
              <th className="px-3.5 py-3 w-[28%]">Nama Aset & Lokasi</th>
              <th className="px-3.5 py-3 w-[15%]">Kategori & Masa</th>
              <th className="px-3.5 py-3 w-[18%]">Perolehan & Akumulasi</th>
              <th className="px-3.5 py-3 text-right w-[12%]">Nilai Buku</th>
              <th className="px-3.5 py-3 text-center w-[7%]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3.5 py-8 text-center text-slate-400">
                  Tidak ada aset tetap yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              filteredAssets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="tabular-nums text-blue-700 font-bold truncate">{a.assetCode}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">{a.acquisitionDate || "-"}</div>
                  </td>
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="font-bold text-slate-900 truncate">{a.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{a.location} &bull; {a.department}</div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <DnaBadge variant="secondary">
                      {a.category} ({a.usefulLifeYears} Thn)
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="font-semibold text-slate-900">{formatRupiah(a.acquisitionCost)}</div>
                    <div className="text-[10px] text-amber-700">Akum: {formatRupiah(a.accumDepreciation)}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right truncate">
                    <div className="font-bold text-emerald-700">{formatRupiah(a.bookValue)}</div>
                    <div className="text-[10px] text-slate-400 tabular-nums">Net Value</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaButton variant="ghost" size="sm" onClick={() => setSelectedAsset(a)} title="Lihat Detail & Riwayat">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                    </DnaButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 tabular-nums text-slate-600"
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
            <DnaButton variant="primary" size="md" onClick={handleSaveAsset} disabled={createAssetMutation.isPending}>
              {createAssetMutation.isPending ? "Menyimpan..." : "Simpan Aset Register"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* DETAIL DRAWER (QUICK PEEK & UPGRADE HISTORY) */}
      <DnaDetailDrawer
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset?.name || "Detail Aset Tetap"}
        subtitle={selectedAsset?.assetCode}
        badge={
          selectedAsset ? (
            <DnaBadge variant="info">
              {selectedAsset.category} &bull; {selectedAsset.usefulLifeYears} Tahun
            </DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "spec",
            label: "Spesifikasi & Nilai Buku",
            content: selectedAsset && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tanggal Perolehan</span>
                    <span className="font-semibold text-slate-900">{selectedAsset.acquisitionDate || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Metode Penyusutan</span>
                    <span className="font-semibold text-slate-900">Garis Lurus (Straight Line)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Harga Perolehan (Cost)</span>
                    <span className="font-bold text-slate-900">{formatRupiah(selectedAsset.acquisitionCost)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Akumulasi Penyusutan</span>
                    <span className="font-bold text-amber-700">{formatRupiah(selectedAsset.accumDepreciation)}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">Nilai Buku Bersih (Net Book Value):</span>
                    <span className="font-extrabold text-base text-emerald-700">{formatRupiah(selectedAsset.bookValue)}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900">Alokasi & Tanggung Jawab Operasional</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Lokasi Fisik:</span>
                      <span className="font-medium">{selectedAsset.location}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Departemen PIC:</span>
                      <span className="font-medium">{selectedAsset.department}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: "history",
            label: "Riwayat Pembelian & Upgrade",
            content: selectedAsset && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 mb-2">
                  Catatan mutasi kapitalisasi, penggantian suku cadang besar, dan overhaul mesin.
                </div>
                {selectedAsset.purchaseHistory && selectedAsset.purchaseHistory.length > 0 ? (
                  <DnaTable className="w-full text-left text-xs table-fixed">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-[11px]">
                        <th className="py-2 px-2 w-[25%]">Tanggal & Ref</th>
                        <th className="py-2 px-2 w-[35%]">Jenis & Keterangan</th>
                        <th className="py-2 px-2 text-right w-[40%]">Nominal (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedAsset.purchaseHistory.map((ph, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-2">
                            <div className="font-medium text-slate-800">{ph.date}</div>
                            <div className="tabular-nums text-[10px] text-blue-700">{ph.invoiceRef}</div>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="font-semibold text-slate-900">{ph.type}</div>
                            <div className="text-[10px] text-slate-500">{ph.notes}</div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-emerald-700">
                            {formatRupiah(ph.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </DnaTable>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                    Belum ada riwayat kapitalisasi tambahan untuk aset ini.
                  </div>
                )}
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedAsset(null)}>
              Tutup
            </DnaButton>
            <div className="flex gap-2">
              <DnaButton variant="secondary" size="md" onClick={() => toast.success("Mencetak label barcode aset...")}>
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Barcode
              </DnaButton>
              <DnaButton variant="primary" size="md" onClick={() => toast.success("Membuka form penambahan perbaikan aset...")}>
                <Wrench className="w-4 h-4 mr-1.5" />
                Catat Upgrade
              </DnaButton>
            </div>
          </div>
        }
      />
    </DnaPageContainer>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 tabular-nums text-xs">Memuat Asset Register...</div>}>
      <AssetsContent />
    </Suspense>
  );
}
