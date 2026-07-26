// ── Content & Posts ──

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
  bestContent: ContentRow[];  // sorted by engagement
}
