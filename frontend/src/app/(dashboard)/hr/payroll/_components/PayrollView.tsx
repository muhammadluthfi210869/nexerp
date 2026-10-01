"use client";

import React from "react";
import {
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
  DnaSelect,
} from "@/components/dna";
import { Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { usePayrollOperations } from "../_hooks/usePayrollOperations";
import { PayrollKpiGrid } from "./PayrollKpiGrid";
import { PayrollTable } from "./PayrollTable";
import { SalarySlipModal } from "./SalarySlipModal";
import { GeneratePayrollModal } from "./GeneratePayrollModal";

export function PayrollView() {
  const {
    payrolls,
    activePayroll,
    items,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedPayrollId,
    setSelectedPayrollId,
    isGenerateModalOpen,
    setIsGenerateModalOpen,
    slipModalItem,
    setSlipModalItem,
    generatePayroll,
    isGenerating,
    authorizePayroll,
    isAuthorizing,
  } = usePayrollOperations();

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* 01. MODULAR PAGE HEADER */}
      <DnaPageHeader
        backHref="/hr/dashboard"
        backText="Kembali ke Dashboard HR"
        title="PAYROLL & SLIP GAJI WORKBENCH"
        subtitle="Rincian Kompensasi, Lembur Roaster, Potongan Kasbon, Threshold Pajak PPh 21 & Cetak Slip Gaji"
        action={
          <DnaButton
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-1.5 font-bold"
          >
            <Wallet className="w-4 h-4" />
            Generate Payroll
          </DnaButton>
        }
      />

      {/* Period Selector & Authorize Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Pilih Periode Payroll:</span>
          {payrolls.length > 0 ? (
            <DnaSelect
              value={selectedPayrollId || activePayroll?.id || ""}
              onChange={(val) => setSelectedPayrollId(val)}
              className="w-64"
            >
              {payrolls.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.periodName} ({p.status} - {p.totalEmployees} Pegawai)
                </option>
              ))}
            </DnaSelect>
          ) : (
            <span className="text-xs text-slate-400 italic">Belum ada data payroll yang digenerate</span>
          )}
        </div>

        {activePayroll && activePayroll.status === "DRAFT" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Status DRAFT
            </span>
            <DnaButton
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => authorizePayroll(activePayroll.id)}
              disabled={isAuthorizing}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {isAuthorizing ? "Mengotorisasi..." : "Otorisasi & Finalkan Payroll"}
            </DnaButton>
          </div>
        )}
      </div>

      {/* 02. METRIC CARDS */}
      <PayrollKpiGrid activePayroll={activePayroll} />

      {/* 03. PAYROLL ITEMS TABLE */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari rincian gaji pegawai...",
          filterColumns: [],
          selectedColumn: "",
          onSelectColumn: () => {},
          filterValue: "ALL",
          onFilterValueChange: () => {},
        }}
      >
        <PayrollTable
          items={items}
          activePayroll={activePayroll}
          isLoading={isLoading}
          onOpenSlip={(item) => setSlipModalItem(item)}
        />
      </DnaDataTableCard>

      {/* 04. FLOATING MODALS */}
      <GeneratePayrollModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSubmit={generatePayroll}
        isSubmitting={isGenerating}
      />

      <SalarySlipModal
        isOpen={!!slipModalItem}
        onClose={() => setSlipModalItem(null)}
        item={slipModalItem}
        activePayroll={activePayroll}
      />
    </div>
  );
}
