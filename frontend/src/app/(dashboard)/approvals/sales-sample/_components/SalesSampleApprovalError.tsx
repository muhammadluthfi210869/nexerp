import React from "react";
import { DnaErrorState } from "@/components/dna";

export interface SalesSampleApprovalErrorProps {
  isAccessDenied: boolean;
  errorMessage: string;
  onRetry: () => void;
}

export function SalesSampleApprovalError({
  isAccessDenied,
  errorMessage,
  onRetry,
}: SalesSampleApprovalErrorProps) {
  return (
    <div className="p-8">
      <DnaErrorState
        title={isAccessDenied ? "Akses ditolak" : "Gagal memuat data"}
        message={
          isAccessDenied
            ? "Anda tidak memiliki akses ke daftar penjualan sample."
            : errorMessage
        }
        onRetry={onRetry}
      />
    </div>
  );
}
