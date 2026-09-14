"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Users } from "lucide-react";
import type { MarketingTask, MarketingTeamMember } from "@/types/marketing-api";

interface MemberCardsGridProps {
  members: MarketingTeamMember[];
  tasks: MarketingTask[];
}

export default function MemberCardsGrid({ members, tasks }: MemberCardsGridProps) {
  // Compute stats per member
  const memberStats = useMemo(() => {
    return members.map((m) => {
      // match by assigneeId or assignee.name
      const mTasks = tasks.filter(
        (t) => t.assigneeId === (m.userId ?? m.id) || t.assignee?.name?.toLowerCase() === m.name.toLowerCase()
      );
      const mDaily = mTasks.filter((t) => t.type === "DAILY");
      const mDailyDone = mDaily.filter((t) => t.status === "DONE").length;
      const mProject = mTasks.filter((t) => t.type === "PROJECT");
      const mProjectActive = mProject.filter((t) => t.status !== "DONE").length;
      const mLate = mTasks.filter(
        (t) => t.status !== "DONE" && new Date(t.dueDate) < new Date()
      ).length;
      const mCompleted = mTasks.filter((t) => t.status === "DONE").length;
      const completionRate = mTasks.length > 0 ? Math.round((mCompleted / mTasks.length) * 100) : 0;

      const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      return {
        member: m,
        slug,
        total: mTasks.length,
        late: mLate,
        dailyDone: mDailyDone,
        dailyTotal: mDaily.length,
        projectActive: mProjectActive,
        completionRate,
      };
    });
  }, [members, tasks]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Member Workspace
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {members.length} Anggota Tim
          </span>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Klik kartu untuk detail task & analitik performa per anggota
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {memberStats.map(
          ({ member, slug, total, late, dailyDone, dailyTotal, projectActive, completionRate }) => (
            <Link
              key={member.id}
              href={`/marketing/management-task/${slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-blue-300 hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-slate-700 border border-slate-200 shrink-0 group-hover:scale-105 transition"
                      style={{ backgroundColor: member.avatarBg }}
                    >
                      {member.initial}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition flex items-center gap-1">
                        {member.name}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-blue-600" />
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {total} tasks ·{" "}
                        <span className={late > 0 ? "text-rose-600 font-bold" : "text-slate-500"}>
                          {late} late
                        </span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                </div>

                <div className="text-[11px] text-slate-500 mt-2 line-clamp-1">
                  {member.role}
                </div>
              </div>

              {/* 3-Column Footer Stats */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 mt-4 pt-3 text-center">
                <div className="text-left">
                  <div className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">
                    Daily Task
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {dailyDone} / {dailyTotal}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">
                    Project
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {projectActive} active
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">
                    Rate
                  </div>
                  <div
                    className={`text-xs font-black mt-0.5 ${
                      completionRate >= 75 ? "text-emerald-600" : "text-blue-600"
                    }`}
                  >
                    {completionRate}%
                  </div>
                </div>
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
