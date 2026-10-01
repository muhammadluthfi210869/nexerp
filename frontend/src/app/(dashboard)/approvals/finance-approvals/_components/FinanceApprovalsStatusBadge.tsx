"use client";

import React from "react";
import { DnaBadge } from "@/components/dna";
import { FundRequestStatus, getFundRequestStatusBadgeVariant } from "../_types/finance-approvals.types";

export interface FinanceApprovalsStatusBadgeProps {
  status: FundRequestStatus;
}

export function FinanceApprovalsStatusBadge({ status }: FinanceApprovalsStatusBadgeProps) {
  const { variant, label } = getFundRequestStatusBadgeVariant(status);
  return <DnaBadge variant={variant}>{label}</DnaBadge>;
}
