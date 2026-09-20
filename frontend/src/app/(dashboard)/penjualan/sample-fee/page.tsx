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
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaInput,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  formatRupiah,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { Plus, Eye, CheckCircle2, Clock, Search, DollarSign } from "lucide-react";

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
  // `offsetToDPId` is the only offset signal the model carries: set means the
  // fee was compensated against a Down Payment, null means it is still open.
  offset: !!fee.offsetToDPId,
  offsetTo: fee.offsetToDPId || EMPTY,
  notes: fee.notes || "",
});

export default function SampleFeePaymentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
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

  const filtered = data.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.feeNo.toLowerCase().includes(q) ||
      d.customerId.toLowerCase().includes(q) ||
      d.notes.toLowerCase().includes(q)
    );
  });

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
    <DnaPageContainer>
      <DnaPageHeader
        title="Pembayaran & Komitmen Sample Fee"
        subtitle="Pencatatan pembayaran fee riset sample, pelacakan masa berlaku (validity), dan mekanisme offset ke DP produksi"
        breadcrumbs={[{ label: "Penjualan", href: "/sales" }, { label: "Sample Fee" }]}
        actions={
          <DnaButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            + Buat Sample Fee
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Sample Fee Aktif"
          value={formatRupiah(totalOpen)}
          icon={<DollarSign className="w-4 h-4" />}
          delta={{ value: `${data.filter((d) => !d.offset).length} Sample Belum Offset`, isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Telah Di-Offset ke DP"
          value={formatRupiah(totalOffset)}
          icon={<CheckCircle2 className="w-4 h-4" />}
          delta={{ value: "Kompensasi ke Kontrak Produksi", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Total Transaksi Fee"
          value={`${data.length} Transaksi`}
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: "Akumulasi Siklus Sample", isPositive: true }}
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Komitmen & Offset Sample Fee"
        count={filtered.length}
        totalItems={data.length}
        actions={
          <div className="w-64">
            <DnaInput
              placeholder="Cari no fee atau customer id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        }
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
                : "Ubah kata kunci pencarian."
            }
          />
        ) : (
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Sample Fee No</th>
                <th className="px-4 py-3">Customer (ID)</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Offset To</th>
                <th className="px-4 py-3 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-blue-600">{item.feeNo}</td>
                  <td className="px-4 py-3 font-mono text-slate-900">{item.customerId}</td>
                  <td className="px-4 py-3 text-slate-600">{item.date}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge variant={item.offset ? "emerald" : "blue"}>
                      {item.offset ? "OFFSET" : "RECEIVED"}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{item.offsetTo}</td>
                  <td className="px-4 py-3 text-right">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedRecord(item)}
                    >
                      Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
        )}
      </DnaDataTableCard>

      {/* Modal Detail */}
      <DnaModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Detail Sample Fee: ${selectedRecord?.feeNo || ""}`}
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Nomor Fee</span>
                <span className="font-mono font-bold text-slate-800">{selectedRecord.feeNo}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Tanggal Pembayaran</span>
                <span className="font-medium text-slate-800">{selectedRecord.date}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Customer (ID)</span>
                <span className="font-mono text-slate-900 break-all">{selectedRecord.customerId}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Nominal Komitmen</span>
                <span className="font-mono font-bold text-blue-600">{formatRupiah(selectedRecord.amount)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Status Penggunaan</span>
                <DnaBadge variant={selectedRecord.offset ? "emerald" : "blue"}>
                  {selectedRecord.offset ? "OFFSET" : "RECEIVED"}
                </DnaBadge>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Offset ke Kontrak DP</span>
              <p className="font-mono text-slate-700 mt-1">{selectedRecord.offsetTo}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Catatan Operasional</span>
              <p className="text-slate-600 mt-1">{selectedRecord.notes || "—"}</p>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedRecord(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Buat Fee */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Penerimaan Sample Fee"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-sm">
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
              SampleFee menyimpan customer sebagai UUID; nama customer tidak tersedia dari
              endpoint ini.
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
    </DnaPageContainer>
  );
}
