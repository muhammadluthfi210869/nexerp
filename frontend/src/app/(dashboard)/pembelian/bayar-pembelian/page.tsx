"use client";

import React, { Suspense } from "react";
import { FileSpreadsheet } from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaButton,
  DnaBadge,
} from "@/components/dna";
import {
  PaymentBankOverview,
  PaymentKpiCards,
  PaymentTable,
  PaymentDetailDrawer,
} from "./_components";
import { useBayarPembelianOperations } from "./_hooks/useBayarPembelianOperations";

function BayarPembelianContent() {
  const ops = useBayarPembelianOperations();

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pembayaran Tagihan Pembelian (AP Settlement)"
        description="Pelunasan faktur vendor terverifikasi 3-Way Match dengan real-time liquid cash validator."
        badge={<DnaBadge variant="neutral">FIN-AP-PAY</DnaBadge>}
        actions={
          <DnaButton
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={ops.handleExportExcel}
          >
            Export Excel
          </DnaButton>
        }
      />

      <PaymentBankOverview
        bankBalances={ops.bankBalances}
        totalLiquidCash={ops.totalLiquidCash}
      />

      <PaymentKpiCards kpis={ops.kpis} />

      <PaymentTable
        isLoading={ops.isLoading}
        isError={ops.isError}
        refetch={ops.refetch}
        searchQuery={ops.searchQuery}
        onSearchChange={ops.setSearchQuery}
        filteredList={ops.filteredList}
        onOpenPayDrawer={ops.handleOpenPayDrawer}
      />

      <PaymentDetailDrawer
        selectedBill={ops.selectedBill}
        onClose={ops.handleClosePayDrawer}
        bankBalances={ops.bankBalances}
        paymentDate={ops.paymentDate}
        setPaymentDate={ops.setPaymentDate}
        selectedAccountCode={ops.selectedAccountCode}
        setSelectedAccountCode={ops.setSelectedAccountCode}
        payAmount={ops.payAmount}
        setPayAmount={ops.setPayAmount}
        useDebitNote={ops.useDebitNote}
        setUseDebitNote={ops.setUseDebitNote}
        refNumber={ops.refNumber}
        setRefNumber={ops.setRefNumber}
        paymentNotes={ops.paymentNotes}
        setPaymentNotes={ops.setPaymentNotes}
        onProcessPayment={ops.handleProcessPayment}
      />
    </DnaPageContainer>
  );
}

export default function BayarPembelianPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Bayar Pembelian...</div>}>
      <BayarPembelianContent />
    </Suspense>
  );
}
