// Communication thread types — Wave 3 D1.Frontend (Phase 3)
// Mirrors the contract D1.Backend is building at /v1/communications/*.
// ponytail: lean shapes — no derived fields, all optional except id + createdAt.
// Real-time WS shapes added once D1.Backend publishes events.

export type ThreadStatus = "OPEN" | "CLOSED" | "ARCHIVED";
export type ReplyUrgency = "NORMAL" | "PENTING" | "URGENT";
export type NotificationKind = "mention" | "approval" | "thread_reply" | "system";

export interface CommUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
  initial?: string;
  avatarBg?: string;
}

export interface CommAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  isImage: boolean;
  uploadedById?: string;
  createdAt: string;
}

export interface CommReply {
  id: string;
  threadId: string;
  parentReplyId?: string | null;
  authorId: string;
  authorName: string;
  authorRole?: string;
  body: string;
  urgency: ReplyUrgency;
  mentionIds: string[];
  mentions?: CommUser[];
  attachments: CommAttachment[];
  createdAt: string;
}

export interface CommThread {
  id: string;
  title: string;
  contextType?: string | null;
  contextId?: string | null;
  status: ThreadStatus;
  participantIds: string[];
  participants?: CommUser[];
  replyCount: number;
  lastActivityAt: string;
  unreadCount?: number;
  createdAt: string;
}

export interface CommNotification {
  id: string;
  kind: NotificationKind;
  threadId?: string;
  replyId?: string;
  actorId?: string;
  actorName?: string;
  title: string;
  preview?: string;
  readAt: string | null;
  createdAt: string;
}

export interface CreateReplyInput {
  body: string;
  urgency?: ReplyUrgency;
  mentionIds?: string[];
  attachmentIds?: string[];
  parentReplyId?: string | null;
}

export interface ListThreadsQuery {
  contextType?: string;
  status?: ThreadStatus | "all";
  q?: string;
  page?: number;
  limit?: number;
}