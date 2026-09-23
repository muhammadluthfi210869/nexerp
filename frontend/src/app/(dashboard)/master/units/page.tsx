"use client";

import React, { useState, useMemo } from "react";
import {
  Ruler,
  Plus,
  Edit3,
  Power,
  Eye,
  Type,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaStatCard,
  DnaBadge,
  DnaButton,
  DnaDataTableCard,
  DnaTable,
  DnaCell,
  DnaModal,
  DnaDetailDrawer,
  DnaInput,
  DnaTextarea,
  useDnaToast,
} from "@/components/dna";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

interface Unit {
  id: string;
  code: string;
  name: string;
  symbol?: string | null;
  description?: string | null;
  isActive: boolean;
}

interface UnitForm {
  code: string;
  name: string;
  symbol: string;
  description: string;
}

const EMPTY_FORM: UnitForm = { code: "", name: "", symbol: "", description: "" };

export default function MasterUnitsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useDnaToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UnitForm>(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const {
    data: units,
    isLoading,
    isError,
    error: unitsError,
    refetch,
  } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const res = await api.get("/master/units");
      return (unwrapResponse(res) || []) as Unit[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (dto: UnitForm) => {
      const res = await api.post("/master/units", {
        code: dto.code.toUpperCase(),
        name: dto.name,
        symbol: dto.symbol || undefined,
        description: dto.description || undefined,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      success(`Satuan ${variables.code} berhasil disimpan.`);
      queryClient.invalidateQueries({ queryKey: ["units"] });
      closeModal();
    },
    onError: (err: any) => {
      error(err.response?.data?.message || "Tidak bisa menambah satuan.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<UnitForm> }) => {
      const res = await api.patch(`/master/units/${id}`, {
        ...(dto.code && { code: dto.code.toUpperCase() }),
        ...(dto.name && { name: dto.name }),
        ...(dto.symbol !== undefined && { symbol: dto.symbol || null }),
        ...(dto.description !== undefined && { description: dto.description || null }),
      });
      return res.data;
    },
    onSuccess: () => {
      success(`Perubahan satuan berhasil disimpan.`);
      queryClient.invalidateQueries({ queryKey: ["units"] });
      closeModal();
    },
    onError: (err: any) => {
      error(err.response?.data?.message || "Gagal memperbarui satuan.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/master/units/${id}`);
      return res.data;
    },
    onSuccess: () => {
      success("Status satuan berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (err: any) => {
      error(err.response?.data?.message || "Gagal mengubah status satuan.");
    },
  });

  function closeModal() {
    setIsOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsOpen(true);
  }

  function openEdit(u: Unit) {
    setEditingId(u.id);
    setForm({
      code: u.code,
      name: u.name,
      symbol: u.symbol ?? "",
      description: u.description ?? "",
    });
    setIsOpen(true);
  }

  function handleSubmit() {
    if (!form.code.trim() || !form.name.trim()) {
      error("Kode dan nama satuan wajib diisi.");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const filteredUnits = useMemo(() => {
    if (!units) return [];
    if (!searchQuery.trim()) return units;
    const q = searchQuery.toLowerCase();
    return units.filter(
      (u) =>
        u.code.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.symbol && u.symbol.toLowerCase().includes(q)) ||
        (u.description && u.description.toLowerCase().includes(q))
    );
  }, [units, searchQuery]);

  const total = units?.length || 0;
  const active = units?.filter((u) => u.isActive).length || 0;

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      <DnaPageHeader
        title="MASTER SATUAN (UoM)"
        badge={<DnaBadge variant="info">MASTER DATA</DnaBadge>}
        subtitle="Konfigurasi unit of measure (PCS, KG, GR, ML, L, dll) yang dipakai di seluruh transaksi inventory, produksi, dan pembelian."
        breadcrumbItems={[
          { label: "Master", href: "/master" },
          { label: "Satuan" },
        ]}
        actions={
          <DnaButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Satuan</span>
          </DnaButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DnaStatCard label="Total Satuan" value={total} icon={<Ruler />} variant="blue" />
        <DnaStatCard label="Aktif" value={active} icon={<Power />} variant="emerald" />
        <DnaStatCard label="Non-Aktif" value={total - active} icon={<Power />} variant="slate" />
      </div>

      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari kode, nama satuan, simbol, atau deskripsi...",
          actionButton: {
            label: "Tambah Satuan",
            onClick: openCreate,
          },
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold tracking-wider uppercase select-none">
                <th className="px-3.5 py-2.5 w-12 text-center text-slate-400">#</th>
                <th className="px-3.5 py-2.5 w-[130px]">Kode Satuan</th>
                <th className="px-3.5 py-2.5 w-[110px]">Simbol</th>
                <th className="px-3.5 py-2.5">Nama Lengkap</th>
                <th className="px-3.5 py-2.5">Deskripsi</th>
                <th className="px-3.5 py-2.5 text-center w-[120px]">Status</th>
                <th className="px-3.5 py-2.5 text-center w-[120px] whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-3.5 py-8 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data satuan...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-3.5 py-8 text-center text-xs text-rose-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span>Gagal memuat data satuan: {(unitsError as any)?.message || "Terjadi kesalahan"}</span>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-md border border-rose-200 transition-colors inline-block"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3.5 py-8 text-center text-xs text-slate-400">
                    Belum ada satuan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u, idx) => (
                  <tr
                    key={u.id}
                    className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedUnit(u);
                      setIsDetailDrawerOpen(true);
                    }}
                  >
                    <td className="px-3.5 py-2.5 text-center font-mono text-slate-400 text-[11px] tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Code>{u.code}</DnaCell.Code>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-mono text-[11.5px] text-slate-600 font-semibold">
                        {u.symbol || "-"}
                      </DnaCell.Text>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-semibold text-slate-900">{u.name}</DnaCell.Text>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Text className="text-slate-600">
                        {u.description || <span className="text-slate-300">-</span>}
                      </DnaCell.Text>
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <DnaBadge variant={u.isActive ? "success" : "neutral"}>
                        {u.isActive ? "AKTIF" : "NON-AKTIF"}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                          onClick={() => {
                            setSelectedUnit(u);
                            setIsDetailDrawerOpen(true);
                          }}
                          title="Lihat Detail Satuan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                          onClick={() => openEdit(u)}
                          title="Sunting Satuan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${u.isActive ? "text-slate-400 hover:text-rose-600" : "text-emerald-500 hover:text-emerald-700"}`}
                          onClick={() => toggleMutation.mutate(u.id)}
                          title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          <Power className="w-3.5 h-3.5" />
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

      {/* ── DETAIL DRAWER SATUAN (Golden Rule 5) ── */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedUnit ? `${selectedUnit.code} — ${selectedUnit.name}` : "Detail Satuan"}
        subtitle={`Simbol: ${selectedUnit?.symbol || "-"} • Status: ${selectedUnit?.isActive ? "Aktif" : "Non-Aktif"}`}
        badge={
          selectedUnit?.isActive ? (
            <DnaBadge variant="success">SATUAN AKTIF</DnaBadge>
          ) : (
            <DnaBadge variant="neutral">NON-AKTIF</DnaBadge>
          )
        }
        tabs={[
          {
            id: "specs",
            label: "Detail & Konfigurasi",
            content: selectedUnit ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Kode Singkat Satuan</span>
                    <span className="font-mono font-bold text-blue-600 text-sm">{selectedUnit.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Simbol Representasi</span>
                    <span className="font-mono font-semibold text-slate-800 text-sm">
                      {selectedUnit.symbol || "-"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[11px]">Nama Satuan Lengkap</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedUnit.name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[11px]">Keterangan Penggunaan</span>
                    <span className="text-slate-700">
                      {selectedUnit.description || "Tidak ada keterangan penggunaan khusus."}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-900 block">Pemakaian di Master Barang</span>
                      <span className="text-slate-500 text-[11px]">Bahan Baku, Kemasan, Barang Jadi & Ruahan</span>
                    </div>
                  </div>
                  <DnaBadge variant="info">Multi-Modul</DnaBadge>
                </div>
              </div>
            ) : null,
          },
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={() => {
                success(`Daftar pemetaan satuan ${selectedUnit?.code} diekspor.`);
              }}
            >
              Export Pemetaan
            </DnaButton>
            <div className="flex items-center gap-2">
              <DnaButton
                variant="secondary"
                size="sm"
                icon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (selectedUnit) {
                    setIsDetailDrawerOpen(false);
                    openEdit(selectedUnit);
                  }
                }}
              >
                Sunting Satuan
              </DnaButton>
              <DnaButton variant="primary" size="sm" onClick={() => setIsDetailDrawerOpen(false)}>
                Selesai
              </DnaButton>
            </div>
          </div>
        }
      />

      <DnaModal
        isOpen={isOpen}
        onClose={closeModal}
        title={editingId ? "Sunting Satuan" : "Tambah Satuan Baru"}
        subtitle="Kode uppercase 2-6 karakter. Simbol opsional untuk display."
        size="md"
        footer={
          <>
            <DnaButton variant="secondary" onClick={closeModal}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Simpan Perubahan" : "Simpan"}
            </DnaButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode *
              </label>
              <DnaInput
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="PCS / KG / GR"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Simbol (opsional)
              </label>
              <DnaInput
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                placeholder="kg, ml, pcs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Satuan *
            </label>
            <DnaInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Pieces / Kilogram / Gram"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi
            </label>
            <DnaTextarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Catatan penggunaan satuan ini..."
              rows={2}
            />
          </div>
        </div>
      </DnaModal>
    </div>
  );
}