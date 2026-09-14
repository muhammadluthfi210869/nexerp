"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, Plus, Pencil, Trash2, RefreshCw, Star, ArrowRightLeft } from "lucide-react";
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

interface Currency {
  id: string;
  code: string;
  symbol?: string;
  exchangeRate: number;
  isMain?: boolean;
}

const FALLBACK: Currency[] = [
  { id: "cur-1", code: "IDR", symbol: "Rp", exchangeRate: 1, isMain: true },
  { id: "cur-2", code: "USD", symbol: "$", exchangeRate: 15800, isMain: false },
  { id: "cur-3", code: "EUR", symbol: "€", exchangeRate: 17200, isMain: false },
  { id: "cur-4", code: "SGD", symbol: "S$", exchangeRate: 11800, isMain: false },
];

export default function FinanceCurrenciesPage() {
  const toast = useDnaToast();
  const qc = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rateEditing, setRateEditing] = useState<Currency | null>(null);
  const [newRate, setNewRate] = useState("");

  // Form state
  const [code, setCode] = useState("");
  const [symbol, setSymbol] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [isMain, setIsMain] = useState(false);

  const { data: currencies = FALLBACK, isLoading } = useQuery({
    queryKey: ["finance-currencies"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/currencies");
        const body = unwrapResponse(res);
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : FALLBACK;
      } catch {
        return FALLBACK;
      }
    },
  });

  const createMut = useMutation({
    mutationFn: (payload: Partial<Currency>) => api.post("/finance/currencies", payload).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Mata uang berhasil ditambahkan");
      qc.invalidateQueries({ queryKey: ["finance-currencies"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menambah mata uang"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Currency> }) =>
      api.patch(`/finance/currencies/${id}`, payload).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Mata uang berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["finance-currencies"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui mata uang"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/currencies/${id}`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Mata uang berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["finance-currencies"] });
      setDeletingId(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menghapus mata uang"),
  });

  const rateMut = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) =>
      api.put(`/finance/currencies/${id}/exchange-rate`, { exchangeRate: rate }).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Kurs berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["finance-currencies"] });
      setRateEditing(null);
      setNewRate("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui kurs"),
  });

  function openCreate() {
    setEditing(null);
    setCode(""); setSymbol(""); setExchangeRate("1"); setIsMain(false);
    setModalOpen(true);
  }

  function openEdit(c: Currency) {
    setEditing(c);
    setCode(c.code); setSymbol(c.symbol ?? ""); setExchangeRate(String(c.exchangeRate)); setIsMain(!!c.isMain);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function submit() {
    const payload = { code, symbol, exchangeRate: parseFloat(exchangeRate), isMain };
    if (editing) {
      updateMut.mutate({ id: editing.id, payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const mainCurrency = currencies.find((c: Currency) => c.isMain);
  const totalCurrencies = currencies.length;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Manajemen Mata Uang (Currency Master)"
        description="Konfigurasi multi-currency, kurs tukar (exchange rate), dan mata uang utama untuk seluruh transaksi."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-semibold">
            <Coins className="w-3.5 h-3.5" />
            <span>SCR-051: Currency Master</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => qc.invalidateQueries({ queryKey: ["finance-currencies"] })}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Mata Uang
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Mata Uang"
          value={`${totalCurrencies} CCY`}
          icon={<Coins className="w-5 h-5 text-amber-600" />}
          subtext="Seluruh mata uang terdaftar"
          variant="info"
        />
        <DnaStatCard
          label="Base Currency"
          value={mainCurrency ? `${mainCurrency.code} (${mainCurrency.symbol ?? ""})` : "—"}
          icon={<Star className="w-5 h-5 text-emerald-600" />}
          subtext="Mata uang utama pelaporan"
          variant="success"
        />
        <DnaStatCard
          label="Kurs Tertinggi"
          value={currencies.length ? Math.max(...currencies.map((c: Currency) => c.exchangeRate)).toLocaleString("id-ID") : "—"}
          icon={<ArrowRightLeft className="w-5 h-5 text-indigo-600" />}
          subtext="Rate vs IDR"
          variant="warning"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Mata Uang"
        badge={<DnaBadge variant="amber">{currencies.length} Entri</DnaBadge>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Kode</th>
                <th className="px-3.5 py-3 text-center">Simbol</th>
                <th className="px-3.5 py-3 text-right">Kurs (per IDR)</th>
                <th className="px-3.5 py-3 text-center">Tipe</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Memuat...</td></tr>
              ) : currencies.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Belum ada data mata uang</td></tr>
              ) : currencies.map((c: Currency) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900 font-mono">{c.code}</td>
                  <td className="px-3.5 py-2.5 text-center text-lg">{c.symbol ?? "—"}</td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono font-bold text-slate-800">{c.exchangeRate.toLocaleString("id-ID")}</span>
                      <DnaButton variant="secondary" size="sm" onClick={() => { setRateEditing(c); setNewRate(String(c.exchangeRate)); }}>
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </DnaButton>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    {c.isMain ? (
                      <DnaBadge variant="success"><Star className="w-3 h-3 mr-1 inline" />Base</DnaBadge>
                    ) : (
                      <DnaBadge variant="secondary">Secondary</DnaBadge>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <DnaButton variant="secondary" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton variant="danger" size="sm" onClick={() => setDeletingId(c.id)} disabled={!!c.isMain}>
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
        title={editing ? "Edit Mata Uang" : "Tambah Mata Uang"}
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kode (ISO 4217)</label>
            <DnaInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="contoh: USD" disabled={!!editing} />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Simbol</label>
            <DnaInput value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="contoh: $" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kurs (per IDR)</label>
            <DnaInput value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} placeholder="contoh: 15800" type="number" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tipe</label>
            <DnaSelect value={isMain ? "main" : "secondary"} onChange={(v) => setIsMain(v === "main")}>
              <option value="secondary">Secondary</option>
              <option value="main">Base Currency</option>
            </DnaSelect>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DnaButton variant="secondary" size="md" onClick={closeModal}>Batal</DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={submit}
              disabled={!code || !exchangeRate || createMut.isPending || updateMut.isPending}
            >
              {editing ? "Simpan Perubahan" : "Tambah"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* Exchange rate modal */}
      <DnaModal
        isOpen={!!rateEditing}
        onClose={() => setRateEditing(null)}
        title={`Update Kurs ${rateEditing?.code}`}
        size="sm"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">Kurs saat ini: <strong>{rateEditing?.exchangeRate.toLocaleString("id-ID")}</strong></p>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kurs Baru (per IDR)</label>
            <DnaInput value={newRate} onChange={(e) => setNewRate(e.target.value)} type="number" placeholder="contoh: 15900" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setRateEditing(null)}>Batal</DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => rateEditing && rateMut.mutate({ id: rateEditing.id, rate: parseFloat(newRate) })}
              disabled={!newRate || rateMut.isPending}
            >
              Update Kurs
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
        title="Hapus Mata Uang?"
        description="Mata uang yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        variant="danger"
      />
    </DnaPageContainer>
  );
}
