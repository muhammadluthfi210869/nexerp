"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "IN_REVIEW" | "REVISION" | "DONE" | "CANCELLED";
export type SocialStatus = "IDEA" | "DRAFT" | "SCRIPTING" | "PRODUCTION" | "IN_REVIEW" | "REVISION" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export interface MarketingMember {
  id: string;
  userId?: string;
  fullName: string;
  name?: string;
  email?: string;
  roles?: string[];
  initial?: string;
  role?: string;
  avatarColor?: string;
  // Phase-3 per-path checkout extensions:
  avatarBg?: string;      // CSS class for avatar background
  department?: string;    // e.g., "DIGIMAR", "CREATIVE"
  phone?: string;
}
export interface MarketingBrand { id: string; code: string; name: string; handle?: string | null; primaryPlatform?: string | null; accentToken?: string; isActive?: boolean }
export interface MarketingProject { id: string; projectCode: string; name: string; channel: string; category: string; status: string; progress: number; version: number; brandId?: string | null; deadline?: string | null; _count?: { tasks: number } }
export interface ChecklistItem { id: string; text: string; done: boolean; isRequired: boolean; sortOrder: number }
export interface TaskHistory { id: string; fromStatus?: string | null; toStatus: string; note?: string | null; createdAt: string; by?: MarketingMember }
export interface TaskComment { id: string; body: string; createdAt: string; author?: MarketingMember }
export interface MarketingTask {
  id: string; taskCode: string; type: "DAILY" | "PROJECT"; title: string; status: TaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; channel: string; category: string;
  projectId?: string | null; project?: MarketingProject | null; brandId?: string | null; brand?: MarketingBrand | null;
  assigneeId: string; assignee?: MarketingMember | null; reviewerId?: string | null; reviewer?: MarketingMember | null;
  startDate: string; dueDate: string; completedAt?: string | null; brief?: string | null; outputUrl?: string | null;
  referenceUrl?: string | null; estimatedMinutes: number; actualMinutes: number; version: number;
  checklistDone: number; checklistTotal: number; checklist: ChecklistItem[]; history: TaskHistory[];
  comments: TaskComment[]; attachments: unknown[]; createdAt: string; updatedAt: string;
}
export interface PageResult<T> { data: T[]; page: number; limit: number; total: number; hasMore: boolean }

export interface TaskFilters { page: number; limit: number; q?: string; status?: string; assigneeId?: string; projectId?: string; brandId?: string; sort?: string }
export interface CreateTaskInput {
  type: "DAILY" | "PROJECT"; title: string; projectId?: string; brandId?: string; channel: string;
  category: string; assigneeId: string; reviewerId?: string; priority: string; startDate: string;
  dueDate: string; brief?: string; outputUrl?: string; referenceUrl?: string; estimatedMinutes?: number;
  checklist?: Array<{ text: string; isRequired: boolean; sortOrder: number }>;
}

export interface SocialPost {
  id: string; title: string; platform: string; contentType: string; status: SocialStatus; legacyStatus: string;
  brandId?: string | null; brand?: MarketingBrand | null; assigneeId?: string | null; assignee?: MarketingMember | null;
  reviewerId?: string | null; reviewer?: MarketingMember | null; brief?: string; referenceUrl?: string;
  version: number; scheduledDate?: string; publishedDate?: string; pillar?: string; caption?: string;
  campaign?: string; checklist?: Array<{ id: string; text: string; done: boolean }>;
  createdAt: string; updatedAt: string;
}

export interface IntegrationConnection {
  id: string; brandId: string; provider: string; status: string; config: Record<string, unknown>;
  scopes: string[]; lastSyncAt?: string | null; tokenExpiresAt?: string | null; updatedAt: string;
  brand?: MarketingBrand; syncJobs?: Array<{ id: string; status: string; startedAt?: string; finishedAt?: string; errorMessage?: string }>;
}

function params(input: object) {
  const out = new URLSearchParams();
  Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") out.set(key, String(value));
  });
  return out.toString();
}

function idempotencyHeaders() {
  return { "Idempotency-Key": crypto.randomUUID() };
}

