export type UserStatus = 'AKTIF' | 'NON-AKTIF';

export interface BusDevUser {
  id: string; // e.g., 'user_1'
  name: string; // e.g., 'Diaz'
  status: UserStatus;
  lastAssigned: string | null; // ISO Date string e.g., '2026-09-01T08:00:00Z'
  leadCount: number;
  avatar?: string;
  phone?: string; // e.g., '6281277889904'
  formattedPhone?: string; // e.g., '+62 812-7788-9904'
  role?: string;
  specialty?: string; // e.g., 'Maklon Skincare & Serum'
  deviceModel?: string; // e.g., 'Samsung Galaxy S24 (WhatsApp Bisnis)'
  whatsappAccountKey?: string;
  whatsappConfigured?: boolean;
}

export type CurrentUserRole = 'SUPER_ADMIN' | 'BUSDEV';

export interface AppAccount {
  id: string; // 'admin' or user id
  name: string;
  role: CurrentUserRole;
  phone: string;
  avatar?: string;
  specialty?: string;
  isSuperAdmin: boolean;
  whatsappAccountKey?: string;
}

export interface Stage {
  id: string; // e.g., 'stage_traffic_meta_ads'
  name: string; // e.g., 'TRAFFIC META ADS'
  order: number;
  color?: string;
  description?: string; // Instruction text e.g. 'Setelah pindah ke tahap ini: Jalankan Salesbot: Ami greeting Meta Ads'
  autoTag?: string; // e.g. 'Meta Ads - Ami'
  salesbotTrigger?: string; // e.g. 'Ami greeting Meta Ads'
  actionNotes?: string;
  isLossStage?: boolean;
  isWonStage?: boolean;
}

export type PipelineStage = Stage;

export interface Pipeline {
  id: string; // e.g., 'pipe_1'
  name: string; // e.g., 'Pipeline Round Robin'
  roundRobin: boolean; // true = AKTIF, false = NON-AKTIF
  stages: Stage[];
  icon?: string;
  assignedBusDevId?: string; // Optional direct owner
}

export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageChannel = 'WHATSAPP_HP' | 'CRM_WEB' | 'WHATSAPP_CLIENT';

export interface WhatsAppMessage {
  id: string;
  leadId: string;
  senderName: string;
  message: string;
  direction: MessageDirection;
  channel: MessageChannel;
  timestamp: string;
  tags?: string[];
  autoMovedStageTo?: string;
  replyTo?: {
    timestamp: string;
    sender: string;
    text: string;
  };
  status?: 'SENT' | 'DELIVERED' | 'READ';
}

export interface Lead {
  id: string; // e.g., 'lead_101'
  name: string; // e.g., 'Neil Royan'
  leadNumber?: string; // e.g., '28981912'
  conversationNumber?: string; // e.g., 'A23424'
  phone: string; // e.g., '6281283069717'
  source: string; // e.g., 'Meta Ads', 'Google Ads', 'Link Tree', etc.
  pipelineId: string; // e.g., 'pipe_anisa'
  stageId: string; // e.g., 'stage_client_deal'
  assignedTo: string | null; // user_anisa or null
  assignedName?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
  email?: string;
  value?: number;
  lossReason?: string;
  company?: string;
  jobTitle?: string;
  upcomingAppointments?: string;
  formLink?: string;
  stageDurationDays?: number;
  avatarUrl?: string;
  isAnswered?: boolean;
}

export interface AutomationRuleCondition {
  id: string;
  nodeIndex: number;
  keywordMatch: string; // e.g., "Halo Dreamlab, saya ingin konsultasi maklon..."
  targetPipelineId?: string; // e.g. 'pipe_diaz'
  targetStageId: string; // e.g. 'stage_traffic_link_tree'
  autoTag?: string; // e.g. 'Link Tree - Ami'
  stopBot: boolean;
  greetingReply?: string;
  isFallback?: boolean;
}

export interface AutomationFlow {
  id: string;
  name: string; // e.g. 'AMI INCOMING LEADS NEW'
  active: boolean;
  triggerEvent?: 'INBOUND_MESSAGE' | 'LEAD_CREATED';
  triggerType?: string;
  conditions: AutomationRuleCondition[];
  fallbackTargetStageId?: string;
  fallbackAutoTag?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BroadcastLogItem {
  id?: string;
  source?: string;
  leadId: string;
  leadName: string;
  phone: string;
  renderedMessage: string;
  delaySeconds: number;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
}

export interface BroadcastExecution {
  id: string;
  sourceFilter: string;
  templateText: string;
  totalRecipients: number;
  successfulSends: number;
  failedSends: number;
  items: BroadcastLogItem[];
  startedAt: string;
  completedAt?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface EngineLog {
  id: string;
  action:
    | 'intake_guestbook'
    | 'toggle_busdev_status'
    | 'move_lead_stage'
    | 'sync_whatsapp_message'
    | 'execute_broadcast'
    | 'toggle_pipeline_rr'
    | 'salesbot_auto_move'
    | 'system_reset';
  timestamp: string;
  params: Record<string, any>;
  resultSummary: string;
  structuredOutput: Record<string, any>;
  details?: string;
  metadata?: Record<string, any>;
}

export interface TrafficSourceConfig {
  id: string;
  name: string;
  platform: 'META' | 'GOOGLE' | 'TIKTOK' | 'WHATSAPP' | 'OFFLINE' | 'WEBSITE' | 'REFERRAL' | 'OTHER';
  utmSource?: string;
  autoTag?: string;
  leadCount?: number;
  totalValue?: number;
  color?: string;
  icon?: string;
  active: boolean;
}

export interface KlaviyoAudienceFilter {
  id?: string;
  name?: string;
  sourceFilter: string; // 'ALL' or specific source like 'Meta Ads', 'Google Ads', 'Link Tree', 'Google Organic', 'Junk'
  stageFilter: string; // 'ALL', 'stage_lead_masuk', 'stage_cold', 'stage_warm', 'stage_hot', 'stage_sample', 'stage_junk_leads'
  productCategory: string; // 'ALL', 'Skincare', 'Parfum', 'Haircare', 'Bodycare', 'Lipcare'
  minValue: number; // e.g. 0, 25000000, 50000000
  interactionRecency: string; // 'ALL', 'LAST_24H', 'LAST_3D', 'LAST_7D', 'INACTIVE_7D_PLUS'
  excludeJunk: boolean;
  busDevId: string; // 'ALL' or specific busdev id
  tagFilter?: string;
}

export interface CRMState {
  pipelines: Pipeline[];
  busDevs: BusDevUser[];
  leads: Lead[];
  messages: WhatsAppMessage[];
  broadcasts: BroadcastExecution[];
  logs: EngineLog[];
  automationFlows: AutomationFlow[];
  activeFlowId: string;
  trafficSources?: TrafficSourceConfig[];
}
