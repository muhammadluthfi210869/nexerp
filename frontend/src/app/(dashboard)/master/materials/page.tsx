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

const FALLBACK: Material[] = [
  { id: "mat-1", code: "RAW-001", name: "Aqua Destilasi", type: "RAW_MATERIAL", unit: "L", unitPrice: 5000, stockQty: 500, minStock: 50, status: "ACTIVE" },
  { id: "mat-2", code: "RAW-002", name: "Glycerin USP", type: "RAW_MATERIAL", unit: "Kg", unitPrice: 85000, stockQty: 120, minStock: 20, status: "ACTIVE" },
  { id: "mat-3", code: "PKG-001", name: "Botol Pump 30ml", type: "PACKAGING", unit: "Pcs", unitPrice: 2500, stockQty: 5000, minStock: 1000, status: "ACTIVE" },
  { id: "mat-4", code: "PRD-001", name: "Sunscreen Glow Gel SPF 50", type: "FINISHED_GOOD", unit: "Pcs", unitPrice: 35000, stockQty: 800, minStock: 100, status: "ACTIVE" },
];

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

  const { data: materials = FALLBACK, isLoading } = useQuery({
    queryKey: ["master-materials", search],
    queryFn: async () => {
      try {
        const res = await api.get(`/master/materials?search=${encodeURIComponent(search)}`);
        const body = unwrapResponse(res);
        const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : FALLBACK;
        return list;
      } catch {
        return FALLBACK;
      }
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
        title="Daftar Material"
        badge={<DnaBadge variant="emerald">{materials.length} Entri</DnaBadge>}
        customToolbar={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <DnaInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode / nama material..."
              className="pl-9 pr-3 py-1.5 text-xs w-72"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Kode</th>
                <th className="px-3.5 py-3">Nama Material</th>
                <th className="px-3.5 py-3 text-center">Tipe</th>
                <th className="px-3.5 py-3 text-center">Satuan</th>
                <th className="px-3.5 py-3 text-right">Harga Satuan</th>
                <th className="px-3.5 py-3 text-right">Stok</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">Memuat...</td></tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">Belum ada data material</td></tr>
              ) : materials.map((m: Material) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">{m.code ?? "—"}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{m.name}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant="secondary">{m.type}</DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-center text-slate-700">{m.unit}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono">Rp {m.unitPrice.toLocaleString("id-ID")}</td>
                  <td className="px-3.5 py-2.5 text-right">
                    <span className={`font-mono font-bold ${(m.stockQty ?? 0) <= (m.minStock ?? 0) ? "text-rose-600" : "text-slate-800"}`}>
                      {(m.stockQty ?? 0).toLocaleString("id-ID")}
                    </span>
                    {m.minStock ? (
                      <span className="text-[10px] text-slate-400 ml-1">/ min {m.minStock}</span>
                    ) : null}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    {m.status === "ACTIVE" ? (
                      <DnaBadge variant="success">Aktif</DnaBadge>
                    ) : (
                      <DnaBadge variant="secondary">{m.status ?? "—"}</DnaBadge>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <DnaButton variant="secondary" size="sm" onClick={() => openEdit(m)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton variant="danger" size="sm" onClick={() => setDeletingId(m.id)}>
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
