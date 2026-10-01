import React from "react";
import { DnaErrorState } from "@/components/dna";

interface PurchaseRequestApprovalErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

export function PurchaseRequestApprovalErrorState({
  error,
  onRetry,
}: PurchaseRequestApprovalErrorStateProps) {
  const errStatus = (error as { response?: { status?: number } })?.response?.status;
  const denied = errStatus === 401 || errStatus === 403;

  return (
    <div className="p-8">
      <DnaErrorState
        title={denied ? "Akses ditolak" : "Gagal memuat data"}
        message={
          denied
            ? "Akun ini tidak berwenang membaca daftar permintaan pembelian."
            : "Daftar permintaan pembelian tidak dapat diambil dari server."
        }
        onRetry={onRetry}
      />
    </div>
  );
}
