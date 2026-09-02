// Compat layer: provides Prisma enum values for frontend code that imports
// from "@prisma/client" without requiring prisma generate to have run.
//
// Backend enums are defined in backend/prisma/schema/enums.prisma — keep
// this file in sync if the backend schema changes.
//
// Used by restored main-branch pages (e.g. BussdevActionDialog.tsx) so
// they can build without generated @prisma/client.

export const ActivityType = {
  CHAT: 'CHAT',
  CALL: 'CALL',
  MEETING_OFFLINE: 'MEETING_OFFLINE',
  MEETING_ONLINE: 'MEETING_ONLINE',
  SAMPLE_PAYMENT: 'SAMPLE_PAYMENT',
  DOWN_PAYMENT: 'DOWN_PAYMENT',
  FINAL_PAYMENT: 'FINAL_PAYMENT',
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const WorkflowStatus = {
  NEW_LEAD: 'NEW_LEAD',
  CONTACTED: 'CONTACTED',
  FOLLOW_UP_1: 'FOLLOW_UP_1',
  FOLLOW_UP_2: 'FOLLOW_UP_2',
  FOLLOW_UP_3: 'FOLLOW_UP_3',
  NEGOTIATION: 'NEGOTIATION',
  SAMPLE_REQUESTED: 'SAMPLE_REQUESTED',
  SAMPLE_SENT: 'SAMPLE_SENT',
  SAMPLE_APPROVED: 'SAMPLE_APPROVED',
  SPK_SIGNED: 'SPK_SIGNED',
  WAITING_FINANCE_APPROVAL: 'WAITING_FINANCE_APPROVAL',
  DP_PAID: 'DP_PAID',
  PRODUCTION_PLAN: 'PRODUCTION_PLAN',
  READY_TO_SHIP: 'READY_TO_SHIP',
  WON_DEAL: 'WON_DEAL',
  LOST: 'LOST',
  ABORTED: 'ABORTED',
} as const;
export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus];

export const ProductCategory = {
  SKINCARE: 'SKINCARE',
  BODYCARE: 'BODYCARE',
  BABYCARE: 'BABYCARE',
  HAIRCARE: 'HAIRCARE',
  DECORATIVE: 'DECORATIVE',
  PARFUM: 'PARFUM',
  FOOTCARE: 'FOOTCARE',
} as const;
export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory];

export const LostReason = {
  PRICE: 'PRICE',
  QUALITY: 'QUALITY',
  COMPETITOR: 'COMPETITOR',
  GHOSTING: 'GHOSTING',
  PRICE_ISSUE: 'PRICE_ISSUE',
  UNRESPONSIVE: 'UNRESPONSIVE',
  PRODUCT_MISMATCH: 'PRODUCT_MISMATCH',
  OTHER: 'OTHER',
  MOQ_TOO_HIGH: 'MOQ_TOO_HIGH',
} as const;
export type LostReason = (typeof LostReason)[keyof typeof LostReason];
