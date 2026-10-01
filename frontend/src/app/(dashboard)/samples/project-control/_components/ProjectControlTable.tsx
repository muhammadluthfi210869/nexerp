"use client";

import React from "react";
import Link from "next/link";
import { FolderOpen, ArrowUpRight, FileText } from "lucide-react";
import {
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaEmptyState,
} from "@/components/dna";
import { cn } from "@/lib/utils";
import { ProjectRow, formatDate } from "../_types/project-control.types";
import { StatusBadge } from "./StatusBadge";

export interface ProjectControlTableProps {
  data: ProjectRow[];
  filteredProjects: ProjectRow[];
}

export function ProjectControlTable({
  data,
  filteredProjects,
}: ProjectControlTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-slate-500" /> Portfolio Proyek
        </h3>
        <span className="text-[11px] text-slate-500 font-medium">
          Menampilkan {filteredProjects.length} Proyek
        </span>
      </div>

      {data.length === 0 ? (
        <div className="p-6">
          <DnaEmptyState
            title="Belum Ada Proyek Tercatat"
            description="Register proyek marketing (/marketing/projects) masih kosong. Project Control tidak menampilkan data contoh."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <DnaTh className="px-4 py-3">Kode / Nama Proyek</DnaTh>
                <DnaTh className="px-4 py-3">Channel</DnaTh>
                <DnaTh className="px-4 py-3">Brand / Owner</DnaTh>
                <DnaTh className="px-4 py-3">Progress</DnaTh>
                <DnaTh className="px-4 py-3">Tasks</DnaTh>
                <DnaTh className="px-4 py-3">Status</DnaTh>
                <DnaTh className="px-4 py-3">Deadline</DnaTh>
                <DnaTh className="px-4 py-3 text-right">Update Terakhir</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredProjects.length === 0 ? (
                <DnaTableRow>
                  <DnaTd
                    colSpan={8}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Tidak ada proyek yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredProjects.map((proj) => (
                  <DnaTableRow
                    key={proj.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <DnaTd className="px-4 py-3 font-bold text-slate-900">
                      <Link
                        href={`/samples/project-control/${proj.id}`}
                        className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
                      >
                        <span>{proj.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
                      </Link>
                      <span className="block text-[11px] font-normal text-slate-500 tabular-nums">
                        {proj.projectCode}
                      </span>
                    </DnaTd>

                    <DnaTd className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {proj.channel}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {proj.category}
                      </span>
                    </DnaTd>

                    <DnaTd className="px-4 py-3">
                      <span className="font-semibold text-slate-900 block">
                        {proj.brandName || "â€”"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Owner: {proj.ownerName}
                      </span>
                    </DnaTd>

                    <DnaTd className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              proj.progress >= 80
                                ? "bg-emerald-500"
                                : proj.progress >= 50
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            )}
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums text-slate-800">
                          {proj.progress}%
                        </span>
                      </div>
                    </DnaTd>

                    <DnaTd className="px-4 py-3">
                      <span className="tabular-nums font-bold text-slate-800">
                        {proj.taskCount}
                      </span>
                      <FileText className="w-3.5 h-3.5 text-slate-400 inline ml-1" />
                    </DnaTd>

                    <DnaTd className="px-4 py-3">
                      <StatusBadge status={proj.status} />
                    </DnaTd>

                    <DnaTd className="px-4 py-3 text-[12px] tabular-nums text-slate-600">
                      {formatDate(proj.deadline)}
                      <span className="block text-[10px] text-slate-400">
                        Mulai: {formatDate(proj.startDate)}
                      </span>
                    </DnaTd>

                    <DnaTd className="px-4 py-3 text-right text-[11px] tabular-nums text-slate-500">
                      {formatDate(proj.updatedAt)}
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      )}
    </div>
  );
}
