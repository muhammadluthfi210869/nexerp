import React from "react";
import { DnaErrorState } from "@/components/dna";

export interface SalesReturnApprovalErrorProps {
  isAccessDenied: boolean;
  onRetry: () => void;
}

export function SalesReturnApprovalError({
  isAccessDenied,
  onRetry,
}: SalesReturnApprovalErrorProps) {
  return (
    <div className="p-8">
      <DnaErrorState
        title={isAccessDenied ? "Akses ditolak" : "Gagal memuat data"}
        message={
          isAccessDenied
            ? "Akun ini tidak berwenang membaca daftar retur penjualan."
            : "Daftar retur penjualan tidak dapat diambil dari server."
        }
        onRetry={onRetry}
      />
    </div>
  );
}
