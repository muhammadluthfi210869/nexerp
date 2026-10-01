"use client";

import React from "react";
import { FlaskConical, Eye, FolderOpen } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
} from "@/components/dna";
import { RndProject } from "../_types/project-monitoring.types";
import { getStatusBadge } from "./getStatusBadge";

interface ProjectMonitoringTableProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  isLoading: boolean;
  filteredProjects: RndProject[];
  onSelectProject: (project: RndProject) => void;
}

export function ProjectMonitoringTable({
  searchQuery,
  onSearchChange,
  isLoading,
  filteredProjects,
  onSelectProject,
}: ProjectMonitoringTableProps) {
  return (
    <DnaDataTableCard
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Cari Project, Klien, Brand, PIC Formulator..."
    >
      <div className="w-full">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="py-3 px-4 w-[26%]">Project & Brand</DnaTh>
              <DnaTh className="py-3 px-4 w-[24%]">Klien & Formulator</DnaTh>
              <DnaTh className="py-3 px-4 w-[20%]">Target & Pengerjaan</DnaTh>
              <DnaTh className="py-3 px-4 w-[14%]">Status & Revisi</DnaTh>
              <DnaTh className="py-3 px-4 w-[10%]">Folder Drive</DnaTh>
              <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  Memuat data project R&D...
                </DnaTd>
              </DnaTableRow>
            ) : filteredProjects.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada project R&D yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredProjects.map((row) => (
                <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="font-semibold text-slate-900 text-xs truncate">{row.projectName}</p>
                    <p className="text-[11px] text-indigo-600 font-medium truncate">{row.brandName}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="font-semibold text-slate-800 text-xs truncate">{row.clientName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{row.picFormulator}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="tabular-nums text-xs font-bold text-slate-900 truncate">
                      Target: {row.targetFinishDate}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums truncate">
                      Masuk: {row.npfEntryDate} â€¢ {row.sampleWorkDays} Hari
                    </p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(row.status)}
                    </div>
                    <p className="text-[10px] tabular-nums text-slate-400 mt-0.5 truncate">{row.activeRevision}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <a
                      href={row.formulaFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-blue-600 text-[11px] font-medium border border-slate-200"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> Drive
                    </a>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-right">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectProject(row)}
                      title="Lihat Detail Project"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
