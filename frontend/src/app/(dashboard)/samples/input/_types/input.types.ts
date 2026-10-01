import { LucideIcon } from "lucide-react";

export type Platform =
  | "IG_ADS"
  | "TIKTOK_ADS"
  | "FB_ADS"
  | "GOOGLE_ADS"
  | "IG_ORGANIC"
  | "TIKTOK_ORGANIC"
  | "FB_ORGANIC";

export interface AdsEntry {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  leadsGenerated: number;
}

export interface OrganicEntry {
  totalFollowers: number;
  followerGrowth: number;
  unfollows: number;
  totalReach: number;
  profileVisits: number;
  postsCount: number;
  storiesCount: number;
  avgStoryViews: number;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
}

export interface ContentData {
  publishDate: string;
  platform: string;
  contentPillar: string;
  title: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface TargetData {
  month: number;
  year: number;
  adBudget: number;
  leadTarget: number;
  postTarget: number;
  revenueTarget: number;
}

export interface BaselineEntry {
  platform: string;
  spend?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  leadsGenerated?: number;
  totalFollowers?: number;
  totalReach?: number;
  [key: string]: any;
}

export interface MatrixTotals {
  s: number;
  l: number;
  c: number;
  i: number;
}

export interface OrganicTotals {
  followers: number;
  reach: number;
  posts: number;
  engagement: number;
}

export interface MatrixRowProps {
  label: string;
  icon: LucideIcon;
  platforms: string[];
  field: string;
  matrix: Record<string, any>;
  setMatrix: React.Dispatch<React.SetStateAction<any>>;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
  startIdx: number;
  prefix?: string;
  important?: boolean;
  accent?: string;
  baseline?: BaselineEntry[];
  showCalc?: (platform: string) => string | null;
}

export interface QuotaRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function getCriticalCardClass(isCritical: boolean): string {
  return isCritical
    ? "border-[#FECDD3] shadow-[0_0_0_1px_rgba(220,38,38,0.08),0_18px_40px_-16px_rgba(220,38,38,0.34)]"
    : "border-slate-200 shadow-sm";
}
