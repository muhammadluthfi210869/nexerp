"use client";

/**
 * Cost Allocation — Alokasi Overhead antar Cost Center
 *
 * Data nyata dari GET /finance/cost-allocations (tabel cost_allocations).
 * Master "allocation rule / pool" belum ada di backend, sehingga halaman ini
 * menampilkan alokasi yang benar-benar tercatat, bukan rule simulasi.
 */

import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Layers,
  Plus,
  Calculator,
  ArrowRightLeft,
  CalendarClock,
  Percent,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  DnaBadge,
  formatRupiah,
  useDnaToast,
} from "@/components/dna";

interface CostAllocationRow {
  id: string;
  allocationDate: string;
  amount: number;
  fromCostCenter: string;
  toCostCenter: string;
  allocationMethod: string;
  basis?: string | null;
  notes?: string | null;
}

const METHODS = ["DIRECT", "STEP_DOWN", "RECIPROCAL"] as const;

export default function CostAllocationSetupPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [methodFilter, setMethodFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState<string>("DIRECT");
  const [formBasis, setFormBasis] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState("");

  const {
    data: allocations,
    isLoading,
    isError,
    refetch,
  } = useQuery<CostAllocationRow[]>({
    queryKey: ["finance-cost-allocations"],
    queryFn: async () => {
      const res = await api.get("/finance/cost-allocations");
      const body = unwrapResponse<any>(res);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows.map((a) => ({
        id: a.id,
        allocationDate: a.allocationDate,
        amount: Number(a.amount || 0),
        fromCostCenter: a.fromCostCenter,
        toCostCenter: a.toCostCenter,
        allocationMethod: a.allocationMethod || "DIRECT",
        basis: a.basis ?? null,
        notes: a.notes ?? null,
      }));
    },
  });

  const rows = useMemo(() => {
    const list = allocations ?? [];
    return list
      .filter((r) => methodFilter === "ALL" || r.allocationMethod === methodFilter)
      .sort(
        (a, b) =>
          new Date(b.allocationDate).getTime() - new Date(a.allocationDate).getTime(),
      );
  }, [allocations, methodFilter]);

  const all = allocations ?? [];
  const sourcePools = new Set(all.map((r) => r.fromCostCenter)).size;
  const totalAmount = all.reduce((acc, r) => acc + r.amount, 0);
  const methodCounts = useMemo(() => {
    const map = new Map<string, number>();
    all.forEach((r) => map.set(r.allocationMethod, (map.get(r.allocationMethod) ?? 0) + 1));
    return map;
  }, [all]);
  const dominantMethod =
    [...methodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const resetForm = () => {
    setFormFrom("");
    setFormTo("");
    setFormAmount("");
    setFormMethod("DIRECT");
    setFormBasis("");
    setFormNotes("");
    setFormDate(new Date().toISOString().slice(0, 10));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formAmount);
    if (!formFrom.trim() || !formTo.trim() || !(amount > 0)) {
      toast.error("Validasi Gagal", "Cost center asal, tujuan, dan nominal alokasi wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/finance/cost-allocations", {
        allocationDate: formDate,
        amount,
        fromCostCenter: formFrom.trim(),
        toCostCenter: formTo.trim(),
        allocationMethod: formMethod,
        basis: formBasis.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["finance-cost-allocations"] });
      toast.success("Alokasi Tersimpan", `Alokasi ${formFrom} → ${formTo} berhasil dicatat.`);
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error("Gagal Menyimpan", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="Cost Allocation (Alokasi Overhead antar Cost Center)"
        description="Alokasi biaya overhead yang tercatat di sistem. Master aturan alokasi belum tersedia di backend."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Calculator className="w-3.5 h-3.5" />
            COST ACCOUNTING
          </span>
        }
        actions={
          <DnaButton
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            + Catat Alokasi Overhead
          </DnaButton>
        }
      />

      <DnaKpiGrid
        columns={4}
        items={[
          {
            label: "COST CENTER SUMBER",
            value: `${sourcePools} Sumber`,
            subtext: "Cost center asal alokasi",
            icon: Layers,
            status: "neutral",
          },
          {
            label: "TOTAL BIAYA DIALOKASIKAN",
            value: formatRupiah(totalAmount),
            subtext: `${all.length} entri alokasi tercatat`,
            icon: ArrowRightLeft,
            status: "success",
          },
          {
            label: "METODE DOMINAN",
            value: dominantMethod,
            subtext: `${METHODS.length} metode didukung`,
            icon: Percent,
            status: "neutral",
          },
          {
            label: "ALOKASI TERAKHIR",
            value: all[0]
              ? new Date(
                  Math.max(...all.map((r) => new Date(r.allocationDate).getTime())),
                )
                  .toISOString()
                  .slice(0, 10)
              : "—",
            subtext: "Tanggal alokasi terbaru",
            icon: CalendarClock,
            status: "neutral",
          },
        ]}
      />

      <DnaDataTableCard
        title="Riwayat Alokasi Biaya Overhead"
        toolbarProps={{
          searchPlaceholder: "Cari cost center...",
          extraActions: (
            <DnaSelect
              value={methodFilter}
              onChange={(val) => setMethodFilter(val)}
              options={[
                { value: "ALL", label: "Semua Metode" },
                ...METHODS.map((m) => ({ value: m, label: m })),
              ]}
              className="h-9 w-44"
            />
          ),
        }}
      >
        {isLoading ? (
          <DnaLoadingSkeleton rows={5} />
        ) : isError ? (
          <DnaErrorState
            title="Gagal Memuat Alokasi Biaya"
            message="Tidak dapat mengambil data alokasi dari server."
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <DnaEmptyState
            title="Belum Ada Alokasi Tercatat"
            description="Belum ada entri alokasi biaya overhead pada metode yang dipilih. Catat alokasi baru untuk memulai."
          />
        ) : (
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh>FROM COST CENTER</DnaTh>
                <DnaTh>TO COST CENTER</DnaTh>
                <DnaTh className="w-[130px]">METODE</DnaTh>
                <DnaTh className="w-[140px]">BASIS</DnaTh>
                <DnaTh align="right" className="w-[150px]">NOMINAL</DnaTh>
                <DnaTh className="w-[120px]">TANGGAL</DnaTh>
                <DnaTh>CATATAN</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {rows.map((r) => (
                <DnaTableRow key={r.id}>
                  <DnaTd>
                    <span className="font-semibold text-slate-800">{r.fromCostCenter}</span>
                  </DnaTd>
                  <DnaTd>
                    <span className="font-semibold text-slate-800">{r.toCostCenter}</span>
                  </DnaTd>
                  <DnaTd>
                    <DnaBadge variant={r.allocationMethod === "DIRECT" ? "blue" : "amber"}>
                      {r.allocationMethod}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="text-xs text-slate-600">{r.basis || "—"}</DnaTd>
                  <DnaTd align="right" className="tabular-nums font-semibold text-slate-800">
                    {formatRupiah(r.amount)}
                  </DnaTd>
                  <DnaTd className="tabular-nums text-xs text-slate-600">
                    {new Date(r.allocationDate).toISOString().slice(0, 10)}
                  </DnaTd>
                  <DnaTd className="text-xs text-slate-500 max-w-xs truncate" title={r.notes || ""}>
                    {r.notes || "—"}
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        )}
      </DnaDataTableCard>

      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Catat Alokasi Biaya Overhead"
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cost Center Asal *</label>
              <DnaInput
                placeholder="Contoh: CC-OVERHEAD"
                value={formFrom}
                onChange={(e) => setFormFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cost Center Tujuan *</label>
              <DnaInput
                placeholder="Contoh: CC-PRODUCTION"
                value={formTo}
                onChange={(e) => setFormTo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Metode Alokasi *</label>
              <DnaSelect
                value={formMethod}
                onChange={(val) => setFormMethod(val)}
                options={METHODS.map((m) => ({ value: m, label: m }))}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Basis Alokasi</label>
              <DnaInput
                placeholder="Contoh: machine_hours"
                value={formBasis}
                onChange={(e) => setFormBasis(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Alokasi *</label>
              <DnaInput
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
              <DnaInput
                type="number"
                min={1}
                placeholder="5000000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
            <DnaInput
              placeholder="Contoh: Alokasi overhead Q3"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <DnaButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              Batal
            </DnaButton>
            <DnaButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSaving ? "Menyimpan..." : "Simpan Alokasi"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}