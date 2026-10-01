"use client";

import React from "react";
import {
  Calendar,
  ChevronRight,
  Loader2,
  Timer,
} from "lucide-react";
import {
  TableWrapper,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import { StabilityStudy } from "../_types/stability.types";

interface StabilityTableProps {
  studies: StabilityStudy[];
  isLoading: boolean;
  onLogResult: (study: StabilityStudy) => void;
}

export function StabilityTable({
  studies,
  isLoading,
  onLogResult,
}: StabilityTableProps) {
  return (
    <TableWrapper>
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px]">Tanggal Mulai</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px]">Study ID</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[180px]">Produk & Formulasi</DnaTh>
              <DnaTh className="px-4 py-2.5 text-center w-[110px]">Chamber</DnaTh>
              <DnaTh className="px-4 py-2.5 text-center w-[100px]">Interval</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[120px]">Next Test Gate</DnaTh>
              <DnaTh className="px-4 py-2.5 text-center w-[130px]">Status Integritas</DnaTh>
              <DnaTh className="pr-4 py-2.5 text-right w-[110px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={9} className="text-center py-12 text-slate-400 text-xs">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-slate-400" />
                  Memuat data uji stabilitas...
                </DnaTd>
              </DnaTableRow>
            ) : studies.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={9} className="text-center py-12 text-slate-400 text-xs">
                  Tidak ada data uji stabilitas aktif.
                </DnaTd>
              </DnaTableRow>
            ) : (
              studies.map((log, idx) => (
                <DnaTableRow
                  key={log.id}
                  className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <DnaTd className="px-4 py-2.5 text-center text-slate-400 tabular-nums text-xs font-mono">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-slate-700 text-xs tabular-nums">
                    {log.startDate}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <span className="font-bold text-slate-900 text-xs font-mono">{log.id}</span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-xs">{log.product}</span>
                      <span className="text-[11px] font-medium text-slate-400">Batch: {log.batch}</span>
                    </div>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    <DnaBadge variant={log.chamber === "A" ? "info" : "default"}>
                      Chamber {log.chamber || "A"}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    <DnaBadge variant="default">{log.interval || "1M"}</DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs tabular-nums">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{log.nextTest}</span>
                    </div>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    <DnaBadge variant={log.status === "STABLE" ? "success" : "critical"}>
                      {log.status}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right">
                    <DnaButton
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => onLogResult(log)}
                    >
                      Log Result <ChevronRight className="ml-1 h-3 w-3" />
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </TableWrapper>
  );
}
