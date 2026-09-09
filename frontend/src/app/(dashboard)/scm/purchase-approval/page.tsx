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
import { DnaButton, DnaBadge, DnaInput, TableWrapper } from "@/components/dna";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ConflictModal } from "@/components/scm/ConflictModal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { cn } from "@/lib/utils";

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
  // Item 68: conflict detection
  const [conflict, setConflict] = useState<{ open: boolean; lastModifiedAt?: string; lastModifiedBy?: string }>({ open: false });
  // Item 46, 71: PO detail modal with diskon & source dropdown
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
        // Item 68: intercept 409 conflict
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
      <Dialog open={!!approveDialog} onOpenChange={(o) => { if (!o) setApproveDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Konfirmasi Persetujuan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Setujui PO ini? Status akan berubah menjadi APPROVED.</p>
          <DialogFooter className="gap-2">
            <DnaButton variant="ghost" onClick={() => setApproveDialog(null)}>Batal</DnaButton>
            <DnaButton variant="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
              toast.success("PO berhasil disetujui.");
              setApproveDialog(null);
            }}>Ya, Setujui</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectDialog} onOpenChange={(o) => { if (!o) { setRejectDialog(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500" /> Konfirmasi Penolakan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold text-slate-700">Alasan Penolakan</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Berikan alasan penolakan..."
              rows={3}
              className="text-xs"
            />
          </div>
          <DialogFooter className="gap-2">
            <DnaButton variant="ghost" onClick={() => { setRejectDialog(null); setRejectReason(''); }}>Batal</DnaButton>
            <DnaButton variant="primary" className="bg-rose-600 hover:bg-rose-700" onClick={() => {
              toast.success("PO ditolak.");
              setRejectDialog(null);
              setRejectReason('');
            }}>Ya, Tolak</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extended Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Pencarian Detail Pembelian</span>
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
        <TableWrapper>
          <Table className="table-dense">
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">No. PO</TableHead>
                <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">Supplier</TableHead>
                <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">Item</TableHead>
                <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase text-right">Qty</TableHead>
                <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase text-right">Harga</TableHead>
                <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">Tgl PO</TableHead>
                <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase text-center">Status</TableHead>
                <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-medium text-sm">Tidak ada purchase order ditemukan.</p>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.map((po: any) => (
                <TableRow key={po.id} className="hover:bg-slate-50/30 transition-all">
                  <TableCell className="py-3 px-4">
                    <span className="font-black text-xs uppercase italic text-slate-900">{po.poNumber || '-'}</span>
                  </TableCell>
                  <TableCell className="py-3 px-4 font-medium text-xs text-slate-700">
                    {po.supplier?.name || po.supplierName || '-'}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">
                        {(po.items || []).map((i: any) => i.itemName || i.name).filter(Boolean).slice(0, 2).join(', ')}
                        {(po.items || []).length > 2 ? ` +${(po.items || []).length - 2}` : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-700">
                    {(po.items || []).reduce((s: number, i: any) => s + Number(i.quantity || i.qty || 0), 0)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right font-black text-xs tabular-nums text-slate-900">
                    Rp {Number(po.totalValue || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-xs text-slate-500">
                    {po.estArrival ? new Date(po.estArrival).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <DnaBadge status={
                      po.status === 'APPROVED' || po.status === 'ORDERED' ? "success" :
                      po.status === 'PENDING_APPROVAL' || po.status === 'SUBMITTED' ? "warning" :
                      po.status === 'REJECTED' ? "critical" : "default"
                    }>
                      {po.status?.replace('_', ' ') || 'DRAFT'}
                    </DnaBadge>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {(po.status === 'PENDING_APPROVAL' || po.status === 'DRAFT' || po.status === 'SUBMITTED') && (
                        <>
                          <DnaButton variant="primary" size="sm" onClick={() => setApproveDialog(po.id)} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Setuju
                          </DnaButton>
                          <DnaButton variant="outline" size="sm" onClick={() => setRejectDialog(po.id)} className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-7">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                          </DnaButton>
                        </>
                      )}
                      <DnaButton variant="ghost" size="sm" className="h-7" onClick={() => {
                        setSelectedPO(po);
                        setPoDiscount(Number(po.discountAmount || po.discountManual || 0));
                        setPoShippingCost(Number(po.shippingCost || 0));
                        // Item 71: default source = STOCK if currentStock >= qty, else PO
                        const sources: Record<string, "PO" | "STOCK"> = {};
                        (po.items || []).forEach((it: any, idx: number) => {
                          sources[it.id || it.materialId || idx] =
                            Number(it.currentStock || 0) >= Number(it.quantity || it.qty || 0) ? "STOCK" : "PO";
                        });
                        setLineSources(sources);
                      }}>
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      )}

      {/* Item 68: ConflictModal — shown when API returns 409 */}
      <ConflictModal
        open={conflict.open}
        lastModifiedAt={conflict.lastModifiedAt}
        lastModifiedBy={conflict.lastModifiedBy}
        onRefresh={() => { setConflict({ open: false }); refetch(); }}
        onCancel={() => setConflict({ open: false })}
      />

      {/* Item 46, 71: PO Detail Modal — diskon, shipping cost, line-item source dropdown */}
      <Dialog open={!!selectedPO} onOpenChange={(o) => { if (!o) setSelectedPO(null); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase">Detail PO: {selectedPO?.poNumber}</DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              {/* Diskon & Ongkos Kirim — Item 46 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Diskon (Rp)</label>
                  <DnaInput
                    type="number"
                    min="0"
                    value={poDiscount}
                    onChange={(e) => setPoDiscount(Number(e.target.value))}
                    className="h-9 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Ongkos Kirim (Rp)</label>
                  <DnaInput
                    type="number"
                    min="0"
                    value={poShippingCost}
                    onChange={(e) => setPoShippingCost(Number(e.target.value))}
                    className="h-9 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Line Items with Source Dropdown — Item 71 */}
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase">Item PO & Sumber</div>
                {(selectedPO.items || []).map((it: any, idx: number) => {
                  const key = it.id || it.materialId || `item-${idx}`;
                  const defaultSource = Number(it.currentStock || 0) >= Number(it.quantity || it.qty || 0) ? "STOCK" : "PO";
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{it.itemName || it.name || "—"}</p>
                        <p className="text-[10px] text-slate-400">Qty: {Number(it.quantity || it.qty || 0)} {it.unit || ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Sumber</label>
                        <select
                          value={lineSources[key] || defaultSource}
                          onChange={(e) => setLineSources({ ...lineSources, [key]: e.target.value as "PO" | "STOCK" })}
                          className="h-8 px-2 border border-slate-200 rounded-lg text-[10px] font-bold bg-white"
                        >
                          <option value="PO">PO</option>
                          <option value="STOCK">STOCK</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setSelectedPO(null)}>Tutup</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
