// Communication service — Wave 3 D1.Frontend
// Pattern mirrors marketing-service.ts: Mock impl for dev, HTTP impl flips on
// when D1.Backend lands /v1/communications/* + /v1/ws. NEXT_PUBLIC_COMM_API_MODE=real.
//
// ponytail: minimal surface — only what the 5 DNA primitives call. Add
// features (read/unread counts, typing indicators) when a real call needs them.

import type {
  CommAttachment,
  CommNotification,
  CommReply,
  CommThread,
  CommUser,
  CreateReplyInput,
  ListThreadsQuery,
} from "@/types/communication";

export interface ICommunicationService {
  // threads
  listThreads(viewer: CommUser, query: ListThreadsQuery): Promise<{ items: CommThread[]; total: number }>;
  getThread(viewer: CommUser, threadId: string): Promise<CommThread>;
  // replies
  listReplies(viewer: CommUser, threadId: string): Promise<CommReply[]>;
  createReply(viewer: CommUser, threadId: string, input: CreateReplyInput): Promise<CommReply>;
  // users (for @mention autocomplete)
  searchUsers(viewer: CommUser, q: string): Promise<CommUser[]>;
  // attachments
  uploadAttachment(viewer: CommUser, file: File): Promise<CommAttachment>;
  // notifications
  listNotifications(viewer: CommUser): Promise<CommNotification[]>;
  markNotificationRead(viewer: CommUser, notificationId: string): Promise<void>;
}

// ─── Seed ────────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();

const usersSeed: CommUser[] = [
  { id: "u-revita", name: "Revita", email: "revita@dreamlab.id", role: "Digital Marketing Lead", initial: "R", avatarBg: "#fce7f3" },
  { id: "u-gusti", name: "Gusti Raditya", email: "gusti@dreamlab.id", role: "Lead Digital & Brand Strategist", initial: "G", avatarBg: "#dbeafe" },
  { id: "u-andra", name: "Andra", email: "andra@dreamlab.id", role: "Content Creator", initial: "A", avatarBg: "#dcfce7" },
  { id: "u-erwin", name: "Erwin", email: "erwin@dreamlab.id", role: "Finance Controller", initial: "E", avatarBg: "#fef3c7" },
  { id: "u-amira", name: "Amira", email: "amira@dreamlab.id", role: "R&D Formulator", initial: "A", avatarBg: "#ede9fe" },
  { id: "u-panca", name: "Panca", email: "panca@dreamlab.id", role: "R&D Senior", initial: "P", avatarBg: "#fee2e2" },
];

const viewer: CommUser = usersSeed[0];

const attachmentsSeed: CommAttachment[] = [];

const repliesSeed: CommReply[] = [
  {
    id: "r-1",
    threadId: "t-1",
    parentReplyId: null,
    authorId: "u-amira",
    authorName: "Amira",
    authorRole: "R&D Formulator",
    body: "Sample B5 batch ke-2 sudah ready. Butuh QC rilis sebelum masuk produksi massal @Erwin mohon dicek.",
    urgency: "PENTING",
    mentionIds: ["u-erwin"],
    mentions: [usersSeed[3]],
    attachments: [],
    createdAt: "2026-09-13T08:30:00Z",
  },
  {
    id: "r-2",
    threadId: "t-1",
    parentReplyId: null,
    authorId: "u-erwin",
    authorName: "Erwin",
    authorRole: "Finance Controller",
    body: "Noted. Akan release COGS setelah verifikasi HPP @Amira. Estimasi 2 jam.",
    urgency: "NORMAL",
    mentionIds: ["u-amira"],
    mentions: [usersSeed[4]],
    attachments: [],
    createdAt: "2026-09-13T09:15:00Z",
  },
  {
    id: "r-3",
    threadId: "t-1",
    parentReplyId: "r-2",
    authorId: "u-amira",
    authorName: "Amira",
    authorRole: "R&D Formulator",
    body: "Thanks! Link CoA: lihat lampiran.",
    urgency: "NORMAL",
    mentionIds: [],
    mentions: [],
    attachments: [],
    createdAt: "2026-09-13T09:20:00Z",
  },
];

