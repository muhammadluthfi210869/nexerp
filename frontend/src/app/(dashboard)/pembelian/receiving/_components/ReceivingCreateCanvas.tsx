"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  PackageCheck,
  Truck,
  Building2,
  Calendar,
  Layers,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Warehouse,
  ShieldCheck,
} from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaBadge,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

interface PoItem {
  id: string;
  name: string;
  code?: string;
  qtyOrdered: number;
  unit: string;
  unitPrice?: number;
}

interface PurchaseOrderOption {
  id: string;
  poNumber: string;
  vendorId?: string;
  vendorName: string;
  items: PoItem[];
}

interface ReceivingItemRow {
  materialId: string;
  materialName: string;
  unit: string;
  qtyOrdered: number;
  qtyGood: number;
  qtyReject: number;
  qtyFree: number;
  notes: string;
}

interface ReceivingCreateCanvasProps {
  purchaseOrders: PurchaseOrderOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ReceivingCreateCanvas({
  purchaseOrders,
  onClose,
  onSuccess,
}: ReceivingCreateCanvasProps) {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [selectedPoId, setSelectedPoId] = useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [arrivalDate, setArrivalDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [doNumber, setDoNumber] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [itemRows, setItemRows] = useState<ReceivingItemRow[]>([]);

  // Fetch active warehouses
  const { data: rawWarehouses } = useQuery({
    queryKey: ["warehouses-active"],
    queryFn: async () => {
      const res = await api.get("/master/warehouses/active");
      return unwrapResponse(res) || [];
    },
  });

  const warehouseOptions = useMemo(() => {
    if (!rawWarehouses || !Array.isArray(rawWarehouses) || rawWarehouses.length === 0) {
      return [
        { label: "Gudang Utama Raw Material & Kemasan (GD-RAW-01)", value: "WH-RAW-01" },
        { label: "Gudang Karantina & QC Lab (GD-QC-01)", value: "WH-QC-01" },
      ];
    }
    return rawWarehouses.map((w: any) => ({
      label: `${w.name} (${w.code || "WH"})`,
      value: w.id,
    }));
  }, [rawWarehouses]);

  useEffect(() => {
    if (warehouseOptions.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouseOptions[0].value);
    }
  }, [warehouseOptions, selectedWarehouseId]);

  // Selected PO
  const activePo = useMemo(() => {
    return purchaseOrders.find((p) => p.id === selectedPoId || p.poNumber === selectedPoId) || null;
  }, [purchaseOrders, selectedPoId]);

  // When PO changes, populate line items with 3-Pilar defaults
  useEffect(() => {
    if (activePo && activePo.items && activePo.items.length > 0) {
      setItemRows(
        activePo.items.map((it) => ({
          materialId: it.id || it.name,
          materialName: it.name,
          unit: it.unit || "PCS",
          qtyOrdered: it.qtyOrdered || 0,
          qtyGood: it.qtyOrdered || 0,
          qtyReject: 0,
          qtyFree: 0,
          notes: "",
        }))
      );
    } else {
      setItemRows([]);
    }
  }, [activePo]);

  const updateItemField = (index: number, field: keyof ReceivingItemRow, val: any) => {
    setItemRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const totals = useMemo(() => {
    return itemRows.reduce(
      (acc, r) => ({
        ordered: acc.ordered + (r.qtyOrdered || 0),
        good: acc.good + (r.qtyGood || 0),
        reject: acc.reject + (r.qtyReject || 0),
        free: acc.free + (r.qtyFree || 0),
        totalActual: acc.totalActual + (r.qtyGood || 0) + (r.qtyReject || 0) + (r.qtyFree || 0),
      }),
      { ordered: 0, good: 0, reject: 0, free: 0, totalActual: 0 }
    );
  }, [itemRows]);

  const createGrnMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPoId) throw new Error("Pilih nomor PO terlebih dahulu");
      if (itemRows.length === 0) throw new Error("Item penerimaan tidak boleh kosong");
      if (!selectedWarehouseId) throw new Error("Pilih gudang tujuan penerimaan");

      const payload = {
        poId: activePo?.id || selectedPoId,
        warehouseId: selectedWarehouseId,
        doNumber: doNumber || undefined,
        driverName: driverName || undefined,
        arrivalDate: arrivalDate ? new Date(arrivalDate).toISOString() : new Date().toISOString(),
        notes: notes || undefined,
        items: itemRows.map((it) => ({
          materialId: it.materialId,
          quantity: it.qtyGood + it.qtyFree,
          qtyActual: it.qtyGood + it.qtyReject + it.qtyFree,
          qtyGood: it.qtyGood,
          qtyReject: it.qtyReject,
          qtyFree: it.qtyFree,
          notes: it.notes || undefined,
        })),
      };

      const res = await api.post("/scm/inbounds", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Penerimaan barang (GRN) berhasil didaftarkan.");
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["approved-po"] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Gagal mendaftarkan penerimaan barang");
    },
  });

  const poOptions = useMemo(() => {
    return purchaseOrders.map((p) => ({
      label: `${p.poNumber} — ${p.vendorName} (${p.items.length} item)`,
      value: p.id || p.poNumber,
    }));
  }, [purchaseOrders]);

  return (
    <div className="space-y-6">
      {/* Header Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <PackageCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Pendaftaran Kedatangan Barang (GRN Inbound)</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🏷️ Auto-Number: GRN-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan fisik gudang 3 pilar (Bagus/Stok, Reject/Cacat retur, Free/Bonus) terintegrasi otomatis dengan PO dan QC Lab.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <DnaButton variant="outline" size="sm" onClick={onClose} disabled={createGrnMutation.isPending}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() => createGrnMutation.mutate()}
            disabled={createGrnMutation.isPending || !selectedPoId || itemRows.length === 0}
          >
            {createGrnMutation.isPending ? "Menyimpan..." : "Daftarkan Penerimaan"}
          </DnaButton>
        </div>
      </div>

      {/* 2-Column Upper Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Sumber PO & Vendor */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Building2 className="w-4 h-4 text-indigo-600" />
              1. Dokumen Sumber & Gudang Tujuan
            </div>
            {activePo && (
              <DnaBadge variant="info">
                {activePo.items.length} Item Terdaftar
              </DnaBadge>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Purchase Order (PO Aktif) *
            </label>
            <DnaSelect
              placeholder="-- Cari PO Yang Sudah Disetujui --"
              value={selectedPoId}
              onChange={setSelectedPoId}
              options={poOptions}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Gudang Tujuan Penerimaan *
            </label>
            <DnaSelect
              placeholder="-- Pilih Gudang Fisik --"
              value={selectedWarehouseId}
              onChange={setSelectedWarehouseId}
              options={warehouseOptions}
            />
          </div>

          {activePo && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Nama Supplier</span>
                <span className="font-bold text-slate-900 block mt-0.5">{activePo.vendorName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Nomor PO Ref</span>
                <span className="font-bold text-indigo-600 font-mono block mt-0.5">{activePo.poNumber}</span>
              </div>
            </div>
          )}
        </DnaCard>

        {/* Right Column: Ekspedisi & Logistik */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Truck className="w-4 h-4 text-emerald-600" />
              2. Dokumen Pengiriman & Ekspedisi
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Kedatangan *
              </label>
              <DnaInput
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                No. DO / Surat Jalan Ekspedisi
              </label>
              <DnaInput
                placeholder="Contoh: DO-EXP-2026-99"
                value={doNumber}
                onChange={(e) => setDoNumber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Kurir / Plat Nomor Kendaraan
            </label>
            <DnaInput
              placeholder="Contoh: B 9128 UAZ (Bpk. Mulyono)"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Kondisi Fisik Pengiriman
            </label>
            <DnaInput
              placeholder="Contoh: Segel kontainer utuh, tidak ada kemasan basah/penyok"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </DnaCard>
      </div>

      {/* Full-Width 3-Pilar Physical Receiving Grid */}
      <DnaCard className="p-5 space-y-4 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Layers className="w-4 h-4 text-indigo-600" />
            3. Verifikasi Fisik 3 Pilar Gudang (Bagus, Reject, Free)
          </div>
          <span className="text-[11px] text-slate-500">
            Pilar Bagus masuk stok & hutang • Reject untuk klaim retur DN • Free bonus HPP 0
          </span>
        </div>

        {itemRows.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            Pilih PO Aktif di atas untuk memuat daftar barang pesanan otomatis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-2.5 px-3 w-[50px] text-center">No</DnaTh>
                  <DnaTh className="py-2.5 px-3 min-w-[200px]">Nama Material / Item</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[110px]">Qty PO</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center w-[130px] bg-emerald-50/70 text-emerald-900">
                    1. Bagus (Stok)
                  </DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center w-[130px] bg-rose-50/70 text-rose-900">
                    2. Reject (Cacat)
                  </DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center w-[130px] bg-amber-50/70 text-amber-900">
                    3. Free (Bonus)
                  </DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[120px]">Total Aktual</DnaTh>
                  <DnaTh className="py-2.5 px-3 min-w-[150px]">Catatan / Keterangan</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {itemRows.map((row, idx) => {
                  const lineActual = (row.qtyGood || 0) + (row.qtyReject || 0) + (row.qtyFree || 0);
                  const isMatch = lineActual === row.qtyOrdered;
                  return (
                    <DnaTableRow key={idx} className="hover:bg-slate-50/60">
                      <DnaTd className="py-2.5 px-3 text-center font-mono text-xs text-slate-400">
                        {idx + 1}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block text-xs">{row.materialName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{row.unit}</span>
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-700 tabular-nums text-xs">
                        {row.qtyOrdered.toLocaleString("id-ID")} {row.unit}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 bg-emerald-50/30">
                        <input
                          type="number"
                          min="0"
                          value={row.qtyGood}
                          onChange={(e) => updateItemField(idx, "qtyGood", Math.max(0, Number(e.target.value) || 0))}
                          className="w-full text-center text-xs font-bold text-emerald-700 bg-white border border-emerald-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 bg-rose-50/30">
                        <input
                          type="number"
                          min="0"
                          value={row.qtyReject}
                          onChange={(e) => updateItemField(idx, "qtyReject", Math.max(0, Number(e.target.value) || 0))}
                          className="w-full text-center text-xs font-bold text-rose-700 bg-white border border-rose-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                        />
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 bg-amber-50/30">
                        <input
                          type="number"
                          min="0"
                          value={row.qtyFree}
                          onChange={(e) => updateItemField(idx, "qtyFree", Math.max(0, Number(e.target.value) || 0))}
                          className="w-full text-center text-xs font-bold text-amber-700 bg-white border border-amber-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right tabular-nums">
                        <span className={`font-bold text-xs block ${isMatch ? "text-slate-900" : "text-amber-600"}`}>
                          {lineActual.toLocaleString("id-ID")} {row.unit}
                        </span>
                        {!isMatch && (
                          <span className="text-[10px] text-amber-600 font-semibold block">
                            {lineActual > row.qtyOrdered ? `+${lineActual - row.qtyOrdered}` : `${lineActual - row.qtyOrdered}`} selisih
                          </span>
                        )}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="Catatan batch/lot..."
                          value={row.notes}
                          onChange={(e) => updateItemField(idx, "notes", e.target.value)}
                          className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </DnaTd>
                    </DnaTableRow>
                  );
                })}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}

        {/* Totals Breakdown Bar */}
        {itemRows.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Target PO</span>
              <span className="font-bold text-slate-900 text-sm tabular-nums">
                {totals.ordered.toLocaleString("id-ID")} Item
              </span>
            </div>
            <div>
              <span className="text-emerald-700 font-semibold block text-[11px]">Total Pilar 1 (Bagus)</span>
              <span className="font-extrabold text-emerald-700 text-sm tabular-nums">
                {totals.good.toLocaleString("id-ID")} Item
              </span>
            </div>
            <div>
              <span className="text-rose-700 font-semibold block text-[11px]">Total Pilar 2 (Reject)</span>
              <span className="font-extrabold text-rose-700 text-sm tabular-nums">
                {totals.reject.toLocaleString("id-ID")} Item
              </span>
            </div>
            <div>
              <span className="text-amber-700 font-semibold block text-[11px]">Total Pilar 3 (Free)</span>
              <span className="font-extrabold text-amber-700 text-sm tabular-nums">
                {totals.free.toLocaleString("id-ID")} Item
              </span>
            </div>
          </div>
        )}
      </DnaCard>
    </div>
  );
}
