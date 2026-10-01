import React from "react";
import { DnaBadge } from "@/components/dna";
import type { DeliveryStatus, FinancialGateStatus } from "../_types/release.types";

interface ReleaseStatusBadgeProps {
  status: DeliveryStatus;
}

export function ReleaseStatusBadge({ status }: ReleaseStatusBadgeProps) {
  switch (status) {
    case "READY":
      return <DnaBadge variant="warning">Siap Kirim</DnaBadge>;
    case "IN_TRANSIT":
      return <DnaBadge variant="info">Dalam Perjalanan</DnaBadge>;
    case "DELIVERED":
      return <DnaBadge variant="success">Terkirim (POD)</DnaBadge>;
    case "ON_HOLD":
      return <DnaBadge variant="critical">On Hold</DnaBadge>;
    case "RETURNED":
      return <DnaBadge variant="critical">Retur</DnaBadge>;
    default:
      return <DnaBadge variant="default">{status}</DnaBadge>;
  }
}

interface FinancialGateBadgeProps {
  status: FinancialGateStatus;
}

export function FinancialGateBadge({ status }: FinancialGateBadgeProps) {
  switch (status) {
    case "LUNAS":
      return <DnaBadge variant="success">Lunas</DnaBadge>;
    case "DP_APPROVED":
      return <DnaBadge variant="info">DP Approved</DnaBadge>;
    case "ON_HOLD":
      return <DnaBadge variant="critical">On Hold (Unpaid)</DnaBadge>;
    default:
      return <DnaBadge variant="default">{status}</DnaBadge>;
  }
}
