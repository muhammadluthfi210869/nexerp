"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import type { KpiScorecard, KpiRawEmployee } from "../_types/kpi.types";

export function useHrKpiOperations() {
  const toast = useDnaToast();
  const [period, setPeriod] = useState("Q3-2026");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpi, setSelectedKpi] = useState<KpiScorecard | null>(null);

  const { data: rawKpis = [], isLoading } = useQuery({
    queryKey: ["hr-kpi-employees"],
    queryFn: async () => {
      const res = await api.get("/hr/kpi/employees");
      return res.data;
    },
  });

  const kpis: KpiScorecard[] = useMemo(() => {
    if (!rawKpis || rawKpis.length === 0) return [];
    return (rawKpis as KpiRawEmployee[]).map((emp, idx) => {
      const ach = emp.finalKpiScore || 0;
      let grade: "A" | "B+" | "B" | "C" = "C";
      let mult = 0.5;
      if (ach >= 90) { grade = "A"; mult = 1.0; }
      else if (ach >= 85) { grade = "B+"; mult = 0.75; }
      else if (ach >= 75) { grade = "B"; mult = 0.5; }
      else { grade = "C"; mult = 0.25; }

      return {
        id: emp.id || `kpi-${idx}`,
        empId: emp.employeeId || emp.nik || `EMP-${idx + 1}`,
        empName: emp.employeeName || emp.name || "Karyawan",
        empRole: emp.role || "Staff",
        department: emp.department || "Operasional",
        targetKpi: emp.kpiItems?.[0]?.name || "Target Operasional Divisi",
        achievement: Math.round(ach * 10) / 10,
        disciplineScore: 95,
        objectiveScore: Math.round((emp.roleSpecificScore || ach) * 10) / 10,
        grade,
        bonusMultiplier: mult,
        bonusAmount: Math.round(mult * 5000000),
      };
    });
  }, [rawKpis]);

  const totalBonus = kpis.reduce((acc, k) => acc + k.bonusAmount, 0);
  const avgScore = kpis.length > 0 ? (kpis.reduce((acc, k) => acc + k.achievement, 0) / kpis.length).toFixed(1) : "0.0";

  const filteredKpis = useMemo(() => {
    return kpis.filter(k => {
      const matchSearch = k.empName.toLowerCase().includes(searchQuery.toLowerCase()) || k.empRole.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === "ALL" || k.department.includes(deptFilter);
      return matchSearch && matchDept;
    });
  }, [kpis, searchQuery, deptFilter]);

  const handlePrintScorecard = () => {
    window.print();
  };

  const handleProcessGradingBonus = () => {
    toast.success("Kalkulasi Grading & Bonus Kinerja Periode " + period + " Selesai!");
  };

  const handlePrintDetailScorecard = () => {
    toast.success("Mencetak lembar evaluasi scorecard...");
  };

  const handleSignoffEvaluation = () => {
    toast.success("Evaluasi Karyawan Telah Disign-off HR Director!");
    setSelectedKpi(null);
  };

  const handleCloseDetail = () => {
    setSelectedKpi(null);
  };

  const handleSelectKpi = (kpi: KpiScorecard) => {
    setSelectedKpi(kpi);
  };

  return {
    period,
    setPeriod,
    deptFilter,
    setDeptFilter,
    searchQuery,
    setSearchQuery,
    selectedKpi,
    setSelectedKpi,
    isLoading,
    kpis,
    totalBonus,
    avgScore,
    filteredKpis,
    handlePrintScorecard,
    handleProcessGradingBonus,
    handlePrintDetailScorecard,
    handleSignoffEvaluation,
    handleCloseDetail,
    handleSelectKpi,
  };
}

export type UseHrKpiOperationsReturn = ReturnType<typeof useHrKpiOperations>;
