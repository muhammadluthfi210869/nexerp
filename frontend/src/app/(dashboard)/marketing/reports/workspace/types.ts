export type TaskType = 'Daily' | 'Project';
export type TaskStatus = 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Late';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  project?: string;
  assignee: string; // Member name
  assigneeId?: string; // Member user / team id
  brand?: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  link?: string;
  reference?: string;
  caption?: string;
  brief?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  createdAt: string;
}

export interface Member {
  id: string;
  userId?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatarBg: string;
  initial: string;
  department: string;
}

export type PostFormat = 'Reels' | 'Carousel' | 'Single' | 'Story' | 'TikTok' | 'Video' | 'Shorts';
export type PostPlatform = 'Instagram' | 'TikTok' | 'YouTube' | 'LinkedIn' | 'Website' | 'Paid Ads';
export type PostStatus = 'Planning' | 'Brief' | 'Draft' | 'Production' | 'Review' | 'Published' | 'Late';

export interface PostMetrics {
  views: number; // Kuantitas Views / Video Plays / Impressions
  reach: number; // Unique accounts reached
  likes: number; // Likes
  comments: number; // Comments
  shares: number; // Shares
  saves: number; // Saves / Bookmarks
  avgWatchPercentage?: number; // e.g. 65% watch retention
  engagementRate?: number; // Calculated ER %
  leadsContributed?: number; // Direct leads / DM inquiries from this post
  sampleRequests?: number; // Sample kit / formulation sample requests generated
}

export interface SocialPost {
  id: string;
  brandId: string; // Brand name or id
  platform?: PostPlatform; // 'Instagram' | 'TikTok' | 'YouTube' | 'LinkedIn'
  title: string;
  date: string; // YYYY-MM-DD
  format: PostFormat;
  status: PostStatus;
  pic: string; // Member name
  progress: number; // 0 to 100
  imageUrl?: string; // Media preview image or uploaded photo of the content
  hook?: string;
  soundTrend?: string; // Sound/Audio trend (specifically for TikTok/Reels)
  targetAngle?: string; // Content angle / audience target
  ctaLink?: string; // Call-to-action / Bio link / Sample request link
  caption?: string;
  brief?: string;
  reference?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  metrics?: PostMetrics;
}

export interface Brand {
  id: string;
  name: string;
  handle: string;
  initial: string;
  color: string;
  primaryPlatform: string;
  pic: string;
  note: string;
}

export interface PlatformMetric {
  platform: 'Instagram' | 'TikTok' | 'LinkedIn' | 'YouTube' | string;
  followers: number;
  followersGrowth: number;
  reach: number;
  views: number;
  engagementRate: number;
  postsCount: number;
}

export interface WeeklyTrend {
  week: string; // 'Minggu 1', 'Minggu 2', etc.
  reach: number;
  views: number;
  engagement: number;
  impressions: number;
  followersGained?: number;
  followersUnfollowed?: number;
}

export interface FormatPerformance {
  format: string;
  postsCount: number;
  avgEngagementRate: number;
  avgReach: number;
  avgViews: number;
}

export interface DailyStoryRecap {
  id: string;
  date: string; // e.g. "2026-09-09"
  dayNumber: number; // e.g. 9
  dayName?: string; // e.g. "Rabu"
  storiesCount: number; // Berapa stories dibuat/update hari tersebut
  totalViews: number; // Total kuantitas view dari stories hari itu
  avgViewsPerStory?: number; // Rata-rata view per story pada hari itu
  replies?: number; // Balasan pesan / DM
  linkClicks?: number; // Tap stiker link
  shares?: number; // Shares
  topicOrTheme?: string; // Topik/tema update harian
  note?: string;
}

export interface StoriesMonthlyRecap {
  totalStoriesCreated: number; // Total stories dibuat dalam bulan itu
  totalStoryViews: number; // Total view akumulasi stories dalam bulan itu
  avgViewsPerStory: number; // Rata-rata view per story
  avgStoriesPerDay?: number; // Rata-rata stories per hari
  completionRate?: number; // Persentase completion penonton
  dailyStories?: DailyStoryRecap[];
}

