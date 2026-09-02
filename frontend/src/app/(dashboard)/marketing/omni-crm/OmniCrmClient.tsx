'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Layers,
  MessageSquare,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { DnaBadge } from '@/components/dna/DnaBadge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { CRMState, Lead, WhatsAppMessage, BusDevUser, Pipeline } from './types';
import { INITIAL_STATE, FIVE_STAGE_FUNNEL } from './initialState';
import {
  intakeGuestbook,
  toggleBusdevStatus,
  moveLeadStage,
  syncWhatsappMessage,
  togglePipelineRoundRobin,
  renderBroadcastMessage,
  generateUniqueId,
  IntakeGuestbookParams,
} from './crmEngine';

const STORAGE_KEY = 'erp_omnicrm_state_v1';

export default function OmniCrmClient() {
  const [state, setState] = useState<CRMState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
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

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    state.leads[0]?.id || null
  );
  const [activeLeadForDetail, setActiveLeadForDetail] = useState<Lead | null>(null);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);

  // Form states for Guestbook Intake
  const [intakeForm, setIntakeForm] = useState<IntakeGuestbookParams>({
    name: '',
    phone: '',
    source: 'Meta Ads',
    notes: '',
    value: 30000000,
  });

  // Message state for WhatsApp Coexistence
  const [chatInput, setChatInput] = useState('');

  // Broadcast state
  const [broadcastSourceFilter, setBroadcastSourceFilter] = useState('ALL');
  const [broadcastTemplate, setBroadcastTemplate] = useState(
    'Halo {{name}}, {kabar baik|apa kabar}? Kami dari ERP Digmar ingin menawarkan promo spesial maklon skincare.'
  );

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const activePipeline = state.pipelines[0] || INITIAL_STATE.pipelines[0];

  // Calculated Stats
  const totalLeadsCount = state.leads.length;
  const unansweredCount = state.leads.filter((l) => !l.isAnswered).length;
  const totalValue = state.leads.reduce((acc, l) => acc + (l.value || 0), 0);
  const dealsCount = state.leads.filter((l) => l.stageId === 'stage_client_deal').length;
  const rrStatus = activePipeline.roundRobin;

  // HANDLERS
  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeForm.name || !intakeForm.phone) {
      showToast('⚠️ Nama dan Nomor HP wajib diisi!');
      return;
    }
    const result = intakeGuestbook(state, intakeForm);
    setState(result.newState);
    setSelectedLeadId(result.newLead.id);
    setIsIntakeOpen(false);
    setIntakeForm({ name: '', phone: '', source: 'Meta Ads', notes: '', value: 30000000 });
    showToast(result.log.resultSummary);
  };

  const handleSendMessage = () => {
    if (!selectedLeadId || !chatInput.trim()) return;
    const result = syncWhatsappMessage(state, {
      lead_id: selectedLeadId,
      message: chatInput,
      direction: 'OUTBOUND',
      channel: 'WHATSAPP_HP',
    });
    setState(result.newState);
    setChatInput('');
    showToast('Pesan WhatsApp terkirim & tersinkronisasi!');
  };

  const handleMoveStage = (leadId: string, newStageId: string) => {
    const result = moveLeadStage(state, {
      lead_id: leadId,
      target_pipeline_id: activePipeline.id,
      target_stage_id: newStageId,
    });
    setState(result.newState);
    if (activeLeadForDetail && activeLeadForDetail.id === leadId) {
      setActiveLeadForDetail(result.lead);
    }
    showToast(result.log.resultSummary);
  };

  const handleToggleBusdev = (userId: string, currentStatus: string) => {
    const result = toggleBusdevStatus(state, {
      user_id: userId,
      is_active: currentStatus !== 'AKTIF',
    });
    setState(result.newState);
    showToast(result.log.resultSummary);
  };

  const handleToggleRR = () => {
    const result = togglePipelineRoundRobin(state, activePipeline.id);
    setState(result.newState);
    showToast(result.log.resultSummary);
  };

  const selectedLead = state.leads.find((l) => l.id === selectedLeadId) || state.leads[0];
  const selectedLeadMessages = state.messages.filter((m) => m.leadId === selectedLeadId);

  return (
    <DashboardShell
      title="Omni CRM — Core Engine & WhatsApp Coexistence"
      subtitle="Sistem Manajemen Leads Omnichannel, Rotasi Round-Robin BusDev, & Engine Chat Coexistence"
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Compact Clean Header KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Inbound Leads</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{totalLeadsCount}</h3>
              <p className="text-[10px] font-bold text-slate-400">Omnichannel Intake</p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Belum Direspon</p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-600 tabular-nums">{unansweredCount}</h3>
              <p className="text-[10px] font-bold text-amber-500">Unanswered Queue</p>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Round-Robin Engine</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">{rrStatus ? 'AKTIF' : 'OFF'}</h3>
              <p className="text-[10px] font-bold text-emerald-600">{rrStatus ? 'Rotasi 5 BusDev' : 'Manual Mode'}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <Radio className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nilai Pipeline</p>
              <h3 className="text-xl sm:text-2xl font-black text-purple-600 tabular-nums">Rp {(totalValue / 1000000).toFixed(0)}M</h3>
              <p className="text-[10px] font-bold text-purple-500">{dealsCount} Client Deals</p>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {[
              { id: 'bento', label: 'Bento Overview', icon: Layers },
              { id: 'kanban', label: 'Pipeline Kanban', icon: BarChart3 },
              { id: 'whatsapp', label: 'WhatsApp Inbox', icon: MessageSquare },
              { id: 'busdev', label: 'BusDev Manager', icon: Users },
              { id: 'broadcast', label: 'Broadcast Simulator', icon: Zap },
              { id: 'console', label: 'Engine Audit Log', icon: Terminal },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleRR}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                rrStatus
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Round-Robin: {rrStatus ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setIsIntakeOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Lead Baru (Intake)
            </button>
          </div>
        </div>

        {/* 1. BENTO OVERVIEW */}
        {activeTab === 'bento' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 md:col-span-2 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> Ringkasan Distribution Engine
                </h3>
                <DnaBadge status="info">LIVE ENGINE ACTIVE</DnaBadge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Status Round-Robin</span>
                  <div className="font-bold text-emerald-600 text-xs">{rrStatus ? 'Auto Rotate Active' : 'Manual Mode'}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Tim BusDev Aktif</span>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    {state.busDevs.filter((b) => b.status === 'AKTIF').length} / {state.busDevs.length} BusDev
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Unanswered Rate</span>
                  <div className="font-bold text-amber-600 text-xs">
                    {totalLeadsCount > 0 ? ((unansweredCount / totalLeadsCount) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {/* Lead Recent List */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Leads Terbaru Masuk:</span>
                <div className="space-y-2">
                  {state.leads.slice(0, 4).map((lead) => {
                    const busdev = state.busDevs.find((b) => b.id === lead.assignedTo);
                    return (
                      <div
                        key={lead.id}
                        onClick={() => setActiveLeadForDetail(lead)}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{lead.name}</div>
                          <div className="text-[10px] text-slate-400">Source: {lead.source} • Phone: {lead.phone}</div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <DnaBadge status="default">{busdev ? busdev.name : 'Unassigned'}</DnaBadge>
                          <div className="text-[10px] text-emerald-600 font-bold">
                            Rp {((lead.value || 0) / 1000000).toFixed(0)}M
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Side Bento Card */}
            <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" /> Sumber Traffic Inbound
              </h3>

              <div className="space-y-2 text-xs">
                {(state.trafficSources || []).map((src) => {
                  const leadCnt = state.leads.filter((l) => l.source.toLowerCase().includes(src.name.toLowerCase())).length;
                  return (
                    <div key={src.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{src.name}</div>
                        <div className="text-[9px] text-slate-400 uppercase">{src.platform}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-[10px]">
                        {leadCnt} Leads
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* 2. PIPELINE KANBAN */}
        {activeTab === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto pb-4 scrollbar-thin">
            {activePipeline.stages.slice(0, 5).map((stage) => {
              const stageLeads = state.leads.filter((l) => l.stageId === stage.id);
              return (
                <div
                  key={stage.id}
                  className="bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 space-y-2.5 min-w-[230px]"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {stage.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-600 dark:text-slate-400">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stageLeads.map((lead) => {
                      const busdev = state.busDevs.find((b) => b.id === lead.assignedTo);
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setActiveLeadForDetail(lead)}
                          className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold text-blue-600 uppercase">{lead.source}</span>
                            <DnaBadge status={lead.isAnswered ? 'success' : 'warning'}>
                              {lead.isAnswered ? 'RESPONDED' : 'UNANSWERED'}
                            </DnaBadge>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{lead.name}</h4>
                          <div className="text-[10px] text-emerald-600 font-bold tabular-nums">
                            Rp {((lead.value || 0) / 1000000).toFixed(0)}M
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
                            <span className="font-semibold">{busdev ? busdev.name : 'Unassigned'}</span>
                            <span className="text-blue-500 font-bold">Detail &rarr;</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. WHATSAPP COEXISTENCE INBOX */}
        {activeTab === 'whatsapp' && (
          <Card className="p-0 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[560px] shadow-sm">
            {/* Left Conversations List */}
            <div className="w-full md:w-72 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/40">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">WhatsApp Coexistence Inbox</span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <Input type="text" placeholder="Cari percakapan..." className="pl-8 h-8 text-xs rounded-xl" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {state.leads.map((lead) => {
                  const lastMsg = state.messages.filter((m) => m.leadId === lead.id).slice(-1)[0];
                  const isSelected = lead.id === selectedLeadId;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`p-3 cursor-pointer transition-colors space-y-1 ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/60 border-l-4 border-blue-600'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{lead.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{lead.source}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">
                        {lastMsg ? lastMsg.message : 'Belum ada obrolan'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Chat Thread & Actions */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
              {selectedLead ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{selectedLead.name}</h4>
                      <p className="text-[10px] text-slate-400">Phone: {selectedLead.phone} • Source: {selectedLead.source}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedLead.stageId}
                        onChange={(e) => handleMoveStage(selectedLead.id, e.target.value)}
                        className="h-8 px-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-slate-800"
                      >
                        {activePipeline.stages.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setActiveLeadForDetail(selectedLead)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        Detail Lead
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages Body */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                    {selectedLeadMessages.length > 0 ? (
                      selectedLeadMessages.map((msg) => {
                        const isOutbound = msg.direction === 'OUTBOUND';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed space-y-1 ${
                                isOutbound
                                  ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none shadow-sm'
                              }`}
                            >
                              <div className="text-[9px] opacity-75 font-extrabold">{msg.senderName}</div>
                              <div className="text-xs">{msg.message}</div>
                              <div className="text-[9px] opacity-60 text-right">
                                {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-xs text-slate-400 py-10">
                        Belum ada riwayat percakapan. Mulai kirim pesan balasan di bawah!
                      </div>
                    )}
                  </div>

                  {/* Chat Input Footer */}
                  <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Ketik pesan WhatsApp balasan ke lead..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 text-xs rounded-xl"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                  Pilih lead dari panel kiri untuk membuka percakapan.
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 4. BUSDEV MANAGER */}
        {activeTab === 'busdev' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {state.busDevs.map((busdev) => (
              <Card key={busdev.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{busdev.avatar || '👤'}</span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{busdev.name}</h4>
                      <p className="text-[10px] text-slate-400">{busdev.role} • {busdev.specialty}</p>
                    </div>
                  </div>
                  <DnaBadge status={busdev.status === 'AKTIF' ? 'success' : 'default'}>
                    {busdev.status}
                  </DnaBadge>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Leads Terdistribusi</span>
                  <span className="font-black text-blue-600 text-xs tabular-nums">{busdev.leadCount} Leads</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">{busdev.formattedPhone}</span>
                  <button
                    onClick={() => handleToggleBusdev(busdev.id, busdev.status)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase"
                  >
                    Toggle {busdev.status === 'AKTIF' ? 'Non-Aktif' : 'Aktifkan'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 5. BROADCAST SIMULATOR */}
        {activeTab === 'broadcast' && (
          <Card className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> WhatsApp Broadcast Simulator
              </h3>
              <p className="text-[11px] text-slate-500">
                Simulasi broadcast terpersonalisasi dengan Spintax {'{A|B|C}'} dan variabel {'{{name}}'}.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Filter Target Leads:</label>
                <select
                  value={broadcastSourceFilter}
                  onChange={(e) => setBroadcastSourceFilter(e.target.value)}
                  className="w-full h-8 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="ALL">Semua Leads ({state.leads.length} Kontak)</option>
                  <option value="Meta Ads">Khusus Meta Ads</option>
                  <option value="Google Ads">Khusus Google Ads</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Template Pesan Broadcast:</label>
                <textarea
                  rows={3}
                  value={broadcastTemplate}
                  onChange={(e) => setBroadcastTemplate(e.target.value)}
                  className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                />
              </div>

              {/* Sample Rendered Preview */}
              {state.leads[0] && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold text-blue-600 block uppercase">Preview Render ({state.leads[0].name}):</span>
                  <p className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {renderBroadcastMessage(broadcastTemplate, state.leads[0])}
                  </p>
                </div>
              )}

              <button
                onClick={() => showToast('🚀 Broadcast berhasil disimulasikan & dicatat di audit log!')}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Jalankan Broadcast Simulator Now
              </button>
            </div>
          </Card>
        )}

        {/* 6. ENGINE AUDIT LOG */}
        {activeTab === 'console' && (
          <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700 dark:text-slate-300" /> Omni CRM Action Audit Trail Log
              </h3>
              <button
                onClick={() => {
                  setState((prev) => ({ ...prev, logs: [] }));
                  showToast('Audit log berhasil dibersihkan.');
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-rose-600"
              >
                Clear Log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Waktu</th>
                    <th className="p-2">Action</th>
                    <th className="p-2">Ringkasan Eksekusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {state.logs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-2 text-slate-400 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                      </td>
                      <td className="p-2 font-bold text-blue-600">{log.action}</td>
                      <td className="p-2 text-slate-700 dark:text-slate-300">{log.resultSummary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* GUESTBOOK INTAKE MODAL */}
      {isIntakeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" /> Intake Lead Inbound Baru
              </h3>
              <button onClick={() => setIsIntakeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase text-slate-400">Nama Lead / Perusahaan *</label>
                <Input
                  type="text"
                  placeholder="cth: Brand Skincare Glow"
                  value={intakeForm.name}
                  onChange={(e) => setIntakeForm({ ...intakeForm, name: e.target.value })}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase text-slate-400">Nomor WhatsApp *</label>
                <Input
                  type="text"
                  placeholder="cth: 6281234567890"
                  value={intakeForm.phone}
                  onChange={(e) => setIntakeForm({ ...intakeForm, phone: e.target.value })}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase text-slate-400">Sumber Traffic</label>
                <select
                  value={intakeForm.source}
                  onChange={(e) => setIntakeForm({ ...intakeForm, source: e.target.value })}
                  className="w-full h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="TikTok Ads">TikTok Ads</option>
                  <option value="Link Tree">Link Tree</option>
                  <option value="Booth Expo">Booth Expo / Offline</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase text-slate-400">Catatan Kebutuhan</label>
                <Input
                  type="text"
                  placeholder="cth: Maklon serum 5.000 pcs"
                  value={intakeForm.notes}
                  onChange={(e) => setIntakeForm({ ...intakeForm, notes: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIntakeOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                >
                  Daftarkan Lead (Auto Rotate)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAD DETAIL MODAL */}
      {activeLeadForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{activeLeadForDetail.name}</h3>
                <p className="text-[10px] text-slate-400">Lead ID: {activeLeadForDetail.id}</p>
              </div>
              <button onClick={() => setActiveLeadForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Funnel Stage:</span>
                <select
                  value={activeLeadForDetail.stageId}
                  onChange={(e) => handleMoveStage(activeLeadForDetail.id, e.target.value)}
                  className="w-full h-8 px-2 font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {activePipeline.stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone:</span>
                  <div className="font-bold text-xs">{activeLeadForDetail.phone}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nilai Prospek:</span>
                  <div className="font-bold text-emerald-600 text-xs tabular-nums">
                    Rp {((activeLeadForDetail.value || 0) / 1000000).toFixed(0)}M
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Catatan / Kebutuhan:</span>
                <p className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                  {activeLeadForDetail.notes || 'Tidak ada catatan khusus.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveLeadForDetail(null)}
                className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
