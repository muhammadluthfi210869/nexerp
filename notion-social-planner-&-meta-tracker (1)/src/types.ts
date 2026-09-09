export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'threads' | 'youtube' | 'linkedin';

export type ContentType = 'reel' | 'carousel' | 'single_post' | 'story' | 'video' | 'live';

export type PostStatus = 'idea' | 'scripting' | 'review' | 'scheduled' | 'published' | 'archived';

export type ContentPillar = 
  | 'Educational' 
  | 'Promotional' 
  | 'Behind The Scenes' 
  | 'Entertainment' 
  | 'Community' 
  | 'Product Highlight' 
  | 'Tips & Tricks';

export interface PostPerformance {
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  videoViews?: number;
  clicks?: number;
  engagementRate: number; // percentage, e.g. 5.4
  viralityScore?: number; // 1-100
  costPerResult?: number; // for meta ads
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface PostItem {
  id: string;
  title: string;
  platform: SocialPlatform;
  contentType: ContentType;
  status: PostStatus;
  scheduledDate: string; // ISO string or YYYY-MM-DDTHH:mm
  publishedDate?: string;
  pillar: ContentPillar;
  caption: string;
  hooks: string[];
  cta: string;
  hashtags: string[];
  coverImage?: string;
  mediaUrls?: string[];
  author: {
    id?: string;
    name: string;
    avatar: string;
    role: string;
  };
  metaPostId?: string;
  metaPermalink?: string;
  notes?: string;
  checklist: ChecklistItem[];
  calloutText?: string;
  calloutEmoji?: string;
  targetAudience?: string;
  campaign?: string;
  performance?: PostPerformance;
  createdAt: string;
  updatedAt: string;
}

export interface MetaAccountConfig {
  accessToken: string;
  pageId: string;
  pageName: string;
  igAccountId: string;
  igUsername: string;
  profilePictureUrl: string;
  isConnected: boolean;
  isLiveApi: boolean;
  tokenExpiresAt?: string;
  permissions: string[];
  followersCount: number;
  igFollowersCount: number;
}

export interface MetaInsightsSummary {
  totalReach: number;
  impressions: number;
  profileVisits: number;
  websiteClicks: number;
  netFollowers: number;
  engagementRate: number;
  reachGrowthPercent: number;
  impressionsGrowthPercent: number;
  engagementGrowthPercent: number;
  followersGrowthPercent: number;
  storiesReach: number;
  reelsViews: number;
  avgEngagementPerPost: number;
}

export interface MetaDailyTrend {
  date: string;
  reach: number;
  impressions: number;
  engagement: number;
  followersGain: number;
  facebookReach: number;
  instagramReach: number;
}

export interface DemographicData {
  ageGender: { group: string; male: number; female: number }[];
  topCities: { city: string; percent: number }[];
  topCountries: { country: string; percent: number }[];
}

export interface BestTimeSlot {
  day: string;
  hourScores: { hour: number; score: number; label: string }[];
}

export interface CampaignOKR {
  id: string;
  title: string;
  objective: string;
  targetMetric: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: 'on_track' | 'at_risk' | 'completed' | 'behind';
  associatedPosts: string[]; // post IDs
  color: string;
}

export type DatabaseViewType = 
  | 'table' 
  | 'board' 
  | 'calendar' 
  | 'gallery' 
  | 'list' 
  | 'meta_analytics' 
  | 'api_hub' 
  | 'campaign_okrs' 
  | 'ai_studio';

export interface ViewFilter {
  platform?: SocialPlatform | 'all';
  status?: PostStatus | 'all';
  pillar?: ContentPillar | 'all';
  month?: string; // 'all' or 'YYYY-MM' e.g. '2026-08'
  search?: string;
  groupByMonth?: boolean;
}

export interface ViewSort {
  field: keyof PostItem | 'performance.reach' | 'performance.engagementRate';
  direction: 'asc' | 'desc';
}
