"use client";

import React from "react";
import { DnaBadge } from "@/components/dna";

export function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return <DnaBadge variant="success">Approved</DnaBadge>;
    case "ORDERED":
      return <DnaBadge variant="info">Ordered (PO Terbit)</DnaBadge>;
    case "REJECTED":
      return <DnaBadge variant="critical">Ditolak</DnaBadge>;
    case "PENDING_HEAD":
      return <DnaBadge variant="warning">Pending Head</DnaBadge>;
    case "PENDING_FINANCE":
      return <DnaBadge variant="warning">Pending Finance</DnaBadge>;
    case "PENDING_DIRECTOR":
      return <DnaBadge variant="warning">Pending Direktur</DnaBadge>;
    default:
      return <DnaBadge variant="neutral">{status}</DnaBadge>;
  }
}

export function getPriorityBadge(priority: string) {
  switch (priority) {
    case "URGENT":
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          Urgent
        </span>
      );
    case "MEDIUM":
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Medium
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          Low
        </span>
      );
  }
}
