"use client";

import React, { Suspense } from "react";
import { ArrowDownLeft, Plus } from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaButton,
  KwitansiPrintModal,
} from "@/components/dna";
import { useCashInOperations } from "./_hooks/useCashInOperations";
import {
  CashInKpiCards,
  CashInTable,
  CashInFormModal,
  CashInDetailDrawer,
} from "./_components";

export default function CashInPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">Memuat Kas Masuk...</div>
      }
    >
      <CashInContent />
    </Suspense>
  );
}

function CashInContent() {
  const ops = useCashInOperations();

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Kas Bank Masuk"
        description="Pencatatan penerimaan kas operasional, setoran modal, dan penerimaan pelunasan piutang."
        actions={
          <DnaButton
            variant="primary"
            size="sm"
            onClick={() => ops.setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Catat Kas Masuk
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <CashInKpiCards
        totalKasMasuk={ops.totalKasMasuk}
        totalReconciled={ops.totalReconciled}
        totalUnreconciled={ops.totalUnreconciled}
      />

      {/* Main Table */}
      <CashInTable
        items={ops.filteredItems}
        totalKasMasuk={ops.totalKasMasuk}
        searchQuery={ops.searchQuery}
        setSearchQuery={ops.setSearchQuery}
        statusOptions={ops.statusOptions}
        selectedStatus={ops.selectedStatus}
        onSelectStatus={ops.setSelectedStatus}
        filterColumns={ops.filterColumns}
        selectedColumn={ops.selectedColumn}
        onSelectColumn={ops.setSelectedColumn}
        filterValue={ops.filterValue}
        onFilterValueChange={ops.setFilterValue}
        dateMode={ops.dateMode}
        onDateModeChange={ops.setDateMode}
        startDate={ops.startDate}
        onStartDateChange={ops.setStartDate}
        endDate={ops.endDate}
        onEndDateChange={ops.setEndDate}
        onResetAll={ops.handleResetAll}
        onSelectDetail={ops.setSelectedDetail}
        onPrintItem={ops.handlePrintItem}
      />

      {/* Create Modal */}
      <CashInFormModal
        isOpen={ops.isCreateModalOpen}
        onClose={() => ops.setIsCreateModalOpen(false)}
        formData={ops.formData}
        setFormData={ops.setFormData}
        onSave={ops.handleSave}
      />

      {/* Detail Drawer */}
      <CashInDetailDrawer
        selectedDetail={ops.selectedDetail}
        onClose={() => ops.setSelectedDetail(null)}
        onPrint={ops.handlePrintItem}
      />

      {/* Kwitansi Print Modal (LUNAS Stamp) */}
      <KwitansiPrintModal
        isOpen={ops.isPrintModalOpen}
        onClose={() => ops.setIsPrintModalOpen(false)}
        data={ops.printReceiptData}
      />
    </DnaPageContainer>
  );
}
