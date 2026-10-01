import React from "react";
import { DnaBadge } from "@/components/dna";
import type { PurchaseDpStatus } from "../_types/dp-pembelian.types";

export function getStatusBadge(status: PurchaseDpStatus) {
  switch (status) {
    case "PENDING_APPROVAL":
      return <DnaBadge variant="warning">Menunggu Approval</DnaBadge>;
    case "PAID":
      return <DnaBadge variant="info">Terbayar (Saldo Aktif)</DnaBadge>;
    case "ALLOCATED":
      return <DnaBadge variant="success">Dialokasikan ke Faktur</DnaBadge>;
    case "VOID":
      return <DnaBadge variant="critical">Dibatalkan</DnaBadge>;
  }
}
