import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
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

import type {
  CRMState,
  Lead,
  MessageChannel,
  MessageDirection,
  AutomationFlow,
  AppAccount,
} from './types';
import { INITIAL_STATE, FIVE_STAGE_FUNNEL } from './data/initialState';
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
} from './services/crmEngine';
import { CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';

const STORAGE_KEY = 'omnicrm_state_v5';

// Default user is Super Admin
const DEFAULT_ACCOUNT: AppAccount = {
  id: 'admin',
  name: 'DREAMLAB MASTER ADMIN',
  role: 'SUPER_ADMIN',
  isSuperAdmin: true,
  phone: '6281100001111',
  avatar: '👑',
};

export default function App() {
  const [state, setState] = useState<CRMState>(() => {
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Storage quota exceeded:', e);
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
    setState(result.newState);
    if (activeLeadForDetail && activeLeadForDetail.id === leadId && result.lead) {
      setActiveLeadForDetail(result.lead);
    }
    showToast(result.log.resultSummary);
  };

  const handleSyncWhatsapp = (
    leadId: string,
    message: string,
    direction: MessageDirection,
    channel: MessageChannel
  ) => {
    const result = syncWhatsappMessage(state, {
      lead_id: leadId,
      message,
      direction,
      channel,
    });
    setState(result.newState);
    showToast(result.log.resultSummary);
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
    showToast(`Berhasil mensimulasikan ${count} lead masuk secara rotasi Round-Robin 10 BusDev!`);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white pb-12">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        state={state}
        currentUser={currentUser}
        onAccountChange={(acc) => {
          setCurrentUser(acc);
          showToast(`Beralih akun: ${acc.name} (${acc.isSuperAdmin ? 'Akses Penuh Semua Chat' : 'Khusus Nomor ' + acc.phone})`);
        }}
        onOpenIntake={() => {
          setIntakeDefaultPipeline('pipe_round_robin');
          setIsIntakeOpen(true);
        }}
        onResetState={handleResetState}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSalesbotFlow={() => setIsSalesbotOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 flex-1 w-full">
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
      </main>

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
    </div>
  );
}
