'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractApiError } from '@/lib/api';

export interface Conversation {
  id: string;
  trackingCode: string;
  name: string;
  phone: string | null;
  source: string | null;
  status: string;
  workflowStatus: string;
  lastMessageAt: string | null;
  lastMessage: string | null;
  lastDirection: 'INBOUND' | 'OUTBOUND' | null;
  messageCount: number;
  assignedName: string | null;
  nameMatch: boolean | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  phone: string | null;
  waName: string | null;
  body: string;
  createdAt: string;
  msgId: string | null;
}

export interface GatewayStatus {
  configured: boolean;
  tokenConfigured: boolean;
  configuredAccountCount: number;
  live: boolean;
}

/**
 * List leads with WA phone (= conversations for the Inbox sidebar).
 */
export function useConversations() {
  return useQuery({
    queryKey: ['marketing', 'omni-crm', 'conversations'],
    queryFn: async () => {
      const res = await api.get<Conversation[]>('/marketing/omni-crm/conversations');
      return res.data;
    },
    refetchInterval: 30_000,
  });
}

/**
 * List real BusDev sales representatives.
 */
export function useBusDevs() {
  return useQuery({
    queryKey: ['marketing', 'omni-crm', 'busdevs'],
    queryFn: async () => {
      const res = await api.get<Array<{
        id: string;
        name: string;
        status: 'AKTIF' | 'NON-AKTIF';
        lastAssigned: string;
        leadCount: number;
        phone: string;
        formattedPhone: string;
        role: string;
        specialty: string;
        deviceModel: string;
        whatsappAccountKey: string;
        whatsappConfigured: boolean;
      }>>('/marketing/omni-crm/conversations/busdevs');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useGatewayStatus() {
  return useQuery({
    queryKey: ['marketing', 'omni-crm', 'gateway-status'],
    queryFn: async () => {
      const res = await api.get<GatewayStatus>('/marketing/omni-crm/conversations/gateway-status');
      return res.data;
    },
    refetchInterval: 60_000,
  });
}

/**
 * Fetch full chat thread for one lead.
 */
export function useMessages(leadId: string | null) {
  return useQuery({
    queryKey: ['marketing', 'omni-crm', 'messages', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const res = await api.get<{
        lead: { id: string; trackingCode: string; fullName: string | null; waName: string | null; phone: string | null; source: string | null; status: string; workflowStatus: string; nameMatch: boolean | null };
        messages: ChatMessage[];
      }>(`/marketing/omni-crm/conversations/${leadId}/messages`);
      return res.data;
    },
    enabled: !!leadId,
    refetchInterval: 15_000,
  });
}

/**
 * Send an outbound WhatsApp message and persist it as OUTBOUND LeadMessage.
 * On success, invalidates the messages query so the new bubble appears.
 */
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { leadId?: string; phone: string; message: string; accountKey?: string; clientRequestId: string }) => {
      const res = await api.post<{
        ok: boolean;
        dispatchError: string | null;
        metaMsgId: string | null;
        message: ChatMessage;
      }>('/marketing/omni-crm/conversations/send', data);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      if (vars.leadId) {
        qc.invalidateQueries({ queryKey: ['marketing', 'omni-crm', 'messages', vars.leadId] });
      }
      qc.invalidateQueries({ queryKey: ['marketing', 'omni-crm', 'conversations'] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      leadId: string;
      workflowStatus?: string;
      fullName?: string;
      company?: string;
      email?: string;
      phone?: string;
      notes?: string;
      assignedTo?: string;
    }) => {
      const { leadId, ...payload } = data;
      const res = await api.patch(`/lead-capture/${leadId}`, payload);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['marketing', 'omni-crm', 'conversations'] });
      qc.invalidateQueries({ queryKey: ['marketing', 'omni-crm', 'messages', variables.leadId] });
    },
  });
}

export interface IntakeParams {
  name: string;
  phone: string;
  source?: string;
  notes?: string;
  intent?: string;
}

export interface IntakeResult {
  trackingCode: string;
  assignedName: string;
  assignedPhone: string;
  waUrl: string;
}

/**
 * Intake a new lead into the buku tamu (guestbook).
 * Two-step backend call:
 *   1) POST /v1/lead-capture/track      → creates LeadCapture + auto round-robin
 *   2) PUT  /v1/lead-capture/whatsapp/:trackingCode → seed phone+name so the
 *      lead shows up in the Omni CRM inbox immediately (without waiting for
 *      the real WA webhook to fire).
 */
export function useIntakeGuestbook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: IntakeParams): Promise<IntakeResult> => {
      try {
        const trackRes = await api.post<{ trackingCode: string; waUrl: string }>(
          '/lead-capture/track',
          {
            intent: data.intent || `Buku Tamu: ${data.source || 'manual'}`,
            pageUrl: 'buku-tamu',
            pageTitle: `Intake Manual: ${data.name}`,
            assignedName: undefined,
            assignedPhone: undefined,
          },
        );
        const { trackingCode, waUrl } = trackRes.data;

        // Seed the lead's phone + waName immediately so the inbox sees it now.
        await api.put(`/lead-capture/whatsapp/${trackingCode}`, {
          phone: data.phone,
          waName: data.name,
          waMessage: data.notes || `Manual intake via Buku Tamu (${data.source || 'manual'})`,
        });

        // Pull the just-created row to read back the assigned agent
        const listRes = await api.get<{ data: Array<{ trackingCode: string; assignedName: string | null; assignedPhone: string | null }> }>(
          '/lead-capture',
          { params: { search: trackingCode, limit: 1 } },
        );
        const row = listRes.data?.data?.[0];

        return {
          trackingCode,
          waUrl,
          assignedName: row?.assignedName || 'Belum ditugaskan',
          assignedPhone: row?.assignedPhone || '-',
        };
      } catch (e) {
        throw extractApiError(e);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing', 'omni-crm', 'conversations'] });
    },
  });
}
