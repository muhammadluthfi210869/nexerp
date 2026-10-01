"use client";

import React from "react";
import {
  DnaTable,
  DnaTableHead,
  DnaTableRow,
  DnaTh,
  DnaTableBody,
  DnaTd,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import { FileText, Printer, AlertCircle } from "lucide-react";
import { PayrollItemRecord, PayrollRecord } from "../_types/payroll.types";

interface PayrollTableProps {
  items: PayrollItemRecord[];
  activePayroll: PayrollRecord | null;
  isLoading: boolean;
  onOpenSlip: (item: PayrollItemRecord) => void;
}

export function PayrollTable({
  items,
  activePayroll,
  isLoading,
  onOpenSlip,
}: PayrollTableProps) {
  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">
        Menghitung rincian payroll, potongan kasbon & PPh 21...
      </div>
    );
  }

  const periodDate = activePayroll?.startDate
    ? new Date(activePayroll.startDate).toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      })
    : "-";

  return (
    <DnaTable className="w-full">
      <DnaTableHead>
        <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 tracking-wider">
          <DnaTh className="p-3 w-10 text-center text-slate-400">#</DnaTh>
          <DnaTh className="p-3 w-28">PERIODE</DnaTh>
          <DnaTh className="p-3 w-48">NAMA PEGAWAI & JABATAN</DnaTh>
          <DnaTh className="p-3 w-40">UPAH TETAP</DnaTh>
          <DnaTh className="p-3 w-44">TUNJANGAN & LEMBUR</DnaTh>
          <DnaTh className="p-3 w-40">POTONGAN KASBON</DnaTh>
          <DnaTh className="p-3 w-36">BPJS KES + TK</DnaTh>
          <DnaTh className="p-3 w-40 text-center">PPH 21 (UMR)</DnaTh>
          <DnaTh className="p-3 w-40 text-right">TAKE HOME PAY</DnaTh>
          <DnaTh className="p-3 w-24 text-right">SLIP GAJI</DnaTh>
        </DnaTableRow>
      </DnaTableHead>
      <DnaTableBody>
        {items.length === 0 ? (
          <DnaTableRow>
            <DnaTd colSpan={10} className="p-12 text-center text-slate-400 font-medium">
              Tidak ada rincian gaji pada periode ini. Silakan generate draft payroll terlebih dahulu.
            </DnaTd>
          </DnaTableRow>
        ) : (
          items.map((it, idx) => {
            const fixedWages = it.baseSalary + it.positionAllowance;
            const allowancesAndOvertime = it.transportFlat + it.transportTentative + it.overtimePay + it.kpiIncentive;
            const bpjsTotal = it.bpjsHealth + it.bpjsEmployment;
            const isAboveUmr = it.grossIncome > 5000000;

            return (
              <DnaTableRow
                key={it.id}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                onClick={() => onOpenSlip(it)}
              >
                {/* Col 1: # */}
                <DnaTd className="p-3 text-center text-slate-400 tabular-nums text-xs">
                  {idx + 1}
                </DnaTd>

                {/* Col 2: Tanggal Periode */}
                <DnaTd className="p-3 tabular-nums text-xs font-semibold text-slate-700">
                  {periodDate}
                </DnaTd>

                {/* Col 3: Nama Pegawai & Jabatan */}
                <DnaTd className="p-3">
                  <div className="font-bold text-slate-900 text-xs">{it.employeeName}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {it.employeePosition} • {it.department}
                  </div>
                </DnaTd>

                {/* Col 4: Upah Tetap */}
                <DnaTd className="p-3">
                  <div className="text-xs font-bold text-slate-800">
                    Rp {fixedWages.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Pokok: {it.baseSalary.toLocaleString("id-ID")}
                  </div>
                </DnaTd>

                {/* Col 5: Tunjangan & Lembur */}
                <DnaTd className="p-3">
                  <div className="text-xs font-semibold text-slate-700">
                    Rp {allowancesAndOvertime.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Lembur: Rp {it.overtimePay.toLocaleString("id-ID")}
                  </div>
                </DnaTd>

                {/* Col 6: Potongan Kasbon */}
                <DnaTd className="p-3">
                  {it.loanDeduction > 0 ? (
                    <div>
                      <div className="text-xs font-bold text-rose-600">
                        - Rp {it.loanDeduction.toLocaleString("id-ID")}
                      </div>
                      {typeof it.remainingLoan === "number" && (
                        <div className="text-[10px] text-slate-500 font-medium">
                          Sisa: Rp {it.remainingLoan.toLocaleString("id-ID")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">-</span>
                  )}
                </DnaTd>

                {/* Col 7: BPJS Kes + TK */}
                <DnaTd className="p-3">
                  <div className="text-xs font-semibold text-slate-700">
                    - Rp {bpjsTotal.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Kes: {it.bpjsHealth.toLocaleString("id-ID")} | TK: {it.bpjsEmployment.toLocaleString("id-ID")}
                  </div>
                </DnaTd>

                {/* Col 8: PPh 21 */}
                <DnaTd className="p-3 text-center">
                  {isAboveUmr ? (
                    <div>
                      <DnaBadge variant="warning">
                        POTONG 5%
                      </DnaBadge>
                      <div className="text-[10px] font-bold text-amber-700 mt-0.5">
                        - Rp {it.pph21.toLocaleString("id-ID")}
                      </div>
                    </div>
                  ) : (
                    <DnaBadge variant="success">
                      BEBAS (≤ UMR)
                    </DnaBadge>
                  )}
                </DnaTd>

                {/* Col 9: Take Home Pay */}
                <DnaTd className="p-3 text-right">
                  <div className="text-xs font-black text-emerald-700">
                    Rp {it.netSalary.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Gross: Rp {it.grossIncome.toLocaleString("id-ID")}
                  </div>
                </DnaTd>

                {/* Col 10: Slip Gaji */}
                <DnaTd className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <DnaButton
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] font-bold flex items-center gap-1.5"
                    onClick={() => onOpenSlip(it)}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Slip Gaji
                  </DnaButton>
                </DnaTd>
              </DnaTableRow>
            );
          })
        )}
      </DnaTableBody>
    </DnaTable>
  );
}
