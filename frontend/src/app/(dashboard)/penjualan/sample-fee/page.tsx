"use client";

/**
 * Pembayaran & Komitmen Sample Fee — the sample-fee registry.
 *
 * Every record on this page comes from the production `GET /finance/sample-fees`,
 * and a new fee is written through `POST /finance/sample-fees`. The previous
 * revision rendered an in-file `SAMPLE_FEES` array of four invented records —
 * client names, amounts, dates, a `RECEIVED/OFFSET/EXPIRED` status carrying a
 * 30-day validity, job-order references and notes — and its create form only
 * mutated React state, so an operator could "file" a fee that was never
 * persisted. None of that remains: there is no static array, no browser storage
 * and no fallback here, and the page states nothing the API did not return.
 */

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaCell,
  DnaModal,
  DnaDetailDrawer,
  DnaInput,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  formatRupiah,
} from "@/components/dna";
import { Plus, CheckCircle2, Clock, DollarSign } from "lucide-react";

const EMPTY = "—";

/** Exactly what `GET /finance/sample-fees` returns — nothing more. */
interface ApiSampleFee {
  id: string;
  feeNumber: string;
  customerId: string;
  amount: string | number;
  feeDate: string;
  notes?: string | null;
  offsetToDPId?: string | null;
}

interface SampleFeeRecord {
  id: string;
  feeNo: string;
  customerId: string;
  date: string;
  amount: number;
  offset: boolean;
  offsetTo: string;
  notes: string;
}

const toRecord = (fee: ApiSampleFee): SampleFeeRecord => ({
  id: fee.id,
  feeNo: fee.feeNumber,
  customerId: fee.customerId,
  date: fee.feeDate,
  amount: Number(fee.amount) || 0,
  offset: !!fee.offsetToDPId,
  offsetTo: fee.offsetToDPId || EMPTY,
  notes: fee.notes || "",
});

