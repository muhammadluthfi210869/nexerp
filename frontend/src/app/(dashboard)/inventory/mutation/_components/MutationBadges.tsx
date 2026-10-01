import React from "react";
import { DnaBadge } from "@/components/dna";
import type { TransferStatus } from "../_types/mutation.types";

export function getMutationStatusBadge(status: TransferStatus | string) {
  switch (status) {
    case "COMPLETED":
      return <DnaBadge variant="success">Selesai</DnaBadge>;
    case "PENDING":
      return <DnaBadge variant="warning">Dalam Proses</DnaBadge>;
    case "CANCELLED":
      return <DnaBadge variant="critical">Dibatalkan</DnaBadge>;
    default:
      return <DnaBadge variant="default">{status}</DnaBadge>;
  }
}

interface MutationStatusBadgeProps {
  status: TransferStatus | string;
}

export function MutationStatusBadge({ status }: MutationStatusBadgeProps) {
  return getMutationStatusBadge(status);
}
