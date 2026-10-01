"use client";

import React from "react";
import { DnaBadge, Button } from "@/components/dna";
import { cn } from "@/lib/utils";
import type { WorkCardProps } from "../_types/workstation.types";

export function WorkCard({
  icon,
  title,
  subtitle,
  status,
  actionLabel,
  onAction,
  disabled = false,
  isAmber = false,
}: WorkCardProps) {
  return (
    <div
      className={cn(
        "bg-white p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-zinc-400 transition-all shadow-sm",
        isAmber ? "border-amber-200/80 bg-amber-50/20" : "border-zinc-200"
      )}
    >
      <div className="flex items-center gap-6">
        <div
          className={cn(
            "h-14 w-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 border",
            isAmber ? "bg-amber-50 border-amber-200" : "bg-zinc-100 border-zinc-200"
          )}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                className: cn(
                  "w-6 h-6",
                  isAmber ? "text-amber-700" : "text-zinc-800"
                ),
              })
            : icon}
        </div>
        <div>
          <h4 className="text-base font-semibold text-zinc-900">
            {title}
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <DnaBadge
          status={
            status === "COMPLETED" || status === "APPROVED"
              ? "success"
              : status === "PENDING" || status === "DRAFT" || status === "IN_TRANSIT"
              ? "warning"
              : "default"
          }
        >
          {status}
        </DnaBadge>
        <Button
          onClick={onAction}
          disabled={disabled}
          className={cn(
            "h-10 px-6 font-semibold text-xs rounded-lg transition-all",
            isAmber ? "bg-zinc-900 hover:bg-black text-white" : "bg-zinc-900 hover:bg-black text-white"
          )}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
