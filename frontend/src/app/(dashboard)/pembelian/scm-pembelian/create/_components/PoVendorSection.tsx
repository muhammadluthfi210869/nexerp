import React from "react";
import { DnaInput, DnaSelect } from "@/components/dna";
import type { SupplierOption, WarehouseOption } from "../_types/create-po.types";

interface PoVendorSectionProps {
  supplierId: string;
  setSupplierId: (val: string) => void;
  warehouseId: string;
  setWarehouseId: (val: string) => void;
  estArrival: string;
  setEstArrival: (val: string) => void;
  suppliers: SupplierOption[];
  warehouses: WarehouseOption[];
}

export function PoVendorSection({
  supplierId,
  setSupplierId,
  warehouseId,
  setWarehouseId,
  estArrival,
  setEstArrival,
  suppliers,
  warehouses,
}: PoVendorSectionProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        1. Identitas Dokumen & Mitra Supplier
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-bold text-slate-700 block mb-1 text-xs">
            Nomor Purchase Order
          </label>
          <DnaInput
            value=""
            disabled
            placeholder="Digenerate sistem saat simpan"
            className="bg-slate-100 tabular-nums text-xs font-bold text-blue-700"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            poNumber dibuat otomatis oleh server (idGenerator)
          </span>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1 text-xs">
            Tanggal PO (Read-Only Hari Ini) *
          </label>
          <DnaInput
            value={new Date().toLocaleDateString("id-ID")}
            disabled
            className="bg-slate-100 tabular-nums text-xs text-slate-700"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Otomatis hari ini (BUS-RULE-016)
          </span>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1 text-xs">
            Target Deadline Tiba di Pabrik *
          </label>
          <DnaInput
            type="date"
            value={estArrival}
            onChange={(e) => setEstArrival(e.target.value)}
            className="tabular-nums text-xs font-bold text-rose-600"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Dikirim sebagai estArrival
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div>
          <label className="font-bold text-slate-700 block mb-1 text-xs">Pilih Supplier Mitra *</label>
          <DnaSelect
            options={suppliers.map((s) => ({
              value: s.id,
              label: s.categoryName ? `${s.name} (${s.categoryName})` : s.name,
            }))}
            value={supplierId}
            onChange={(val) => setSupplierId(val)}
            placeholder="â€” Pilih Supplier â€”"
          />
          {suppliers.length === 0 && (
            <span className="text-[10px] text-rose-500 mt-0.5 block">
              Belum ada supplier terdaftar di master.
            </span>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="font-bold text-slate-700 block mb-1 text-xs">Gudang Penerima *</label>
          <DnaSelect
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            value={warehouseId}
            onChange={(val) => setWarehouseId(val)}
            placeholder="â€” Pilih Gudang â€”"
          />
          {warehouses.length === 0 && (
            <span className="text-[10px] text-rose-500 mt-0.5 block">
              Belum ada gudang aktif terdaftar di master.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
