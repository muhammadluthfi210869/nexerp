import React from "react";
import { DnaErrorState } from "@/components/dna";

export interface SalesApprovalErrorProps {
  isAccessDenied: boolean;
  onRetry: () => void;
}

export function SalesApprovalError({
  isAccessDenied,
  onRetry,
}: SalesApprovalErrorProps) {
  return (
    <div className="p-8">
      <DnaErrorState
        title={isAccessDenied ? "Akses ditolak" : "Gagal memuat data"}
        message={
          isAccessDenied
            ? "Akun ini tidak berwenang membaca daftar sales order."
            : "Daftar sales order tidak dapat diambil dari server."
        }
        onRetry={onRetry}
      />
    </div>
  );
}
