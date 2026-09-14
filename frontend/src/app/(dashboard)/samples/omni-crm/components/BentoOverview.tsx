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
      return (
        l.assignedTo === currentUser.id ||
        (currentUser.name &&
          l.assignedName &&
          (l.assignedName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
            currentUser.name.toLowerCase().includes(l.assignedName.toLowerCase())))
      );
    }
    if (isMasterOverview) return true;
    if (l.pipelineId === currentPipeline.id) return true;
    if (currentPipeline.assignedBusDevId && l.assignedTo === currentPipeline.assignedBusDevId) return true;
    const owner = (state.busDevs || []).find((b) => b.id === currentPipeline.assignedBusDevId);
    if (
      owner &&
      l.assignedName &&
      (l.assignedName.toLowerCase().includes(owner.name.toLowerCase()) ||
        owner.name.toLowerCase().includes(l.assignedName.toLowerCase()))
    ) {
      return true;
    }
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
      {/* BRAND CREDENTIALS HERO BANNER (DNA LIGHT PALETTE) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs shrink-0">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Dreamlab Indonesia
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  One-Stop Maklon Kosmetik Partner
                </span>
                {isBusDev && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 uppercase tracking-wide">
                    <Lock className="w-3 h-3" />
                    <span>Akun Terisolasi: {currentUser?.name}</span>
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Pusat CRM & WhatsApp Coexistence Terpadu — R&D Custom Formulasi, CPKB Grade A, BPOM & Halal Resmi, Desain Kemasan & Scale-up Beautypreneur.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges (Layer 02 DnaStatCard Inspired) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap self-stretch md:self-auto justify-end">
            <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-left shadow-2xs min-w-[110px]">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                {isBusDev ? 'Leads Anda' : 'Total Leads'}
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {currentPipelineLeads.length}
              </span>
            </div>
            <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-left shadow-2xs min-w-[110px]">
              <span className="text-[10px] text-blue-700 font-bold block uppercase tracking-wider">
                Client DEAL
              </span>
              <span className="text-lg font-bold text-blue-700 font-mono tabular-nums">
                {totalDeals} Deals
              </span>
            </div>
            <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-left shadow-2xs min-w-[130px]">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                Pipeline Value
              </span>
              <span className="text-lg font-bold text-emerald-700 font-mono tabular-nums">
                Rp {(totalValue / 1000000).toFixed(0)} Jt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: OVERVIEW MASTER & SUB-PIPELINES NAVIGATOR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Header: Overview Title & Master Toggle */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Dreamlab Multi-Pipeline Overview</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 font-mono font-bold uppercase tracking-wide">
                    1 BusDev = 1 Dedicated WhatsApp Number
                  </span>
                </h2>
                <p className="text-[12px] text-slate-500 font-normal">
                  Ringkasan Pipeline Master Maklon di atas dan Sub-Pipeline masing-masing BusDev di bawahnya
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto justify-end">
            {!isBusDev && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-[12px] font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Pipeline Baru</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('kanban')}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between text-[12px] mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
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
                type="button"
                onClick={() => setSelectedPipelineId('pipe_round_robin')}
                className={`flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] transition-colors cursor-pointer shrink-0 border ${
                  selectedPipelineId === 'pipe_round_robin'
                    ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 font-medium border-slate-200'
                }`}
              >
                <span>🌐 Master Round-Robin (All)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                    selectedPipelineId === 'pipe_round_robin'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-600'
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
                    (pipe.assignedBusDevId && l.assignedTo === pipe.assignedBusDevId) ||
                    (owner &&
                      l.assignedName &&
                      (l.assignedName.toLowerCase().includes(owner.name.toLowerCase()) ||
                        owner.name.toLowerCase().includes(l.assignedName.toLowerCase())))
                ).length;
                const isOnline = owner ? owner.status === 'AKTIF' : true;

                return (
                  <button
                    key={pipe.id}
                    id={`bento-subpipe-${pipe.id}`}
                    type="button"
                    onClick={() => setSelectedPipelineId(pipe.id)}
                    className={`flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] transition-colors cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 font-medium border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
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
                      <div className="truncate max-w-[130px] leading-tight">
                        {pipe.name}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
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
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-slate-900 uppercase tracking-wider">
                Tahapan Funnel Maklon: {isBusDev ? `Pipeline Pribadi (${currentUser?.name})` : currentPipeline.name}
              </span>
              {isBusDev && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 font-mono font-bold">
                  📱 {currentUser?.phone}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSourceFilter}
                onChange={(e) => setSelectedSourceFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded-lg h-8 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
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
                type="button"
                onClick={() => onOpenIntake(currentPipeline.id)}
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
                    <div className="flex items-center justify-between text-[11px] uppercase font-bold mb-2 pb-1 border-b border-slate-100">
                      <span className="text-slate-800 truncate">{stage.name}</span>
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold">
                        {leadsInStage.length}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                      {leadsInStage.length === 0 ? (
                        <div className="flex items-center justify-center py-4 text-slate-400 font-mono text-[10px] uppercase">
                          Kosong
                        </div>
                      ) : (
                        leadsInStage.map((lead) => {
                          const assignedUser = (state.busDevs || []).find((b) => b.id === lead.assignedTo);
                          return (
                            <div
                              key={lead.id}
                              onClick={() => onOpenLeadDetail(lead)}
                              className="bg-slate-50 hover:bg-blue-50/70 p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer group shadow-2xs"
                            >
                              <div className="text-[12px] font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                                {lead.name}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                                {lead.source}
                              </div>

                              <div className="mt-1 flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                                <span className="text-blue-700 font-mono font-medium">
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
                <span className="text-[12px] font-semibold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Overview Matriks Seluruh Pipeline BusDev:</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {activeBusDevs.length} BusDev Connected
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-[12px]">
                  <thead className="h-10 bg-slate-50/75 text-[11px] uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Pipeline & BusDev</th>
                      <th className="py-2.5 px-2 text-center text-slate-900 font-semibold">Total Leads</th>
                      <th className="py-2.5 px-2 text-center text-blue-700 font-semibold">Cold</th>
                      <th className="py-2.5 px-2 text-center text-amber-700 font-semibold">Warm</th>
                      <th className="py-2.5 px-2 text-center text-orange-700 font-semibold">Hot</th>
                      <th className="py-2.5 px-2 text-center text-purple-700 font-semibold">Sample</th>
                      <th className="py-2.5 px-3 text-right text-emerald-700 font-semibold">Pipeline Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
                    {pipelinesList.map((pipe) => {
                      const isSelected = pipe.id === selectedPipelineId;
                      const owner = (state.busDevs || []).find((b) => b.id === pipe.assignedBusDevId);
                      const pLeads = (state.leads || []).filter((l) =>
                        pipe.id === 'pipe_round_robin'
                          ? true
                          : l.pipelineId === pipe.id ||
                            (pipe.assignedBusDevId && l.assignedTo === pipe.assignedBusDevId) ||
                            (owner &&
                              l.assignedName &&
                              (l.assignedName.toLowerCase().includes(owner.name.toLowerCase()) ||
                                owner.name.toLowerCase().includes(l.assignedName.toLowerCase())))
                      );
                      const cold = pLeads.filter((l) => l.stageId === 'stage_cold').length;
                      const warm = pLeads.filter((l) => l.stageId === 'stage_warm').length;
                      const hot = pLeads.filter((l) => l.stageId === 'stage_hot').length;
                      const sample = pLeads.filter((l) => l.stageId === 'stage_sample').length;
                      const val = pLeads.reduce((acc, l) => acc + (l.value || 0), 0);

                      return (
                        <tr
                          key={pipe.id}
                          onClick={() => setSelectedPipelineId(pipe.id)}
                          className={`h-[40px] transition-colors cursor-pointer hover:bg-slate-50/60 ${
                            isSelected ? 'bg-blue-50/50 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-800 font-sans flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isSelected ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            />
                            <span className="truncate max-w-[180px] font-medium">{pipe.name}</span>
                            {owner && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({owner.formattedPhone || owner.phone})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-900 font-bold tabular-nums">
                            {pLeads.length}
                          </td>
                          <td className="py-2 px-2 text-center text-blue-700 tabular-nums">{cold}</td>
                          <td className="py-2 px-2 text-center text-amber-700 tabular-nums">{warm}</td>
                          <td className="py-2 px-2 text-center text-orange-700 tabular-nums">{hot}</td>
                          <td className="py-2 px-2 text-center text-purple-700 tabular-nums">{sample}</td>
                          <td className="py-2 px-3 text-right text-emerald-700 font-bold tabular-nums">
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
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-slate-900">
                  {isBusDev ? 'Pesan WhatsApp Nomor Anda' : 'Aktivitas WhatsApp Terkini'}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isBusDev ? currentUser?.phone : 'Sinkronisasi Realtime Coexistence'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('whatsapp')}
              className="text-[12px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Buka Chat</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentMessages.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-[12px]">
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
                    className="p-2.5 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200 transition-colors cursor-pointer text-[12px]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                        {lead?.name || msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
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
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-slate-900">
                  {isBusDev ? 'Profil & Spesialisasi Anda' : 'Distribusi Round Robin'}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isBusDev
                    ? currentUser?.specialty
                    : `Next: ${nextEligible?.name || (activeBusDevs[0]?.name ?? 'Belum ada')}`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('busdev')}
              className="text-[12px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Detail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(state.busDevs || []).slice(0, 5).map((busdev) => {
              const isCurrent = currentUser?.id === busdev.id;
              const count = (state.leads || []).filter(
                (l) =>
                  l.assignedTo === busdev.id ||
                  (l.assignedName &&
                    (l.assignedName.toLowerCase().includes(busdev.name.toLowerCase()) ||
                      busdev.name.toLowerCase().includes(l.assignedName.toLowerCase())))
              ).length;

              return (
                <div
                  key={busdev.id}
                  className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between text-[12px] ${
                    isCurrent
                      ? 'bg-emerald-50 border-emerald-200 font-semibold'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {busdev.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <span className="text-slate-900 block truncate font-medium">{busdev.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        📱 {busdev.formattedPhone || busdev.phone}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono font-bold text-slate-700">
                    {count} Leads
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Quick Action & Broadcast Shortcuts */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-slate-900">Broadcast & Automations</h3>
                <span className="text-[10px] text-slate-500 font-mono">Anti-Ban Spintax Engine</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigateTab('broadcast')}
              className="w-full h-10 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold shadow-2xs flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                <span>Kirim Broadcast Tertarget</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('kanban')}
              className="w-full h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[12px] font-semibold shadow-2xs flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span>Kelola Kanban Pipelines</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-blue-900 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Salesbot Otomasi Aktif</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
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
