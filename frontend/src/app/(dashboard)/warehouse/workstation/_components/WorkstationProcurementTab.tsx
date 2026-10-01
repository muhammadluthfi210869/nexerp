"use client";

import React from "react";
import { Truck } from "lucide-react";
import { toast } from "sonner";
import { WorkCard } from "./WorkCard";
import type { ProcurementItem } from "../_types/workstation.types";

interface WorkstationProcurementTabProps {
  activeTab: string;
  procurementItems: ProcurementItem[];
}

export function WorkstationProcurementTab({
  activeTab,
  procurementItems,
}: WorkstationProcurementTabProps) {
  return (
    <div hidden={activeTab !== "procurement"} className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-brand-black rounded-full" />
        <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">
          PENDING INBOUND & RECEIVING
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {procurementItems.map((item: any) => (
          <WorkCard
            key={item.id}
            icon={<Truck />}
            title={`PO: ${item.poId}`}
            subtitle={`${item.receivedAt} â€¢ ${item.items?.length} MATERIALS IN QUEUE`}
            status="IN_TRANSIT"
            actionLabel="RECEIVE BATCH"
            onAction={() => toast.info("PROCEED TO INBOUND TAB")}
          />
        ))}
      </div>
    </div>
  );
}
