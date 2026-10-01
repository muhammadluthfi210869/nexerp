import React from "react";
import { DnaBadge } from "@/components/dna";
import { RequisitionStatus } from "../_types/requisition.types";

export const getStatusBadge = (status: RequisitionStatus) => {
  switch (status) {
    case "PENDING":
      return <DnaBadge variant="warning">Menunggu Approval</DnaBadge>;
    case "APPROVED":
      return <DnaBadge variant="info">Disetujui (Siap Picking)</DnaBadge>;
    case "COMPLETED":
      return <DnaBadge variant="success">Selesai Diserahkan</DnaBadge>;
    case "REJECTED":
      return <DnaBadge variant="critical">Ditolak</DnaBadge>;
  }
};

export const RequisitionStatusBadge: React.FC<{ status: RequisitionStatus }> = ({ status }) => {
  return getStatusBadge(status);
};
