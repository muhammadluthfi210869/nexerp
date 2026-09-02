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
  engagementRate: number;
  viralityScore?: number;
  costPerResult?: number;
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
  scheduledDate: string;
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
  associatedPosts: string[];
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
  | 'campaign_okrs';

export interface ViewFilter {
  platform?: SocialPlatform | 'all';
  status?: PostStatus | 'all';
  pillar?: ContentPillar | 'all';
  search?: string;
}

export interface ViewSort {
  field: keyof PostItem | 'performance.reach' | 'performance.engagementRate';
  direction: 'asc' | 'desc';
}
