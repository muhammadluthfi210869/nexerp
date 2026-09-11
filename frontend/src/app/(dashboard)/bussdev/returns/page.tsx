"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Undo2, Plus, Pencil, Trash2, RefreshCw, Package, Eye } from "lucide-react";
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

interface ReturnRecord {
  id: string;
  soId: string;
  warehouseId: string;
  returnDate?: string;
  returnStatus?: string;
  notes?: string;
  createdAt?: string;
  items?: Array<{ materialId: string; qty?: number; qtyOriginal?: number; qtyReturned?: number }>;
}

const FALLBACK: ReturnRecord[] = [
  { id: "rt-1", soId: "SO-2026-0123", warehouseId: "WH-JKT-01", returnDate: "2026-08-20", returnStatus: "PENDING", notes: "Klaim packaging rusak dari klien", items: [{ materialId: "mat-1", qty: 50, qtyOriginal: 500, qtyReturned: 50 }] },
  { id: "rt-2", soId: "SO-2026-0098", warehouseId: "WH-JKT-01", returnDate: "2026-08-15", returnStatus: "APPROVED", notes: "Klaim produk cacat produksi — sudah di-quarantine", items: [{ materialId: "mat-2", qty: 100, qtyOriginal: 1000, qtyReturned: 100 }] },
  { id: "rt-3", soId: "SO-2026-0078", warehouseId: "WH-SBY-01", returnDate: "2026-08-10", returnStatus: "REJECTED", notes: "Klaim di luar garansi", items: [{ materialId: "mat-3", qty: 25, qtyOriginal: 200, qtyReturned: 25 }] },
];

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED", "RECEIVED"];

