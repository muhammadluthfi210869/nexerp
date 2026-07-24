// ═══════════════════════════════════════════════════════════════
// R&D SHARED CONSTANTS — Satu sumber kebenaran untuk semua komponen RND
// ═══════════════════════════════════════════════════════════════

// ── RND TEAM ──
export const RND_PICS = ["Panca", "Yaya", "Amira"] as const;
export type RndPic = (typeof RND_PICS)[number];

// ── DAILY TRACKING ──
export const DT_CATEGORIES = ["New Sample", "Revisi", "Stability", "Benchmark", "Innovation", "Documentation", "Scale Up", "Admin"] as const;
export const DT_STATUSES = ["Done", "On Progress", "Pending", "Failed Trial", "Waiting Material", "Waiting Approval", "Cancelled"] as const;
export const DT_PROGRESS_STEPS = [0, 25, 50, 75, 100] as const;
export const BUSDEV_OPTIONS = ["Ami", "Annisa", "Mada"] as const;

// ── PROJECT MONITORING ──
export const PM_STATUSES = ["In progress", "Pending", "Ready To send", "Terkirim", "Revisi", "Cancelled"] as const;
export const PM_CATEGORIES = ["New Product", "Revision", "Reformulation", "Innovation", "Scale Up"] as const;

// ── COLOR MAPS ──
export const STATUS_STYLES: Record<string, string> = {
  // Daily Tracking
  Done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "On Progress": "bg-blue-50 text-blue-700 border-blue-200",
  "Failed Trial": "bg-rose-50 text-rose-700 border-rose-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "Waiting Material": "bg-purple-50 text-purple-700 border-purple-200",
  "Waiting Approval": "bg-indigo-50 text-indigo-700 border-indigo-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  // Project Monitoring
  Terkirim: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Ready To send": "bg-blue-50 text-blue-700 border-blue-200",
  "In progress": "bg-amber-50 text-amber-700 border-amber-200",
  Revisi: "bg-rose-50 text-rose-700 border-rose-200",
};

export const PROGRESS_COLORS = (pct: number) =>
  pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct > 0 ? "bg-amber-500" : "bg-slate-200";

// ── STYLING TOKENS (single source of truth) ──
export const TYPOGRAPHY = {
  tableHeader: "text-[10px] font-black uppercase tracking-wider text-slate-400",
  tableCell: "text-[12px] leading-5",
  badge: "text-[10px] font-bold",
  chip: "text-[10px] font-bold uppercase",
  sectionTitle: "text-[12px] font-black uppercase",
  statLabel: "text-[9px] font-semibold uppercase tracking-wider text-slate-400",
  statValue: "text-[11px] font-bold",
  label: "text-[9px] font-black uppercase tracking-[0.08em] text-slate-400",
} as const;

export const CHIP_CLASSES = {
  active: "bg-blue-600 text-white",
  inactive: "bg-slate-100 text-slate-500 hover:bg-slate-200",
} as const;

export const CARD_CLASS = "rounded-[24px] border bg-white p-5";
export const TABLE_WRAPPER = "rounded-[24px] border border-slate-100 bg-white overflow-hidden";

/**
 * Weighted score calculation (guidebook Bab 9.3)
 * Digunakan oleh WeeklyPerformanceTab dan MonthlyKpiTab
 */
export function calcWeightedScore(params: {
  ontimePct: number;
  trialSuccessRate: number;
  initiativeScore: number;
  revisionCount?: number;
  revisionRate?: number;
  doneCount?: number;
  totalTask?: number;
  knowledgeContribution?: number;
}): number {
  const {
    ontimePct, trialSuccessRate, initiativeScore,
    revisionCount = 0, revisionRate,
    doneCount = 0, totalTask = 0,
    knowledgeContribution = 0,
  } = params;

  // Revision score: 100 - min(revisionCount * 10, 100) OR 100 - revisionRate
  const revScore = revisionRate !== undefined
    ? Math.max(0, 100 - revisionRate)
    : Math.max(0, 100 - Math.min(revisionCount * 10, 100));

  // Done rate
  const doneRate = totalTask > 0 ? (doneCount / totalTask) * 100 : 0;

  return Math.round(
    (ontimePct * 0.30) +
    (trialSuccessRate * 0.25) +
    (initiativeScore * 0.25) +
    (revScore * 0.10) +
    ((knowledgeContribution || doneRate) * 0.10)
  );
}

/**
 * Derive grade dari composite score (sama seperti Monthly KPI)
 */
export function deriveGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  return "D";
}
