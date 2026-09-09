'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BentoOverview } from './components/BentoOverview';
import { PipelineKanban } from './components/PipelineKanban';
import { BusDevManager } from './components/BusDevManager';
import { WhatsAppCoexistence } from './components/WhatsAppCoexistence';
import { BroadcastEngine } from './components/BroadcastEngine';
import { EngineConsole } from './components/EngineConsole';
import { GuestbookIntakeModal } from './components/GuestbookIntakeModal';
import { LeadDetailModal } from './components/LeadDetailModal';
import { SettingsPipelineModal } from './components/SettingsPipelineModal';
import { SalesbotFlowModal } from './components/SalesbotFlowModal';
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaTabNav,
  DnaButton,
} from '@/components/dna';
import {
  Users,
  GitBranch,
  MessageSquare,
  Radio,
  Terminal,
  RotateCcw,
  UserPlus,
  LayoutGrid,
  Settings,
  Sparkles,
  TrendingUp,
  ChevronDown,
  CheckCircle2,
  Check,
  RefreshCw,
} from 'lucide-react';

import type {
  CRMState,
  Lead,
  MessageChannel,
  MessageDirection,
  AutomationFlow,
  AppAccount,
  WhatsAppMessage,
  EngineLog,
} from './types';
import { INITIAL_STATE, FIVE_STAGE_FUNNEL } from './initialState';
import {
  intakeGuestbook,
  toggleBusdevStatus,
  moveLeadStage,
  syncWhatsappMessage,
  tagMessage,
  tagLead,
  executeBroadcastInstant,
  togglePipelineRoundRobin,
  createCustomPipeline,
  updatePipelineName,
  saveAutomationFlow,
  addTrafficSource,
  deleteTrafficSource,
  IntakeGuestbookParams,
  generateUniqueId,
} from './crmEngine';
import {
  useConversations,
  useBusDevs,
  useSendMessage,
  useIntakeGuestbook,
  useGatewayStatus,
  useMessages,
  useUpdateLead,
  useSyncDreamlabRr,
  useDreamlabRrSummary,
} from '@/hooks/useOmniCrmConversations';
import { useOmniCrmStateSync } from '@/hooks/useOmniCrmState';

const STORAGE_KEY = 'erp_omnicrm_real_v1';

// Default user is Super Admin
const DEFAULT_ACCOUNT: AppAccount = {
  id: 'admin',
  name: 'DREAMLAB MASTER ADMIN',
  role: 'SUPER_ADMIN',
  isSuperAdmin: true,
  phone: '6281100001111',
  avatar: '👑',
  whatsappAccountKey: 'BUSDEV_1',
};

