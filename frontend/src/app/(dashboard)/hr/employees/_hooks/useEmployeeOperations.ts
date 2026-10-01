"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { EmployeeItem, EmployeeFormData, EmployeeLoanItem } from "../_types/employee.types";

export function useEmployeeOperations() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [loanModalEmployee, setLoanModalEmployee] = useState<EmployeeItem | null>(null);

  const { data: employees = [], isLoading, refetch } = useQuery<EmployeeItem[]>({
    queryKey: ["hr-employees"],
    queryFn: async () => {
      const [empRes, deptScoresRes] = await Promise.all([
        api.get("/hr/employees"),
        api.get("/hr/department-scores").catch(() => ({ data: [] })),
      ]);

      const rawList = Array.isArray(empRes.data) ? empRes.data : [];
      const deptScores = Array.isArray(deptScoresRes.data) ? deptScoresRes.data : [];

      // Enrich employee data with KPI if available
      return rawList.map((emp: any) => {
        let kpi = 85;
        let disiplin = 95;
        for (const dept of deptScores) {
          const match = dept.employees?.find((e: any) => e.id === emp.id || e.name === emp.name);
          if (match) {
            kpi = match.kpi ?? kpi;
            disiplin = match.disiplin ?? disiplin;
            break;
          }
        }
        return {
          ...emp,
          position: emp.roles?.[0]?.roleName || emp.position || "Staff Operasional",
          division: emp.roles?.[0]?.division || emp.division || "PRODUCTION",
          kpi,
          disiplin,
        };
      });
    },
  });

  const { data: loans = [] } = useQuery<EmployeeLoanItem[]>({
    queryKey: ["hr-employee-loans"],
    queryFn: async () => {
      const res = await api.get("/hr/loans").catch(() => ({ data: [] }));
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const saveEmployeeMutation = useMutation({
    mutationFn: async (formData: EmployeeFormData) => {
      const payload: any = {
        name: formData.name,
        nik: formData.nik || undefined,
        birthDate: formData.birthDate || undefined,
        gender: formData.gender || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        bpjsKesehatan: formData.bpjsKesehatan || undefined,
        bpjsKetenagakerjaan: formData.bpjsKetenagakerjaan || undefined,
        joinedAt: formData.joinedAt || new Date().toISOString(),
        contractEnd: formData.contractEnd || undefined,
        contractType: formData.contractType || "PKWT",
        baseSalary: formData.baseSalary ? formData.baseSalary : editingEmployee ? undefined : "0",
        positionAllowance: formData.positionAllowance ? formData.positionAllowance : editingEmployee ? undefined : "0",
        transportFlat: formData.transportFlat ? formData.transportFlat : editingEmployee ? undefined : "0",
        transportTentativeDaily: formData.transportTentativeDaily ? formData.transportTentativeDaily : editingEmployee ? undefined : "0",
        roles: [
          {
            division: formData.division || "PRODUCTION",
            roleName: formData.position || "Staff",
            weight: 100,
            isPrimary: true,
          },
        ],
      };

      if (editingEmployee) {
        const res = await api.patch(`/hr/employees/${editingEmployee.id}`, payload);
        return res.data;
      } else {
        const res = await api.post("/hr/employees", payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      toast.success(
        editingEmployee
          ? "Data karyawan & struktur kompensasi berhasil diperbarui!"
          : "Karyawan baru berhasil ditambahkan!"
      );
      setIsFormOpen(false);
      setEditingEmployee(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan data karyawan");
    },
  });

  const createLoanMutation = useMutation({
    mutationFn: async ({
      employeeId,
      totalAmount,
      monthlyDeduction,
      reason,
    }: {
      employeeId: string;
      totalAmount: number;
      monthlyDeduction: number;
      reason?: string;
    }) => {
      const res = await api.post("/hr/loans", {
        employeeId,
        totalAmount,
        monthlyDeduction,
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-employee-loans"] });
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      toast.success("Pengajuan kasbon/pinjaman berhasil dicatat dan akan dipotong saat payroll!");
      setLoanModalEmployee(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mencatat kasbon");
    },
  });

  const filteredEmployees = employees.filter((e) => {
    const matchesDiv =
      divisionFilter === "ALL" ? true : e.division === divisionFilter;
    const matchesSearch =
      searchQuery === "" ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.nik && e.nik.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.position && e.position.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDiv && matchesSearch;
  });

  return {
    employees: filteredEmployees,
    allEmployees: employees,
    loans,
    isLoading,
    refetch,
    searchQuery,
    setSearchQuery,
    divisionFilter,
    setDivisionFilter,
    isFormOpen,
    setIsFormOpen,
    editingEmployee,
    setEditingEmployee,
    loanModalEmployee,
    setLoanModalEmployee,
    saveEmployee: saveEmployeeMutation.mutate,
    isSaving: saveEmployeeMutation.isPending,
    createLoan: createLoanMutation.mutate,
    isCreatingLoan: createLoanMutation.isPending,
  };
}
