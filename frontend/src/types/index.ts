export interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
}

export interface Activity {
  id: string;
  lead_id: string;
  activity_type: string;
  notes: string;
  created_at: string;
}

export interface Lead {
  id: string;
  client_name: string;
  phone_number: string;
  city: string;
  source_id: string;
  campaign_name?: string;
  status: string;
  is_high_value: boolean;
  is_sla_warning: boolean;
  bd_id: string;
  bd?: {
    full_name: string;
  };
  activities?: Activity[];
  created_at: string;
}

export interface SocialMetric {
  id: string;
  platform: string;
  total_reach: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  followers_count: number;
  created_at: string;
}

export interface Metric {
  id: string;
  date: string;
  platform: string;
  ad_spend: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
}

