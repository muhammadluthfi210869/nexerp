import React from "react";
import { DnaBadge } from "@/components/dna";
import type { OpnameSessionStatus } from "../_types/opname.types";

export function getStatusBadge(status: OpnameSessionStatus) {
  switch (status) {
    case "DRAFT_FREEZE":
      return <DnaBadge variant="critical">Inventory Frozen</DnaBadge>;
    case "IN_COUNT":
      return <DnaBadge variant="warning">Proses Hitung</DnaBadge>;
    case "RECONCILED_CLOSED":
      return <DnaBadge variant="success">Selesai Rekonsiliasi</DnaBadge>;
  }
}

export function WarehouseOpnameStatusBadge({ status }: { status: OpnameSessionStatus }) {
  return getStatusBadge(status);
}
