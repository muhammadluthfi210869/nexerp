"use client";

import React from "react";
import { Wallet, DollarSign, ShieldAlert, Bell, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { PayrollRecord } from "../_types/payroll.types";

export function PayrollKpiGrid({ activePayroll }: { activePayroll: PayrollRecord | null }) {
  if (!activePayroll) {
    return (
      <DnaKpiGrid
        cards={[
          {
            key: "EMPTY",
            title: "STATUS WORKBENCH",
            value: "BELUM GENERATE",
            subtext: "Klik 'Generate Payroll' untuk memproses periode berjalan",
            icon: <Wallet className="w-4 h-4" />,
            iconBg: "bg-slate-100",
            iconColor: "text-slate-600",
          },
        ]}
      />
    );
  }

  const netTotal = activePayroll.totalNet || 0;
  const grossTotal = activePayroll.totalGross || 0;
  const deductionsTotal = activePayroll.totalDeductions || 0;
  const employeeCount = activePayroll.totalEmployees || 0;

  return (
    <DnaKpiGrid
      cards={[
        {
          key: "NET",
          title: "TOTAL TAKE HOME PAY (NET)",
          value: `Rp ${(netTotal / 1_000_000).toFixed(2)} Jt`,
          subtext: `${employeeCount} karyawan terdaftar di periode ${activePayroll.periodName}`,
          icon: <Wallet className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "GROSS",
          title: "TOTAL UPAH KOTOR (GROSS)",
          value: `Rp ${(grossTotal / 1_000_000).toFixed(2)} Jt`,
          subtext: "Gaji pokok, tunjangan jabatan & lembur roaster",
          icon: <DollarSign className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "DEDUCTIONS",
          title: "TOTAL POTONGAN RESMI",
          value: `Rp ${(deductionsTotal / 1_000_000).toFixed(2)} Jt`,
          subtext: "BPJS Kes/TK, Kasbon & PPh 21 threshold UMR",
          icon: <ShieldAlert className="w-4 h-4" />,
          iconBg: "bg-rose-50",
          iconColor: "text-rose-600",
        },
        {
          key: "REMINDER",
          title: "REMINDER PELAPORAN GAJI",
          value: "TGL 25-28",
          subtext: "Batas rekonsiliasi transfer bank & pelaporan SPT",
          icon: <Bell className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
      ]}
    />
  );
}
