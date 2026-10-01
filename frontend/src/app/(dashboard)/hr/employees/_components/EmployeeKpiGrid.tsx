"use client";

import React from "react";
import { Users, Award, Wallet, ShieldAlert } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { EmployeeItem, EmployeeLoanItem } from "../_types/employee.types";

export function EmployeeKpiGrid({
  employees,
  loans,
}: {
  employees: EmployeeItem[];
  loans: EmployeeLoanItem[];
}) {
  const totalEmployees = employees.length;

  // Best performer based on KPI
  const sortedByKpi = [...employees].sort((a, b) => (b.kpi || 0) - (a.kpi || 0));
  const topPerformer = sortedByKpi[0];

  // Total active loans balance
  const activeLoans = loans.filter((l) => l.status === "ACTIVE");
  const totalRemainingLoan = activeLoans.reduce((sum, l) => sum + Number(l.remainingBalance || 0), 0);

  // Critical expiring contracts (< 60 days)
  const expiringCount = employees.filter((e) => {
    if (!e.contractEnd) return false;
    const diffDays = Math.ceil((new Date(e.contractEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 60;
  }).length;

  return (
    <DnaKpiGrid
      cards={[
        {
          key: "TOTAL",
          title: "TOTAL KARYAWAN AKTIF",
          value: totalEmployees.toString(),
          subtext: "Tersebar di 8 divisi operasional",
          icon: <Users className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "TOP_PERFORMER",
          title: "RANK 1 KARYAWAN TERBAIK",
          value: topPerformer ? topPerformer.name.split(" ")[0] : "-",
          subtext: topPerformer ? `KPI: ${topPerformer.kpi}/100 • ${topPerformer.position}` : "Belum ada evaluasi",
          icon: <Award className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "LOAN",
          title: "SISA KASBON BERJALAN",
          value: `Rp ${(totalRemainingLoan / 1_000_000).toFixed(1)} Jt`,
          subtext: `${activeLoans.length} pinjaman aktif dipotong gaji`,
          icon: <Wallet className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          key: "CONTRACT",
          title: "AUDIT PKWT SEGERA BERAKHIR",
          value: expiringCount.toString(),
          subtext: "Kontrak berakhir dalam <= 60 hari",
          icon: <ShieldAlert className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
      ]}
    />
  );
}
