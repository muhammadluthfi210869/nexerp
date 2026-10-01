import React from "react";
import { DnaBadge } from "@/components/dna";

export function OutboundStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "DELIVERED":
      return <DnaBadge variant="success">Diterima</DnaBadge>;
    case "SHIPPED":
      return <DnaBadge variant="info">Dalam Perjalanan</DnaBadge>;
    case "PACKING":
      return <DnaBadge variant="warning">Packing Gudang</DnaBadge>;
    default:
      return <DnaBadge variant="default">{status}</DnaBadge>;
  }
}
