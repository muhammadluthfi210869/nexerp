"use client";

import React from "react";
import {
  DollarSign,
  Truck,
  ShoppingCart,
  Trash2,
  Package,
  BadgeCheck,
} from "lucide-react";
import {
  DnaModal,
  DnaButton,
  DnaSelect,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaTextarea,
} from "@/components/dna";
import { CartItem } from "../_types/purchasing.types";

interface PurchasingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVendor: string;
  setSelectedVendor: (val: string) => void;
  vendorOptions: { label: string; value: string }[];
  selectedWarehouse: string;
  setSelectedWarehouse: (val: string) => void;
  warehouseOptions: { label: string; value: string }[];
  selectedDate: string;
  selectedDueDate: string;
  setSelectedDueDate: (val: string) => void;
  discountAmount: number;
  setDiscountAmount: (val: number) => void;
  shippingCost: number;
  setShippingCost: (val: number) => void;
  materialOptions: { label: string; value: string }[];
  addItem: (materialId: string) => void;
  items: CartItem[];
  setItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  removeItem: (materialId: string) => void;
  updateItem: (materialId: string, field: keyof CartItem, value: any) => void;
  subtotal: number;
  taxPercent: string;
  tax: number;
  grandTotal: number;
  notes: string;
  setNotes: (val: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PurchasingFormModal({
  isOpen,
  onClose,
  selectedVendor,
  setSelectedVendor,
  vendorOptions,
  selectedWarehouse,
  setSelectedWarehouse,
  warehouseOptions,
  selectedDate,
  selectedDueDate,
  setSelectedDueDate,
  discountAmount,
  setDiscountAmount,
  shippingCost,
  setShippingCost,
  materialOptions,
  addItem,
  items,
  setItems,
  removeItem,
  updateItem,
  subtotal,
  taxPercent,
  tax,
  grandTotal,
  notes,
  setNotes,
  onSubmit,
  isSubmitting,
}: PurchasingFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Purchase Order"
      subtitle="Procurement Order Protocol v4.0"
      size="3xl"
      badge="PO"
      footer={
        <>
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onSubmit}
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Pembelian"}
          </DnaButton>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <DnaSelect
            label="Supplier"
            required
            placeholder="Pilih Supplier"
            value={selectedVendor}
            onChange={setSelectedVendor}
            options={vendorOptions}
          />
          <DnaSelect
            label="Gudang Tujuan"
            placeholder="Pilih Gudang"
            value={selectedWarehouse}
            onChange={setSelectedWarehouse}
            options={warehouseOptions}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <DnaInput
            label="Tanggal PO (Auto)"
            type="date"
            value={selectedDate}
            readOnly
            className="bg-zinc-100 text-zinc-500 font-medium cursor-not-allowed border-zinc-200"
          />
          <DnaInput
            label="Deadline Pengiriman"
            type="date"
            required
            value={selectedDueDate}
            onChange={(e) => setSelectedDueDate(e.target.value)}
          />
          <DnaInput
            label="Diskon (Rp)"
            type="number"
            value={discountAmount || ""}
            placeholder="0"
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            icon={<DollarSign className="h-3.5 w-3.5 text-zinc-400" />}
          />
          <DnaInput
            label="Ongkir (Rp)"
            type="number"
            value={shippingCost || ""}
            placeholder="0"
            onChange={(e) => setShippingCost(Number(e.target.value))}
            icon={<Truck className="h-3.5 w-3.5 text-zinc-400" />}
          />
        </div>

        <div>
          <DnaSelect
            label="Pilih Barang"
            placeholder="+ Tambah Barang ke Keranjang"
            value=""
            onChange={(val) => val && addItem(val)}
            options={materialOptions}
          />
        </div>

        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
          <div className="bg-zinc-50 px-4 py-3 flex justify-between items-center border-b border-zinc-200">
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="h-3.5 w-3.5" /> Keranjang Belanja ({items.length} item)
            </span>
            {items.length > 0 && (
              <DnaButton
                variant="ghost"
                size="sm"
                onClick={() => setItems([])}
                icon={<Trash2 className="h-3 w-3" />}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Bersihkan
              </DnaButton>
            )}
          </div>
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-500 font-medium uppercase tracking-wider text-[10px]">
                <DnaTh className="py-2 px-4">Barang</DnaTh>
                <DnaTh className="py-2 px-4 text-center">Qty</DnaTh>
                <DnaTh className="py-2 px-4 text-right">Harga</DnaTh>
                <DnaTh className="py-2 px-4 text-right">Subtotal</DnaTh>
                <DnaTh className="w-12"></DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {items.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={5} className="py-12 text-center">
                    <ShoppingCart className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-zinc-400 font-medium text-sm">
                      Belum ada barang. Pilih barang di atas.
                    </p>
                  </DnaTd>
                </DnaTableRow>
              ) : (
                items.map((item) => (
                  <DnaTableRow key={item.materialId}>
                    <DnaTd className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-800 border border-zinc-200">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 text-sm">{item.name}</p>
                          <p className="text-[10px] text-zinc-400">Unit: {item.unit}</p>
                        </div>
                      </div>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <DnaInput
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(item.materialId, "qty", Number(e.target.value))
                        }
                        className="w-20 text-center font-semibold text-xs"
                        min={0}
                      />
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right">
                      <DnaInput
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(item.materialId, "price", Number(e.target.value))
                        }
                        className="w-28 text-right font-semibold text-xs"
                        min={0}
                      />
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right font-semibold text-zinc-900 text-sm tabular-nums">
                      Rp {(item.qty * item.price).toLocaleString()}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right">
                      <DnaButton
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.materialId)}
                        icon={<Trash2 className="h-4 w-4 text-zinc-400 hover:text-rose-600" />}
                      />
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>

        <div className="bg-zinc-50 rounded-xl p-5 space-y-2 border border-zinc-200">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-zinc-500">Subtotal Barang</span>
            <span className="font-semibold text-zinc-900">Rp {subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-700">
              <span className="font-medium">Potongan Diskon</span>
              <span className="font-semibold">- Rp {discountAmount.toLocaleString()}</span>
            </div>
          )}
          {shippingCost > 0 && (
            <div className="flex justify-between text-sm text-zinc-600">
              <span className="font-medium">Ongkos Kirim</span>
              <span className="font-semibold">+ Rp {shippingCost.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="font-medium text-zinc-500">Pajak PPN ({taxPercent}%)</span>
            <span className="font-semibold text-zinc-900">Rp {tax.toLocaleString()}</span>
          </div>
          <div className="border-t border-zinc-200 pt-3 flex justify-between text-base">
            <span className="font-semibold text-zinc-900">Grand Total PO</span>
            <span className="font-bold text-zinc-900 text-lg tabular-nums">
              Rp {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900">
                Otorisasi & Digital Signature
              </p>
              <p className="text-[10px] text-zinc-500">
                PO disahkan dengan tanda tangan digital terenkripsi ERP
              </p>
            </div>
          </div>
          <DnaBadge variant="success">DIGITAL SIGNED</DnaBadge>
        </div>

        <DnaTextarea
          label="Catatan"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan untuk supplier..."
          rows={2}
        />
      </div>
    </DnaModal>
  );
}
