import { DnaBadge } from "@/components/dna";
import type { GoodsReceiptNote } from "../_types/inbound.types";

interface InboundStatusBadgeProps {
  status: GoodsReceiptNote["status"];
}

export function InboundStatusBadge({ status }: InboundStatusBadgeProps) {
  switch (status) {
    case "PENDING_QC":
      return <DnaBadge variant="warning">Karantina / QC</DnaBadge>;
    case "APPROVED":
      return <DnaBadge variant="success">Lolos QC</DnaBadge>;
    case "HAS_REJECT":
      return <DnaBadge variant="critical">Ada Reject</DnaBadge>;
    case "REJECTED":
      return <DnaBadge variant="critical">Ditolak Total</DnaBadge>;
    default:
      return null;
  }
}
