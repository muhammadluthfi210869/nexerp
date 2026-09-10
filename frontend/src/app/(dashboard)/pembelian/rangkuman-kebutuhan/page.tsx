"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Package,
  Search,
  Filter,
  Download,
  ArrowLeft,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Coins,
  Layers,
  ClipboardList,
  ChevronDown,
  Calendar,
  Building2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DnaButton, DnaBadge, DnaInput, DnaStatCard, DnaDataTableCard, DnaModal, DnaSelect, DnaCell } from "@/components/dna";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/empty-state";

// SPEC: SCR-SCM-MRP-001 — Consolidated Material Requirements Planning (Rangkuman Kebutuhan)
// Business feature: selisih (kebutuhan - stok) drives critical/high/medium/low priority;
// PO otomatis dibuat untuk material dengan selisih negatif.

const SUPPLIERS = [
  "PT Kimia Farma Tbk", "CV Bahan Kimia Abadi", "PT Global Packaging Solution", "UD Sumber Makmur", "PT Aroma Nusantara"
];

export default function ConsolidatedMRPPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [poQty, setPoQty] = useState(0);
  const [poSupplier, setPoSupplier] = useState("");
  const [poPrice, setPoPrice] = useState(0);
  const [poDeliveryDate, setPoDeliveryDate] = useState("");

  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ["scm-requirements-summary"],
    queryFn: async () => {
      const res = await api.get("/scm/requirements/summary");
      return unwrapResponse(res);
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: { materialId: string; supplierId: string; qty: number; unitPrice: number }) => {
      const res = await api.post("/scm/purchase-orders/from-requirement", data);
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scm-requirements-summary"] });
      setIsPOModalOpen(false);
    },
  });

  const data = Array.isArray(summaryData) ? summaryData : [];
  const filteredData = data.filter((item: any) =>
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openPOModal = (item: any) => {
    setSelectedItem(item);
    setIsPOModalOpen(true);
  };

  const supplierOptions = SUPPLIERS.map((s) => ({ label: s, value: s }));

  return (
    <DashboardShell
      title="RANGKUMAN"
      titleAccent="KEBUTUHAN"
      subtitle="(Consolidated Material Requirements Planning • Global Operational View)"
      actions={
        <div className="flex gap-3">
          <DnaButton variant="ghost" onClick={() => router.back()} icon={<ArrowLeft />} className="h-11 px-5">
            Kembali
          </DnaButton>
          <DnaButton variant="outline" icon={<Download />}>
            Export Excel
          </DnaButton>
          <DnaButton variant="primary" icon={<ShoppingCart />}>
            Buat PO Global
          </DnaButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DnaStatCard label="Active Orders" value="12 SO" icon={<ClipboardList />} variant="blue" />
        <DnaStatCard label="Unique SKUs" value="48 Materials" icon={<Layers />} variant="info" />
        <DnaStatCard label="Total Requirement" value="15,750 units" icon={<TrendingUp />} variant="emerald" />
        <DnaStatCard label="Estimated Budget" value="Rp 285.0M" icon={<Coins />} variant="amber" />
      </div>

      <DnaDataTableCard
        customToolbar={
          <div className="px-5 py-3 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
            <div className="flex gap-4 w-full md:w-auto">
              <div className="w-full md:w-72">
                <DnaInput placeholder="Cari bahan..." icon={<Search />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 h-11 px-4 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-[9px] font-bold uppercase text-slate-500">Period: Apr 2026</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>
            <div className="flex gap-4 shrink-0">
              <DnaButton variant="ghost" icon={<Filter />}>
                Filter Advanced
              </DnaButton>
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="p-14 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 animate-pulse">Loading consolidated requirements...</p>
          </div>
        ) : error ? (
          <div className="p-14 flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
            <p className="text-xs font-bold text-rose-600 uppercase">Failed to load data</p>
            <p className="text-[9px] text-slate-400">{(error as any)?.message || "Unknown error"}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-4 text-left">#</th>
                <th className="py-4 px-4 text-left">Identitas Bahan</th>
                <th className="py-4 px-4 text-right">Kebutuhan / Stok</th>
                <th className="py-4 px-4 text-right">Selisih</th>
                <th className="py-4 px-4 text-center">Prioritas</th>
                <th className="py-4 px-4 text-left">SO Breakdown</th>
                <th className="py-4 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState
                      icon={<Package className="h-8 w-8 text-slate-300" />}
                      title="Tidak Ada Data"
                      description="Tidak ada data kebutuhan yang sesuai dengan pencarian. Coba ubah kata kunci pencarian."
                    />
                  </td>
                </tr>
              ) : filteredData.map((item, idx) => (
                <tr key={item.kode} className="hover:bg-slate-50/80">
                  <td className="py-4 px-4 font-bold text-slate-300 text-xs">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 tracking-tight text-xs uppercase italic">{item.nama}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.kode} • {item.kategori}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-xs tabular-nums">{item.total_kebutuhan.toLocaleString()} <span className="text-[9px] text-slate-400 font-bold">{item.satuan}</span></span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Stok: {item.stok.toLocaleString()} {item.satuan}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className={cn(
                      "font-bold text-xs tabular-nums inline-flex items-center gap-1",
                      item.selisih < 0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {item.selisih > 0 ? "+" : ""}{item.selisih.toLocaleString()}
                      {item.selisih < 0 && <AlertTriangle className="h-3 w-3 animate-pulse" />}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <DnaBadge status={
                      item.prioritas?.toLowerCase() === 'critical' ? 'critical' :
                      item.prioritas?.toLowerCase() === 'high' ? 'warning' :
                      item.prioritas?.toLowerCase() === 'medium' ? 'warning' : 'default'
                    }>
                      {item.prioritas}
                    </DnaBadge>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight line-clamp-2 italic max-w-[150px]">
                      {item.so_list}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {item.selisih < 0 && (
                        <DnaButton onClick={() => openPOModal(item)} variant="danger" size="sm">
                          Buat PO
                        </DnaButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 uppercase italic">
                Total {data.length} material | {data.reduce((a: number, i: any) => a + (i.total_kebutuhan || 0), 0).toLocaleString()} units | Estimasi berdasarkan kebutuhan
              </p>
              <p className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="h-3.5 w-3.5" /> {data.filter((i: any) => i.prioritas === 'Critical' || i.prioritas === 'High').length} material dengan status Critical/High perlu pembelian segera
              </p>
            </div>
          </div>
          <DnaButton variant="danger" size="lg" icon={<AlertTriangle />}>
            PO Massal Critical
          </DnaButton>
        </div>
      </DnaDataTableCard>

      <DnaModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        title={`Buat Purchase Order: ${selectedItem?.nama || ''}`}
        subtitle="Procurement Protocol"
        size="xl"
        badge="PO"
        footer={
          <>
            <DnaButton onClick={() => setIsPOModalOpen(false)} variant="ghost" className="flex-1">
              Batal
            </DnaButton>
            <DnaButton
              onClick={() => {
                if (!selectedItem || !poSupplier || !poQty || !poPrice) return;
                createPOMutation.mutate({
                  materialId: selectedItem.materialId || selectedItem.kode,
                  supplierId: poSupplier,
                  qty: poQty || Math.abs(selectedItem.selisih),
                  unitPrice: poPrice,
                });
              }}
              disabled={!poSupplier || !poPrice || createPOMutation.isPending}
              variant="primary"
              icon={<CheckCircle2 />}
              className="flex-[2]"
            >
              {createPOMutation.isPending ? "Processing..." : "Initialize Purchase Order"}
            </DnaButton>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
              <div className="col-span-2 border-b border-slate-200 pb-2">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Material</p>
                <p className="font-bold text-xs uppercase italic text-blue-600">{selectedItem.nama} ({selectedItem.kode})</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Kebutuhan</p>
                <p className="font-bold text-xs uppercase italic tabular-nums">{Math.abs(selectedItem.selisih).toLocaleString()} {selectedItem.satuan}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Fulfillment Scope</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">{selectedItem.so_list.split(',').length} Sales Orders</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DnaSelect
                label="Select Supplier"
                placeholder="Choose Supplier..."
                value={poSupplier}
                onChange={setPoSupplier}
                options={supplierOptions}
                icon={<Building2 className="h-4 w-4 text-slate-400" />}
              />
              <DnaInput
                label="Target Delivery Date"
                type="date"
                value={poDeliveryDate}
                onChange={(e) => setPoDeliveryDate(e.target.value)}
                icon={<Calendar />}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DnaInput
                label="Purchase Quantity"
                type="number"
                value={poQty || Math.abs(selectedItem.selisih)}
                onChange={(e) => setPoQty(Number(e.target.value))}
                className="text-sm font-bold tabular-nums"
              />
              <DnaInput
                label="Unit Price (IDR)"
                type="number"
                placeholder="0"
                value={poPrice || ""}
                onChange={(e) => setPoPrice(Number(e.target.value))}
                className="text-sm font-bold tabular-nums"
              />
            </div>
          </div>
        )}
      </DnaModal>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 flex gap-6 items-center shadow-sm">
        <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-blue-50">
          <Coins className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600 italic">Procurement Insight: Liquidity & Inventory Balance</p>
          <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase">
            Consolidating POs for <span className="text-blue-600 font-bold">Critical Materials</span> can reduce logistics costs by up to 15%.
            Focus on high-volume materials like <span className="font-bold text-slate-900 italic">Glycerin</span> and <span className="font-bold text-slate-900 italic">Aquades</span> to leverage bulk pricing with our Tier-1 suppliers.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
