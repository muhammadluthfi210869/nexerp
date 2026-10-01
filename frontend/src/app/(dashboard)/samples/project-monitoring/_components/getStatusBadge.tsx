"use client";

import React from "react";
import { DnaBadge } from "@/components/dna";
import { RndProject } from "../_types/project-monitoring.types";

export const getStatusBadge = (status: RndProject["status"]) => {
  switch (status) {
    case "APPROVED":
      return <DnaBadge variant="success">APPROVED</DnaBadge>;
    case "IN_PROGRESS":
      return <DnaBadge variant="info">IN PROGRESS</DnaBadge>;
    case "REVISION":
      return <DnaBadge variant="warning">REVISI</DnaBadge>;
    case "TERKIRIM":
      return <DnaBadge variant="info">TERKIRIM</DnaBadge>;
    case "OVERDUE":
      return <DnaBadge variant="danger">OVERDUE</DnaBadge>;
    default:
      return <DnaBadge variant="neutral">{status}</DnaBadge>;
  }
};
