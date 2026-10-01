import React from "react";
import { DnaErrorState } from "@/components/dna";

export interface PurchaseReturnApprovalErrorProps {
  isAccessDenied: boolean;
  onRetry: () => void;
}

export function PurchaseReturnApprovalError({
  isAccessDenied,
  onRetry,
}: PurchaseReturnApprovalErrorProps) {
  return (
    <div className="p-8">
      <DnaErrorState
        title={isAccessDenied ? "Akses ditolak" : "Gagal memuat data"}
        message={
          isAccessDenied
            ? "Akun ini tidak berwenang membaca daftar retur pembelian."
            : "Daftar retur pembelian tidak dapat diambil dari server."
        }
        onRetry={onRetry}
      />
    </div>
  );
}
