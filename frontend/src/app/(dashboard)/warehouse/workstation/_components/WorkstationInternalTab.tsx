"use client";

import React from "react";
import { ArrowRightLeft, ClipboardCheck } from "lucide-react";
import { WorkCard } from "./WorkCard";
import type { InternalTransferItem, StockOpnameItem } from "../_types/workstation.types";

interface WorkstationInternalTabProps {
  activeTab: string;
  internalTransfers: InternalTransferItem[];
  stockOpnames: StockOpnameItem[];
  onSelectOpname: (item: StockOpnameItem) => void;
}

export function WorkstationInternalTab({
  activeTab,
  internalTransfers,
  stockOpnames,
  onSelectOpname,
}: WorkstationInternalTabProps) {
  return (
    <div hidden={activeTab !== "internal"} className="space-y-12">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-600 rounded-full" />
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">
            INTERNAL TRANSFERS
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {internalTransfers.map((item: any) => (
            <WorkCard
              key={item.id}
              icon={<ArrowRightLeft />}
              title={item.transferNumber}
              subtitle={`${item.sourceWarehouse?.name} â†’ ${item.destWarehouse?.name}`}
              status={item.status}
              actionLabel="EXECUTE MOVE"
              isAmber={true}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-amber-500 rounded-full" />
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">
            STOCK AUDIT & OPNAME
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {stockOpnames.map((item: any) => (
            <WorkCard
              key={item.id}
              icon={<ClipboardCheck />}
              title={item.opnameNumber}
              subtitle={`${item.warehouse?.name} â€¢ ITEMS: ${item.items?.length}`}
              status={item.approvalStatus}
              actionLabel="APPROVE DISCREPANCY"
              onAction={() => onSelectOpname(item)}
              isAmber={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
