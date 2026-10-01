import React from "react";
import { DnaInput, DnaSelect } from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import { PoActionsBar } from "./PoActionsBar";

interface PoCostSummaryProps {
  cartCount: number;
  subtotalBarang: number;
  discountRp: number;
  setDiscountRp: (val: number) => void;
  shippingCostRp: number;
  setShippingCostRp: (val: number) => void;
  taxRate: number;
  setTaxRate: (val: number) => void;
  grandTotal: number;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PoCostSummary({
  cartCount,
  subtotalBarang,
  discountRp,
  setDiscountRp,
  shippingCostRp,
  setShippingCostRp,
  taxRate,
  setTaxRate,
  grandTotal,
  onCancel,
  isSubmitting = false,
}: PoCostSummaryProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3.5">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        4. Ringkasan Kalkulasi Finansial
      </h3>

      <div className="space-y-2.5 text-xs text-slate-700">
        <div className="flex justify-between items-center py-1">
          <span>Subtotal Barang ({cartCount} Item):</span>
          <span className="font-bold tabular-nums text-slate-900">{formatCurrency(subtotalBarang)}</span>
        </div>

        <div className="flex justify-between items-center py-1">
          <div>
            <span className="font-semibold block">Potongan Diskon Supplier (Rp):</span>
            <span className="text-[10px] text-slate-400">Dikirim sebagai discountManual</span>
          </div>
          <div className="w-36">
            <DnaInput
              type="number"
              min={0}
              value={discountRp}
              onChange={(e) => setDiscountRp(Number(e.target.value))}
              className="tabular-nums text-right font-bold text-emerald-600 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-between items-center py-1">
          <div>
            <span className="font-semibold block">Biaya Ongkir (Rp):</span>
            <span className="text-[10px] text-slate-400">Dikirim sebagai shippingCost</span>
          </div>
          <div className="w-36">
            <DnaInput
              type="number"
              min={0}
              value={shippingCostRp}
              onChange={(e) => setShippingCostRp(Number(e.target.value))}
              className="tabular-nums text-right font-bold text-slate-800 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-between items-center py-1">
          <span>Pajak Pertambahan Nilai (PPN):</span>
          <div className="w-36">
            <DnaSelect
              options={[
                { value: "0", label: "0% (Bebas PPN)" },
                { value: "11", label: "11% (PPN Masukan)" },
              ]}
              value={String(taxRate)}
              onChange={(val) => setTaxRate(Number(val))}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-900">Grand Total Tagihan PO:</span>
          <span className="text-lg font-black text-blue-600 tabular-nums">
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>

      <PoActionsBar onCancel={onCancel} isSubmitting={isSubmitting} />
    </div>
  );
}