export interface FollowerDynamics {
  followersGained: number; // Followers baru (+ Follow)
  followersUnfollowed: number; // Followers unfollow (- Unfollow)
  netGrowth: number; // Net pertumbuhan
  unfollowRate: number; // Persentase unfollow
}

export interface WeeklyReportData {
  id: string;
  weekNumber: number; // 1, 2, 3, 4, 5
  weekLabel: string; // 'Minggu 1', 'Minggu 2', etc.
  dateRange: string; // e.g. '1 - 7 Sep 2026'

  // Metrik Followers & Pertumbuhan per Week
  startingFollowers?: number;
  followersGained: number; // Followers baru (+ Follow)
  followersUnfollowed: number; // Akun yang unfollow (- Unfoll)
  netGrowth: number; // Net pertumbuhan = followersGained - followersUnfollowed
  growthPercent?: number; // % pertumbuhan mingguan
  endingFollowers: number; // Total followers di akhir minggu

  // Metrik Engagement per Week
  views: number; // Kuantitas Views konten minggu ini
  reach: number; // Total reach jangkauan akun minggu ini
  impressions?: number;
  totalEngagement: number; // Total interaksi seminggu
  engagementRate: number; // ER % mingguan
  likes: number;
  comments: number;
  shares: number;
  saves: number;

  // Metrik Stories per Week
  storiesCount: number; // Jumlah story ditayangkan minggu ini
  totalStoryViews: number; // Total views akumulasi story seminggu
  avgViewsPerStory: number; // Rata-rata views per story
  storyReplies?: number; // Balasan/DM story
  storyCompletionRate?: number; // % completion rate

  // Evaluasi mingguan
  highlights?: string;
  notes?: string;
}

export interface ChannelLeadFunnel {
  channel: 'Instagram' | 'TikTok' | 'YouTube' | 'Website' | 'Meta Ads' | 'Google Ads';
  traffic: number; // Impressions / Views / Sessions
  prospects: number; // Contributed Leads / Inquiries
  nurturingSamples: number; // Product sample kits / Formulation testing sent
  goals: number; // Closed Deals / Won Contracts / Paying Customers
  conversionRate: number; // Leads to Goals %
  spend?: number; // Ad spend if paid channel
  cpl?: number; // Cost per Lead in IDR
  dealValue?: number; // Estimated closed deal value in IDR
  notes: string;
}

export interface TikTokTopVideo {
  id: string;
  title: string;
  hook: string;
  views: number;
  likes: number;
  shares: number;
  saves: number;
  retentionRate: number; // %
  leadsContributed: number;
  sampleRequests: number;
}

export interface TikTokReportData {
  followers: number;
  followersGained: number;
  totalViews: number;
  avgWatchRetention: number; // %
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  profileVisits: number;
  bioLinkClicks: number;
  leadsContributed: number;
  sampleRequests: number;
  topVideos: TikTokTopVideo[];
}

export interface YouTubeTopVideo {
  id: string;
  title: string;
  format: 'Video' | 'Shorts';
  views: number;
  watchTimeHours: number;
  ctr: number; // %
  leadsContributed: number;
  sampleRequests: number;
}

export interface YouTubeReportData {
  subscribers: number;
  subsGained: number;
  totalViews: number;
  watchTimeHours: number;
  avgViewDuration: string;
  impressions: number;
  ctr: number;
  leadsContributed: number;
  sampleRequests: number;
  trafficSources: { source: string; percentage: number }[];
  topVideos: YouTubeTopVideo[];
}

export interface WebsiteTask {
  id: string;
  title: string;
  category: 'SEO Optimization' | 'Landing Page' | 'Blog Article' | 'CRO & Sample Form' | 'Technical & Speed';
  assignee: string;
  targetQuery?: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Review' | 'Completed';
  impact: string; // e.g. "+520 Organic Impressions / +12 Leads"
}

