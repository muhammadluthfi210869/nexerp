"use client";

import React from "react";
import {
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
} from "@/components/dna";
import { UserPlus } from "lucide-react";
import { useEmployeeOperations } from "../_hooks/useEmployeeOperations";
import { EmployeeKpiGrid } from "./EmployeeKpiGrid";
import { EmployeeTable } from "./EmployeeTable";
import { EmployeeFormModal } from "./EmployeeFormModal";
import { EmployeeLoanModal } from "./EmployeeLoanModal";

export function EmployeeView() {
  const {
    employees,
    allEmployees,
    loans,
    isLoading,
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
    saveEmployee,
    isSaving,
    createLoan,
    isCreatingLoan,
  } = useEmployeeOperations();

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* 01. MODULAR PAGE HEADER */}
      <DnaPageHeader
        backHref="/hr/dashboard"
        backText="Kembali ke Dashboard HR"
        title="DATA PEGAWAI & KOMPENSASI"
        subtitle="Master Biodata, Kontrak PKWT, Upah Tetap, Transportasi 2 Kolom, BPJS & Kasbon"
        action={
          <DnaButton
            onClick={() => {
              setEditingEmployee(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 font-bold"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pegawai
          </DnaButton>
        }
      />

      {/* Tabs Filter Divisi */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { key: "ALL", label: "Semua Divisi", count: allEmployees.length },
          { key: "PRODUCTION", label: "Produksi", count: allEmployees.filter((e) => e.division === "PRODUCTION").length },
          { key: "QC", label: "Quality Control", count: allEmployees.filter((e) => e.division === "QC").length },
          { key: "WAREHOUSE", label: "Warehouse", count: allEmployees.filter((e) => e.division === "WAREHOUSE").length },
          { key: "BD", label: "Sales / BD", count: allEmployees.filter((e) => e.division === "BD").length },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              divisionFilter === t.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
            onClick={() => setDivisionFilter(t.key)}
          >
            <span>{t.label}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] tabular-nums font-black ${
              divisionFilter === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 02. METRIC CARDS */}
      <EmployeeKpiGrid employees={allEmployees} loans={loans} />

      {/* 03. EMPLOYEES DATA TABLE */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari pegawai berdasarkan nama, NIK, jabatan...",
          filterColumns: [],
          selectedColumn: "",
          onSelectColumn: () => {},
          filterValue: "ALL",
          onFilterValueChange: () => {},
        }}
      >
        <EmployeeTable
          employees={employees}
          loans={loans}
          isLoading={isLoading}
          onEdit={(emp) => {
            setEditingEmployee(emp);
            setIsFormOpen(true);
          }}
          onOpenLoanModal={(emp) => setLoanModalEmployee(emp)}
        />
      </DnaDataTableCard>

      {/* 04. FLOATING MODALS */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={saveEmployee}
        isSubmitting={isSaving}
        editingEmployee={editingEmployee}
      />

      <EmployeeLoanModal
        isOpen={!!loanModalEmployee}
        onClose={() => setLoanModalEmployee(null)}
        onSubmit={createLoan}
        isSubmitting={isCreatingLoan}
        employee={loanModalEmployee}
      />
    </div>
  );
}