const threadsSeed: CommThread[] = [
  {
    id: "t-1",
    title: "Rilis Sample B5 Batch #2 — Dreamlab Q3",
    contextType: "formulation",
    contextId: "formula-b5-v2",
    status: "OPEN",
    participantIds: ["u-amira", "u-erwin", "u-revita"],
    participants: [usersSeed[4], usersSeed[3], usersSeed[0]],
    replyCount: 3,
    lastActivityAt: "2026-09-13T09:20:00Z",
    unreadCount: 1,
    createdAt: "2026-09-13T08:00:00Z",
  },
  {
    id: "t-2",
    title: "Brief Carousel Vitamin C — Approval Revisi 2",
    contextType: "creative",
    contextId: "post-vitc-r2",
    status: "OPEN",
    participantIds: ["u-revita", "u-andra", "u-gusti"],
    participants: [usersSeed[0], usersSeed[2], usersSeed[1]],
    replyCount: 1,
    lastActivityAt: "2026-09-12T16:40:00Z",
    unreadCount: 0,
    createdAt: "2026-09-12T14:00:00Z",
  },
  {
    id: "t-3",
    title: "Approval HPP Q3 — Penyesuaian Bahan Aktif",
    contextType: "cogs",
    contextId: "hpp-q3-r1",
    status: "CLOSED",
    participantIds: ["u-erwin", "u-amira"],
    participants: [usersSeed[3], usersSeed[4]],
    replyCount: 0,
    lastActivityAt: "2026-09-10T11:00:00Z",
    unreadCount: 0,
    createdAt: "2026-09-09T09:00:00Z",
  },
];

const notificationsSeed: CommNotification[] = [
  {
    id: "n-1",
    kind: "mention",
    threadId: "t-1",
    replyId: "r-1",
    actorId: "u-amira",
    actorName: "Amira",
    title: "Amira mentioned you in Rilis Sample B5 Batch #2",
    preview: "Butuh QC rilis sebelum masuk produksi massal @Erwin…",
    readAt: null,
    createdAt: "2026-09-13T08:30:00Z",
  },
  {
    id: "n-2",
    kind: "thread_reply",
    threadId: "t-1",
    replyId: "r-2",
    actorId: "u-erwin",
    actorName: "Erwin",
    title: "Erwin replied to Rilis Sample B5 Batch #2",
    preview: "Noted. Akan release COGS setelah verifikasi HPP…",
    readAt: null,
    createdAt: "2026-09-13T09:15:00Z",
  },
];

const db = {
  threads: [...threadsSeed],
  replies: [...repliesSeed],
  users: [...usersSeed],
  attachments: [...attachmentsSeed],
  notifications: [...notificationsSeed],
};

// ─── Mock impl ───────────────────────────────────────────────────────────────

const MOCK_DELAY_MS = 200;

function delay<T>(value: T): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), MOCK_DELAY_MS));
}

function uid(): string {
  return crypto.randomUUID();
}

