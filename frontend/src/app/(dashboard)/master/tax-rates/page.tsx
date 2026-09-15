"use client";

import React, { useState } from "react";
import {
  Percent,
  Plus,
  Edit3,
  Power,
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

interface TaxRate {
  id: string;
  name: string;
  rate: number | string;
  description?: string | null;
  isActive: boolean;
}

interface TaxRateForm {
  name: string;
  rate: string;
  description: string;
}

const EMPTY_FORM: TaxRateForm = { name: "", rate: "", description: "" };

export default function MasterTaxRatesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useDnaToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaxRateForm>(EMPTY_FORM);

  const { data: taxRates, isLoading } = useQuery({
    queryKey: ["tax-rates"],
    queryFn: async () => {
      const res = await api.get("/master/tax-rates");
      return (unwrapResponse(res) || []) as TaxRate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (dto: { name: string; rate: number; description?: string }) => {
      const res = await api.post("/master/tax-rates", dto);
      return res.data;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Tarif Pajak Ditambahkan", message: `${form.name} berhasil disimpan.` });
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
      closeModal();
    },
    onError: (err: any) => {
      showToast({ type: "error", title: "Gagal", message: err.response?.data?.message || "Tidak bisa menambah tarif." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: any }) => {
      const res = await api.patch(`/master/tax-rates/${id}`, dto);
      return res.data;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Tarif Pajak Diperbarui", message: `${form.name} berhasil diubah.` });
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
      closeModal();
    },
    onError: (err: any) => {
      showToast({ type: "error", title: "Gagal", message: err.response?.data?.message || "Tidak bisa mengubah tarif." });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/master/tax-rates/${id}`);
      return res.data;
    },
    onSuccess: () => {
      showToast({ type: "warning", title: "Status Diubah", message: "Tarif pajak dinonaktifkan." });
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
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

  function openEdit(tr: TaxRate) {
    setEditingId(tr.id);
    setForm({
      name: tr.name,
      rate: String(tr.rate),
      description: tr.description ?? "",
    });
    setIsOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.rate) {
      showToast({ type: "error", title: "Validasi Gagal", message: "Nama dan tarif wajib diisi." });
      return;
    }
    const rate = Number(form.rate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      showToast({ type: "error", title: "Validasi Gagal", message: "Tarif harus angka 0-100." });
      return;
    }
    const dto = { name: form.name, rate, description: form.description || undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto });
    } else {
      createMutation.mutate(dto);
    }
  }

  const active = taxRates?.filter((t) => t.isActive).length || 0;
  const total = taxRates?.length || 0;

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      <DnaPageHeader
        title="MASTER TARIF PAJAK"
        badge={<DnaBadge status="info">MASTER DATA</DnaBadge>}
        subtitle="Konfigurasi tarif pajak (PPN, PPh) yang dipakai di seluruh transaksi penjualan, pembelian, dan jurnal."
        breadcrumbItems={[
          { label: "Master", href: "/master" },
          { label: "Tarif Pajak" },
        ]}
        actions={
          <DnaButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Tarif</span>
          </DnaButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DnaStatCard label="Total Tarif" value={total} icon={<Percent />} variant="blue" />
        <DnaStatCard label="Aktif" value={active} icon={<Power />} variant="emerald" />
        <DnaStatCard label="Non-Aktif" value={total - active} icon={<Power />} variant="slate" />
      </div>

      <DnaDataTableCard
        title="DAFTAR TARIF PAJAK"
        count={total}
        badge={<DnaBadge status="neutral">PPN & PPh</DnaBadge>}
      >
        <DnaTable>
          <DnaTableHead>
            <tr>
              <th className={cn(DNA_TABLE_CLASSES.th, "w-12 text-center")}>#</th>
              <th className={DNA_TABLE_CLASSES.th}>Nama Tarif</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-right")}>Persentase</th>
              <th className={DNA_TABLE_CLASSES.th}>Deskripsi</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center w-32")}>Aksi</th>
            </tr>
          </DnaTableHead>
          <tbody className={DNA_TABLE_CLASSES.tbody}>
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-xs text-slate-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!isLoading && (!taxRates || taxRates.length === 0) && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-xs text-slate-400">
                  Belum ada tarif. Klik "Tambah Tarif" untuk membuat.
                </td>
              </tr>
            )}
            {taxRates?.map((tr, idx) => (
              <tr key={tr.id} className={DNA_TABLE_CLASSES.tr}>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-center font-mono text-slate-400")}>
                  {idx + 1}
                </td>
                <td className={DNA_TABLE_CLASSES.td}>
                  <DnaCell.Text primary={tr.name} />
                </td>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-right font-mono font-bold")}>
                  {Number(tr.rate).toFixed(2)}%
                </td>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-xs text-slate-600")}>
                  {tr.description || <span className="text-slate-300">—</span>}
                </td>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                  <DnaBadge status={tr.isActive ? "success" : "neutral"}>
                    {tr.isActive ? "AKTIF" : "NON-AKTIF"}
                  </DnaBadge>
                </td>
                <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(tr)}
                      className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                      title="Sunting"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Nonaktifkan tarif "${tr.name}"?`)) {
                          toggleMutation.mutate(tr.id);
                        }
                      }}
                      className={cn(
                        "p-1 rounded transition-colors",
                        tr.isActive
                          ? "text-slate-400 hover:text-rose-600"
                          : "text-emerald-500 hover:text-emerald-700"
                      )}
                      title={tr.isActive ? "Nonaktifkan" : "Aktifkan kembali (perlu edit)"}
                      disabled={!tr.isActive}
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
        title={editingId ? "Sunting Tarif Pajak" : "Tambah Tarif Pajak"}
        subtitle="Konfigurasi nama tarif dan persentase pajak."
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Tarif *
            </label>
            <DnaInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: PPN 11%, PPh 23"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Persentase (%) *
            </label>
            <DnaInput
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              placeholder="11.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi
            </label>
            <DnaTextarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Catatan atau konteks penggunaan tarif ini..."
              rows={2}
            />
          </div>
        </div>
      </DnaModal>
    </div>
  );
}