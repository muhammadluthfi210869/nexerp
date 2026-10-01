import React from "react";
import { Search, CircleDollarSign, FileCheck2 } from "lucide-react";
import {
  DnaInput,
  DnaButton,
  DnaBadge,
  DnaDataTableCard,
  DnaTable,
  DnaTableBody,
  DnaTd,
  DnaTh,
  DnaTableHead,
  DnaTableRow,
} from "@/components/dna";
import { SamplePayment } from "../_types/bayar-sample.types";

interface BayarSampleTableProps {
  samples: SamplePayment[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onPay: (sample: SamplePayment) => void;
}

export function BayarSampleTable({
  samples,
  searchTerm,
  onSearchChange,
  onPay,
}: BayarSampleTableProps) {
  return (
    <DnaDataTableCard
      customToolbar={
        <div className="relative w-full max-w-md">
          <DnaInput
            icon={<Search className="h-4 w-4" />}
            placeholder="Cari kode sample atau customer..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      }
    >
      <DnaTable className="table-dense">
        <DnaTableHead className="bg-slate-50/70">
          <DnaTableRow className="hover:bg-transparent border-slate-100">
            <DnaTh className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
              Kode Sample
            </DnaTh>
            <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
              Customer
            </DnaTh>
            <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
              Total
            </DnaTh>
            <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
              Sudah Bayar
            </DnaTh>
            <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
              Sisa
            </DnaTh>
            <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">
              Status Bayar
            </DnaTh>
            <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
              Aksi
            </DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {samples.map((sample) => (
            <DnaTableRow
              key={sample.id}
              className="group hover:bg-emerald-50/30 transition-all duration-300 border-b border-slate-50"
            >
              <DnaTd className="pl-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">
                    {sample.code}
                  </span>
                </div>
              </DnaTd>
              <DnaTd className="py-4">
                <p className="font-black text-slate-900 text-xs uppercase italic">
                  {sample.customerName}
                </p>
              </DnaTd>
              <DnaTd className="text-right tabular-nums py-4 font-semibold text-slate-900 text-xs">
                Rp {sample.totalAmount.toLocaleString("id-ID")}
              </DnaTd>
              <DnaTd className="text-right tabular-nums py-4 font-semibold text-emerald-600 text-xs">
                Rp {sample.paidAmount.toLocaleString("id-ID")}
              </DnaTd>
              <DnaTd className="text-right tabular-nums py-4 font-semibold text-rose-600 text-xs">
                Rp {sample.remainingAmount.toLocaleString("id-ID")}
              </DnaTd>
              <DnaTd className="text-center py-4">
                <DnaBadge
                  variant={
                    sample.paymentStatus === "PAID"
                      ? "success"
                      : sample.paymentStatus === "PARTIAL"
                        ? "warning"
                        : "critical"
                  }
                >
                  {sample.paymentStatus === "PAID"
                    ? "Lunas"
                    : sample.paymentStatus === "PARTIAL"
                      ? "Partial"
                      : "Belum Bayar"}
                </DnaBadge>
              </DnaTd>
              <DnaTd className="pr-6 text-right py-4">
                {sample.remainingAmount > 0 && (
                  <DnaButton
                    onClick={() => onPay(sample)}
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-[8px]"
                    icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                  >
                    Bayar
                  </DnaButton>
                )}
              </DnaTd>
            </DnaTableRow>
          ))}
          {samples.length === 0 && (
            <DnaTableRow>
              <DnaTd
                colSpan={7}
                className="text-center py-10 text-slate-400 italic"
              >
                Tidak ada sample payment ditemukan.
              </DnaTd>
            </DnaTableRow>
          )}
        </DnaTableBody>
      </DnaTable>
    </DnaDataTableCard>
  );
}