class MockCommunicationService implements ICommunicationService {
  async listThreads(_viewer: CommUser, query: ListThreadsQuery) {
    let items = [...db.threads];
    if (query.status && query.status !== "all") items = items.filter((t) => t.status === query.status);
    if (query.contextType) items = items.filter((t) => t.contextType === query.contextType);
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter((t) => t.title.toLowerCase().includes(q));
    }
    return delay({ items, total: items.length });
  }

  async getThread(_viewer: CommUser, threadId: string) {
    const t = db.threads.find((x) => x.id === threadId);
    if (!t) throw new Error("Thread not found");
    return delay(t);
  }

  async listReplies(_viewer: CommUser, threadId: string) {
    return delay(db.replies.filter((r) => r.threadId === threadId));
  }

  async createReply(v: CommUser, threadId: string, input: CreateReplyInput) {
    const reply: CommReply = {
      id: uid(),
      threadId,
      parentReplyId: input.parentReplyId ?? null,
      authorId: v.id,
      authorName: v.name,
      authorRole: v.role,
      body: input.body,
      urgency: input.urgency ?? "NORMAL",
      mentionIds: input.mentionIds ?? [],
      mentions: (input.mentionIds ?? []).map((id) => db.users.find((u) => u.id === id)).filter(Boolean) as CommUser[],
      attachments: (input.attachmentIds ?? []).map((id) => db.attachments.find((a) => a.id === id)).filter(Boolean) as CommAttachment[],
      createdAt: now(),
    };
    db.replies.push(reply);
    const t = db.threads.find((x) => x.id === threadId);
    if (t) {
      t.replyCount += 1;
      t.lastActivityAt = reply.createdAt;
    }
    return delay(reply);
  }

  async searchUsers(_viewer: CommUser, q: string) {
    const needle = q.toLowerCase();
    const matches = q ? db.users.filter((u) => u.name.toLowerCase().includes(needle) || (u.email?.toLowerCase().includes(needle) ?? false)) : db.users.slice(0, 8);
    return delay(matches.slice(0, 8));
  }

  async uploadAttachment(_viewer: CommUser, file: File) {
    const att: CommAttachment = {
      id: uid(),
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      url: `mock://attachments/${uid()}-${file.name}`,
      isImage: file.type.startsWith("image/"),
      createdAt: now(),
    };
    db.attachments.push(att);
    return delay(att);
  }

  async listNotifications(_viewer: CommUser) {
    return delay([...db.notifications]);
  }

  async markNotificationRead(_viewer: CommUser, notificationId: string) {
    const n = db.notifications.find((x) => x.id === notificationId);
    if (n) n.readAt = now();
    return delay(undefined);
  }
}

// ─── HTTP impl ───────────────────────────────────────────────────────────────

class HttpCommunicationService implements ICommunicationService {
  private baseUrl: string;
  constructor(baseUrl: string = "/api/v1/communications") {
    this.baseUrl = baseUrl;
  }

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  async listThreads(_viewer: CommUser, query: ListThreadsQuery) {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.contextType) params.set("contextType", query.contextType);
    if (query.q) params.set("q", query.q);
    return this.req<{ items: CommThread[]; total: number }>(`/threads?${params}`);
  }
  getThread(_viewer: CommUser, threadId: string) {
    return this.req<CommThread>(`/threads/${threadId}`);
  }
  listReplies(_viewer: CommUser, threadId: string) {
    return this.req<CommReply[]>(`/threads/${threadId}/replies`);
  }
  createReply(_viewer: CommUser, threadId: string, input: CreateReplyInput) {
    return this.req<CommReply>(`/threads/${threadId}/replies`, { method: "POST", body: JSON.stringify(input) });
  }
  searchUsers(_viewer: CommUser, q: string) {
    return this.req<CommUser[]>(`/users?q=${encodeURIComponent(q)}`);
  }
  async uploadAttachment(_viewer: CommUser, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${this.baseUrl}/attachments`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  listNotifications(_viewer: CommUser) {
    return this.req<CommNotification[]>("/notifications");
  }
  markNotificationRead(_viewer: CommUser, id: string) {
    return this.req<void>(`/notifications/${id}/read`, { method: "PATCH" });
  }
}

// ─── Singleton + mode switch ─────────────────────────────────────────────────

const MODE = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_COMM_API_MODE) || "mock";

export const communicationService: ICommunicationService =
  MODE === "real" ? new HttpCommunicationService() : new MockCommunicationService();

export const isCommMockMode = MODE !== "real";

// Convenience export for mock-mode single-viewer dev.
export const mockCommViewer: CommUser = viewer;