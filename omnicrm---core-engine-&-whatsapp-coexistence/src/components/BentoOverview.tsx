import React, { useState } from 'react';
import {
  GitBranch,
  Users,
  MessageSquare,
  Radio,
  Terminal,
  Activity,
  ArrowRight,
  Sparkles,
  Zap,
  Smartphone,
  Laptop,
  CheckCircle2,
  Clock,
  RotateCw,
  Plus,
  Tag,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
  User,
  ShieldCheck,
  Flame,
  Award,
  FlaskConical,
  Lock,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { CRMState, Lead, BusDevUser, Pipeline, AppAccount } from '../types';
import { getNextRoundRobinBusDev } from '../services/crmEngine';
import { CreatePipelineModal } from './CreatePipelineModal';

interface BentoOverviewProps {
  state: CRMState;
  currentUser?: AppAccount;
  onNavigateTab: (tab: 'bento' | 'kanban' | 'whatsapp' | 'busdev' | 'broadcast' | 'console') => void;
  onOpenIntake: (pipelineId?: string) => void;
  onSelectLeadForChat: (leadId: string) => void;
  onOpenLeadDetail: (lead: Lead) => void;
  onCreatePipeline?: (
    name: string,
    roundRobin: boolean,
    stages?: string[],
    assignedBusDevId?: string
  ) => void;
}

export const BentoOverview: React.FC<BentoOverviewProps> = ({
  state,
  currentUser,
  onNavigateTab,
  onOpenIntake,
  onSelectLeadForChat,
  onOpenLeadDetail,
  onCreatePipeline,
}) => {
  const isBusDev = currentUser && !currentUser.isSuperAdmin;
  const pipelinesList = state.pipelines || [];

  // Default selected pipeline based on current user
  const initialPipelineId = isBusDev
    ? pipelinesList.find((p) => p.assignedBusDevId === currentUser.id)?.id || 'pipe_round_robin'
    : 'pipe_round_robin';

  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(initialPipelineId);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const nextEligible = getNextRoundRobinBusDev(state.busDevs || []);
  const currentPipeline =
    pipelinesList.find((p) => p.id === selectedPipelineId) ||
    pipelinesList[0] || {
      id: 'pipe_round_robin',
      name: 'Pipeline Round Robin',
      roundRobin: true,
      stages: [],
    };

  const isMasterOverview = currentPipeline.id === 'pipe_round_robin';

  // Leads for current pipeline view & security context
  const currentPipelineLeads = (state.leads || []).filter((l) => {
    if (isBusDev && currentUser) {
      return l.assignedTo === currentUser.id;
    }
    if (isMasterOverview) return true;
    if (l.pipelineId === currentPipeline.id) return true;
    if (currentPipeline.assignedBusDevId && l.assignedTo === currentPipeline.assignedBusDevId) return true;
    return false;
  });

  const filteredLeads =
    selectedSourceFilter === 'ALL'
      ? currentPipelineLeads
      : currentPipelineLeads.filter((l) => l.source === selectedSourceFilter);

  const recentMessages = isBusDev && currentUser
    ? [...(state.messages || [])]
        .filter((m) => {
          const lead = (state.leads || []).find((l) => l.id === m.leadId);
          return lead?.assignedTo === currentUser.id;
        })
        .reverse()
        .slice(0, 6)
    : [...(state.messages || [])].reverse().slice(0, 6);

  const activeBusDevs = (state.busDevs || []).filter((b) => b.status === 'AKTIF');

  // Extract all unique sources dynamically
  const allSources: string[] = Array.from(
    new Set((state.leads || []).map((l) => l.source).filter(Boolean))
  );

  // BusDev pipelines list
  const busDevPipelines = pipelinesList.filter(
    (p) =>
      p.assignedBusDevId ||
      p.id.startsWith('pipe_user') ||
      p.name.toLowerCase().includes('busdev')
  );

  // Top funnel preview stages
  const previewStages = (currentPipeline.stages || []).slice(0, 5);

  const totalDeals = currentPipelineLeads.filter((l) => l.stageId === 'stage_client_deal').length;
  const totalValue = currentPipelineLeads.reduce((acc, l) => acc + (l.value || 0), 0);

  return (
    <div className="space-y-4">
      {/* BRAND CREDENTIALS HERO BANNER (CLEAN LIGHT/WHITE PALETTE WITH VIBRANT BLUE & ORANGE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 border border-orange-400/40 shrink-0">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Dreamlab Indonesia
                </h1>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wide">
                  One-Stop Maklon Kosmetik Partner
                </span>
                {isBusDev && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Akun Terisolasi: {currentUser?.name}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
                Pusat CRM & WhatsApp Coexistence Terpadu — R&D Custom Formulasi, CPKB Grade A, BPOM & Halal Resmi, Desain Kemasan & Scale-up Beautypreneur.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap self-stretch md:self-auto justify-end">
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-left shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                {isBusDev ? 'Leads Anda' : 'Total Leads'}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
                {currentPipelineLeads.length}
              </span>
            </div>
            <div className="bg-orange-50 border border-orange-200 px-3.5 py-2 rounded-xl text-left shadow-2xs">
              <span className="text-[10px] text-orange-700 font-bold block uppercase tracking-wider">
                Client DEAL
              </span>
              <span className="text-base sm:text-lg font-extrabold text-orange-800 font-mono">
                {totalDeals} Deals
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-left shadow-2xs">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                Pipeline Value
              </span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-800 font-mono">
                Rp {(totalValue / 1000000).toFixed(0)} Jt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: OVERVIEW MASTER & SUB-PIPELINES NAVIGATOR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Header: Overview Title & Master Toggle */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Dreamlab Multi-Pipeline Overview</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 font-mono font-bold">
                    1 BusDev = 1 Dedicated WhatsApp Number
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Ringkasan Pipeline Master Maklon di atas dan Sub-Pipeline masing-masing BusDev di bawahnya
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto justify-end">
            {!isBusDev && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5 border border-orange-400/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Pipeline Baru</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('kanban')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Buka Kanban Full</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* SUB-PIPELINES BAR: BusDev Sub-Pipelines Carousel */}
        {!isBusDev && (
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Sub-Pipeline BusDev Maklon:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {busDevPipelines.length} Dedicated BusDev Pipelines
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {/* Master Overview Pill */}
              <button
                onClick={() => setSelectedPipelineId('pipe_round_robin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer shrink-0 border ${
                  selectedPipelineId === 'pipe_round_robin'
                    ? 'bg-blue-600 text-white shadow-sm border-blue-600 font-bold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span className="text-[10px]">🌐</span>
                <span>Master Round-Robin (All)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    selectedPipelineId === 'pipe_round_robin'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {(state.leads || []).length}
                </span>
              </button>

              {/* Individual BusDev Sub-Pipelines */}
              {busDevPipelines.map((pipe) => {
                const isSelected = pipe.id === selectedPipelineId;
                const owner = (state.busDevs || []).find((b) => b.id === pipe.assignedBusDevId);
                const count = (state.leads || []).filter(
                  (l) =>
                    l.pipelineId === pipe.id ||
                    (pipe.assignedBusDevId && l.assignedTo === pipe.assignedBusDevId)
                ).length;
                const isOnline = owner ? owner.status === 'AKTIF' : true;

                return (
                  <button
                    key={pipe.id}
                    id={`bento-subpipe-${pipe.id}`}
                    onClick={() => setSelectedPipelineId(pipe.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm border-blue-600 font-bold'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? 'bg-white text-blue-700'
                          : isOnline
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {owner ? owner.name.charAt(0) : 'P'}
                    </div>

                    <div className="text-left">
                      <div className="truncate max-w-[130px] leading-tight font-bold">
                        {pipe.name}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVE PIPELINE STAGE PREVIEW (COLD -> WARM -> HOT -> SAMPLE) */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tahapan Funnel Maklon: {isBusDev ? `Pipeline Pribadi (${currentUser?.name})` : currentPipeline.name}
              </span>
              {isBusDev && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-mono font-bold">
                  📱 {currentUser?.phone}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSourceFilter}
                onChange={(e) => setSelectedSourceFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-[10px] font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">Semua Source ({currentPipelineLeads.length})</option>
                {allSources.map((src) => {
                  const count = currentPipelineLeads.filter((l) => l.source === src).length;
                  return (
                    <option key={src} value={src}>
                      {src} ({count})
                    </option>
                  );
                })}
              </select>

              <button
                onClick={() => onOpenIntake(currentPipeline.id)}
                className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Lead Baru</span>
              </button>
            </div>
          </div>

          {/* Stages Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {previewStages.map((stage) => {
              const leadsInStage = filteredLeads.filter((l) => l.stageId === stage.id);

              return (
                <div
                  key={stage.id}
                  className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold mb-2 pb-1 border-b border-slate-100">
                      <span className="text-slate-800 truncate">{stage.name}</span>
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold">
                        {leadsInStage.length}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                      {leadsInStage.length === 0 ? (
                        <div className="flex items-center justify-center py-4 text-slate-400 font-mono text-[9px] uppercase">
                          Kosong
                        </div>
                      ) : (
                        leadsInStage.map((lead) => {
                          const assignedUser = (state.busDevs || []).find((b) => b.id === lead.assignedTo);
                          return (
                            <div
                              key={lead.id}
                              onClick={() => onOpenLeadDetail(lead)}
                              className="bg-slate-50 hover:bg-blue-50/70 p-2 rounded-lg border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group shadow-2xs"
                            >
                              <div className="text-[11px] font-bold text-slate-900 group-hover:text-blue-700 truncate">
                                {lead.name}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-0.5 font-mono truncate">
                                {lead.source}
                              </div>

                              <div className="mt-1 flex items-center justify-between pt-1 border-t border-slate-200/60 text-[8px]">
                                <span className="text-blue-700 font-mono font-semibold">
                                  {assignedUser ? assignedUser.name.split(' ')[0] : 'Unassigned'}
                                </span>
                                <span className="text-slate-400 font-mono">{lead.id}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Funnel Matrix Table (Admin Only) */}
          {!isBusDev && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                  <span>Overview Matriks Seluruh Pipeline BusDev:</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">10 BusDev Connected</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Pipeline & BusDev</th>
                      <th className="py-2.5 px-2 text-center text-slate-900">Total Leads</th>
                      <th className="py-2.5 px-2 text-center text-blue-700">Cold</th>
                      <th className="py-2.5 px-2 text-center text-amber-700">Warm</th>
                      <th className="py-2.5 px-2 text-center text-orange-700">Hot</th>
                      <th className="py-2.5 px-2 text-center text-purple-700">Sample</th>
                      <th className="py-2.5 px-3 text-right text-emerald-700">Pipeline Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {pipelinesList.map((pipe) => {
                      const isSelected = pipe.id === selectedPipelineId;
                      const pLeads = (state.leads || []).filter((l) =>
                        pipe.id === 'pipe_round_robin'
                          ? true
                          : l.pipelineId === pipe.id ||
                            (pipe.assignedBusDevId && l.assignedTo === pipe.assignedBusDevId)
                      );
                      const cold = pLeads.filter((l) => l.stageId === 'stage_cold').length;
                      const warm = pLeads.filter((l) => l.stageId === 'stage_warm').length;
                      const hot = pLeads.filter((l) => l.stageId === 'stage_hot').length;
                      const sample = pLeads.filter((l) => l.stageId === 'stage_sample').length;
                      const val = pLeads.reduce((acc, l) => acc + (l.value || 0), 0);
                      const owner = (state.busDevs || []).find((b) => b.id === pipe.assignedBusDevId);

                      return (
                        <tr
                          key={pipe.id}
                          onClick={() => setSelectedPipelineId(pipe.id)}
                          className={`transition-colors cursor-pointer hover:bg-blue-50/50 ${
                            isSelected ? 'bg-blue-50 font-bold' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-800 font-sans flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isSelected ? 'bg-orange-500' : 'bg-slate-400'
                              }`}
                            />
                            <span className="truncate max-w-[180px]">{pipe.name}</span>
                            {owner && (
                              <span className="text-[9px] text-slate-500 font-mono">
                                ({owner.formattedPhone || owner.phone})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-900 font-bold">
                            {pLeads.length}
                          </td>
                          <td className="py-2 px-2 text-center text-blue-700">{cold}</td>
                          <td className="py-2 px-2 text-center text-amber-700">{warm}</td>
                          <td className="py-2 px-2 text-center text-orange-700">{hot}</td>
                          <td className="py-2 px-2 text-center text-purple-700">{sample}</td>
                          <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                            Rp {(val / 1000000).toFixed(0)} Jt
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 BENTO CARDS: WHATSAPP CONVERSATIONS, BUSDEV STATUS & AUTOMATION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: WhatsApp Activity Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {isBusDev ? 'Pesan WhatsApp Nomor Anda' : 'Aktivitas WhatsApp Terkini'}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isBusDev ? currentUser?.phone : 'Sinkronisasi Realtime Coexistence'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('whatsapp')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Chat</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentMessages.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Belum ada percakapan WhatsApp baru.
              </div>
            ) : (
              recentMessages.map((msg) => {
                const lead = (state.leads || []).find((l) => l.id === msg.leadId);
                const isOutbound = msg.direction === 'OUTBOUND';

                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      onSelectLeadForChat(msg.leadId);
                      onNavigateTab('whatsapp');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 truncate max-w-[140px]">
                        {lead?.name || msg.senderName}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-1">
                      {isOutbound && <span className="text-blue-600 font-semibold">Anda: </span>}
                      {msg.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card 2: BusDev Team / Round Robin Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {isBusDev ? 'Profil & Spesialisasi Anda' : 'Distribusi Round Robin'}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isBusDev ? currentUser?.specialty : `Next: ${nextEligible?.name || 'Diaz'}`}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('busdev')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Detail</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(state.busDevs || []).slice(0, 5).map((busdev) => {
              const isCurrent = currentUser?.id === busdev.id;
              const count = (state.leads || []).filter((l) => l.assignedTo === busdev.id).length;

              return (
                <div
                  key={busdev.id}
                  className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between text-xs ${
                    isCurrent
                      ? 'bg-emerald-50 border-emerald-200 font-bold'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {busdev.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <span className="text-slate-900 block truncate">{busdev.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        📱 {busdev.formattedPhone || busdev.phone}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 font-mono font-bold text-slate-700">
                    {count} Leads
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Quick Action & Broadcast Shortcuts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Broadcast & Automations</h3>
                <span className="text-[10px] text-slate-500 font-mono">Anti-Ban Spintax Engine</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('broadcast')}
              className="w-full p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                <span>Kirim Broadcast Tertarget</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('kanban')}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span>Kelola Kanban Pipelines</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl text-[11px] text-orange-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>Salesbot Otomasi Aktif</span>
              </div>
              <p className="text-slate-600 text-[10px] leading-relaxed">
                Salesbot otomatis membalas sapaan dari Meta Ads & Google Ads, lalu mengalihkan obrolan ke nomor WhatsApp BusDev Anda saat prospek siap berkonsultasi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Pipeline Modal */}
      {isCreateModalOpen && onCreatePipeline && (
        <CreatePipelineModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={onCreatePipeline}
          busDevs={state.busDevs || []}
        />
      )}
    </div>
  );
};
