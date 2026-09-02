"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Inbox, FlaskConical, Landmark, XCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { DnaButton } from "@/components/dna";
import { STAGES } from "./pipeline-constants";

interface PipelineLead {
  id: string | number;
  clientName: string;
  brandName?: string | null;
  productInterest: string;
  category?: string | null;
  source?: string | null;
  moq: number;
  unitPrice: number;
  estimatedValue: number;
  status: string;
  slaDays: number;
  notes?: string | null;
}

interface PipelineLeadTableProps {
  leads: PipelineLead[] | undefined;
  isLoading: boolean;
  onAdvance: (lead: PipelineLead, targetStage: string) => void;
  onMarkLost: (lead: PipelineLead) => void;
  stageMap?: Record<string, { label: string; color: string; bg: string; icon?: any }>;
}

function ChevronDown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function PipelineLeadTable({ leads, isLoading, onAdvance, onMarkLost, stageMap }: PipelineLeadTableProps) {
  const stages = stageMap || STAGES;
  const stageKeys = Object.keys(stages);

  return (
    <motion.div
      key="active"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-4 px-4 text-table-header text-slate-400 w-10 text-center">#</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400">Client & Brand</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400">Produk & MOQ</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400">Estimasi Order</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400">Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-b border-slate-50">
                  <TableCell className="py-4 px-4 text-center"><div className="h-4 w-4 bg-slate-100 rounded animate-pulse mx-auto" /></TableCell>
                  <TableCell className="py-4 px-4"><div className="space-y-2"><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /><div className="h-3 w-20 bg-slate-50 rounded animate-pulse" /></div></TableCell>
                  <TableCell className="py-4 px-4"><div className="h-4 w-40 bg-slate-100 rounded animate-pulse" /></TableCell>
                  <TableCell className="py-4 px-4"><div className="h-8 w-28 bg-slate-100 rounded animate-pulse" /></TableCell>
                  <TableCell className="py-4 px-4"><div className="h-8 w-28 bg-slate-100 rounded-xl animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : !leads || leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                      <Inbox className="h-12 w-12" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">
                        No Active Leads
                      </h3>
                      <p className="text-[10px] font-medium text-slate-400 uppercase italic tracking-widest">
                        Pipeline kosong. Konversi tamu dari Buku Tamu atau intake lead baru.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead, idx) => {
                const StageIcon = stages[lead.status]?.icon || Inbox;
                const dropdownStages = stageKeys.filter(
                  (s) => s !== lead.status && s !== "LOST" && s !== "WON_DEAL"
                );
                const total = lead.moq * lead.unitPrice;

                return (
                  <TableRow
                    key={lead.id}
                    className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50"
                  >
                    <TableCell className="py-3 px-4 text-center font-medium italic text-slate-300 text-[10px]">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">
                          {lead.clientName}
                        </span>
                        {lead.brandName && (
                          <span className="text-[10px] font-medium text-slate-500 uppercase italic">
                            ({lead.brandName})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                            {lead.productInterest}
                          </span>
                          {lead.category && (
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {lead.category}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 tabular-nums">
                          MOQ: {lead.moq.toLocaleString()} pcs
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-medium text-slate-400 tabular-nums">
                          MOQ: {lead.moq.toLocaleString()} pcs
                        </span>
                        <span className="text-[9px] font-medium text-slate-400 tabular-nums">
                          HPP: Rp {lead.unitPrice.toLocaleString()}/pcs
                        </span>
                        <span className="text-xs font-black text-slate-900 tabular-nums italic">
                          Rp {total.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "rounded px-3 py-1.5 font-black uppercase text-[8px] shadow-sm flex items-center gap-1.5 transition-all hover:opacity-80 cursor-pointer",
                                stages[lead.status]?.bg,
                                stages[lead.status]?.color
                              )}
                            >
                              <StageIcon className="h-2.5 w-2.5" />
                              {stages[lead.status]?.label || lead.status}
                              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-xl border-none shadow-sm p-2 bg-white min-w-[180px] max-h-72 overflow-y-auto">
                            {dropdownStages.map((stage) => {
                              const SIcon = stages[stage]?.icon || ArrowRight;
                              return (
                                <DropdownMenuItem
                                  key={stage}
                                  onClick={() => onAdvance(lead, stage)}
                                  className="rounded-lg h-9 px-3 font-black uppercase text-[8px] hover:bg-blue-50 cursor-pointer flex justify-between"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <SIcon className="h-3 w-3 text-slate-400" />
                                    {stages[stage]?.label || stage}
                                  </div>
                                  <ArrowRight className="h-3 w-3 text-blue-500" />
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <span className={cn(
                          "text-[9px] font-medium tabular-nums whitespace-nowrap",
                          lead.slaDays > 7 ? "text-rose-600 font-black animate-pulse" : "text-slate-400"
                        )}>
                          SLA: {lead.slaDays}d
                        </span>

                        {lead.status !== "WON_DEAL" && lead.status !== "LOST" && (
                          <DnaButton
                            onClick={() => onAdvance(lead, "WON_DEAL")}
                            variant="primary"
                            size="sm"
                            className="!h-7 !px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Won
                          </DnaButton>
                        )}

                        <DnaButton
                          onClick={() => onMarkLost(lead)}
                          variant="danger"
                          size="sm"
                          className="!h-7 !px-2 rounded-lg text-[8px] font-black uppercase gap-1"
                        >
                          <XCircle className="h-3 w-3" /> Lost
                        </DnaButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    </motion.div>
  );
}
