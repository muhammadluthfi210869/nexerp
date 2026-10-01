"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import {
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { ProjectRow, formatDate } from "../_types/project-control.types";
import { StatusBadge } from "./StatusBadge";

export interface ProjectControlAttentionTableProps {
  attentionProjects: ProjectRow[];
}

export function ProjectControlAttentionTable({
  attentionProjects,
}: ProjectControlAttentionTableProps) {
  if (attentionProjects.length === 0) return null;

  return (
    <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h3 className="text-[14px] font-extrabold text-slate-900 uppercase tracking-wide">
            Perlu Perhatian (At Risk / Blocker)
          </h3>
        </div>
        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">
          {attentionProjects.length} Proyek
        </span>
      </div>

      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="bg-rose-50/40 border-b border-rose-100 text-[11px] font-bold text-slate-700 uppercase">
              <DnaTh className="py-2.5 px-3">Proyek</DnaTh>
              <DnaTh className="py-2.5 px-3">Status</DnaTh>
              <DnaTh className="py-2.5 px-3">Blocker Tercatat</DnaTh>
              <DnaTh className="py-2.5 px-3">Owner</DnaTh>
              <DnaTh className="py-2.5 px-3">Deadline</DnaTh>
              <DnaTh className="py-2.5 px-3 text-right">Detail</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {attentionProjects.map((proj) => (
              <DnaTableRow
                key={proj.id}
                className="hover:bg-rose-50/30 transition-colors"
              >
                <DnaTd className="py-2.5 px-3 font-bold text-slate-900">
                  <Link
                    href={`/samples/project-control/${proj.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {proj.name}
                  </Link>
                  <span className="block text-[11px] font-normal text-slate-500">
                    {proj.channel}
                  </span>
                </DnaTd>
                <DnaTd className="py-2.5 px-3">
                  <StatusBadge status={proj.status} />
                </DnaTd>
                <DnaTd className="py-2.5 px-3">
                  {proj.blockers?.trim() ? (
                    <span className="text-rose-700 text-[12px] font-medium">
                      {proj.blockers}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-[12px]">
                      Tidak ada blocker tercatat
                    </span>
                  )}
                </DnaTd>
                <DnaTd className="py-2.5 px-3 font-medium text-slate-700">
                  {proj.ownerName}
                </DnaTd>
                <DnaTd className="py-2.5 px-3 text-slate-600 tabular-nums text-[12px]">
                  {formatDate(proj.deadline)}
                </DnaTd>
                <DnaTd className="py-2.5 px-3 text-right">
                  <Link
                    href={`/samples/project-control/${proj.id}`}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer text-decoration-none shadow-2xs"
                  >
                    <span>Lihat Detail</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </DnaTd>
              </DnaTableRow>
            ))}
          </DnaTableBody>
        </DnaTable>
      </div>
    </div>
  );
}
