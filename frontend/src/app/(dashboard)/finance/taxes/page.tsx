"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, Plus, Pencil, Trash2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
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
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
} from "@/components/dna";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isActive: boolean;
  description?: string;
}

const FALLBACK: TaxRate[] = [
  { id: "tx-1", name: "PPN 11%", rate: 11, isActive: true, description: "Pajak Pertambahan Nilai standar 2026" },
  { id: "tx-2", name: "PPh 21", rate: 5, isActive: true, description: "Potongan pajak penghasilan karyawan" },
  { id: "tx-3", name: "PPh 23", rate: 2, isActive: true, description: "Potongan pajak jasa" },
  { id: "tx-4", name: "Pajak Daerah 0.5%", rate: 0.5, isActive: false, description: "Pajak restoran (legacy)" },
];

export default function FinanceTaxesPage() {
  const toast = useDnaToast();
  const qc = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");

  const { data: taxes = FALLBACK, isLoading } = useQuery({
    queryKey: ["finance-taxes"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/taxes");
        const body = unwrapResponse(res);
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : FALLBACK;
      } catch {
        return FALLBACK;
      }
    },
  });

  const createMut = useMutation({
    mutationFn: (payload: Partial<TaxRate>) => api.post("/finance/taxes", payload).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Tarif pajak berhasil ditambahkan");
      qc.invalidateQueries({ queryKey: ["finance-taxes"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menambah tarif pajak"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TaxRate> }) =>
      api.patch(`/finance/taxes/${id}`, payload).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Tarif pajak berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["finance-taxes"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui tarif pajak"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/taxes/${id}`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Tarif pajak berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["finance-taxes"] });
      setDeletingId(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menghapus tarif pajak"),
  });

  function openCreate() {
    setEditing(null);
    setName(""); setRate(""); setIsActive(true); setDescription("");
    setModalOpen(true);
  }

  function openEdit(t: TaxRate) {
    setEditing(t);
    setName(t.name); setRate(String(t.rate)); setIsActive(t.isActive); setDescription(t.description ?? "");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function submit() {
    const payload = { name, rate: parseFloat(rate), isActive, description };
    if (editing) {
      updateMut.mutate({ id: editing.id, payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const activeCount = taxes.filter((t: TaxRate) => t.isActive).length;
  const maxRate = taxes.reduce((m: number, t: TaxRate) => (t.rate > m ? t.rate : m), 0);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Manajemen Tarif Pajak (Tax Rate Master)"
        description="Konfigurasi master tarif pajak (PPN, PPh, pajak daerah) untuk seluruh modul finance dan transaksi otomatis."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 font-semibold">
            <Percent className="w-3.5 h-3.5" />
            <span>SCR-050: Tax Master Data</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => qc.invalidateQueries({ queryKey: ["finance-taxes"] })}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Tarif Pajak
            </DnaButton>
          </div>
        }
      />

      <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-3 my-4">
        <div className="p-1 rounded-md bg-amber-100 text-amber-700 font-bold">INFO</div>
        <div>
          <div className="font-bold text-sm">Modul Pajak &amp; e-Faktur Ditangguhkan (Tax Purge Applied)</div>
          <div className="text-amber-800 mt-0.5">
            Sesuai arahan Requirement Bagian 12 (&quot;Modul Pajak dan e-Faktur: tidak perlu dikerjakan / di-skip dari scope&quot;), seluruh perhitungan pajak (PPN/PPh) pada faktur penjualan, pembelian, dan pembayaran dinonaktifkan dan ditunda ke fase maintenance/perubahan.
          </div>
        </div>
      </div>

      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Tarif Pajak"
          value={`${taxes.length} Skema`}
          icon={<Percent className="w-5 h-5 text-indigo-600" />}
          subtext="Seluruh jenis pajak terdaftar"
          variant="info"
        />
        <DnaStatCard
          label="Tarif Aktif"
          value={`${activeCount} Skema`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: `${taxes.length ? Math.round((activeCount / taxes.length) * 100) : 0}% Active`, isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Tarif Tertinggi"
          value={`${maxRate}%`}
          icon={<Percent className="w-5 h-5 text-rose-600" />}
          subtext="Tarif pajak dengan nilai terbesar"
          variant="warning"
        />
      </DnaKpiGrid>

      <DnaDataTableCard>
        <DnaTable>
          <DnaTableHead>
            <tr>
              <DnaTh>Nama Pajak</DnaTh>
              <DnaTh align="right" className="w-[140px]">Tarif (%)</DnaTh>
              <DnaTh>Deskripsi</DnaTh>
              <DnaTh align="center" className="w-[120px]">Status</DnaTh>
              <DnaTh align="center" className="w-[100px]">Aksi</DnaTh>
            </tr>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={5} className="text-center py-8 text-slate-400">Memuat...</DnaTd>
              </DnaTableRow>
            ) : taxes.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={5} className="text-center py-8 text-slate-400">Belum ada data tarif pajak</DnaTd>
              </DnaTableRow>
            ) : taxes.map((t: TaxRate) => (
              <DnaTableRow key={t.id}>
                <DnaTd className="font-semibold text-slate-900">{t.name}</DnaTd>
                <DnaTd align="right">
                  <span className="font-semibold tabular-nums text-indigo-700">{t.rate.toFixed(2)}%</span>
                </DnaTd>
                <DnaTd className="text-slate-600">{t.description ?? "—"}</DnaTd>
                <DnaTd align="center">
                  {t.isActive ? (
                    <DnaBadge variant="success">Aktif</DnaBadge>
                  ) : (
                    <DnaBadge variant="secondary"><XCircle className="w-3 h-3 mr-1 inline" />Non-Aktif</DnaBadge>
                  )}
                </DnaTd>
                <DnaTd align="center">
                  <div className="flex items-center justify-center gap-1.5">
                    <DnaButton variant="secondary" size="sm" onClick={() => openEdit(t)} title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </DnaButton>
                    <DnaButton variant="danger" size="sm" onClick={() => setDeletingId(t.id)} title="Hapus">
                      <Trash2 className="w-3.5 h-3.5" />
                    </DnaButton>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ))}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>

      <DnaModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editing ? "Edit Tarif Pajak" : "Tambah Tarif Pajak"}
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Pajak</label>
            <DnaInput value={name} onChange={(e) => setName(e.target.value)} placeholder="contoh: PPN 11%" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tarif (%)</label>
            <DnaInput value={rate} onChange={(e) => setRate(e.target.value)} placeholder="contoh: 11" type="number" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deskripsi</label>
            <DnaInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Keterangan pajak (opsional)" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status</label>
            <DnaSelect value={isActive ? "active" : "inactive"} onChange={(v) => setIsActive(v === "active")}>
              <option value="active">Aktif</option>
              <option value="inactive">Non-Aktif</option>
            </DnaSelect>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DnaButton variant="secondary" size="md" onClick={closeModal}>Batal</DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={submit}
              disabled={!name || !rate || createMut.isPending || updateMut.isPending}
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
        title="Hapus Tarif Pajak?"
        description="Tarif pajak yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        variant="danger"
      />
    </DnaPageContainer>
  );
}