export function useMarketingMembers() {
  return useQuery({ queryKey: ["marketing", "members"], queryFn: () => api.get<MarketingMember[]>("/marketing/members").then((r) => r.data), staleTime: 300_000 });
}
export function useMarketingBrands() {
  return useQuery({ queryKey: ["marketing", "brands"], queryFn: () => api.get<MarketingBrand[]>("/marketing/brands").then((r) => r.data), staleTime: 300_000 });
}
export function useMarketingProjects() {
  return useQuery({ queryKey: ["marketing", "projects"], queryFn: () => api.get<PageResult<MarketingProject>>("/marketing/projects?limit=100").then((r) => r.data), staleTime: 120_000 });
}
export function useMarketingTasks(filters: TaskFilters) {
  return useQuery({ queryKey: ["marketing", "tasks", filters], queryFn: () => api.get<PageResult<MarketingTask>>(`/marketing/tasks?${params(filters)}`).then((r) => r.data), placeholderData: (old) => old });
}
export function useCreateMarketingTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: CreateTaskInput) => api.post<MarketingTask>("/marketing/tasks", data, { headers: idempotencyHeaders() }).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing", "tasks"] }) });
}
export function useTaskStatusMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, version, status, reason }: { id: string; version: number; status: TaskStatus; reason?: string }) => api.patch<MarketingTask>(`/marketing/tasks/${id}/status`, { version, status, reason }).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing", "tasks"] }) });
}
export function useChecklistMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ taskId, itemId, version, done }: { taskId: string; itemId: string; version: number; done: boolean }) => api.patch<MarketingTask>(`/marketing/tasks/${taskId}/checklist/${itemId}`, { version, done }).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing", "tasks"] }) });
}
export function useCommentMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ taskId, version, body }: { taskId: string; version: number; body: string }) => api.post<MarketingTask>(`/marketing/tasks/${taskId}/comments`, { version, body }, { headers: idempotencyHeaders() }).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing", "tasks"] }) });
}

export interface SocialFilters { page: number; limit: number; search?: string; status?: string; platform?: string; pillar?: string }
export function useCanonicalSocialPosts(filters: SocialFilters) {
  return useQuery({ queryKey: ["marketing", "social", "canonical", filters], queryFn: () => api.get<PageResult<SocialPost> & { posts?: SocialPost[] }>(`/marketing/social/posts?${params(filters)}`).then((r) => ({ ...r.data, data: r.data.data ?? r.data.posts ?? [] })), placeholderData: (old) => old });
}
export function useCreateCanonicalSocialPost() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Partial<SocialPost>) => api.post<{ post: SocialPost }>("/marketing/social/posts", { ...data, status: "IDEA", version: undefined }, { headers: idempotencyHeaders() }).then((r) => r.data.post), onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing", "social"] }) });
}
export function useSocialStatusMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ post, status }: { post: SocialPost; status: SocialStatus }) => api.patch<{ post: SocialPost }>(`/marketing/social/posts/${post.id}`, { version: post.version, status }).then((r) => r.data.post), onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing", "social"] }) });
}

export function useMarketingReports(filters: { brandId?: string; channel?: string; page?: number; limit?: number }) {
  return useQuery({ queryKey: ["marketing", "reports", filters], queryFn: () => api.get<PageResult<any>>(`/marketing/social/reports?${params({ page: 1, limit: 50, ...filters })}`).then((r) => r.data) });
}
export function useUpsertChannelMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/marketing/social/reports/channel-metrics", data, { headers: idempotencyHeaders() }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing", "reports"] }),
  });
}
export function useMarketingIntegrations(brandId?: string) {
  return useQuery({ queryKey: ["marketing", "integrations", brandId], queryFn: () => api.get<IntegrationConnection[]>(`/marketing/social/integrations?${params({ brandId })}`).then((r) => r.data) });
}
export function useConfigureIntegration() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { brandId: string; provider: string; secret?: string; config?: Record<string, unknown>; scopes?: string[] }) => api.post<IntegrationConnection>("/marketing/social/integrations", data, { headers: idempotencyHeaders() }).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing", "integrations"] }) });
}
export function useTriggerIntegrationSync() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (connectionId: string) => api.post("/marketing/social/integrations/sync", { connectionId }, { headers: idempotencyHeaders() }).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing", "integrations"] }) });
}
