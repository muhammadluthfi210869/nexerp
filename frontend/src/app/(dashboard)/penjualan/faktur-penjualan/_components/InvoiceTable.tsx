"use client";

import React from "react";
import { Receipt, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaCell,
  DnaBadge,
  DnaButton,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { SalesInvoice } from "../_types/faktur-penjualan.types";

interface InvoiceTableProps {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  invoices: SalesInvoice[];
  onToggleGatekeeper: (invId: string) => void;
  onSelectInvoice: (inv: SalesInvoice) => void;
}

export function InvoiceTable({
  isLoading,
  isError,
  error,
  refetch,
  searchTerm,
  onSearchChange,
  invoices,
  onToggleGatekeeper,
  onSelectInvoice,
}: InvoiceTableProps) {
  if (isLoading) {
    return <DnaLoadingSkeleton rows={5} />;
  }

  if (isError) {
    return (
      <DnaErrorState
        title="Gagal Memuat Faktur Penjualan"
        message={(error as any)?.message || "Terjadi kesalahan saat memuat data tagihan."}
        onRetry={refetch}
      />
    );
  }

  return (
    <DnaDataTableCard
      toolbarProps={{
        searchPlaceholder: "Cari no faktur, SO, pelanggan, atau brand...",
        searchValue: searchTerm,
        onSearchChange: onSearchChange,
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-3.5 py-2.5 w-[45px] text-center text-slate-400">#</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[160px]">No. Faktur Penjualan</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px]">No. SO Ref</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[110px]">Tgl Faktur</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[110px]">Jatuh Tempo</DnaTh>
              <DnaTh className="px-3.5 py-2.5 min-w-[170px]">Pelanggan / Klien</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[130px]">Nama Brand</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px] text-right">Total Tagihan (Rp)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px] text-right">Sisa Piutang (Rp)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[120px] text-center">Status Bayar</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[120px] text-center">AR Gatekeeper</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {invoices.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={12} className="text-center py-12 text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="font-semibold text-slate-600">Tidak ada faktur ditemukan</p>
                  <p className="text-xs text-slate-400">Sesuaikan filter atau buat faktur baru.</p>
                </DnaTd>
              </DnaTableRow>
            ) : (
              invoices.map((inv, idx) => {
                const remaining = inv.grandTotal - inv.paidAmount;
                return (
                  <DnaTableRow
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <DnaTd className="px-3.5 py-2.5 text-center text-slate-400 tabular-nums text-[12px]">{idx + 1}</DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Code code={inv.invoiceNumber} />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Code code={inv.soNumber} />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text text={inv.invoiceDate} />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text text={inv.dueDate} />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <span className="font-semibold text-slate-900 text-[12px] line-clamp-1">{inv.customerName}</span>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <span className="text-slate-600 text-[12px] line-clamp-1">{inv.brandName || "Reguler"}</span>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric value={inv.grandTotal} prefix="Rp " />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-right tabular-nums">
                      <span className={`text-[12px] font-semibold ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        Rp {remaining.toLocaleString("id-ID")}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <DnaBadge
                        variant={
                          inv.paymentStatus === "PAID"
                            ? "success"
                            : inv.paymentStatus === "PARTIAL"
                            ? "warning"
                            : "critical"
                        }
                      >
                        {inv.paymentStatus === "PAID"
                          ? "Lunas"
                          : inv.paymentStatus === "PARTIAL"
                          ? "Sebagian"
                          : "Belum Bayar"}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleGatekeeper(inv.id)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                          inv.arGatekeeperStatus === "RELEASED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                        }`}
                        title="Klik untuk ubah status tahan/lepas pengiriman DO"
                      >
                        DO {inv.arGatekeeperStatus}
                      </button>
                    </DnaTd>
                    <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        onClick={() => onSelectInvoice(inv)}
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