export default function OmniCrmClient() {
  const [state, setState] = useState<CRMState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            // Deduplicate and sanitize log IDs
            const seenLogIds = new Set<string>();
            const rawLogs = Array.isArray(parsed.logs) ? parsed.logs : INITIAL_STATE.logs;
            const sanitizedLogs = rawLogs.map((l: any, idx: number) => {
              let id = l && typeof l.id === 'string' && l.id ? l.id : `log_${idx}`;
              if (seenLogIds.has(id)) {
                id = `${id}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
              }
              seenLogIds.add(id);
              return { ...l, id };
            });

            // Deduplicate and sanitize message IDs
            const seenMsgIds = new Set<string>();
            const rawMessages = Array.isArray(parsed.messages) ? parsed.messages : INITIAL_STATE.messages;
            const sanitizedMessages = rawMessages.map((m: any, idx: number) => {
              let id = m && typeof m.id === 'string' && m.id ? m.id : `msg_${idx}`;
              if (seenMsgIds.has(id)) {
                id = `${id}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
              }
              seenMsgIds.add(id);
              return { ...m, id };
            });

            // Deduplicate and sanitize lead IDs
            const seenLeadIds = new Set<string>();
            const rawLeads = Array.isArray(parsed.leads) ? parsed.leads : INITIAL_STATE.leads;
            const sanitizedLeads = rawLeads.map((lead: any, idx: number) => {
              let id = lead && typeof lead.id === 'string' && lead.id ? lead.id : `lead_${idx}`;
              if (seenLeadIds.has(id)) {
                id = `${id}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
              }
              seenLeadIds.add(id);
              return { ...lead, id };
            });

            return {
              ...INITIAL_STATE,
              ...parsed,
              pipelines: Array.isArray(parsed.pipelines) && parsed.pipelines.length > 0
                ? parsed.pipelines.map((p: any) => ({
                    ...p,
                    stages: Array.isArray(p.stages) && p.stages.length > 0 ? p.stages : INITIAL_STATE.pipelines[0].stages,
                  }))
                : INITIAL_STATE.pipelines,
              busDevs: Array.isArray(parsed.busDevs) && parsed.busDevs.length > 0
                ? parsed.busDevs
                : INITIAL_STATE.busDevs,
              leads: sanitizedLeads,
              messages: sanitizedMessages,
              broadcasts: Array.isArray(parsed.broadcasts) ? parsed.broadcasts : INITIAL_STATE.broadcasts,
              logs: sanitizedLogs,
              automationFlows: Array.isArray(parsed.automationFlows) && parsed.automationFlows.length > 0
                ? parsed.automationFlows.map((f: any) => ({
                    ...f,
                    conditions: Array.isArray(f.conditions) ? f.conditions : [],
                  }))
                : INITIAL_STATE.automationFlows,
              activeFlowId: parsed.activeFlowId || INITIAL_STATE.activeFlowId,
            };
          }
        } catch (e) {
          console.error('Failed to parse saved state:', e);
        }
      }
    }
    return INITIAL_STATE;
  });

  // Current logged in account context (Super Admin vs individual BusDev)
  const [currentUser, setCurrentUser] = useState<AppAccount>(DEFAULT_ACCOUNT);

  const [activeTab, setActiveTab] = useState<
    'bento' | 'kanban' | 'whatsapp' | 'busdev' | 'broadcast' | 'console'
  >('bento');

  // Modals & Active selections
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSalesbotOpen, setIsSalesbotOpen] = useState(false);
  const [intakeDefaultPipeline, setIntakeDefaultPipeline] = useState('pipe_round_robin');
  const [selectedLeadForChatId, setSelectedLeadForChatId] = useState<string | null>(
    state.leads[0]?.id || null
  );
  const [activeLeadForDetail, setActiveLeadForDetail] = useState<Lead | null>(null);

  // Floating Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-Account Switcher State
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculated KPI Metrics for Layer 02 Stat Cards
  const activeBusDevCount = (state.busDevs || []).filter((b) => b.status === 'AKTIF').length;
  const totalLeads = (state.leads || []).length;
  const currentUserLeadsCount = currentUser.isSuperAdmin
    ? totalLeads
    : (state.leads || []).filter((l) => l.assignedTo === currentUser.id).length;
  const totalPipelineValue = (state.leads || []).reduce((acc, l) => acc + (l.value || 0), 0);

  // Real Backend API Queries & Mutations (Meta Cloud API Integration)
  const { data: serverConversations, refetch: refetchConversations, isFetching: isSyncingBackend } = useConversations();
  const { data: serverBusDevs } = useBusDevs();
  const sendMutation = useSendMessage();
  const intakeMutation = useIntakeGuestbook();
  const updateLeadMutation = useUpdateLead();
  const { data: gatewayStatus } = useGatewayStatus();
  const { data: activeServerThread } = useMessages(selectedLeadForChatId);
  const syncDreamlabRrMutation = useSyncDreamlabRr();
  useOmniCrmStateSync();

  const handleSyncWebsiteRr = async () => {
    try {
      showToast('⏳ Menghubungi database website & menyinkronkan data leads...');
      const res = await syncDreamlabRrMutation.mutateAsync();
      if (res.success) {
        showToast(`✅ Sinkronisasi berhasil! ${res.importedCount} leads baru diimpor, ${res.updatedCount} terupdate.`);
        refetchConversations();
      }
    } catch (err: any) {
      showToast(`Gagal sinkronisasi website: ${err?.message || 'Error koneksi'}`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Helper: Map Backend Workflow Status into 5-Stage Core Funnel
  const mapWorkflowStatusToStage = (status: string | null): string => {
    switch (status) {
      case 'NEW_LEAD':
      case 'PENDING':
        return 'stage_lead_masuk';
      case 'CONTACTED':
      case 'FOLLOW_UP_1':
        return 'stage_cold';
      case 'FOLLOW_UP_2':
      case 'FOLLOW_UP_3':
        return 'stage_warm';
      case 'NEGOTIATION':
        return 'stage_hot';
      case 'SAMPLE_REQUESTED':
      case 'SAMPLE_SENT':
      case 'SAMPLE_APPROVED':
        return 'stage_sample';
      case 'DEAL_WON':
      case 'CONVERTED':
        return 'stage_client_deal';
      case 'SPAM':
      case 'DEAL_LOST':
      case 'DISQUALIFIED':
        return 'stage_junk_leads';
      default:
        return 'stage_lead_masuk';
    }
  };

  const mapStageToWorkflowStatus = (stageId: string): string => {
    switch (stageId) {
      case 'stage_cold': return 'CONTACTED';
      case 'stage_warm': return 'FOLLOW_UP_2';
      case 'stage_hot': return 'NEGOTIATION';
      case 'stage_sample': return 'SAMPLE_REQUESTED';
      case 'stage_client_deal': return 'WON_DEAL';
      case 'stage_junk_leads': return 'LOST';
      default: return 'NEW_LEAD';
    }
  };

  useEffect(() => {
    const hydrate = (event: Event) => {
      const nextState = (event as CustomEvent<CRMState>).detail;
      if (nextState && typeof nextState === 'object') setState(nextState);
    };
    window.addEventListener('omni-crm-state-hydrated', hydrate);
    return () => window.removeEventListener('omni-crm-state-hydrated', hydrate);
  }, []);

  // Sync Real BusDevs from Backend Database
  useEffect(() => {
    if (!serverBusDevs || !Array.isArray(serverBusDevs) || serverBusDevs.length === 0) return;
    setState((prevState) => ({
      ...prevState,
      busDevs: serverBusDevs as any,
    }));
  }, [serverBusDevs]);

  // Sync Real Conversations / Leads from PostgreSQL Database into state.leads & state.messages
  useEffect(() => {
    if (!serverConversations || !Array.isArray(serverConversations)) return;

    setState((prevState) => {
      // Filter out any legacy dummy mock leads (e.g. lead_28981912, dr. Maya, Neil Royan, etc.)
      const cleanedExistingLeads = (prevState.leads || []).filter(
        (l) =>
          !l.id.startsWith('lead_28') &&
          !l.id.startsWith('lead_11') &&
          !l.id.startsWith('lead_10') &&
          !l.id.startsWith('lead_junk')
      );
      const existingLeadIds = new Set(cleanedExistingLeads.map((l) => l.id));
      const newLeads: Lead[] = [];
      const newMessages: WhatsAppMessage[] = [];

      for (const conv of serverConversations) {
        const assignedBusDev = (prevState.busDevs || []).find((b) => {
          if (!conv.assignedName && !conv.assignedBusDevId) return false;
          if (conv.assignedBusDevId && b.id === conv.assignedBusDevId) return true;
          if (conv.assignedName) {
            const cleanConvName = conv.assignedName.toLowerCase().trim();
            const cleanBName = b.name.toLowerCase().trim();
            return cleanBName.includes(cleanConvName) || cleanConvName.includes(cleanBName);
          }
          return false;
        });

        const assignedPipeline = assignedBusDev
          ? (prevState.pipelines || []).find((p) => p.assignedBusDevId === assignedBusDev.id)
          : undefined;

        const realLead: Lead = {
          id: conv.id,
          leadNumber: conv.trackingCode,
          conversationNumber: conv.trackingCode,
          name: conv.name || `Prospek ${conv.trackingCode}`,
          phone: conv.phone || '',
          source: conv.source || 'WhatsApp Inbound',
          pipelineId: assignedPipeline ? assignedPipeline.id : 'pipe_round_robin',
          stageId: mapWorkflowStatusToStage(conv.workflowStatus),
          assignedTo: assignedBusDev ? assignedBusDev.id : (conv.assignedBusDevId || null),
          assignedName: conv.assignedName || assignedBusDev?.name,
          createdAt: conv.createdAt || new Date().toISOString(),
          updatedAt: conv.lastMessageAt || conv.createdAt || new Date().toISOString(),
          tags: [conv.source || 'WhatsApp', conv.workflowStatus].filter(Boolean),
          notes: `Tracking Code: ${conv.trackingCode}${conv.assignedName ? ` • Ditugaskan ke: ${conv.assignedName}` : ''}`,
          value: 0,
          isAnswered: conv.lastDirection === 'OUTBOUND',
        };

        if (!existingLeadIds.has(realLead.id)) {
          newLeads.push(realLead);
          existingLeadIds.add(realLead.id);
        }

        if (conv.lastMessage) {
          newMessages.push({
            id: `msg_srv_${conv.id}`,
            leadId: realLead.id,
            senderName: conv.lastDirection === 'OUTBOUND' ? 'CRM Dreamlab' : (conv.name || 'Client'),
            message: conv.lastMessage,
            direction: (conv.lastDirection as MessageDirection) || 'INBOUND',
            channel: 'WHATSAPP_CLIENT',
            timestamp: conv.lastMessageAt || conv.createdAt || new Date().toISOString(),
            tags: [conv.source || 'WA Cloud API'],
          });
        }
      }

      const mergedLeads = [...newLeads, ...cleanedExistingLeads];

      // Dynamic calculation of trafficSources
      const updatedTrafficSources = (prevState.trafficSources || []).map((src) => {
        const matchingLeads = mergedLeads.filter((l) => {
          const lSrc = (l.source || '').toLowerCase();
          const sName = src.name.toLowerCase();
          const sUtm = (src.utmSource || '').toLowerCase();
          return (
            lSrc === sName ||
            lSrc.includes(sName) ||
            sName.includes(lSrc) ||
            (sUtm && lSrc.includes(sUtm))
          );
        });
        return {
          ...src,
          leadCount: matchingLeads.length,
          totalValue: matchingLeads.reduce((acc, curr) => acc + (curr.value || 0), 0),
        };
      });

      return {
        ...prevState,
        leads: mergedLeads,
        trafficSources: updatedTrafficSources,
        messages: [...newMessages, ...(prevState.messages || []).filter((m) => !m.id.startsWith('msg_10') && !m.id.startsWith('msg_11') && !m.id.startsWith('msg_12'))],
      };
    });
  }, [serverConversations]);

  // The selected conversation uses the complete canonical database history,
  // replacing the sidebar preview message for that lead.
  useEffect(() => {
    if (!selectedLeadForChatId || !activeServerThread?.messages) return;
    const fullHistory: WhatsAppMessage[] = activeServerThread.messages.map((message) => ({
      id: message.id,
      leadId: selectedLeadForChatId,
      senderName: message.direction === 'OUTBOUND'
        ? 'CRM Dreamlab'
        : (message.waName || activeServerThread.lead.fullName || 'Client'),
      message: message.body,
      direction: message.direction,
      channel: 'WHATSAPP_CLIENT',
      timestamp: message.createdAt,
      status: message.direction === 'OUTBOUND' ? 'SENT' : undefined,
    }));
    setState((previous) => ({
      ...previous,
      messages: [
        ...(previous.messages || []).filter((message) => message.leadId !== selectedLeadForChatId),
        ...fullHistory,
      ],
    }));
  }, [activeServerThread, selectedLeadForChatId]);

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Storage quota exceeded:', e);
      }
    }
  }, [state]);

  // Adjust selected lead when switching accounts if BusDev
  useEffect(() => {
    if (!currentUser.isSuperAdmin) {
      const firstBusDevLead = (state.leads || []).find((l) => l.assignedTo === currentUser.id);
      if (firstBusDevLead) {
        setSelectedLeadForChatId(firstBusDevLead.id);
      } else {
        setSelectedLeadForChatId(null);
      }
    }
  }, [currentUser, state.leads]);

  // CORE ENGINE HANDLERS
  const handleIntakeGuestbook = (params: IntakeGuestbookParams) => {
    const result = intakeGuestbook(state, params);
    setState(result.newState);
    setSelectedLeadForChatId(result.newLead.id);
    showToast(result.log.resultSummary);

    // Call Real Backend API in background if phone is provided
    if (params.phone) {
      intakeMutation.mutate(
        {
          name: params.name,
          phone: params.phone,
          source: params.source,
          notes: params.notes,
        },
        {
          onSuccess: (res) => {
            console.log('[Backend Intake Sync OK]', res);
          },
          onError: (err) => {
            console.warn('[Backend Intake Sync Failed/Mock Active]', err);
          },
        }
      );
    }
  };

  const handleToggleBusdev = (userId: string, isActive: boolean) => {
    const result = toggleBusdevStatus(state, { user_id: userId, is_active: isActive });
    setState(result.newState);
    showToast(result.log.resultSummary);
  };

  const handleMoveLead = (
    leadId: string,
    targetPipelineId: string,
    targetStageId: string
  ) => {
    const result = moveLeadStage(state, {
      lead_id: leadId,
      target_pipeline_id: targetPipelineId,
      target_stage_id: targetStageId,
    });
    const previousState = state;
    setState(result.newState);
    if (activeLeadForDetail && activeLeadForDetail.id === leadId && result.lead) {
      setActiveLeadForDetail(result.lead);
    }
    showToast(result.log.resultSummary);
    if (!(serverConversations || []).some((conversation) => conversation.id === leadId)) return;
    updateLeadMutation.mutate(
      { leadId, workflowStatus: mapStageToWorkflowStatus(targetStageId) },
      {
        onError: (error) => {
          setState(previousState);
          showToast(`Perubahan tahap gagal disimpan: ${(error as Error).message}`);
        },
      },
    );
  };

  const handleSyncWhatsapp = async (
    leadId: string,
    message: string,
    direction: MessageDirection,
    channel: MessageChannel
  ) => {
    // Outbound messages only enter the timeline after Meta accepts them.
    if (direction === 'OUTBOUND') {
      const targetLead = (state.leads || []).find((l) => l.id === leadId);
      if (targetLead?.phone) {
        try {
          const response = await sendMutation.mutateAsync({
            leadId,
            phone: targetLead.phone,
            message,
            accountKey: currentUser.whatsappAccountKey,
            clientRequestId: crypto.randomUUID(),
          });
          if (!response.ok) throw new Error(response.dispatchError || 'Meta menolak pesan');
          const result = syncWhatsappMessage(state, {
            lead_id: leadId, message, direction, channel,
          });
          setState(result.newState);
          showToast(result.log.resultSummary);
          return true;
        } catch (error) {
          showToast(`Pesan gagal dikirim: ${(error as Error).message}`);
          return false;
        }
      }
      showToast('Pesan gagal dikirim: nomor WhatsApp prospek belum tersedia.');
      return false;
    }

    const result = syncWhatsappMessage(state, {
      lead_id: leadId, message, direction, channel,
    });
    setState(result.newState);
    showToast(result.log.resultSummary);
    return true;
  };

  const handleTagMessage = (messageId: string, tag: string) => {
    const result = tagMessage(state, messageId, tag);
    setState(result.newState);
    showToast(result.log.resultSummary);
  };

  const handleTagLead = (leadId: string, tag: string) => {
    const result = tagLead(state, leadId, tag);
    setState(result.newState);
    if (activeLeadForDetail && activeLeadForDetail.id === leadId) {
      const updated = result.newState.leads.find((l) => l.id === leadId);
      if (updated) setActiveLeadForDetail(updated);
    }
    showToast(result.log.resultSummary);
  };

  const handleCreatePipeline = (
    name: string,
    roundRobin?: boolean,
    stages?: string[],
    assignedBusDevId?: string
  ) => {
    const result = createCustomPipeline(state, name, roundRobin, stages, assignedBusDevId);
    setState(result.newState);
    showToast(`Pipeline "${name}" baru berhasil dibuat!`);
  };

  const handleUpdatePipelineName = (pipelineId: string, name: string) => {
    const result = updatePipelineName(state, pipelineId, name);
    setState(result.newState);
    showToast(`Nama pipeline diperbarui menjadi "${name}"`);
  };

  const handleSaveAutomationFlow = (flow: AutomationFlow) => {
    const result = saveAutomationFlow(state, flow);
    setState(result.newState);
    showToast(`Flow Salesbot "${flow.name}" berhasil disimpan!`);
  };

  const handleExecuteBroadcastInstant = (
    sourceFilter: string,
    templateText: string
  ) => {
    const result = executeBroadcastInstant(state, {
      source_filter: sourceFilter,
      template_text: templateText,
    });
    setState(result.newState);
    showToast(result.log.resultSummary);
  };

  const handleTogglePipelineRR = (pipelineId: string) => {
    const result = togglePipelineRoundRobin(state, pipelineId);
    setState(result.newState);
    showToast(result.log.resultSummary);
  };

  const handleAddTrafficSource = (params: {
    name: string;
    platform: 'META' | 'GOOGLE' | 'TIKTOK' | 'WHATSAPP' | 'OFFLINE' | 'WEBSITE' | 'REFERRAL' | 'OTHER';
    utmSource?: string;
    autoTag?: string;
    color?: string;
    icon?: string;
  }) => {
    const updatedState = addTrafficSource(state, params);
    setState(updatedState);
    showToast(`Sumber leads "${params.name}" berhasil didaftarkan ke sistem!`);
  };

  const handleDeleteTrafficSource = (sourceId: string) => {
    const updatedState = deleteTrafficSource(state, sourceId);
    setState(updatedState);
    showToast('Sumber leads berhasil dihapus.');
  };

  const handleApplyFiveStagesToAll = () => {
    const updatedPipelines = state.pipelines.map((pipe) => ({
      ...pipe,
      stages: FIVE_STAGE_FUNNEL,
    }));
    setState((prev) => ({
      ...prev,
      pipelines: updatedPipelines,
    }));
    showToast('Berhasil menerapkan 5-Stage Core Funnel (COLD - WARM - HOT - SAMPLE - CLIENT DEAL) ke semua pipeline!');
  };

  const handleResetState = () => {
    if (window.confirm('Reset database kembali ke kondisi awal Dreamlab CRM?')) {
      setState(INITIAL_STATE);
      setCurrentUser(DEFAULT_ACCOUNT);
      setSelectedLeadForChatId(INITIAL_STATE.leads[0]?.id || null);
      showToast('Database Mock berhasil direset ke kondisi awal!');
    }
  };

  const handleSimulateIntake = (count: number) => {
    const sampleNames = [
      'Brand Kosmetik Glow',
      'CV Herbal Alam Sejahtera',
      'PT Cantik Nusantara',
      'Skincare Organik Indonesia',
      'Brand Serum Premium',
    ];
    const sampleSources = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'Buku Tamu Booth A'];
    let currentState = state;
    for (let i = 0; i < count; i++) {
      const randomName =
        sampleNames[Math.floor(Math.random() * sampleNames.length)] +
        ` #${Math.floor(Math.random() * 900 + 100)}`;
      const randomPhone = `6281${Math.floor(10000000 + Math.random() * 90000000)}`;
      const randomSource = sampleSources[Math.floor(Math.random() * sampleSources.length)];
      const res = intakeGuestbook(currentState, {
        name: randomName,
        phone: randomPhone,
        source: randomSource,
        pipeline_id: 'pipe_round_robin',
        notes: 'Inquiry maklon kosmetik baru.',
        value: 30000000,
      });
      currentState = res.newState;
    }
    setState(currentState);
    showToast(`Berhasil mensimulasikan ${count} lead masuk secara rotasi Round-Robin ${(state.busDevs || []).length} BusDev!`);
  };

  // Tool Invoker from Engine Console
  const handleExecuteToolByName = (toolName: string, params: Record<string, any>) => {
    switch (toolName) {
      case 'intake_guestbook':
        handleIntakeGuestbook(params as IntakeGuestbookParams);
        break;
      case 'toggle_busdev_status':
        handleToggleBusdev(params.user_id, params.is_active);
        break;
      case 'move_lead_stage':
        handleMoveLead(params.lead_id, params.target_pipeline_id, params.target_stage_id);
        break;
      case 'sync_whatsapp_message':
        handleSyncWhatsapp(params.lead_id, params.message, params.direction, params.channel);
        break;
      case 'execute_broadcast':
        handleExecuteBroadcastInstant(params.source_filter, params.template_text);
        break;
      default:
        alert(`Tool ${toolName} tidak dikenal.`);
    }
  };

  const handleClearLogs = () => {
    setState((prev) => ({
      ...prev,
      logs: [
        {
          id: generateUniqueId('log_cleared'),
          action: 'system_reset',
          timestamp: new Date().toISOString(),
          params: {},
          resultSummary: 'Audit log dibersihkan.',
          structuredOutput: { status: 'CLEARED' },
        },
      ],
    }));
  };

  return (
    <DnaPageContainer className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Layer 01: Ultra-Clean Un-boxed Header */}
      <DnaPageHeader
        title="OMNICRM & WHATSAPP COEXISTENCE"
        subtitle="Multi-Account WhatsApp Gateway, Five-Stage Funnel & Automated Lead Distribution"
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing/dashboard' },
          { label: 'OmniCRM' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-Account Switcher */}
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                id="btn-account-switcher"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-[12px] font-semibold shadow-2xs cursor-pointer transition-colors"
                title="Ganti Akun & Nomor WhatsApp"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                    currentUser.isSuperAdmin ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}
                >
                  {currentUser.isSuperAdmin ? '👑' : currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-bold text-[12px] truncate max-w-[120px] block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block leading-tight">
                    {currentUser.isSuperAdmin ? 'SUPER ADMIN' : currentUser.phone}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilih Akun WhatsApp
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentUser(DEFAULT_ACCOUNT);
                      setIsAccountMenuOpen(false);
                      showToast('Beralih akun: Super Admin (Akses Penuh Semua Chat)');
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 transition cursor-pointer ${
                      currentUser.isSuperAdmin ? 'bg-blue-50/50 font-bold text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      👑
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">DREAMLAB MASTER ADMIN</div>
                      <div className="text-[10px] text-slate-500 font-mono">Akses Semua Chat & Gateway</div>
                    </div>
                    {currentUser.isSuperAdmin && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1">
                    BusDev Representative
                  </div>
                  {(state.busDevs || []).map((busdev) => (
                    <button
                      key={busdev.id}
                      type="button"
                      onClick={() => {
                        setCurrentUser({
                          id: busdev.id,
                          name: busdev.name,
                          role: 'BUSDEV',
                          phone: busdev.phone || '6281200000000',
                          avatar: busdev.avatar || '👤',
                          specialty: busdev.specialty,
                          isSuperAdmin: false,
                          whatsappAccountKey: busdev.whatsappAccountKey,
                        });
                        setIsAccountMenuOpen(false);
                        showToast(`Beralih akun: ${busdev.name} (Khusus Nomor ${busdev.formattedPhone || busdev.phone})`);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 transition cursor-pointer ${
                        currentUser.id === busdev.id ? 'bg-emerald-50/50 font-bold text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                        {busdev.avatar || busdev.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{busdev.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{busdev.formattedPhone || busdev.phone}</div>
                      </div>
                      {currentUser.id === busdev.id && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
              title="Pengaturan Pipeline & Stages"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsSalesbotOpen(true)}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
              title="Salesbot Automation Flow"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
            </button>

            <button
              type="button"
              onClick={handleResetState}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
              title="Reset Demo State"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={handleSyncWebsiteRr}
              disabled={syncDreamlabRrMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[12px] font-semibold shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
              title="Tarik 353 leads & update rotasi BusDev dari website DreamLab"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncDreamlabRrMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Tarik Data Website RR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIntakeDefaultPipeline('pipe_round_robin');
                setIsIntakeOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold shadow-2xs cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Prospek
            </button>
          </div>
        }
      />

      {/* Layer 02: 4 KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
        <DnaStatCard
          label="TOTAL PROSPEK"
          value={totalLeads}
          subtext={currentUser.isSuperAdmin ? 'Semua BusDev Aktif' : `${currentUserLeadsCount} prospek Anda`}
          icon={<Users className="w-4 h-4" />}
          variant="blue"
        />
        <DnaStatCard
          label="ESTIMASI PIPELINE"
          value={totalPipelineValue > 0 ? `Rp ${(totalPipelineValue / 1000000).toFixed(0)} Jt` : 'Rp 1.85 M'}
          subtext="5-Stage Funnel Aktif"
          icon={<TrendingUp className="w-4 h-4" />}
          variant="emerald"
        />
        <DnaStatCard
          label="WHATSAPP GATEWAY"
          value={gatewayStatus?.configured ? 'TERKONFIGURASI' : 'BELUM SIAP'}
          subtext={`${gatewayStatus?.configuredAccountCount || 0} Nomor Terhubung`}
          icon={<MessageSquare className="w-4 h-4" />}
          variant="emerald"
        />
        <DnaStatCard
          label="SALES POOL & RR"
          value={`${activeBusDevCount}/${(state.busDevs || []).length} Online`}
          subtext="Round-Robin Distribusi"
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="sky"
        />
      </div>

      {/* Layer 03: Bordered Tab Nav Container */}
      <DnaTabNav
        tabs={[
          { id: 'bento', label: 'Bento Overview', icon: LayoutGrid },
          { id: 'kanban', label: 'Pipeline Kanban', icon: GitBranch, badge: currentUserLeadsCount },
          { id: 'whatsapp', label: 'WhatsApp Studio', icon: MessageSquare },
          { id: 'busdev', label: 'BusDev Manager', icon: Users, badge: activeBusDevCount },
          { id: 'broadcast', label: 'Broadcast Engine', icon: Radio },
          { id: 'console', label: 'Engine Console', icon: Terminal },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
        className="mt-[22px]"
      />

      {/* Layer 05: Clean Data Work Area */}
      <div className="mt-[18px]">
        {activeTab === 'bento' && (
          <BentoOverview
            state={state}
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onOpenIntake={(pipeId) => {
              setIntakeDefaultPipeline(pipeId || 'pipe_round_robin');
              setIsIntakeOpen(true);
            }}
            onSelectLeadForChat={(leadId) => {
              setSelectedLeadForChatId(leadId);
              setActiveTab('whatsapp');
            }}
            onOpenLeadDetail={(lead) => setActiveLeadForDetail(lead)}
            onCreatePipeline={handleCreatePipeline}
          />
        )}

        {activeTab === 'kanban' && (
          <PipelineKanban
            state={state}
            currentUser={currentUser}
            onMoveLead={handleMoveLead}
            onTogglePipelineRR={handleTogglePipelineRR}
            onSelectLeadForChat={(leadId) => {
              setSelectedLeadForChatId(leadId);
              setActiveTab('whatsapp');
            }}
            onOpenIntake={(pipeId) => {
              setIntakeDefaultPipeline(pipeId || 'pipe_round_robin');
              setIsIntakeOpen(true);
            }}
            onOpenLeadDetail={(lead) => setActiveLeadForDetail(lead)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenSalesbotFlow={() => setIsSalesbotOpen(true)}
            onCreatePipeline={handleCreatePipeline}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppCoexistence
            state={state}
            currentUser={currentUser}
            selectedLeadId={selectedLeadForChatId}
            onSelectLead={(id) => setSelectedLeadForChatId(id)}
            onSendMessage={handleSyncWhatsapp}
            onTagMessage={handleTagMessage}
            onTagLead={handleTagLead}
            onMoveLead={handleMoveLead}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'busdev' && (
          <BusDevManager
            state={state}
            currentUser={currentUser}
            onToggleBusdev={handleToggleBusdev}
            onSimulateIntake={handleSimulateIntake}
          />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastEngine
            state={state}
            currentUser={currentUser}
            onExecuteBroadcastInstant={handleExecuteBroadcastInstant}
            onAppendMessage={(leadId, message, dir, channel) =>
              handleSyncWhatsapp(leadId, message, dir, channel)
            }
          />
        )}

        {activeTab === 'console' && (
          <EngineConsole
            state={state}
            onExecuteTool={handleExecuteToolByName}
            onClearLogs={handleClearLogs}
          />
        )}
      </div>

      {/* Guestbook Intake Modal */}
      <GuestbookIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        state={state}
        defaultPipelineId={intakeDefaultPipeline}
        onSubmit={handleIntakeGuestbook}
      />

      {/* Lead Detail Modal */}
      <LeadDetailModal
        isOpen={!!activeLeadForDetail}
        onClose={() => setActiveLeadForDetail(null)}
        lead={activeLeadForDetail}
        state={state}
        onMoveLead={handleMoveLead}
        onSendMessage={handleSyncWhatsapp}
      />

      {/* Settings Pipeline Management Modal */}
      <SettingsPipelineModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        onCreatePipeline={handleCreatePipeline}
        onUpdatePipelineName={handleUpdatePipelineName}
        onToggleRoundRobin={handleTogglePipelineRR}
        onApplyFiveStagesToAll={handleApplyFiveStagesToAll}
        onAddTrafficSource={handleAddTrafficSource}
        onDeleteTrafficSource={handleDeleteTrafficSource}
        onOpenSalesbotFlow={() => setIsSalesbotOpen(true)}
      />

      {/* Salesbot Flow Automation Modal */}
      <SalesbotFlowModal
        isOpen={isSalesbotOpen}
        onClose={() => setIsSalesbotOpen(false)}
        state={state}
        onSaveFlow={handleSaveAutomationFlow}
        onSimulateInboundMessage={(leadId, msg) => {
          handleSyncWhatsapp(leadId, msg, 'INBOUND', 'WHATSAPP_CLIENT');
        }}
      />

      {/* Realtime Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-slate-900 block mb-0.5">
              Dreamlab CRM Notifikasi
            </span>
            <p className="text-slate-600 leading-relaxed font-medium">{toastMessage}</p>
          </div>
        </div>
      )}
    </DnaPageContainer>
  );
}
