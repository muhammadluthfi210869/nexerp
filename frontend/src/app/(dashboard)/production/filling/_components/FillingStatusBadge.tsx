import React from "react";
import { DnaBadge } from "@/components/dna";
import { FillingStatus } from "../_types/filling.types";

interface FillingStatusBadgeProps {
  status: FillingStatus;
}

export function FillingStatusBadge({ status }: FillingStatusBadgeProps) {
  switch (status) {
    case "SELESAI":
      return <DnaBadge variant="success">SELESAI</DnaBadge>;
    case "PROSES":
      return <DnaBadge variant="info">PROSES</DnaBadge>;
    case "PENDING":
      return <DnaBadge variant="warning">PENDING</DnaBadge>;
    case "DIBATALKAN":
      return <DnaBadge variant="danger">BATAL</DnaBadge>;
    default:
      return <DnaBadge variant="neutral">{status}</DnaBadge>;
  }
}
