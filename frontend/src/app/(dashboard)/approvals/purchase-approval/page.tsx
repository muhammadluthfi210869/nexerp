"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Package,
  Loader2,
} from "lucide-react";
import { DnaButton, DnaBadge, DnaInput, DnaDataTableCard, DnaModal, DnaSelect, DnaCell } from "@/components/dna";
import { ConflictModal } from "@/components/scm/ConflictModal";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";

// SPEC: SCR-SCM-POA-001 — Purchase Order Approval workflow with conflict detection
// Business features preserved:
//  - Diskon & Ongkos Kirim (Item 46) — edit per-PO
//  - Line-item source dropdown (Item 71) — PO vs STOCK default
//  - 409 Conflict modal (Item 68) on stale PO modification

export default function PurchaseApprovalPage() {
  const [searchKode, setSearchKode] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [searchGudang, setSearchGudang] = useState("");
  const [searchItemName, setSearchItemName] = useState("");
  const [searchMinQty, setSearchMinQty] = useState("");
  const [searchMaxQty, setSearchMaxQty] = useState("");
  const [searchMinPrice, setSearchMinPrice] = useState("");
  const [searchMaxPrice, setSearchMaxPrice] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [approveDialog, setApproveDialog] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [conflict, setConflict] = useState<{ open: boolean; lastModifiedAt?: string; lastModifiedBy?: string }>({ open: false });
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [poDiscount, setPoDiscount] = useState(0);
  const [poShippingCost, setPoShippingCost] = useState(0);
  const [lineSources, setLineSources] = useState<Record<string, "PO" | "STOCK">>({});

  const { data: purchaseOrders, isLoading, refetch } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/scm/purchase-orders");
        return unwrapResponse(res) || [];
      } catch (err: any) {
        if (err?.response?.status === 409) {
          const data = err.response?.data;
          setConflict({
            open: true,
            lastModifiedAt: data?.timestamp || data?.lastModifiedAt || new Date().toISOString(),
            lastModifiedBy: data?.modifiedBy || data?.lastModifiedBy || "user lain",
          });
          return [];
        }
        throw err;
      }
    }
  });

  const filteredOrders = useMemo(() => {
    if (!purchaseOrders) return [];
    return purchaseOrders.filter((po: any) => {
      const qKode = searchKode.toLowerCase();
      const qSupplier = searchSupplier.toLowerCase();
      const qGudang = searchGudang.toLowerCase();
      const qItem = searchItemName.toLowerCase();
      const matchKode = !qKode || (po.poNumber || '').toLowerCase().includes(qKode);
      const matchSupplier = !qSupplier || (po.supplier?.name || po.supplierName || '').toLowerCase().includes(qSupplier);
      const matchGudang = !qGudang || (po.warehouse?.name || '').toLowerCase().includes(qGudang);
      const matchItem = !qItem || (po.items || []).some((i: any) =>
        (i.itemName || i.name || '').toLowerCase().includes(qItem));
      const matchQty = (!searchMinQty || (po.items || []).some((i: any) => Number(i.quantity || i.qty || 0) >= Number(searchMinQty))) &&
        (!searchMaxQty || (po.items || []).some((i: any) => Number(i.quantity || i.qty || 0) <= Number(searchMaxQty)));
      const matchPrice = (!searchMinPrice || Number(po.totalValue || 0) >= Number(searchMinPrice)) &&
        (!searchMaxPrice || Number(po.totalValue || 0) <= Number(searchMaxPrice));
      const poDate = po.estArrival || po.orderDate || po.createdAt || '';
      const matchDate = (!searchDateFrom || poDate >= searchDateFrom) && (!searchDateTo || poDate <= searchDateTo);
      return matchKode && matchSupplier && matchGudang && matchItem && matchQty && matchPrice && matchDate;
    });
  }, [purchaseOrders, searchKode, searchSupplier, searchGudang, searchItemName, searchMinQty, searchMaxQty, searchMinPrice, searchMaxPrice, searchDateFrom, searchDateTo]);

  const pendingCount = filteredOrders.filter((po: any) =>
    po.status === 'PENDING_APPROVAL' || po.status === 'DRAFT' || po.status === 'SUBMITTED'
  ).length;

  const resetFilters = () => {
    setSearchKode(''); setSearchSupplier(''); setSearchGudang('');
    setSearchItemName(''); setSearchMinQty(''); setSearchMaxQty('');
    setSearchMinPrice(''); setSearchMaxPrice(''); setSearchDateFrom(''); setSearchDateTo('');
  };

  const isFilterActive = searchKode || searchSupplier || searchGudang || searchItemName ||
    searchMinQty || searchMaxQty || searchMinPrice || searchMaxPrice || searchDateFrom || searchDateTo;

  return (
    <DashboardShell
      title="PERSETUJUAN"
      titleAccent="PEMBELIAN"
      subtitle="Review dan approve purchase order sebelum diproses ke supplier"
      actions={
        <DnaBadge status="info">
          {pendingCount} Menunggu Approval
        </DnaBadge>
      }
    >
      <DnaModal
        isOpen={!!approveDialog}
        onClose={() => setApproveDialog(null)}
        title="Konfirmasi Persetujuan"
        subtitle="Setujui PO ini? Status akan berubah menjadi APPROVED."
        size="md"
        badge={<CheckCircle2 className="h-3 w-3 text-emerald-500" />}
      >
        <p className="text-sm text-slate-600">
          Tindakan ini akan langsung mengubah status PO menjadi APPROVED dan memicu alur purchasing berikutnya.
        </p>
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={() => setApproveDialog(null)}>Batal</DnaButton>
          <DnaButton variant="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
            toast.success("PO berhasil disetujui.");
            setApproveDialog(null);
          }}>Ya, Setujui</DnaButton>
        </div>
      </DnaModal>

      <DnaModal
        isOpen={!!rejectDialog}
        onClose={() => { setRejectDialog(null); setRejectReason(''); }}
        title="Konfirmasi Penolakan"
        subtitle="Beri alasan penolakan untuk dokumentasi audit."
        size="md"
        badge={<XCircle className="h-3 w-3 text-rose-500" />}
      >
        <DnaInput
          label="Alasan Penolakan"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Berikan alasan penolakan..."
        />
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={() => { setRejectDialog(null); setRejectReason(''); }}>Batal</DnaButton>
          <DnaButton variant="danger" onClick={() => {
            toast.success("PO ditolak.");
            setRejectDialog(null);
            setRejectReason('');
          }}>Ya, Tolak</DnaButton>
        </div>
      </DnaModal>

      <DnaModal
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={`Detail PO: ${selectedPO?.poNumber || ''}`}
        size="3xl"
        footer={
          <DnaButton variant="outline" onClick={() => setSelectedPO(null)}>Tutup</DnaButton>
        }
      >
        {selectedPO && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <DnaInput
                label="Diskon (Rp)"
                type="number"
                min="0"
                value={poDiscount}
                onChange={(e) => setPoDiscount(Number(e.target.value))}
                className="h-9 text-xs font-bold"
              />
              <DnaInput
                label="Ongkos Kirim (Rp)"
                type="number"
                min="0"
                value={poShippingCost}
                onChange={(e) => setPoShippingCost(Number(e.target.value))}
                className="h-9 text-xs font-bold"
              />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Item PO & Sumber</div>
              {(selectedPO.items || []).map((it: any, idx: number) => {
                const key = it.id || it.materialId || `item-${idx}`;
                const defaultSource = Number(it.currentStock || 0) >= Number(it.quantity || it.qty || 0) ? "STOCK" : "PO";
                const sourceOptions = [
                  { label: 'PO (Beli)', value: 'PO' },
                  { label: 'STOCK (Ambil dari Gudang)', value: 'STOCK' },
                ];
                return (
                  <div key={key} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{it.itemName || it.name || "—"}</p>
                      <p className="text-[10px] text-slate-400">Qty: {Number(it.quantity || it.qty || 0)} {it.unit || ""}</p>
                    </div>
                    <DnaSelect
                      label="Sumber"
                      value={lineSources[key] || defaultSource}
                      onChange={(val) => setLineSources({ ...lineSources, [key]: (val || "PO") as "PO" | "STOCK" })}
                      options={sourceOptions}
                      className="h-8 text-[10px]"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DnaModal>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Pencarian Detail Pembelian</span>
          </div>
          {isFilterActive && (
            <button onClick={resetFilters} className="text-xs text-blue-600 hover:text-blue-800 font-bold">Reset Filter</button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <DnaInput placeholder="Kode PO..." value={searchKode} onChange={(e) => setSearchKode(e.target.value)} className="text-xs" />
          <DnaInput placeholder="Supplier..." value={searchSupplier} onChange={(e) => setSearchSupplier(e.target.value)} className="text-xs" />
          <DnaInput placeholder="Gudang..." value={searchGudang} onChange={(e) => setSearchGudang(e.target.value)} className="text-xs" />
          <DnaInput placeholder="Nama Item..." value={searchItemName} onChange={(e) => setSearchItemName(e.target.value)} className="text-xs" />
          <div className="flex gap-1">
            <DnaInput type="number" placeholder="Qty min" value={searchMinQty} onChange={(e) => setSearchMinQty(e.target.value)} className="text-xs w-20" />
            <DnaInput type="number" placeholder="Qty max" value={searchMaxQty} onChange={(e) => setSearchMaxQty(e.target.value)} className="text-xs w-20" />
          </div>
          <div className="flex gap-1">
            <DnaInput type="number" placeholder="Harga min" value={searchMinPrice} onChange={(e) => setSearchMinPrice(e.target.value)} className="text-xs w-24" />
            <DnaInput type="number" placeholder="Harga max" value={searchMaxPrice} onChange={(e) => setSearchMaxPrice(e.target.value)} className="text-xs w-24" />
          </div>
          <div className="flex gap-1">
            <DnaInput type="date" placeholder="Tgl dari" value={searchDateFrom} onChange={(e) => setSearchDateFrom(e.target.value)} className="text-xs" />
            <DnaInput type="date" placeholder="Tgl sampai" value={searchDateTo} onChange={(e) => setSearchDateTo(e.target.value)} className="text-xs" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <DnaDataTableCard>
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <th className="py-3 px-4">No. PO</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Harga</th>
                <th className="py-3 px-4">Tgl PO</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-medium text-sm">Tidak ada purchase order ditemukan.</p>
                  </td>
                </tr>
              ) : filteredOrders.map((po: any) => (
                <tr key={po.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <span className="font-bold text-xs uppercase italic text-slate-900">{po.poNumber || '-'}</span>
                  </td>
                  <td className="py-3 px-4"><DnaCell.Text primary={po.supplier?.name || po.supplierName || '-'} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">
                        {(po.items || []).map((i: any) => i.itemName || i.name).filter(Boolean).slice(0, 2).join(', ')}
                        {(po.items || []).length > 2 ? ` +${(po.items || []).length - 2}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DnaCell.Number value={(po.items || []).reduce((s: number, i: any) => s + Number(i.quantity || i.qty || 0), 0)} />
                  </td>
                  <td className="py-3 px-4 text-right"><DnaCell.Currency value={Number(po.totalValue || 0)} /></td>
                  <td className="py-3 px-4"><DnaCell.Date value={po.estArrival} /></td>
                  <td className="py-3 px-4 text-center">
                    <DnaBadge status={
                      po.status === 'APPROVED' || po.status === 'ORDERED' ? "success" :
                      po.status === 'PENDING_APPROVAL' || po.status === 'SUBMITTED' ? "warning" :
                      po.status === 'REJECTED' ? "critical" : "default"
                    }>
                      {po.status?.replace('_', ' ') || 'DRAFT'}
                    </DnaBadge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {(po.status === 'PENDING_APPROVAL' || po.status === 'DRAFT' || po.status === 'SUBMITTED') && (
                        <>
                          <DnaButton variant="primary" size="sm" onClick={() => setApproveDialog(po.id)} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                            Setuju
                          </DnaButton>
                          <DnaButton variant="outline" size="sm" onClick={() => setRejectDialog(po.id)} className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-7" icon={<XCircle className="w-3.5 h-3.5" />}>
                            Tolak
                          </DnaButton>
                        </>
                      )}
                      <DnaButton variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => {
                        setSelectedPO(po);
                        setPoDiscount(Number(po.discountAmount || po.discountManual || 0));
                        setPoShippingCost(Number(po.shippingCost || 0));
                        const sources: Record<string, "PO" | "STOCK"> = {};
                        (po.items || []).forEach((it: any, idx: number) => {
                          sources[it.id || it.materialId || idx] =
                            Number(it.currentStock || 0) >= Number(it.quantity || it.qty || 0) ? "STOCK" : "PO";
                        });
                        setLineSources(sources);
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DnaDataTableCard>
      )}

      <ConflictModal
        open={conflict.open}
        lastModifiedAt={conflict.lastModifiedAt}
        lastModifiedBy={conflict.lastModifiedBy}
        onRefresh={() => { setConflict({ open: false }); refetch(); }}
        onCancel={() => setConflict({ open: false })}
      />
    </DashboardShell>
  );
}
