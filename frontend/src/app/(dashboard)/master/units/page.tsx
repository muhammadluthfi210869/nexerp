"use client";

import React, { useState } from "react";
import {
  Ruler,
  Plus,
  Edit3,
  Power,
  Type,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaStatCard,
  DnaBadge,
  DnaButton,
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DNA_TABLE_CLASSES,
  DnaCell,
  DnaModal,
  DnaInput,
  DnaTextarea,
  useDnaToast,
} from "@/components/dna";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { cn } from "@/lib/utils";

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
  const { showToast } = useDnaToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UnitForm>(EMPTY_FORM);

  const { data: units, isLoading } = useQuery({
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
      showToast({ type: "success", title: "Satuan Ditambahkan", message: `${variables.code} berhasil disimpan.` });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      closeModal();
    },
    onError: (err: any) => {
      showToast({ type: "error", title: "Gagal", message: err.response?.data?.message || "Tidak bisa menambah satuan." });
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
      showToast({ type: "success", title: "Satuan Diperbarui", message: `Perubahan berhasil disimpan.` });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      closeModal();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/master/units/${id}`);
      return res.data;
    },
    onSuccess: () => {
      showToast({ type: "warning", title: "Status Diubah", message: "Satuan dinonaktifkan." });
      queryClient.invalidateQueries({ queryKey: ["units"] });
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
      showToast({ type: "error", title: "Validasi Gagal", message: "Kode dan nama satuan wajib diisi." });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const total = units?.length || 0;
  const active = units?.filter((u) => u.isActive).length || 0;

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      <DnaPageHeader
        title="MASTER SATUAN (UoM)"
        badge={<DnaBadge status="info">MASTER DATA</DnaBadge>}
        subtitle="Konfigurasi unit of measure (PCS, KG, GR, ML, L, dll) yang dipakai di seluruh transaksi inventory, produksi, dan pembelian."
        breadcrumbItems={[
          { label: "Master", href: "/master" },
          { label: "Satuan" },
        ]}
        actions={
          <DnaButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Satuan</span>
          </DnaButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DnaStatCard label="Total Satuan" value={total} icon={<Ruler />} variant="blue" />
        <DnaStatCard label="Aktif" value={active} icon={<Power />} variant="emerald" />
        <DnaStatCard label="Non-Aktif" value={total - active} icon={<Power />} variant="slate" />
      </div>

      <DnaDataTableCard
        title="DAFTAR SATUAN UKUR"
        count={total}
        badge={<DnaBadge status="neutral">UoM MASTER</DnaBadge>}
      >
        <DnaTable>
          <DnaTableHead>
            <tr>
              <th className={cn(DNA_TABLE_CLASSES.th, "w-12 text-center")}>#</th>
              <th className={DNA_TABLE_CLASSES.th}>Kode</th>
              <th className={DNA_TABLE_CLASSES.th}>Nama Satuan</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Simbol</th>
              <th className={DNA_TABLE_CLASSES.th}>Deskripsi</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center w-32")}>Aksi</th>
            </tr>
          </DnaTableHead>
          <tbody className={DNA_TABLE_CLASSES.tbody}>
            {isLoading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-xs text-slate-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!isLoading && (!units || units.length === 0) && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-xs text-slate-400">
                  Belum ada satuan. Klik "Tambah Satuan" untuk membuat.
                </td>
              </tr>
            )}
            {units?.map((u, idx) => (
              <tr key={u.id} className={DNA_TABLE_CLASSES.tr}>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-center font-mono text-slate-400")}>
                  {idx + 1}
                </td>
                <td className={DNA_TABLE_CLASSES.td}>
                  <DnaCell.Code value={u.code} />
                </td>
                <td className={DNA_TABLE_CLASSES.td}>
                  <DnaCell.Text primary={u.name} />
                </td>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                  {u.symbol ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]">
                      <Type className="w-3 h-3" /> {u.symbol}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-xs text-slate-600")}>
                  {u.description || <span className="text-slate-300">—</span>}
                </td>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                  <DnaBadge status={u.isActive ? "success" : "neutral"}>
                    {u.isActive ? "AKTIF" : "NON-AKTIF"}
                  </DnaBadge>
                </td>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                      title="Sunting"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Nonaktifkan satuan "${u.code}"?`)) {
                          toggleMutation.mutate(u.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Nonaktifkan"
                      disabled={!u.isActive}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

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