export interface WebsiteQueryMetric {
  id: string;
  queryName: string;
  impressions: number; // Search Console impressions
  clicks: number; // Organic clicks
  ctr: number; // %
  avgPosition: number; // Ranking position
  leadsTraffic: number; // Inquiries/leads generated from this query
  sampleRequests: number; // Sample kit / formula testing forms submitted
  landingPage: string;
}

export interface WebsiteReportData {
  totalSessions: number;
  totalUsers: number;
  organicImpressions: number;
  organicClicks: number;
  avgCtr: number;
  avgPosition: number;
  leadsTraffic: number;
  sampleRequests: number;
  conversionRate: number; // %
  queries: WebsiteQueryMetric[];
  tasks: WebsiteTask[];
}

export interface MetaAdsCreativePerformance {
  id: string;
  creativeName: string;
  hook: string;
  format: 'Video / Reel' | 'Carousel' | 'Single Image' | 'Catalog';
  visualAngle: string;
  spend: number; // IDR
  impressions: number;
  clicks: number;
  ctr: number; // %
  hookRate: number; // 3-second video view %
  leadsContributed: number;
  cpl: number; // Cost per Lead IDR
  sampleRequests: number;
  status: 'Top Performer' | 'Active' | 'Fatigue' | 'Testing';
  actionRecommendation: string;
}

export interface MetaAdsReportData {
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  leadsContributed: number;
  cpl: number;
  sampleRequests: number;
  roas: number;
  creatives: MetaAdsCreativePerformance[];
}

export interface GoogleAdsQueryMetric {
  keyword: string;
  matchType: 'Exact' | 'Phrase' | 'Broad';
  impressions: number;
  clicks: number;
  cpc: number;
  leadsContributed: number;
  conversionRate: number;
  cpl: number;
}

export interface GoogleAdsCampaign {
  name: string;
  type: 'Search' | 'Performance Max' | 'Display / Retargeting';
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
}

export interface GoogleAdsReportData {
  spend: number;
  impressions: number;
  clicks: number;
  avgCpc: number;
  ctr: number;
  leadsContributed: number;
  costPerLead: number;
  conversionRate: number;
  campaigns: GoogleAdsCampaign[];
  topQueries: GoogleAdsQueryMetric[];
}

export interface BrandReport {
  id: string;
  brandId: string;
  monthYear: string; // e.g. "September 2026"
  totalFollowers: number;
  followersGained: number; // Followers baru
  followersUnfollowed: number; // Akun yang unfollow
  followersNetGrowth: number; // Net penambahan followers
  followersGrowthPercent: number;
  
  // Views & Reach
  totalViews: number; // Akumulasi kuantitas view konten
  averageViewsPerPost: number; // Rata-rata view per postingan
  totalReach: number;
  reachGrowthPercent: number;
  totalImpressions: number;
  impressionsGrowthPercent: number;
  
  // Engagements
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  totalEngagements: number;
  engagementRate: number;
  engagementRateChange: number;
  
  // Stories Recap
  storiesRecap?: StoriesMonthlyRecap;

  // Weekly Reports
  weeklyReports?: WeeklyReportData[];

  // Lead Funnel (Traffic >> Prospect >> Nurturing / Sample >> Goals)
  leadFunnels?: ChannelLeadFunnel[];

  // Multi-Channel Detailed Reports
  tiktokReport?: TikTokReportData;
  youtubeReport?: YouTubeReportData;
  websiteReport?: WebsiteReportData;
  metaAdsReport?: MetaAdsReportData;
  googleAdsReport?: GoogleAdsReportData;

  totalPostsPublished: number;
  platformBreakdown: PlatformMetric[];
  weeklyTrends: WeeklyTrend[];
  formatPerformance: FormatPerformance[];
  executiveSummary: string;
  strategicRecommendations: string[];
}

export type ActivePage = 
  | { type: 'overview' }
  | { type: 'member'; memberName: string }
  | { type: 'social-planner'; brandName: string; initialChannel?: string }
  | { type: 'social-report'; brandName: string; initialTab?: string };