export default function BussdevReturnsPage() {
  const toast = useDnaToast();
  const qc = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReturnRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReturnRecord | null>(null);

  // Form state
  const [soId, setSoId] = useState("");
  const [warehouseId, setWarehouseId] = useState("WH-JKT-01");
  const [returnDate, setReturnDate] = useState("");
  const [returnStatus, setReturnStatus] = useState("PENDING");
  const [notes, setNotes] = useState("");

  const { data: returns = FALLBACK, isLoading } = useQuery({
    queryKey: ["bussdev-returns"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/returns");
        const body = unwrapResponse(res);
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : FALLBACK;
      } catch {
        return FALLBACK;
      }
    },
  });

  const createMut = useMutation({
    mutationFn: (payload: Partial<ReturnRecord>) => api.post("/bussdev/returns", payload).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur berhasil dicatat");
      qc.invalidateQueries({ queryKey: ["bussdev-returns"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal mencatat retur"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ReturnRecord> }) =>
      api.patch(`/bussdev/returns/${id}`, payload).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Status retur berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["bussdev-returns"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui retur"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/bussdev/returns/${id}`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["bussdev-returns"] });
      setDeletingId(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menghapus retur"),
  });

  function openCreate() {
    setEditing(null);
    setSoId(""); setWarehouseId("WH-JKT-01"); setReturnDate(new Date().toISOString().slice(0, 10)); setReturnStatus("PENDING"); setNotes("");
    setModalOpen(true);
  }

  function openEdit(r: ReturnRecord) {
    setEditing(r);
    setSoId(r.soId); setWarehouseId(r.warehouseId); setReturnDate(r.returnDate?.slice(0, 10) ?? ""); setReturnStatus(r.returnStatus ?? "PENDING"); setNotes(r.notes ?? "");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function submit() {
    const payload = { soId, warehouseId, returnDate, returnStatus, notes };
    if (editing) {
      updateMut.mutate({ id: editing.id, payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const pending = returns.filter((r: ReturnRecord) => r.returnStatus === "PENDING").length;
  const approved = returns.filter((r: ReturnRecord) => r.returnStatus === "APPROVED").length;
  const rejected = returns.filter((r: ReturnRecord) => r.returnStatus === "REJECTED").length;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Retur Penjualan (Sales Returns)"
        description="Pencatatan retur barang dari klien, status approval, dan pergerakan ke gudang karantina."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 font-semibold">
            <Undo2 className="w-3.5 h-3.5" />
            <span>SCR-090: BussDev Returns</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => qc.invalidateQueries({ queryKey: ["bussdev-returns"] })}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" />
              Catat Retur
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Menunggu Persetujuan"
          value={`${pending}`}
          icon={<Undo2 className="w-5 h-5 text-orange-600" />}
          subtext="Retur pending approval"
          variant="warning"
        />
        <DnaStatCard
          label="Disetujui"
          value={`${approved}`}
          icon={<Package className="w-5 h-5 text-emerald-600" />}
          subtext="Siap dijadwalkan quarantine"
          variant="success"
        />
        <DnaStatCard
          label="Ditolak"
          value={`${rejected}`}
          icon={<Package className="w-5 h-5 text-rose-600" />}
          subtext="Klaim tidak memenuhi syarat"
          variant="critical"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Retur Penjualan"
        badge={<DnaBadge variant="orange">{returns.length} Retur</DnaBadge>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">SO Ref</th>
                <th className="px-3.5 py-3">Warehouse</th>
                <th className="px-3.5 py-3">Tgl Retur</th>
                <th className="px-3.5 py-3">Catatan</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Memuat...</td></tr>
              ) : returns.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Belum ada data retur</td></tr>
              ) : returns.map((r: ReturnRecord) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">{r.soId}</td>
                  <td className="px-3.5 py-2.5 text-slate-700">{r.warehouseId}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{r.returnDate ?? "—"}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 max-w-xs truncate">{r.notes ?? "—"}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    {r.returnStatus === "APPROVED" ? (
                      <DnaBadge variant="success">Disetujui</DnaBadge>
                    ) : r.returnStatus === "REJECTED" ? (
                      <DnaBadge variant="danger">Ditolak</DnaBadge>
                    ) : r.returnStatus === "RECEIVED" ? (
                      <DnaBadge variant="info">Diterima</DnaBadge>
                    ) : (
                      <DnaBadge variant="warning">Pending</DnaBadge>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <DnaButton variant="secondary" size="sm" onClick={() => setSelected(r)}>
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton variant="secondary" size="sm" onClick={() => openEdit(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton variant="danger" size="sm" onClick={() => setDeletingId(r.id)}>
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
        title={editing ? "Edit Retur" : "Catat Retur Baru"}
        size="md"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">SO Reference (UUID)</label>
            <DnaInput value={soId} onChange={(e) => setSoId(e.target.value)} placeholder="contoh: so-uuid-..." />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Warehouse ID (UUID)</label>
            <DnaInput value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} placeholder="contoh: wh-uuid-..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tgl Retur</label>
              <DnaInput type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <DnaSelect value={returnStatus} onChange={setReturnStatus}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </DnaSelect>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
            <DnaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alasan retur / klaim klien" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DnaButton variant="secondary" size="md" onClick={closeModal}>Batal</DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={submit}
              disabled={!soId || !warehouseId || createMut.isPending || updateMut.isPending}
            >
              {editing ? "Simpan Perubahan" : "Catat Retur"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* Detail Modal */}
      <DnaModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Detail Retur: ${selected?.soId}`}
        size="md"
      >
        <div className="space-y-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-200">
            <div><span className="text-slate-500">Warehouse:</span> <strong>{selected?.warehouseId}</strong></div>
            <div><span className="text-slate-500">Tgl Retur:</span> <strong>{selected?.returnDate ?? "—"}</strong></div>
            <div><span className="text-slate-500">Status:</span> <strong>{selected?.returnStatus ?? "—"}</strong></div>
            <div><span className="text-slate-500">Catatan:</span> <strong>{selected?.notes ?? "—"}</strong></div>
          </div>
          {selected?.items && selected.items.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-700 mb-2">Item Retur</h4>
              <table className="w-full text-[11px] border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Material</th>
                    <th className="px-2 py-1.5 text-right">Qty Original</th>
                    <th className="px-2 py-1.5 text-right">Qty Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-2 py-1.5 font-mono">{it.materialId}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{it.qtyOriginal ?? "—"}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{it.qtyReturned ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DnaModal>

      <DnaConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteMut.mutate(deletingId);
        }}
        title="Hapus Retur?"
        description="Retur yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        variant="danger"
      />
    </DnaPageContainer>
  );
}
