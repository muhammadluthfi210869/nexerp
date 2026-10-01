"use client";

import React from "react";
import { useFakturPembelianOperations } from "../_hooks/useFakturPembelianOperations";
import { ProcessInvoiceModal } from "./ProcessInvoiceModal";
import { InvoiceDetailDrawer } from "./InvoiceDetailDrawer";
import { InvoiceReasonModal } from "./InvoiceReasonModal";
import { InvoiceImportModal } from "./InvoiceImportModal";

interface InvoiceModalsProps {
  ops: ReturnType<typeof useFakturPembelianOperations>;
}

export function InvoiceModals({ ops }: InvoiceModalsProps) {
  return (
    <>
      <ProcessInvoiceModal
        isOpen={ops.isProcessModalOpen}
        onClose={() => ops.setIsProcessModalOpen(false)}
        selectedInbound={ops.selectedInbound}
        availableInbounds={ops.availableInbounds}
        onSelectInbound={ops.setSelectedInbound}
        isSubmitting={ops.processInvoiceMut.isPending}
        onSubmit={(payload) => ops.processInvoiceMut.mutate(payload)}
      />

      <InvoiceDetailDrawer
        selectedBill={ops.selectedBill}
        onClose={() => ops.setSelectedBill(null)}
        onOpenReasonModal={(b) => ops.setReasonModalBill(b)}
      />

      <InvoiceReasonModal
        reasonModalBill={ops.reasonModalBill}
        onClose={() => ops.setReasonModalBill(null)}
        newReasonText={ops.newReasonText}
        onReasonTextChange={ops.setNewReasonText}
        onSaveReason={() => {
          if (ops.reasonModalBill) {
            ops.updateReasonMut.mutate({ id: ops.reasonModalBill.id, unpaidReason: ops.newReasonText.trim() });
          }
        }}
      />

      <InvoiceImportModal
        isOpen={ops.isImportModalOpen}
        onClose={() => ops.setIsImportModalOpen(false)}
        onImport={(rows) => ops.importMut.mutate(rows)}
        isPending={ops.importMut.isPending}
      />
    </>
  );
}
