"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ArrowRightLeft,
  History,
  Plus,
  Search,
  Warehouse,
  Trash2,
  ChevronLeft,
  Save,
  Eye,
  CheckCircle2,
  Clock,
  ClipboardList,
  Layers,
  ArrowDownToLine,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DnaInput, DnaBadge, DnaButton, DnaStatCard, DnaDataTableCard, DnaSelect, DnaTextarea, DnaCell } from "@/components/dna";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { toast } from "sonner";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

// SPEC: SCR-SCM-MUT-001 — Warehouse Stock Mutation (Mutasi Barang Antar-Gudang)

const WAREHOUSE_OPTIONS_SOURCE = [
  { label: 'Gudang Utama', value: '00000000-0000-0000-0000-000000000001' },
  { label: 'Gudang Bahan Baku', value: '00000000-0000-0000-0000-000000000002' },
];
const WAREHOUSE_OPTIONS_DEST = [
  { label: 'Gudang Produksi', value: '00000000-0000-0000-0000-000000000003' },
  { label: 'Gudang Mixing', value: '00000000-0000-0000-0000-000000000004' },
  { label: 'Gudang Jadi', value: '00000000-0000-0000-0000-000000000005' },
];

export default function InventoryMutationPrototype() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "form">("list");
  const [cart, setCart] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState<number>(1);
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [destWarehouse, setDestWarehouse] = useState("");
  const [notes, setNotes] = useState("");

  const { data: transfers, isLoading: transferLoading } = useQuery({
    queryKey: ["warehouse-transfers"],
    queryFn: async () => {
      const res = await api.get("/warehouse/transfers");
      return unwrapResponse(res);
    },
  });

  const { data: materials } = useQuery({
    queryKey: ["master-materials"],
    queryFn: async () => {
      const res = await api.get("/master/materials");
      return unwrapResponse(res);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      sourceWarehouseId: string;
      destWarehouseId: string;
      notes?: string;
      items: { materialId: string; qty: number }[];
    }) => {
      const res = await api.post("/warehouse/transfers", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      toast.success("Transfer created successfully");
      setView("list");
      setCart([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create transfer");
    },
  });

  const transferList = Array.isArray(transfers) ? transfers : [];
  const materialList = Array.isArray(materials) ? materials : [];

  const materialOptions = materialList.map((m: any) => ({
    label: `${m.name} | ${Number(m.stockQty || 0).toLocaleString()} ${m.unit || "pcs"} Available`,
    value: m.id,
  }));

  const addToCart = () => {
    if (!selectedProduct) return;
    setCart([...cart, { ...selectedProduct, qty }]);
    setSelectedProduct(null);
    setQty(1);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleFinalize = () => {
    if (!sourceWarehouse || !destWarehouse || cart.length === 0) {
      toast.error("Please select warehouses and add at least one item");
      return;
    }
    createMutation.mutate({
      sourceWarehouseId: sourceWarehouse,
      destWarehouseId: destWarehouse,
      notes: notes || undefined,
      items: cart.map((item) => ({
        materialId: item.id,
        qty: item.qty,
      })),
    });
  };

  return (
    <DashboardShell
      title={view === "list" ? "MUTASI" : "BUAT MUTASI"}
      titleAccent="BARANG"
      subtitle={
        view === "list"
          ? "(Protokol Transfer Stok & Pergerakan Aset Antar-Gudang)"
          : "(Drafting Phase • Protocol 09-MT)"
      }
      actions={
        view === "list" ? (
          <div className="flex gap-3">
            <DnaButton variant="outline" size="md" icon={<History className="text-amber-500" />}>
              Riwayat
            </DnaButton>
            <DnaButton variant="primary" size="md" icon={<Plus />} onClick={() => setView("form")}>
              Buat
            </DnaButton>
          </div>
        ) : (
          <div className="flex gap-3">
            <DnaButton variant="ghost" icon={<ChevronLeft />} onClick={() => setView("list")} className="text-rose-500 hover:bg-rose-50 hover:text-rose-500">
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" icon={<Save />} onClick={handleFinalize} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Processing..." : "Finalize Transfer"}
            </DnaButton>
          </div>
        )
      }
    >
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <DnaStatCard label="Transfer Tertunda" value="5" icon={<Clock />} variant="amber" />
              <DnaStatCard label="Berhasil" value="128" icon={<CheckCircle2 />} variant="emerald" />
              <DnaStatCard label="Frekuensi Transfer" value="12/hari" icon={<ArrowRightLeft />} variant="blue" />
              <DnaStatCard label="Peringatan Stok" value="3" icon={<Layers />} variant="rose" />
            </div>

            <DnaDataTableCard
              customToolbar={
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div className="w-72">
                    <DnaInput icon={<Search className="h-3.5 w-3.5 text-slate-400" />} placeholder="Cari ID Mutasi..." className="h-10 text-xs" />
                  </div>
                  <div className="flex gap-4">
                    <DnaButton variant="ghost" className="h-10 px-5 text-[9px]">
                      Filter: Semua Status
                    </DnaButton>
                  </div>
                </div>
              }
            >
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-4">ID Transfer</th>
                    <th className="py-4 px-4">Asal / Tujuan</th>
                    <th className="py-4 px-4">Dibuat Oleh</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transferLoading && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                        <p className="text-[10px] font-bold uppercase mt-4 text-slate-400">Memuat transfer...</p>
                      </td>
                    </tr>
                  )}
                  {!transferLoading && transferList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <p className="text-[10px] font-bold uppercase text-slate-300">Belum ada transfer</p>
                      </td>
                    </tr>
                  )}
                  {!transferLoading && transferList.map((mut: any) => (
                    <tr key={mut.id} className="hover:bg-slate-50/80">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 tracking-tight text-xs uppercase italic">{mut.transferNumber || mut.kode}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{formatDate(mut.date || mut.createdAt)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{mut.sourceWarehouse?.name || mut.dari || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="h-3 w-3 text-blue-600" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase italic tracking-tighter">{mut.destWarehouse?.name || mut.ke || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <DnaBadge status="default" className="rounded-md text-[8px] px-1.5 py-0.5">
                          {mut.createdBy || mut.pembuat || "-"}
                        </DnaBadge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <DnaBadge status={mut.status === "COMPLETED" || mut.status === "Selesai" ? "success" : "warning"} className="text-[8px]">
                          {mut.status === "COMPLETED" ? "Selesai" : mut.status === "PENDING" ? "Proses" : mut.status || "-"}
                        </DnaBadge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DnaButton variant="ghost" size="icon" icon={<Eye className="h-4 w-4" />} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DnaDataTableCard>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6 pb-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8 relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600">Transfer Path</p>
                      <h3 className="text-2xl font-bold italic tracking-tighter uppercase">Warehouse <br /> <span className="text-blue-500 text-3xl">Migration</span></h3>
                    </div>

                    <div className="space-y-5">
                      <DnaSelect
                        label="Gudang Asal"
                        placeholder="-- Pilih Gudang --"
                        value={sourceWarehouse}
                        onChange={setSourceWarehouse}
                        options={WAREHOUSE_OPTIONS_SOURCE}
                      />

                      <div className="flex justify-center">
                        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                          <ArrowRight className="h-4 w-4 rotate-90" />
                        </div>
                      </div>

                      <DnaSelect
                        label="Gudang Tujuan"
                        placeholder="-- Pilih Gudang --"
                        value={destWarehouse}
                        onChange={setDestWarehouse}
                        options={WAREHOUSE_OPTIONS_DEST}
                      />
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <DnaTextarea
                        label="Logistics Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Provide reason for mutation..."
                      />
                    </div>
                  </div>
                  <Warehouse className="h-40 w-40 text-slate-200 absolute -right-10 -bottom-10 rotate-12" />
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold uppercase tracking-tighter italic">Resource <span className="text-blue-600">Selection</span></h2>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select assets for logical migration</p>
                    </div>
                    <DnaBadge status="info">
                      Asset Integrity Verified
                    </DnaBadge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-6">
                      <DnaSelect
                        label="Search Asset"
                        placeholder="— CHOOSE ASSET —"
                        value={selectedProduct?.id || ""}
                        onChange={(val) => setSelectedProduct(materialList.find((p: any) => p.id === val) || null)}
                        options={materialOptions}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <DnaInput
                        label="Transfer Qty"
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="h-11 text-center text-xs font-bold"
                      />
                    </div>
                    <div className="md:col-span-3 h-11">
                      <DnaButton variant="primary" icon={<Plus />} onClick={addToCart} className="w-full h-full text-[9px]">
                        Add to Transfer
                      </DnaButton>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                        <Layers className="h-4 w-4" />
                      </div>
                      <h3 className="text-base font-bold uppercase italic tracking-tighter">Migration <span className="text-blue-600">Manifest</span></h3>
                    </div>
                    {cart.length > 0 && (
                      <DnaButton variant="ghost" icon={<Trash2 />} onClick={() => setCart([])} className="text-[9px] text-rose-500 hover:bg-rose-50 rounded-lg h-9">
                        Clear Manifest
                      </DnaButton>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px]">
                          <th className="py-4 px-4">Barang</th>
                          <th className="py-4 px-4 text-center">Kode</th>
                          <th className="py-4 px-4 text-center">Satuan</th>
                          <th className="py-4 px-4 text-center">Qty Mutasi</th>
                          <th className="py-4 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cart.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <ArrowRightLeft className="h-10 w-10 text-slate-200" />
                                <p className="text-[9px] font-bold uppercase text-slate-300 tracking-[0.3em]">No assets staged for migration</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          cart.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/80">
                              <td className="py-4 px-4">
                                <span className="font-bold text-slate-900 text-xs uppercase">{item.name}</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <DnaBadge status="default" className="rounded-md text-[8px] px-1.5 py-0.5">{item.code || item.id}</DnaBadge>
                              </td>
                              <td className="py-4 px-4 text-center font-bold text-slate-400 text-xs uppercase">{item.unit || "pcs"}</td>
                              <td className="py-4 px-4 text-center font-bold text-slate-900 text-xs tabular-nums">
                                {item.qty}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <DnaButton variant="ghost" size="icon" onClick={() => removeFromCart(i)} icon={<Trash2 className="h-4 w-4" />} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
