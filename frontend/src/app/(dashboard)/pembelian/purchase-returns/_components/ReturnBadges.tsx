import React from "react";
import { DnaBadge } from "@/components/dna";
import type { CompensationType, PurchaseReturnStatus } from "../_types/purchase-returns.types";

export function getStatusBadge(status: PurchaseReturnStatus) {
  switch (status) {
    case "DRAFT":
      return <DnaBadge variant="neutral">Draft</DnaBadge>;
    case "WAITING_APPROVAL":
      return <DnaBadge variant="warning">Menunggu Persetujuan</DnaBadge>;
    case "COMPLETED":
      return <DnaBadge variant="success">Selesai Kompensasi</DnaBadge>;
    case "CANCELLED":
      return <DnaBadge variant="critical">Dibatalkan</DnaBadge>;
  }
}

export function getCompensationBadge(comp: CompensationType) {
  switch (comp) {
    case "POTONG_TAGIHAN":
      return <DnaBadge variant="neutral">Debit Note</DnaBadge>;
    case "GANTI_BARANG":
      return <DnaBadge variant="neutral">Tukar Barang</DnaBadge>;
    case "REFUND_DANA":
      return <DnaBadge variant="neutral">Refund Dana</DnaBadge>;
  }
}
