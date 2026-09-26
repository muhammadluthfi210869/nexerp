"use client";

import React, { useState, useMemo } from "react";
import {
  Percent,
  Plus,
  Edit3,
  Power,
  Eye,
  FileSpreadsheet,
  Receipt,
  CheckCircle2,
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
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

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
  const { showToast, success, error } = useDnaToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaxRateForm>(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const {
    data: taxRates,
    isLoading,
    isError,
    error: taxRatesError,
    refetch,
  } = useQuery({
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
      success(`Tarif pajak ${form.name} berhasil disimpan.`);
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
      closeModal();
    },
    onError: (err: any) => {
      error(err.response?.data?.message || "Tidak bisa menambah tarif.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: any }) => {
      const res = await api.patch(`/master/tax-rates/${id}`, dto);
      return res.data;
    },
    onSuccess: () => {
      success(`Tarif pajak ${form.name} berhasil diubah.`);
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
      closeModal();
    },
    onError: (err: any) => {
      error(err.response?.data?.message || "Tidak bisa mengubah tarif.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/master/tax-rates/${id}`);
      return res.data;
    },
    onSuccess: () => {
      success("Status tarif pajak berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
    },
    onError: (err: any) => {
      error(err.response?.data?.message || "Gagal mengubah status tarif pajak.");
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
      error("Nama dan persentase tarif wajib diisi.");
      return;
    }
    const rate = Number(form.rate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      error("Tarif harus berupa angka valid antara 0 - 100.");
      return;
    }
    const dto = { name: form.name, rate, description: form.description || undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto });
    } else {
      createMutation.mutate(dto);
    }
  }

  const filteredTaxRates = useMemo(() => {
    if (!taxRates) return [];
    if (!searchQuery.trim()) return taxRates;
    const q = searchQuery.toLowerCase();
    return taxRates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        String(t.rate).includes(q)
    );
  }, [taxRates, searchQuery]);

  const active = taxRates?.filter((t) => t.isActive).length || 0;
  const total = taxRates?.length || 0;

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      <DnaPageHeader
        title="MASTER TARIF PAJAK"
        badge={<DnaBadge variant="info">MASTER DATA</DnaBadge>}
        subtitle="Konfigurasi tarif pajak (PPN, PPh) yang dipakai di seluruh transaksi penjualan, pembelian, dan jurnal."
        breadcrumbItems={[
          { label: "Master", href: "/master" },
          { label: "Tarif Pajak" },
        ]}
        actions={
          <DnaButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Tarif</span>
          </DnaButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DnaStatCard label="Total Tarif" value={total} icon={<Percent />} variant="blue" />
        <DnaStatCard label="Aktif" value={active} icon={<Power />} variant="emerald" />
        <DnaStatCard label="Non-Aktif" value={total - active} icon={<Power />} variant="slate" />
      </div>

      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari nama tarif atau deskripsi pajak...",
          actionButton: {
            label: "Tambah Tarif",
            onClick: openCreate,
          },
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold tracking-wider uppercase select-none">
                <DnaTh className="px-3.5 py-2.5 w-12 text-center text-slate-400">#</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Nama Tarif Pajak</DnaTh>
                <DnaTh className="px-3.5 py-2.5 text-right w-[150px]">Persentase (%)</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Deskripsi & Ruang Lingkup</DnaTh>
                <DnaTh className="px-3.5 py-2.5 text-center w-[120px]">Status</DnaTh>
                <DnaTh className="px-3.5 py-2.5 text-center w-[120px] whitespace-nowrap">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="px-3.5 py-8 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data tarif pajak...</span>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ) : isError ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="px-3.5 py-8 text-center text-xs text-rose-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span>Gagal memuat data tarif pajak: {(taxRatesError as any)?.message || "Terjadi kesalahan"}</span>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-md border border-rose-200 transition-colors inline-block"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ) : filteredTaxRates.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="px-3.5 py-8 text-center text-xs text-slate-400">
                    Belum ada tarif yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredTaxRates.map((tr, idx) => (
                  <DnaTableRow
                    key={tr.id}
                    className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedTaxRate(tr);
                      setIsDetailDrawerOpen(true);
                    }}
                  >
                    <DnaTd className="px-3.5 py-2.5 text-center tabular-nums text-slate-400 text-[11px] tabular-nums">
                      {idx + 1}
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-semibold text-slate-900">{tr.name}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric
                        value={Number(tr.rate)}
                        suffix="%"
                        className="tabular-nums font-bold text-blue-600"
                      />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="text-slate-600">
                        {tr.description || <span className="text-slate-300">-</span>}
                      </DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <DnaBadge variant={tr.isActive ? "success" : "neutral"}>
                        {tr.isActive ? "AKTIF" : "NON-AKTIF"}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                          onClick={() => {
                            setSelectedTaxRate(tr);
                            setIsDetailDrawerOpen(true);
                          }}
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                          onClick={() => openEdit(tr)}
                          title="Sunting Tarif"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${tr.isActive ? "text-slate-400 hover:text-rose-600" : "text-emerald-500 hover:text-emerald-700"}`}
                          onClick={() => toggleMutation.mutate(tr.id)}
                          title={tr.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* ── DETAIL DRAWER TARIF PAJAK (Golden Rule 5) ── */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedTaxRate?.name || "Detail Tarif Pajak"}
        subtitle={`Tarif: ${selectedTaxRate ? Number(selectedTaxRate.rate).toFixed(2) : 0}% • Status: ${selectedTaxRate?.isActive ? "Aktif" : "Non-Aktif"}`}
        badge={
          selectedTaxRate?.isActive ? (
            <DnaBadge variant="success">TARIF AKTIF</DnaBadge>
          ) : (
            <DnaBadge variant="neutral">NON-AKTIF</DnaBadge>
          )
        }
        tabs={[
          {
            id: "specs",
            label: "Detail & Ketentuan",
            content: selectedTaxRate ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nama Tarif Pajak</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedTaxRate.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Persentase Pemotongan / Pungutan</span>
                    <span className="tabular-nums font-bold text-blue-600 text-sm">
                      {Number(selectedTaxRate.rate).toFixed(2)}%
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[11px]">Deskripsi & Ruang Lingkup Pengenaan</span>
                    <span className="text-slate-700">
                      {selectedTaxRate.description || "Tidak ada deskripsi tambahan untuk tarif ini."}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-900 block">Modul yang Menggunakan</span>
                      <span className="text-slate-500 text-[11px]">Invoice Penjualan, Purchase Order, Jurnal Memorial</span>
                    </div>
                  </div>
                  <DnaBadge variant="info">Otomatis</DnaBadge>
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
                success(`Rekapitulasi tarif ${selectedTaxRate?.name} diekspor.`);
              }}
            >
              Export Rekap
            </DnaButton>
            <div className="flex items-center gap-2">
              <DnaButton
                variant="secondary"
                size="sm"
                icon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (selectedTaxRate) {
                    setIsDetailDrawerOpen(false);
                    openEdit(selectedTaxRate);
                  }
                }}
              >
                Sunting
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