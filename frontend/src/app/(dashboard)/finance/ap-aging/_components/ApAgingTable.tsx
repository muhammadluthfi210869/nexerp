import React from "react";
import { Calendar, Search, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaInput,
  DnaSelect,
  DnaTable,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import type {
  ApAgingItem,
  ApAgingDateRange,
} from "../_types/ap-aging.types";

interface ApAgingTableProps {
  items: ApAgingItem[];
  dateRange: ApAgingDateRange;
  setDateRange: (range: ApAgingDateRange) => void;
  bucketFilter: string;
  setBucketFilter: (bucket: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectInvoice: (item: ApAgingItem) => void;
}

export function ApAgingTable({
  items,
  dateRange,
  setDateRange,
  bucketFilter,
  setBucketFilter,
  searchQuery,
  setSearchQuery,
  onSelectInvoice,
}: ApAgingTableProps) {
  return (
    <DnaDataTableCard
      title="Matriks Jatuh Tempo Hutang per Vendor (AP Aging)"
      badge={<DnaBadge variant="default">{items.length} Faktur</DnaBadge>}
      customToolbar={
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <DnaInput
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
            />
            <span className="text-slate-400 font-semibold">s/d</span>
            <DnaInput
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
            />
          </div>
          <DnaSelect
            value={bucketFilter}
            onChange={setBucketFilter}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
          >
            <option value="ALL">Semua Bucket Umur</option>
            <option value="Current">Current (Lancar)</option>
            <option value="1-30">1 - 30 Hari</option>
            <option value="31-60">31 - 60 Hari</option>
            <option value=">60">&gt; 60 Hari</option>
          </DnaSelect>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <DnaInput
              type="text"
              placeholder="Cari Vendor / No. Faktur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <DnaTable className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-3.5 py-3">Vendor</th>
              <th className="px-3.5 py-3">Invoice No</th>
              <th className="px-3.5 py-3">Invoice Date</th>
              <th className="px-3.5 py-3">Deadline</th>
              <th className="px-3.5 py-3 text-center">Status Jatuh Tempo</th>
              <th className="px-3.5 py-3 text-center">Days Overdue</th>
              <th className="px-3.5 py-3 text-right">Amount (Rp)</th>
              <th className="px-3.5 py-3 text-center">Bucket</th>
              <th className="px-3.5 py-3 text-center">#</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-3.5 py-2.5 font-bold text-slate-900">
                  {item.vendor}
                </td>
                <td className="px-3.5 py-2.5 tabular-nums text-rose-700 font-semibold">
                  {item.invoiceNo}
                </td>
                <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                  {item.invoiceDate}
                </td>
                <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                  {item.deadline}
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  {item.statusDueDate === "H-3" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                      ðŸ”´ H-3 Jatuh Tempo
                    </span>
                  ) : item.statusDueDate === "H-7" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ðŸŸ¡ H-7 Peringatan
                    </span>
                  ) : item.statusDueDate === "OVERDUE" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-700 text-white animate-bounce">
                      âš ï¸ OVERDUE
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">
                      Normal
                    </span>
                  )}
                </td>
                <td className="px-3.5 py-2.5 text-center font-semibold text-slate-700">
                  {item.daysOverdue > 0 ? `+${item.daysOverdue} Hari` : "0"}
                </td>
                <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">
                  {formatRupiah(item.amount)}
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  <DnaBadge
                    variant={item.bucket === "Current" ? "success" : "critical"}
                  >
                    {item.bucket}
                  </DnaBadge>
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  <DnaButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectInvoice(item)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Drill Down
                  </DnaButton>
                </td>
              </tr>
            ))}
          </tbody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
