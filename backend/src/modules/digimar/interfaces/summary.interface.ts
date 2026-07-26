// ── Summary Performance ──

export interface StoriesKpiRow {
  month: string;
  storiesCreate: number | null;
  growthPct: number | null;
  targetKpiPct: number | null;
  averageView: number | null;
  viewGrowthPct: number | null;
  viewTargetKpiPct: number | null;
}

export interface StoriesKpi {
  instagram: StoriesKpiRow[];
  tiktok: StoriesKpiRow[];
}

export interface TrackerRow {
  month: string;
  engagementRate: number | null;
  growthPct: number | null;
  targetKpiPct: number | null;
  totalFollowers: number | null;
  followerGrowthPct: number | null;
  followerTargetKpiPct: number | null;
  unfollow: number | null;
  unfollowGrowthPct: number | null;
  feedCreate: number | null;
  feedGrowthPct: number | null;
  feedTargetKpiPct: number | null;
  totalPost: number | null;
  totalReach: number | null;
  like: number | null;
  comment: number | null;
  save: number | null;
  share: number | null;
  profileVisit: number | null;
  er: number | null;
  followersGrowth: number | null;
  leads: number | null;
  samples: number | null;
  spend: number | null;
}

export interface SummaryData {
  storiesKpi: StoriesKpi;
  instagram: TrackerRow[];
  tiktok: TrackerRow[];
}
