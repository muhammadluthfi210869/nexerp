"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Pencil, Trash2, RefreshCw, Search } from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaBadge,
  DnaModal,
  DnaConfirmDialog,
  useDnaToast,
} from "@/components/dna";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

interface Material {
  id: string;
  code?: string;
  name: string;
  type: string;
  unit: string;
  unitPrice: number;
  stockQty?: number;
  minStock?: number;
  status?: string;
  categoryId?: string;
}

export default function MasterMaterialsPage() {
  const toast = useDnaToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("RAW_MATERIAL");
  const [unit, setUnit] = useState("Pcs");
  const [unitPrice, setUnitPrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [minStock, setMinStock] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const {
    data: materials = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["master-materials", search],
    queryFn: async () => {
      const res = await api.get(`/master/materials?search=${encodeURIComponent(search)}`);
      const body = unwrapResponse(res);
      const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : (() => { throw new Error('Invalid response shape from /master/materials: not an array') })();
      return list as Material[];
    },
  });

  const createMut = useMutation({
    mutationFn: (payload: Partial<Material>) => api.post("/master/materials", payload).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Material berhasil ditambahkan");
      qc.invalidateQueries({ queryKey: ["master-materials"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menambah material"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Material> }) =>
      api.put(`/master/materials/${id}`, payload).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Material berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["master-materials"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui material"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/master/materials/${id}`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Material berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["master-materials"] });
      setDeletingId(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menghapus material"),
  });

  function openCreate() {
    setEditing(null);
    setCode(""); setName(""); setType("RAW_MATERIAL"); setUnit("Pcs");
    setUnitPrice(""); setStockQty(""); setMinStock(""); setStatus("ACTIVE");
    setModalOpen(true);
  }

  function openEdit(m: Material) {
    setEditing(m);
    setCode(m.code ?? ""); setName(m.name); setType(m.type); setUnit(m.unit);
    setUnitPrice(String(m.unitPrice)); setStockQty(String(m.stockQty ?? "")); setMinStock(String(m.minStock ?? "")); setStatus(m.status ?? "ACTIVE");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function submit() {
    const payload = {
      code,
      name,
      type,
      unit,
      unitPrice: parseFloat(unitPrice),
      stockQty: stockQty ? parseFloat(stockQty) : undefined,
      minStock: minStock ? parseFloat(minStock) : undefined,
      status,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const totalValue = materials.reduce((s: number, m: Material) => s + (m.unitPrice * (m.stockQty ?? 0)), 0);
  const lowStockCount = materials.filter((m: Material) => (m.stockQty ?? 0) <= (m.minStock ?? 0)).length;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Master Material / Barang (Goods Master)"
        description="Master data bahan baku, kemasan, barang setengah jadi, dan barang jadi dengan harga & stok minimum."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <Package className="w-3.5 h-3.5" />
            <span>SCR-022: Goods Master Data</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => qc.invalidateQueries({ queryKey: ["master-materials"] })}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Material
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Material"
          value={`${materials.length} Item`}
          icon={<Package className="w-5 h-5 text-emerald-600" />}
          subtext="Seluruh barang terdaftar"
          variant="info"
        />
        <DnaStatCard
          label="Nilai Inventaris"
          value={`Rp ${totalValue.toLocaleString("id-ID")}`}
          icon={<Package className="w-5 h-5 text-blue-600" />}
          subtext="Qty × Unit Price"
          variant="success"
        />
        <DnaStatCard
          label="Stok Minimum"
          value={`${lowStockCount} Item`}
          icon={<Package className="w-5 h-5 text-rose-600" />}
          delta={{ value: lowStockCount > 0 ? "PERLU REORDER" : "AMAN", isPositive: lowStockCount === 0 }}
          variant={lowStockCount > 0 ? "critical" : "success"}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        toolbarProps={{
          searchProps: {
            value: search,
            onChange: setSearch,
            placeholder: "Cari kode / nama material...",
          },
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 font-bold uppercase tracking-wider text-[11px] select-none">
                <th className="px-4 py-2.5 w-[140px]">Kode Material</th>
                <th className="px-4 py-2.5 min-w-[200px]">Nama Material</th>
                <th className="px-4 py-2.5 w-[140px] text-center">Tipe</th>
                <th className="px-4 py-2.5 w-[100px] text-center">Satuan</th>
                <th className="px-4 py-2.5 w-[140px] text-right">Harga Satuan</th>
                <th className="px-4 py-2.5 w-[120px] text-right">Stok Aktual</th>
                <th className="px-4 py-2.5 w-[120px] text-right">Min. Stok</th>
                <th className="px-4 py-2.5 w-[110px] text-center">Status</th>
                <th className="pr-4 py-2.5 w-[90px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data material...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-rose-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span>Gagal memuat data material: {(error as any)?.message || "Terjadi kesalahan"}</span>
                      <button
                        onClick={() => refetch()}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-md border border-rose-200 transition-colors"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-400">Belum ada data material</td></tr>
              ) : materials.map((m: Material) => (
                <tr key={m.id} className="h-[48px] hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5">
                    <DnaCell.Code code={m.code ?? "—"} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{m.name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <DnaBadge variant="secondary">{m.type}</DnaBadge>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <DnaCell.Text text={m.unit} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <DnaCell.Numeric value={m.unitPrice} prefix="Rp " />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    <span className={`text-[12px] font-semibold ${(m.stockQty ?? 0) <= (m.minStock ?? 0) ? "text-rose-600" : "text-slate-800"}`}>
                      {(m.stockQty ?? 0).toLocaleString("id-ID")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-500">
                    {(m.minStock ?? 0).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <DnaBadge variant={m.status === "ACTIVE" ? "success" : "secondary"}>
                      {m.status === "ACTIVE" ? "Aktif" : m.status ?? "—"}
                    </DnaBadge>
                  </td>
                  <td className="pr-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        onClick={() => openEdit(m)}
                        title="Edit Material"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        onClick={() => setDeletingId(m.id)}
                        title="Hapus Material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </DnaButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* CRUD Modal */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editing ? "Edit Material" : "Tambah Material"}
        size="md"
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode</label>
              <DnaInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="RAW-001" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipe</label>
              <DnaSelect value={type} onChange={setType}>
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="PACKAGING">Packaging</option>
                <option value="SEMI_FINISHED">Semi Finished</option>
                <option value="FINISHED_GOOD">Finished Good</option>
                <option value="AUXILIARY">Auxiliary</option>
              </DnaSelect>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Material</label>
            <DnaInput value={name} onChange={(e) => setName(e.target.value)} placeholder="contoh: Glycerin USP" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
              <DnaSelect value={unit} onChange={setUnit}>
                <option value="Pcs">Pcs</option>
                <option value="Kg">Kg</option>
                <option value="L">Liter</option>
                <option value="Gr">Gram</option>
                <option value="Box">Box</option>
                <option value="Drum">Drum</option>
              </DnaSelect>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <DnaSelect value={status} onChange={setStatus}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Non-Aktif</option>
              </DnaSelect>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Harga</label>
              <DnaInput value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} type="number" placeholder="0" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stok</label>
              <DnaInput value={stockQty} onChange={(e) => setStockQty(e.target.value)} type="number" placeholder="0" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Stok</label>
              <DnaInput value={minStock} onChange={(e) => setMinStock(e.target.value)} type="number" placeholder="0" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DnaButton variant="secondary" size="md" onClick={closeModal}>Batal</DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={submit}
              disabled={!name || !unitPrice || createMut.isPending || updateMut.isPending}
            >
              {editing ? "Simpan Perubahan" : "Tambah"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      <DnaConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteMut.mutate(deletingId);
        }}
        title="Hapus Material?"
        description="Material yang dihapus tidak dapat dikembalikan. Pastikan material tidak sedang digunakan."
        confirmText="Hapus"
        variant="danger"
      />
    </DnaPageContainer>
  );
}
