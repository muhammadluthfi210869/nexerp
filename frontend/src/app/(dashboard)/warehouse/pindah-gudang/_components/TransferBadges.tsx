import React from "react";
import { DnaBadge } from "@/components/dna";
import type { TransferStatus } from "../_types/pindah-gudang.types";

interface TransferStatusBadgeProps {
  status: TransferStatus;
}

export function TransferStatusBadge({ status }: TransferStatusBadgeProps) {
  switch (status) {
    case "DRAFT":
      return <DnaBadge variant="default">Draft SPK</DnaBadge>;
    case "IN_TRANSIT":
      return <DnaBadge variant="info">Dalam Perjalanan</DnaBadge>;
    case "RECEIVED":
      return <DnaBadge variant="warning">Diterima (Menunggu Verifikasi)</DnaBadge>;
    case "VERIFIED":
    case "COMPLETED":
      return <DnaBadge variant="success">Terverifikasi (Selesai)</DnaBadge>;
    case "CANCELLED":
      return <DnaBadge variant="critical">Dibatalkan</DnaBadge>;
    default:
      return <DnaBadge variant="default">{status}</DnaBadge>;
  }
}
