// ── Match backend response types ──

export interface StoriesKpiRow {
  month: string;
  storiesCreate: number | null;
  growthPct: number | null;
  targetKpiPct: number | null;
  averageView: number | null;
  viewGrowthPct: number | null;
  viewTargetKpiPct: number | null;
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

export interface WeeklyRow {
  month: string;
  platform: 'Instagram' | 'TikTok';
  week: string;
  follow: number | null;
  unfollow: number | null;
  viewers: number | null;
  profileVisit: number | null;
  dm: number | null;
  like: number | null;
  save: number | null;
  share: number | null;
  storiesCount: number | null;
  storiesViews: number | null;
  leads: number | null;
  notes: string;
}

export interface PaidAdsRow {
  month: string;
  channel: string;
  budget: number | null;
  spentLeft: number | null;
  spend: number | null;
  traffic: number | null;
  leads: number | null;
  prospecting: number | null;
  samples: number | null;
  notes: string;
}

export interface PaidAdsData {
  rows: PaidAdsRow[];
  totalBudget: number;
  totalSpend: number;
  totalLeads: number;
  totalSamples: number;
  totalTraffic: number;
  cpl: number | null;
  cpa: number | null;
}

export interface ContentRow {
  month: string;
  date: string;
  day: string;
  platform: string;
  contentType: string;
  category: string;
  objective: string;
  pic: string;
  postUrl: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  copywriting: string;
  hashtag: string;
  contentBrief: string;
  published: string;
}

export interface ContentData {
  rows: ContentRow[];
  instagram: ContentRow[];
  tiktok: ContentRow[];
  bestContent: ContentRow[];
}

export interface WeeklyData {
  rows: WeeklyRow[];
  instagram: WeeklyRow[];
  tiktok: WeeklyRow[];
}

export interface SummaryData {
  storiesKpi: { instagram: StoriesKpiRow[]; tiktok: StoriesKpiRow[] };
  instagram: TrackerRow[];
  tiktok: TrackerRow[];
}

export interface AllData {
  summary: SummaryData;
  weekly: WeeklyData;
  paidAds: PaidAdsData;
  content: ContentData;
  months: string[];
}
