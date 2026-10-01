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
import { Edit2, CreditCard, ShieldCheck } from "lucide-react";
import { EmployeeItem, EmployeeLoanItem } from "../_types/employee.types";

interface EmployeeTableProps {
  employees: EmployeeItem[];
  loans: EmployeeLoanItem[];
  isLoading: boolean;
  onEdit: (employee: EmployeeItem) => void;
  onOpenLoanModal: (employee: EmployeeItem) => void;
}

export function EmployeeTable({
  employees,
  loans,
  isLoading,
  onEdit,
  onOpenLoanModal,
}: EmployeeTableProps) {
  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">
        Memuat data master personel & struktur upah...
      </div>
    );
  }

  // Calculate age helper
  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return null;
    const birth = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  };

  // Find active loan for employee
  const getEmployeeLoanInfo = (employeeId: string) => {
    const empLoans = loans.filter((l) => l.employeeId === employeeId && l.status === "ACTIVE");
    const totalRemaining = empLoans.reduce((sum, l) => sum + Number(l.remainingBalance || 0), 0);
    const monthlyTotal = empLoans.reduce((sum, l) => sum + Number(l.monthlyDeduction || 0), 0);
    return {
      hasLoan: empLoans.length > 0,
      totalRemaining,
      monthlyTotal,
    };
  };

  return (
    <DnaTable className="w-full">
      <DnaTableHead>
        <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 tracking-wider">
          <DnaTh className="p-3 w-10 text-center text-slate-400">#</DnaTh>
          <DnaTh className="p-3 w-28">TANGGAL MASUK</DnaTh>
          <DnaTh className="p-3 w-48">IDENTITAS & JABATAN</DnaTh>
          <DnaTh className="p-3 w-52">DATA PRIBADI & BPJS</DnaTh>
          <DnaTh className="p-3 w-36">KONTRAK PKWT</DnaTh>
          <DnaTh className="p-3 w-44">UPAH TETAP</DnaTh>
          <DnaTh className="p-3 w-40">TRANSPORTASI</DnaTh>
          <DnaTh className="p-3 w-44">KASBON / LOAN</DnaTh>
          <DnaTh className="p-3 w-28 text-center">SKOR KPI</DnaTh>
          <DnaTh className="p-3 w-28 text-right">AKSI</DnaTh>
        </DnaTableRow>
      </DnaTableHead>
      <DnaTableBody>
        {employees.length === 0 ? (
          <DnaTableRow>
            <DnaTd colSpan={10} className="p-12 text-center text-slate-400 font-medium">
              Tidak ada data pegawai yang sesuai dengan filter pencarian.
            </DnaTd>
          </DnaTableRow>
        ) : (
          employees.map((emp, idx) => {
            const joinFormatted = emp.joinedAt
              ? new Date(emp.joinedAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";

            const birthFormatted = emp.birthDate
              ? new Date(emp.birthDate).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";

            const age = calculateAge(emp.birthDate);

            // Contract remaining days
            let contractRemainingDays: number | null = null;
            if (emp.contractEnd) {
              const diffMs = new Date(emp.contractEnd).getTime() - Date.now();
              contractRemainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            }

            const isContractCritical =
              typeof contractRemainingDays === "number" && contractRemainingDays <= 60 && contractRemainingDays > 0;

            const loanInfo = getEmployeeLoanInfo(emp.id);

            // Upah tetap
            const baseSalaryNum = parseFloat(emp.baseSalary || "0") || 0;
            const allowanceNum = parseFloat(emp.positionAllowance || "0") || 0;
            const transportFlatNum = parseFloat(emp.transportFlat || "0") || 0;
            const transportDailyNum = parseFloat(emp.transportTentativeDaily || "0") || 0;

            return (
              <DnaTableRow key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Col 1: # */}
                <DnaTd className="p-3 text-center text-slate-400 tabular-nums text-xs">
                  {idx + 1}
                </DnaTd>

                {/* Col 2: Tanggal Masuk */}
                <DnaTd className="p-3 tabular-nums text-xs font-semibold text-slate-700">
                  {joinFormatted}
                </DnaTd>

                {/* Col 3: Identitas & Jabatan */}
                <DnaTd className="p-3">
                  <div className="font-bold text-slate-900 text-xs">{emp.name}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {emp.position || "Staff"} • {emp.division || "PRODUCTION"}
                  </div>
                  {emp.nik && <div className="text-[10px] text-slate-400 font-mono">NIK: {emp.nik}</div>}
                </DnaTd>

                {/* Col 4: Data Pribadi & BPJS */}
                <DnaTd className="p-3">
                  <div className="text-xs text-slate-700">
                    Lahir: {birthFormatted} {age ? `(${age} thn)` : ""}
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5 space-y-0.5">
                    <div>
                      BPJS Kes:{" "}
                      <span className="font-mono text-slate-700 font-semibold">
                        {emp.bpjsKesehatan || "-"}
                      </span>
                    </div>
                    <div>
                      BPJS TK:{" "}
                      <span className="font-mono text-slate-700 font-semibold">
                        {emp.bpjsKetenagakerjaan || "-"}
                      </span>
                    </div>
                  </div>
                </DnaTd>

                {/* Col 5: Kontrak PKWT */}
                <DnaTd className="p-3">
                  <DnaBadge
                    variant={
                      emp.contractType === "PKWTT" || emp.contractType === "TETAP"
                        ? "success"
                        : "purple"
                    }
                  >
                    {emp.contractType || "PKWT"}
                  </DnaBadge>
                  {typeof contractRemainingDays === "number" && (
                    <div
                      className={`text-[10px] font-bold mt-1 ${
                        isContractCritical ? "text-rose-600 font-black" : "text-slate-500"
                      }`}
                    >
                      Sisa {Math.max(0, contractRemainingDays)} hari
                    </div>
                  )}
                </DnaTd>

                {/* Col 6: Upah Tetap */}
                <DnaTd className="p-3">
                  <div className="text-xs font-bold text-slate-800">
                    Rp {baseSalaryNum > 0 ? (baseSalaryNum / 1_000_000).toFixed(2) + " Jt" : "0"}
                  </div>
                  <div className="text-[10.5px] text-slate-500">
                    Tunj. Jabatan: Rp{" "}
                    {allowanceNum > 0 ? (allowanceNum / 1_000_000).toFixed(2) + " Jt" : "0"}
                  </div>
                </DnaTd>

                {/* Col 7: Transportasi 2 Kolom */}
                <DnaTd className="p-3">
                  <div className="text-xs font-semibold text-slate-700">
                    Flat: Rp {transportFlatNum.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10.5px] text-slate-500">
                    Tentatif: Rp {transportDailyNum.toLocaleString("id-ID")}/hari
                  </div>
                </DnaTd>

                {/* Col 8: Kasbon / Loan */}
                <DnaTd className="p-3">
                  {loanInfo.hasLoan ? (
                    <div>
                      <div className="text-xs font-bold text-rose-600">
                        Sisa: Rp {(loanInfo.totalRemaining / 1_000_000).toFixed(2)} Jt
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Potong: Rp {loanInfo.monthlyTotal.toLocaleString("id-ID")}/bln
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Tidak ada kasbon</span>
                  )}
                </DnaTd>

                {/* Col 9: Skor KPI */}
                <DnaTd className="p-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      (emp.kpi || 0) >= 85
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : (emp.kpi || 0) >= 70
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {emp.kpi || 80}/100
                  </span>
                </DnaTd>

                {/* Col 10: Aksi & Maintenance */}
                <DnaTd className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-purple-600 rounded"
                      onClick={() => onOpenLoanModal(emp)}
                      title="Ajukan / Catat Kasbon"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                    </DnaButton>
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 rounded"
                      onClick={() => onEdit(emp)}
                      title="Edit Data & Kompensasi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </DnaButton>
                  </div>
                </DnaTd>
              </DnaTableRow>
            );
          })
        )}
      </DnaTableBody>
    </DnaTable>
  );
}
