import {
  Inbox,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Beaker,
  CheckCircle2,
  FileText,
  Wallet,
  Factory,
  Package,
  XCircle,
} from "lucide-react";

type StageConfig = { label: string; color: string; bg: string; icon?: any };

export const STAGES: Record<string, StageConfig> = {
  NEW_LEAD: { label: "New Lead", color: "text-slate-500", bg: "bg-slate-100", icon: Inbox },
  CONTACTED: { label: "Contacted", color: "text-blue-500", bg: "bg-blue-100", icon: MessageSquare },
  FOLLOW_UP_1: { label: "Follow Up 1", color: "text-blue-500", bg: "bg-blue-100", icon: TrendingUp },
  FOLLOW_UP_2: { label: "Follow Up 2", color: "text-blue-500", bg: "bg-blue-100", icon: TrendingUp },
  FOLLOW_UP_3: { label: "Follow Up 3", color: "text-blue-500", bg: "bg-blue-100", icon: TrendingUp },
  NEGOTIATION: { label: "Negotiation", color: "text-amber-500", bg: "bg-amber-100", icon: DollarSign },
  SAMPLE_REQUESTED: { label: "Sample Requested", color: "text-blue-500", bg: "bg-blue-100", icon: Beaker },
  SAMPLE_APPROVED: { label: "Sample Approved", color: "text-teal-500", bg: "bg-teal-100", icon: CheckCircle2 },
  SPK_SIGNED: { label: "SPK Signed", color: "text-rose-500", bg: "bg-rose-100", icon: FileText },
  DP_PAID: { label: "DP Paid", color: "text-emerald-500", bg: "bg-emerald-100", icon: Wallet },
  PRODUCTION_PLAN: { label: "Production Plan", color: "text-green-500", bg: "bg-green-100", icon: Factory },
  READY_TO_SHIP: { label: "Ready to Ship", color: "text-blue-600", bg: "bg-blue-100", icon: Package },
  WON_DEAL: { label: "Won Deal", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle2 },
  LOST: { label: "Lost", color: "text-rose-600", bg: "bg-rose-100", icon: XCircle },
};

export const SAMPLE_STAGES: Record<string, StageConfig> = {
  NEW_LEAD: STAGES.NEW_LEAD,
  CONTACTED: STAGES.CONTACTED,
  FOLLOW_UP_1: STAGES.FOLLOW_UP_1,
  FOLLOW_UP_2: STAGES.FOLLOW_UP_2,
  FOLLOW_UP_3: STAGES.FOLLOW_UP_3,
  NEGOTIATION: STAGES.NEGOTIATION,
  SAMPLE_REQUESTED: STAGES.SAMPLE_REQUESTED,
  SAMPLE_APPROVED: STAGES.SAMPLE_APPROVED,
};

export const PRODUCTION_STAGES: Record<string, StageConfig> = {
  SPK_SIGNED: STAGES.SPK_SIGNED,
  DP_PAID: STAGES.DP_PAID,
  PRODUCTION_PLAN: STAGES.PRODUCTION_PLAN,
  READY_TO_SHIP: STAGES.READY_TO_SHIP,
  WON_DEAL: STAGES.WON_DEAL,
};
