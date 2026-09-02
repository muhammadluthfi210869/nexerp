// ── Platform Weekly ──

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

export interface WeeklyData {
  rows: WeeklyRow[];
  instagram: WeeklyRow[];
  tiktok: WeeklyRow[];
}
