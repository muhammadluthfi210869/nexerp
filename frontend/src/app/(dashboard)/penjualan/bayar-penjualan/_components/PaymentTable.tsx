import React from "react";
import { CircleDollarSign, FileCheck2, Receipt } from "lucide-react";
import {
  DnaDataTableCard,
  DnaCell,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { ReceivablePayment, statusBadgeConfig } from "../_types/bayar-penjualan.types";

interface PaymentTableProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  payments: ReceivablePayment[];
  onOpenPayment: (payment: ReceivablePayment) => void;
  onShowPaidReceipt: (payment: ReceivablePayment) => void;
}

export function PaymentTable({
  searchTerm,
  onSearchChange,
  payments,
  onOpenPayment,
  onShowPaidReceipt,
}: PaymentTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchPlaceholder: "Cari nomor kwitansi, faktur, pelanggan, atau brand...",
        searchValue: searchTerm,
        onSearchChange: onSearchChange,
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-3.5 py-2.5 w-[45px] text-center text-slate-400">#</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[150px]">No. Kwitansi AR</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[150px]">No. Faktur Penjualan</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[110px]">Tgl Bayar</DnaTh>
              <DnaTh className="px-3.5 py-2.5 min-w-[170px]">Pelanggan / Klien</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[130px]">Nama Brand</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px] text-right">Total Tagihan (Rp)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px] text-right">Kas Masuk Net (Rp)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px] text-right">Potongan PPh 21/23 (Rp)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px] text-right">Sisa Piutang (Rp)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[120px] text-center">Status</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[100px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {payments.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={12} className="text-center py-12 text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="font-semibold text-slate-600">Tidak ada data pembayaran</p>
                  <p className="text-xs text-slate-400">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                </DnaTd>
              </DnaTableRow>
            ) : (
              payments.map((p, idx) => (
                <DnaTableRow key={p.id} className="h-[48px] hover:bg-slate-50/60 transition-colors">
                  <DnaTd className="px-3.5 py-2.5 text-center text-slate-400 tabular-nums text-[12px]">{idx + 1}</DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Code code={`REC-${p.invoiceNumber.replace("INV-", "")}`} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Code code={p.invoiceNumber} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Text text={p.paymentDate} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <span className="font-semibold text-slate-900 text-[12px] line-clamp-1">{p.customerName}</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <span className="text-slate-600 text-[12px] line-clamp-1">{p.brandName || "Maklon"}</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-right">
                    <DnaCell.Numeric value={p.totalAmount} prefix="Rp " />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-right tabular-nums">
                    <span className="text-[12px] font-semibold text-emerald-600">
                      Rp {p.netCashReceived.toLocaleString("id-ID")}
                    </span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-right tabular-nums">
                    <span className="text-[12px] font-medium text-purple-700">
                      Rp {(p.pph23Deduction + p.pph21Deduction).toLocaleString("id-ID")}
                    </span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-right tabular-nums">
                    <span className={`text-[12px] font-semibold ${p.remainingAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      Rp {p.remainingAmount.toLocaleString("id-ID")}
                    </span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <DnaBadge
                      variant={statusBadgeConfig[p.status]?.status || "default"}
                    >
                      {statusBadgeConfig[p.status]?.label || p.status}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      {p.remainingAmount > 0 ? (
                        <DnaButton
                          variant="primary"
                          className="h-7 px-2.5 text-[11px]"
                          onClick={() => onOpenPayment(p)}
                        >
                          <CircleDollarSign className="w-3 h-3 mr-1" /> Bayar
                        </DnaButton>
                      ) : (
                        <DnaButton
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => onShowPaidReceipt(p)}
                        >
                          <FileCheck2 className="w-3.5 h-3.5 mr-1" /> Lunas
                        </DnaButton>
                      )}
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
