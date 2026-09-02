export type UserStatus = 'AKTIF' | 'NON-AKTIF';

export interface BusDevUser {
  id: string;
  name: string;
  status: UserStatus;
  lastAssigned: string | null;
  leadCount: number;
  avatar?: string;
  phone?: string;
  formattedPhone?: string;
  role?: string;
  specialty?: string;
  deviceModel?: string;
}

export type CurrentUserRole = 'SUPER_ADMIN' | 'BUSDEV';

export interface AppAccount {
  id: string;
  name: string;
  role: CurrentUserRole;
  phone: string;
  avatar?: string;
  specialty?: string;
  isSuperAdmin: boolean;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color?: string;
  description?: string;
  autoTag?: string;
  salesbotTrigger?: string;
  actionNotes?: string;
  isLossStage?: boolean;
  isWonStage?: boolean;
}

export type PipelineStage = Stage;

export interface Pipeline {
  id: string;
  name: string;
  roundRobin: boolean;
  stages: Stage[];
  icon?: string;
  assignedBusDevId?: string;
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
  status?: 'SENT' | 'DELIVERED' | 'READ';
}

export interface Lead {
  id: string;
  name: string;
  leadNumber?: string;
  conversationNumber?: string;
  phone: string;
  source: string;
  pipelineId: string;
  stageId: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
  email?: string;
  value?: number;
  lossReason?: string;
  company?: string;
  jobTitle?: string;
  avatarUrl?: string;
  isAnswered?: boolean;
}

export interface AutomationRuleCondition {
  id: string;
  nodeIndex: number;
  keywordMatch: string;
  targetPipelineId?: string;
  targetStageId: string;
  autoTag?: string;
  stopBot: boolean;
  greetingReply?: string;
}

export interface AutomationFlow {
  id: string;
  name: string;
  active: boolean;
  triggerEvent?: 'INBOUND_MESSAGE' | 'LEAD_CREATED';
  conditions: AutomationRuleCondition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BroadcastLogItem {
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
}

export interface TrafficSourceConfig {
  id: string;
  name: string;
  platform: 'META' | 'GOOGLE' | 'TIKTOK' | 'WHATSAPP' | 'OFFLINE' | 'WEBSITE' | 'REFERRAL' | 'OTHER';
  utmSource?: string;
  autoTag?: string;
  color?: string;
  active: boolean;
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
