"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Calendar,
  Layers,
  Upload,
  ShieldCheck,
  HelpCircle,
  XCircle,
  MessageSquare
} from "lucide-react";
import { MOCK_PROJECTS } from "@/components/project-control/mock-data";
import { ProjectStatusBadge, MilestoneStatusBadge } from "@/components/project-control/ProjectControlComponents";
import { ProjectMilestone } from "@/types/project-control";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const initialProject = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];
  const [project, setProject] = useState(initialProject);
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);

  // Auto-calculate project progress derived from mandatory completed milestones
  const handleVerifyMilestone = (milestoneId: string, approve: boolean) => {
    const updatedMilestones = project.milestones.map((m) => {
      if (m.id === milestoneId) {
        return {
          ...m,
          status: approve ? ("DONE" as const) : ("IN_PROGRESS" as const),
          verifiedBy: approve ? "Direktur Utama" : undefined,
          verifiedAt: approve ? new Date().toISOString().replace("T", " ").substring(0, 16) : undefined,
        };
      }
      return m;
    });

    const mandatoryCount = updatedMilestones.filter((m) => m.isMandatory).length || 1;
    const doneMandatoryCount = updatedMilestones.filter((m) => m.isMandatory && m.status === "DONE").length;
    const newProgress = Math.round((doneMandatoryCount / mandatoryCount) * 100);

    setProject({
      ...project,
      progress: newProgress,
      milestones: updatedMilestones,
      status: newProgress === 100 ? "DONE" : project.status,
    });

    setSelectedMilestone(null);
  };

  const handleResolveDecision = () => {
    setProject({
      ...project,
      decisionRequired: false,
      activeDecision: undefined,
    });
  };

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      {/* ── BACK LINK & HEADER ── */}
      <div>
        <Link
          href="/project-control"
          className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors mb-2 text-decoration-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Project Control Hub</span>
        </Link>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] leading-[34px] font-bold text-slate-900 tracking-tight">
                {project.name}
              </h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-[13px] text-slate-500 mt-1">
              Divisi: <strong className="text-slate-700">{project.department}</strong> | Owner: <strong className="text-slate-700">{project.owner}</strong> | PIC: <strong className="text-slate-700">{project.pic}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200">
              PRIORITAS: {project.priority}
            </span>
          </div>
        </div>
      </div>

      {/* ── HEADER CARDS (PROJECT DETAIL METRICS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Status Proyek</p>
          <div className="mt-1">
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Calculated Progress</p>
          <h3 className="text-[22px] font-black text-slate-900 mt-0.5">{project.progress}%</h3>
          <p className="text-[10px] text-slate-500 font-medium">Auto-derived milestone</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Final Deadline</p>
          <h3 className="text-[16px] font-extrabold text-slate-900 mt-1 font-mono">{project.deadline}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Mulai: {project.startDate}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Milestone Aktif</p>
          <p className="text-[12px] font-bold text-slate-900 mt-1 truncate">{project.currentMilestone}</p>
          <p className="text-[10px] text-amber-600 font-mono font-bold">Due: {project.currentMilestoneDue}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Current Blocker</p>
          <p className="text-[12px] font-bold text-rose-600 mt-1 truncate">
            {project.blocker ? project.blocker.title : "Tidak Ada Blocker"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Decision Required?</p>
          <p className="text-[14px] font-black text-purple-700 mt-1">
            {project.decisionRequired ? "YA — Perlu Direksi" : "TIDAK"}
          </p>
        </div>
      </div>

      {/* ── DECISION REQUIRED ACTION CARD (IF ACTIVE) ── */}
      {project.decisionRequired && project.activeDecision && (
        <div className="bg-purple-50 border border-purple-300 rounded-xl p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-purple-600 text-white font-bold text-[10px] rounded uppercase tracking-wider">
                MEMBUTUHKAN KEPUTUSAN DIREKSI
              </span>
              <h3 className="text-[18px] font-bold text-purple-950 mt-1">
                {project.activeDecision.title}
              </h3>
              <p className="text-[13px] text-purple-900 font-medium">
                {project.activeDecision.description}
              </p>
              {project.activeDecision.optionsRecommendation && (
                <div className="p-2.5 bg-white/80 rounded-lg border border-purple-200 text-[12px] text-purple-900 mt-2">
                  <strong>Rekomendasi / Opsi:</strong> {project.activeDecision.optionsRecommendation}
                </div>
              )}
              <p className="text-[11px] font-bold text-rose-700 mt-1">
                ⚠️ Dampak jika tertunda: {project.activeDecision.impactIfDelayed}
              </p>
            </div>

            <button
              onClick={handleResolveDecision}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[12px] rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              Setujui Rekomendasi / Resolve
            </button>
          </div>
        </div>
      )}

      {/* ── DEFINITION OF DONE (DoD) CARD ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Definition of Done (DoD)
        </h3>
        <p className="text-[13px] text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
          "{project.definitionOfDone}"
        </p>
      </div>

      {/* ── MILESTONE TABLE (AUDITABLE VERIFICATION FLOW) ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" /> Milestone & Progress Contribution Table
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {project.milestones.filter((m) => m.status === "DONE").length} / {project.milestones.length} Selesai
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            header
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Nama Milestone</th>
                <th className="px-4 py-3">PIC</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Bukti (Evidence)</th>
                <th className="px-4 py-3">Verified By</th>
                <th className="px-4 py-3 text-right">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {project.milestones.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-center font-bold text-slate-400">{m.sequence}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {m.milestone}
                    {m.blocker && (
                      <span className="block text-[11px] text-rose-600 font-normal mt-0.5">⚠️ Blocker: {m.blocker}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{m.pic}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-600">{m.deadline}</td>
                  <td className="px-4 py-3">
                    <MilestoneStatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-[12px]">
                    {m.evidence ? (
                      <span className="text-blue-600 underline font-medium cursor-pointer">{m.evidence}</span>
                    ) : (
                      <span className="text-slate-400 italic">Belum ada</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">
                    {m.verifiedBy ? (
                      <span className="text-emerald-700 font-semibold">{m.verifiedBy} ({m.verifiedAt})</span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.status === "WAITING_VERIFICATION" || m.status === "IN_PROGRESS" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerifyMilestone(m.id, true)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all shadow-2xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerifyMilestone(m.id, false)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] rounded-lg cursor-pointer transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
