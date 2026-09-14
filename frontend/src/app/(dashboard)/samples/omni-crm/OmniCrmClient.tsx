'use client';

import React, { useState, useEffect } from 'react';
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
  UserPlus,
  LayoutGrid,
  Settings,
  Sparkles,
  TrendingUp,
  CheckCircle2,
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
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'erp_omnicrm_real_v1';

export default function OmniCrmClient() {
  const { user: authenticatedUser } = useAuth();
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

  // Calculated KPI Metrics for Layer 02 Stat Cards
  const activeBusDevCount = (state.busDevs || []).filter((b) => b.status === 'AKTIF').length;
  const totalLeads = (state.leads || []).length;
  const totalPipelineValue = (state.leads || []).reduce((acc, l) => acc + (l.value || 0), 0);
  // NOTE: currentUserLeadsCount dihitung setelah `currentUser` dideklarasikan (TDZ).

  // Real Backend API Queries & Mutations (Meta Cloud API Integration)
  const { data: serverConversations, refetch: refetchConversations, isFetching: isSyncingBackend, isError: conversationsError } = useConversations();
  const { data: serverBusDevs, isError: busDevsError } = useBusDevs();
  const sendMutation = useSendMessage();
  const intakeMutation = useIntakeGuestbook();
  const updateLeadMutation = useUpdateLead();
  const { data: gatewayStatus } = useGatewayStatus();
  const { data: activeServerThread } = useMessages(selectedLeadForChatId);
  const syncDreamlabRrMutation = useSyncDreamlabRr();
  useOmniCrmStateSync();

  const matchedBusDev = (serverBusDevs || []).find((busDev) =>
    busDev.name.toLowerCase().includes((authenticatedUser?.fullName || '').toLowerCase()) ||
    (authenticatedUser?.fullName || '').toLowerCase().includes(busDev.name.toLowerCase()),
  );
  const isSuperAdmin = Boolean(
    authenticatedUser?.roles?.some((role) => ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(role)),
  );
  const currentUser: AppAccount = {
    id: authenticatedUser?.id || '',
    name: authenticatedUser?.fullName || authenticatedUser?.email || 'Pengguna belum terautentikasi',
    role: isSuperAdmin ? 'SUPER_ADMIN' : 'BUSDEV',
    phone: matchedBusDev?.phone || '',
    isSuperAdmin,
    whatsappAccountKey: matchedBusDev?.whatsappAccountKey,
  };

  const currentUserLeadsCount = currentUser.isSuperAdmin
    ? totalLeads
    : (state.leads || []).filter((l) => l.assignedTo === currentUser.id).length;

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
    if (!serverBusDevs || !Array.isArray(serverBusDevs)) return;
    setState((prevState) => ({
      ...prevState,
      busDevs: serverBusDevs as any,
    }));
  }, [serverBusDevs]);

  // Sync Real Conversations / Leads from PostgreSQL Database into state.leads & state.messages
  useEffect(() => {
    if (!serverConversations || !Array.isArray(serverConversations)) return;

    setState((prevState) => {
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

        newLeads.push(realLead);

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

      // PostgreSQL conversations are authoritative. Never merge browser/demo leads.
      const mergedLeads = newLeads;

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
        messages: newMessages,
      };
    });
  }, [serverConversations]);

  useEffect(() => {
    if (!conversationsError) return;
    setState((previous) => ({ ...previous, leads: [], messages: [] }));
  }, [conversationsError]);

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
  const handleIntakeGuestbook = async (params: IntakeGuestbookParams) => {
    if (!params.phone) {
      showToast('Nomor WhatsApp wajib diisi agar prospek dapat disimpan ke server.');
      return;
    }
    try {
      const result = await intakeMutation.mutateAsync({
        name: params.name,
        phone: params.phone,
        source: params.source,
        notes: params.notes,
      });
      await refetchConversations();
      showToast(`Prospek ${result.trackingCode} berhasil disimpan ke server.`);
    } catch (error) {
      showToast(`Prospek gagal disimpan: ${(error as Error).message}`);
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
            <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-[12px] font-semibold shadow-2xs">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${currentUser.isSuperAdmin ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-bold text-[12px] truncate max-w-[150px] block leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 block leading-tight">Akun terautentikasi</span>
              </div>
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

      {(conversationsError || busDevsError) && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          Data OmniCRM tidak tersedia karena API gagal dimuat. Angka lama atau data contoh tidak ditampilkan.
        </div>
      )}

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
          value={totalPipelineValue > 0 ? `Rp ${(totalPipelineValue / 1000000).toFixed(0)} Jt` : '—'}
          subtext={totalPipelineValue > 0 ? 'Sumber: database prospek' : 'Nilai pipeline belum tersedia dari API'}
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
