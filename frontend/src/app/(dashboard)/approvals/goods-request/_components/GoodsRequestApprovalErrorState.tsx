import React from "react";
import { DnaErrorState } from "@/components/dna";

interface GoodsRequestApprovalErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

export function GoodsRequestApprovalErrorState({
  error,
  onRetry,
}: GoodsRequestApprovalErrorStateProps) {
  const errStatus = (error as { response?: { status?: number } })?.response?.status;
  const denied = errStatus === 401 || errStatus === 403;

  return (
    <div className="p-8">
      <DnaErrorState
        title={denied ? "Akses ditolak" : "Gagal memuat data"}
        message={
          denied
            ? "Akun ini tidak berwenang membaca daftar permintaan barang."
            : "Daftar permintaan barang tidak dapat diambil dari server."
        }
        onRetry={onRetry}
      />
    </div>
  );
}
