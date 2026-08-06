"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  marketingProjects,
  marketingTasks,
  marketingPerformance,
} from "./project-management-prototype-data";
import {
  marketingNotifications,
  marketingReportInsights,
  marketingSettings,
  marketingProfiles,
  marketingTeamSummary,
} from "./project-management-prototype-extra-data";

function buildFallbackBundle() {
  return {
    summary: {
      activeProjects: marketingProjects.filter((item) => item.status !== "Completed").length,
      openTasks: marketingTasks.filter((item) => item.status !== "Done").length,
      waitingApproval: marketingTasks.filter((item) => item.status === "Revision").length,
      averageKpi: Math.round(
        marketingPerformance.reduce((sum, item) => sum + item.overallKpi, 0) / marketingPerformance.length,
      ),
    },
    projects: marketingProjects,
    tasks: marketingTasks,
    performance: marketingPerformance,
    notifications: marketingNotifications,
    settings: {
      weights: {
        completion: marketingSettings[0]?.value ?? 40,
        discipline: marketingSettings[1]?.value ?? 30,
        quality: marketingSettings[2]?.value ?? 15,
        productivity: marketingSettings[3]?.value ?? 15,
      },
      workingHours: { start: "08:00", end: "17:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
      appearance: {
        // Fallback offline/dummy: default professional untuk semua akun
        // (tanpa terkecuali — lihat migrasi theme professional).
        departmentDefaultTheme: "professional",
        allowUserOverride: true,
      },
    },
    profiles: marketingProfiles,
    insights: marketingReportInsights,
    reports: {
      averageKpi: marketingTeamSummary.averageKpi,
      teamSize: marketingTeamSummary.totalMembers,
      kpiHistory: marketingPerformance.map((member) => ({
        name: member.name,
        history: [
          { period: "W1", kpi: Math.max(member.overallKpi - 8, 0), discipline: Math.max(member.disciplineScore - 6, 0) },
          { period: "W2", kpi: Math.max(member.overallKpi - 4, 0), discipline: Math.max(member.disciplineScore - 3, 0) },
          { period: "W3", kpi: Math.max(member.overallKpi - 1, 0), discipline: Math.max(member.disciplineScore - 1, 0) },
          { period: "W4", kpi: Math.min(member.overallKpi + 2, 100), discipline: Math.min(member.disciplineScore + 2, 100) },
          { period: "W5", kpi: Math.min(member.overallKpi + 4, 100), discipline: Math.min(member.disciplineScore + 4, 100) },
          { period: "W6", kpi: member.overallKpi, discipline: member.disciplineScore },
        ],
      })),
    },
  };
}

export function useMarketingPrototypeBundle() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["marketing-prototype-bundle", user?.id ?? "anonymous"],
    queryFn: () => api.get("/marketing/prototype/bundle").then((response) => response.data),
    staleTime: 2 * 60 * 1000,
    // placeholderData dihapus — data dummy menyebabkan:
    // 1. Semua task/profil muncul sebelum API selesai
    // 2. viewer.isManager = undefined → fallback ke localStorage role (bisa outdated)
    // Lebih baik loading state daripada data salah
  });
}