export default function SampleFeePaymentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SampleFeeRecord | null>(null);

  // Form State
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formAmount, setFormAmount] = useState("500000");
  const [formNotes, setFormNotes] = useState("");

  const { data: rawFees, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["finance-sample-fees"],
    queryFn: async () => {
      const resp = await api.get("/finance/sample-fees");
      const body = resp.data;
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const data: SampleFeeRecord[] = useMemo(
    () => (Array.isArray(rawFees) ? rawFees.map(toRecord) : []),
    [rawFees],
  );

  const errStatus = (error as { response?: { status?: number } })?.response?.status;
  const denied = errStatus === 401 || errStatus === 403;
  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    "Gagal memuat data sample fee.";

  const createMutation = useMutation({
    mutationFn: async (payload: {
      customerId: string;
      amount: number;
      feeDate: string;
      notes?: string;
    }) => {
      const resp = await api.post("/finance/sample-fees", payload);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-sample-fees"] });
      toast.success("Sample fee tercatat");
      setIsModalOpen(false);
      setFormCustomerId("");
      setFormNotes("");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Sample fee gagal dicatat";
      toast.error(message);
    },
  });

  const filtered = useMemo(() => {
    return data.filter((d) => {
      let matchesTab = true;
      if (activeTab === "open") matchesTab = !d.offset;
      else if (activeTab === "offset") matchesTab = d.offset;

      const q = search.toLowerCase();
      const matchesSearch =
        d.feeNo.toLowerCase().includes(q) ||
        d.customerId.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [data, activeTab, search]);

  const countAll = data.length;
  const countOpen = data.filter((d) => !d.offset).length;
  const countOffset = data.filter((d) => d.offset).length;

  const totalOpen = data.filter((d) => !d.offset).reduce((acc, c) => acc + c.amount, 0);
  const totalOffset = data.filter((d) => d.offset).reduce((acc, c) => acc + c.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      customerId: formCustomerId.trim(),
      amount: parseFloat(formAmount) || 0,
      feeDate: formDate,
      notes: formNotes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header with Unified Tabs */}
      <DnaPageHeader
        title="KOMITMEN & PEMBAYARAN SAMPLE FEE"
        description="Pencatatan pembayaran fee riset sample formulasi R&D maklon kosmetik, pelacakan masa berlaku (validity), dan mekanisme kompensasi offset fee ke Down Payment kontrak produksi."
        tabs={[
          { key: "all", label: "Semua Fee", count: countAll },
          { key: "open", label: "Belum Di-Offset", count: countOpen },
          { key: "offset", label: "Sudah Di-Offset", count: countOffset },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Buat Sample Fee
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: "Total Sample Fee Aktif",
            value: formatRupiah(totalOpen),
            subtitle: `${countOpen} sample belum di-offset`,
            trend: "Komitmen Berjalan",
            icon: DollarSign,
            variant: "blue",
          },
          {
            label: "Telah Di-Offset ke DP",
            value: formatRupiah(totalOffset),
            subtitle: `${countOffset} fee dialihkan ke PO`,
            trend: "Kompensasi Produksi",
            icon: CheckCircle2,
            variant: "emerald",
          },
          {
            label: "Total Transaksi Fee",
            value: `${countAll} Transaksi`,
            subtitle: "Akumulasi siklus riset lab",
            trend: "Aktivitas R&D",
            icon: Clock,
            variant: "purple",
          },
        ]}
      />

      {/* Main Table Card */}
      <DnaDataTableCard
        count={filtered.length}
        totalItems={data.length}
        toolbarProps={{
          searchPlaceholder: "Cari nomor fee, customer ID, atau catatan...",
          searchValue: search,
          onSearchChange: setSearch,
        }}
      >
        {isLoading ? (
          <DnaLoadingSkeleton rows={5} />
        ) : isError ? (
          <DnaErrorState
            title={denied ? "Akses ditolak" : "Gagal memuat data"}
            message={
              denied
                ? "Anda tidak memiliki akses ke daftar sample fee."
                : errorMessage
            }
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <DnaEmptyState
            title={
              data.length === 0
                ? "Belum ada sample fee tercatat"
                : "Tidak ada sample fee yang cocok"
            }
            description={
              data.length === 0
                ? "Belum ada biaya sample yang dicatat. Catat satu lewat tombol Buat Sample Fee."
                : "Ubah kata kunci pencarian atau sesuaikan filter tab."
            }
          />
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-[22%]">No. Fee & Tanggal</th>
                  <th className="py-3 px-3 w-[28%]">Customer ID & Keterangan</th>
                  <th className="py-3 px-3 w-[20%] text-right">Nominal Fee</th>
                  <th className="py-3 px-3 w-[18%] text-center">Status & Offset</th>
                  <th className="py-3 px-3 w-[12%] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-mono font-bold text-blue-600 truncate">{item.feeNo}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{item.date}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-mono text-slate-900 truncate font-semibold">{item.customerId}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.notes || "Tanpa catatan"}</p>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <p className="font-mono font-bold text-slate-900">{formatRupiah(item.amount)}</p>
                      <p className="text-[10px] text-slate-400">Fee Formulasi</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <DnaCell.Badge
                        status={item.offset ? "success" : "info"}
                        label={item.offset ? "OFFSET" : "RECEIVED"}
                      />
                      {item.offset && item.offsetTo !== EMPTY && (
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5" title={item.offsetTo}>
                          {item.offsetTo}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(item)}
                        >
                          Detail
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DnaDataTableCard>

      {/* Drawer Detail */}
      <DnaDetailDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.feeNo || "Detail Sample Fee"}
        subtitle={selectedRecord ? `Customer ID: ${selectedRecord.customerId}` : undefined}
        badge={
          selectedRecord ? (
            <DnaCell.Badge
              status={selectedRecord.offset ? "success" : "info"}
              label={selectedRecord.offset ? "OFFSET" : "RECEIVED"}
            />
          ) : undefined
        }
        actions={
          selectedRecord ? (
            <div className="flex items-center justify-end w-full">
              <DnaButton variant="secondary" onClick={() => setSelectedRecord(null)}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nomor Fee</span>
                <span className="font-mono font-bold text-blue-600 text-xs">{selectedRecord.feeNo}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tanggal Bayar</span>
                <span className="font-mono text-slate-700 text-xs">{selectedRecord.date}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Customer ID (UUID)</span>
                <span className="font-mono font-semibold text-slate-900 text-xs break-all">{selectedRecord.customerId}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nominal Komitmen</span>
                <span className="font-mono font-bold text-blue-600 text-sm">{formatRupiah(selectedRecord.amount)}</span>
              </div>
            </div>

            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kompensasi Offset ke DP Produksi</span>
              <p className="font-mono font-bold text-emerald-600">{selectedRecord.offsetTo}</p>
              <p className="text-[11px] text-slate-400 italic">
                {selectedRecord.offset
                  ? "Fee ini telah diperhitungkan memotong nilai Down Payment kontrak produksi."
                  : "Fee masih terbuka dan dapat dipotongkan saat penerbitan invoice DP pesanan."}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Catatan Operasional</span>
              <p className="text-slate-700">{selectedRecord.notes || "Tidak ada catatan."}</p>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Buat Fee */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Penerimaan Sample Fee"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Customer ID (UUID) *
            </label>
            <DnaInput
              placeholder="11111111-2222-3333-4444-555555555555"
              value={formCustomerId}
              onChange={(e) => setFormCustomerId(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              SampleFee menyimpan customer sebagai UUID; nama customer tidak tersedia dari endpoint ini.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Tanggal Pembayaran *</label>
              <DnaInput
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Nominal Fee (Rp) *</label>
              <DnaInput
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Catatan Tambahan</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              placeholder="Catatan formulasi atau target kompensasi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan Data"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
