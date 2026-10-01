"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PayrollItemRecord, PayrollRecord } from "../_types/payroll.types";

export function usePayrollOperations() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayrollId, setSelectedPayrollId] = useState<string>("");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [slipModalItem, setSlipModalItem] = useState<PayrollItemRecord | null>(null);

  // Fetch all payroll runs
  const { data: payrolls = [], isLoading: isLoadingPayrolls } = useQuery<PayrollRecord[]>({
    queryKey: ["hr-payrolls"],
    queryFn: async () => {
      const res = await api.get("/hr/payrolls").catch(() => ({ data: [] }));
      const list = Array.isArray(res.data) ? res.data : [];
      return list.map((p: any) => ({
        id: p.id,
        periodName: p.period?.name || "Periode Berjalan",
        startDate: p.period?.startDate || new Date().toISOString(),
        endDate: p.period?.endDate || new Date().toISOString(),
        status: p.status || "DRAFT",
        totalEmployees: p.items?.length || 0,
        totalGross: (p.items || []).reduce((sum: number, it: any) => sum + Number(it.grossIncome || 0), 0),
        totalDeductions: (p.items || []).reduce((sum: number, it: any) => sum + Number(it.totalDeductions || 0), 0),
        totalNet: (p.items || []).reduce((sum: number, it: any) => sum + Number(it.netSalary || 0), 0),
        items: (p.items || []).map((it: any) => ({
          id: it.id,
          payrollId: p.id,
          employeeId: it.employeeId,
          employeeName: it.employee?.name || "Karyawan",
          employeePosition: it.employee?.roles?.[0]?.roleName || "Staff Operasional",
          department: it.employee?.roles?.[0]?.division || "PRODUCTION",
          baseSalary: Number(it.baseSalary || 0),
          positionAllowance: Number(it.positionAllowance || 0),
          transportFlat: Number(it.transportFlat || 0),
          transportTentative: Number(it.transportTentative || 0),
          overtimePay: Number(it.overtimePay || 0),
          kpiIncentive: Number(it.kpiIncentive || 0),
          grossIncome: Number(it.grossIncome || 0),
          bpjsHealth: Number(it.bpjsHealth || 0),
          bpjsEmployment: Number(it.bpjsEmployment || 0),
          loanDeduction: Number(it.loanDeduction || 0),
          remainingLoan: Number(it.remainingLoan || 0),
          pph21: Number(it.pph21 || 0),
          totalDeductions: Number(it.totalDeductions || 0),
          netSalary: Number(it.netSalary || 0),
        })),
      }));
    },
  });

  // Current active payroll
  const activePayroll = payrolls.find((p) => p.id === selectedPayrollId) || payrolls[0] || null;

  // Active items
  const items: PayrollItemRecord[] = activePayroll ? activePayroll.items : [];

  const filteredItems = items.filter((it) => {
    return (
      searchQuery === "" ||
      it.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (it.employeePosition && it.employeePosition.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (it.department && it.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const generateMutation = useMutation({
    mutationFn: async (period: string) => {
      const res = await api.post("/hr/payroll/generate", { period });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-payrolls"] });
      toast.success("Draft Payroll berhasil digenerate berdasarkan kehadiran dan formula PPh 21!");
      setIsGenerateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal meng-generate payroll");
    },
  });

  const authorizeMutation = useMutation({
    mutationFn: async (payrollId: string) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await api.post(`/hr/payroll/authorize/${payrollId}`, {
        authorizedById: user.id || "admin",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-payrolls"] });
      toast.success("Payroll berhasil diotorisasi untuk pencairan rekening!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengotorisasi payroll");
    },
  });

  return {
    payrolls,
    activePayroll,
    items: filteredItems,
    isLoading: isLoadingPayrolls,
    searchQuery,
    setSearchQuery,
    selectedPayrollId,
    setSelectedPayrollId,
    isGenerateModalOpen,
    setIsGenerateModalOpen,
    slipModalItem,
    setSlipModalItem,
    generatePayroll: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    authorizePayroll: authorizeMutation.mutate,
    isAuthorizing: authorizeMutation.isPending,
  };
}
