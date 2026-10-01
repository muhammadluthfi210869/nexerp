import React from "react";
import { DnaErrorState } from "@/components/dna";

interface PurchaseApprovalErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

export function PurchaseApprovalErrorState({
  error,
  onRetry,
}: PurchaseApprovalErrorStateProps) {
  const errStatus = (error as { response?: { status?: number } })?.response?.status;
  const denied = errStatus === 401 || errStatus === 403;

  return (
    <div className="p-8">
      <DnaErrorState
        title={denied ? "Akses ditolak" : "Gagal memuat data"}
        message={
          denied
            ? "Akun ini tidak berwenang membaca daftar purchase order."
            : "Daftar purchase order tidak dapat diambil dari server."
        }
        onRetry={onRetry}
      />
    </div>
  );
}
