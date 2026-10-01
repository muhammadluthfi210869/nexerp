import React from "react";
import { Package, Trash2, Plus } from "lucide-react";
import { DnaButton, DnaInput, DnaSelect, DnaEmptyState } from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import type { MaterialOption, CartRowItem } from "../_types/create-po.types";

interface PoItemsTableProps {
  materials: MaterialOption[];
  cartRows: CartRowItem[];
  cartCount: number;
  onAddItem: () => void;
  onSelectMaterial: (lineId: string, materialId: string) => void;
  onUpdateItem: (lineId: string, field: "qty" | "unitPrice", val: number) => void;
  onRemoveItem: (lineId: string) => void;
}

export function PoItemsTable({
  materials,
  cartRows,
  cartCount,
  onAddItem,
  onSelectMaterial,
  onUpdateItem,
  onRemoveItem,
}: PoItemsTableProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            2. Keranjang Multi-Line Bahan / Kemasan ({cartCount} Item)
          </h3>
          <p className="text-[11px] text-slate-500">
            Hanya kuantitas kondisi bagus yang akan dibayar pada faktur pembelian (Poin 53-55).
          </p>
        </div>
        <DnaButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAddItem}
          disabled={materials.length === 0}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Tambah Baris Bahan
        </DnaButton>
      </div>

      {materials.length === 0 ? (
        <DnaEmptyState
          title="Belum Ada Master Bahan"
          description="Katalog bahan/kemasan kosong di /master/materials, sehingga baris PO tidak dapat diisi."
        />
      ) : cartRows.length === 0 ? (
        <DnaEmptyState
          icon={<Package className="w-6 h-6" />}
          title="Keranjang Masih Kosong"
          description="Klik â€œTambah Baris Bahanâ€ untuk memilih bahan dari master materials."
        />
      ) : (
        <div className="space-y-2.5">
          {cartRows.map((item, idx) => (
            <div
              key={item.id}
              className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-wrap items-end gap-3 text-xs"
            >
              <span className="font-bold text-slate-400 w-5 text-center pb-2.5">{idx + 1}</span>

              <div className="flex-1 min-w-[220px]">
                <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                  Bahan / Kemas (Master Materials)
                </label>
                <DnaSelect
                  options={materials.map((m) => ({
                    value: m.id,
                    label: `${m.code} â€” ${m.name}`,
                  }))}
                  value={item.materialId}
                  onChange={(val) => onSelectMaterial(item.id, val)}
                  placeholder="â€” Pilih Bahan â€”"
                />
              </div>

              <div className="w-24">
                <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Satuan</label>
                <DnaInput value={item.unit} disabled className="bg-slate-100 text-[11px]" />
              </div>

              <div className="w-28">
                <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Qty Pesan</label>
                <DnaInput
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) => onUpdateItem(item.id, "qty", Number(e.target.value))}
                  className="font-bold"
                />
              </div>

              <div className="w-36">
                <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                  Harga Satuan (Rp)
                </label>
                <DnaInput
                  type="number"
                  min={0}
                  value={item.unitPrice}
                  onChange={(e) => onUpdateItem(item.id, "unitPrice", Number(e.target.value))}
                  className="tabular-nums"
                />
              </div>

              <div className="w-32 text-right">
                <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Subtotal</label>
                <span className="font-bold text-blue-600 tabular-nums block py-3 text-xs">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors mb-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
