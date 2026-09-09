import React, { useState } from 'react';
import {
  GitBranch,
  User,
  Phone,
  Tag,
  ArrowRight,
  Plus,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Filter,
  Search,
  Users,
  Radio,
  Layers,
  Check,
  Briefcase,
  TrendingUp,
  Lock,
  Smartphone,
  Flame,
} from 'lucide-react';
import { CRMState, Lead, Pipeline, BusDevUser, AppAccount } from '../types';
import { CreatePipelineModal } from './CreatePipelineModal';

interface PipelineKanbanProps {
  state: CRMState;
  currentUser?: AppAccount;
  onMoveLead: (leadId: string, targetPipeId: string, targetStageId: string) => void;
  onTogglePipelineRR: (pipelineId: string) => void;
  onSelectLeadForChat: (leadId: string) => void;
  onOpenIntake: (pipelineId?: string) => void;
  onOpenLeadDetail: (lead: Lead) => void;
  onOpenSettings?: () => void;
  onOpenSalesbotFlow?: () => void;
  onCreatePipeline?: (
    name: string,
    roundRobin: boolean,
    stages?: string[],
    assignedBusDevId?: string
  ) => void;
}

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
  state,
  currentUser,
  onMoveLead,
  onTogglePipelineRR,
  onSelectLeadForChat,
  onOpenIntake,
  onOpenLeadDetail,
  onOpenSettings,
  onOpenSalesbotFlow,
  onCreatePipeline,
}) => {
  const isBusDev = currentUser && !currentUser.isSuperAdmin;
  const pipelinesList = state.pipelines || [];

  // Default to BusDev's own pipeline if logged in as BusDev
  const initialPipelineId = isBusDev
    ? pipelinesList.find((p) => p.assignedBusDevId === currentUser.id)?.id || 'pipe_round_robin'
    : pipelinesList[0]?.id || 'pipe_round_robin';

  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(initialPipelineId);
  const [activeCategory, setActiveCategory] = useState<'all' | 'busdev' | 'channel'>('busdev');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');
  const [selectedBusDevFilter, setSelectedBusDevFilter] = useState<string>('ALL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentPipeline =
    pipelinesList.find((p) => p.id === selectedPipelineId) ||
    pipelinesList[0] || {
      id: 'pipe_round_robin',
      name: 'Pipeline Round Robin',
      roundRobin: true,
      stages: [],
    };

  // BusDev pipelines vs Channel pipelines
  const busDevPipelines = pipelinesList.filter(
    (p) =>
      p.assignedBusDevId ||
      p.id.startsWith('pipe_user') ||
      p.name.toLowerCase().includes('busdev')
  );
  const channelPipelines = pipelinesList.filter(
    (p) => !busDevPipelines.some((bp) => bp.id === p.id) && p.id !== 'pipe_round_robin'
  );

  // Pipeline owner info if any
  const assignedOwner: BusDevUser | undefined = currentPipeline.assignedBusDevId
    ? (state.busDevs || []).find((b) => b.id === currentPipeline.assignedBusDevId)
    : undefined;

  // Extract all unique sources and their counts
  const allSources: string[] = Array.from(
    new Set((state.leads || []).map((l) => l.source).filter(Boolean))
  );

  const getSourceBadgeStyle = (src: string) => {
    const s = (src || '').toLowerCase();
    if (s.includes('meta')) {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: '📱',
      };
    }
    if (s.includes('google ads') || s.includes('adwords')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: '🔍',
      };
    }
    if (s.includes('google') || s.includes('organic') || s.includes('seo')) {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: '🌐',
      };
    }
    if (s.includes('tiktok')) {
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        icon: '🎵',
      };
    }
    if (s.includes('link') || s.includes('tree') || s.includes('bio')) {
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        icon: '🌲',
      };
    }
    if (s.includes('wa') || s.includes('whatsapp') || s.includes('inbound')) {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: '💬',
      };
    }
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: '🏷️',
    };
  };

  // Extract all unique tags
  const allTags: string[] = Array.from(
    new Set(
      (state.leads || [])
        .flatMap((l) => l.tags || [])
        .concat((state.messages || []).flatMap((m) => m.tags || []))
        .filter(Boolean)
    )
  );

  const getAssigneeInfo = (userId: string | null) => {
    if (!userId) {
      return { name: 'Unassigned', status: 'NON-AKTIF', isUnassigned: true };
    }
    const user = (state.busDevs || []).find((u) => u.id === userId);
    return user
      ? { name: user.name, status: user.status, isUnassigned: false, id: user.id, phone: user.formattedPhone || user.phone }
      : { name: userId, status: 'UNKNOWN', isUnassigned: false, id: userId, phone: '' };
  };

  const getLeadMessageCount = (leadId: string) => {
    return (state.messages || []).filter((m) => m.leadId === leadId).length;
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStageId: string) => {
    if (draggedLeadId) {
      onMoveLead(draggedLeadId, currentPipeline.id, targetStageId);
      setDraggedLeadId(null);
    }
  };

  // Filtered Leads for active pipeline view
  const filteredLeads = (state.leads || []).filter((lead) => {
    // Role Isolation
    if (isBusDev && currentUser) {
      if (lead.assignedTo !== currentUser.id) return false;
    } else {
      // Admin pipeline filter
      if (currentPipeline.id !== 'pipe_round_robin') {
        if (lead.pipelineId !== currentPipeline.id) {
          if (
            currentPipeline.assignedBusDevId &&
            lead.assignedTo === currentPipeline.assignedBusDevId
          ) {
            // matches busDev owner
          } else {
            return false;
          }
        }
      }
    }

    // Source Filter
    if (selectedSourceFilter !== 'ALL' && lead.source !== selectedSourceFilter) {
      return false;
    }

    // BusDev Filter (Admin only)
    if (!isBusDev && selectedBusDevFilter !== 'ALL' && lead.assignedTo !== selectedBusDevFilter) {
      return false;
    }

    // Tag Filter
    if (selectedTagFilter !== 'ALL') {
      const hasLeadTag = lead.tags?.includes(selectedTagFilter);
      const hasMsgTag = (state.messages || []).some(
        (m) => m.leadId === lead.id && m.tags?.includes(selectedTagFilter)
      );
      if (!hasLeadTag && !hasMsgTag) return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchCompany = lead.company?.toLowerCase().includes(q);
      const matchPhone = lead.phone.includes(q);
      const matchNotes = lead.notes?.toLowerCase().includes(q);
      const matchId = lead.id.toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchPhone && !matchNotes && !matchId) {
        return false;
      }
    }

    return true;
  });

  const totalValue = filteredLeads.reduce((acc, l) => acc + (l.value || 0), 0);

  return (
    <div className="space-y-4">
      {/* Role / Mode Notice */}
      {isBusDev && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="text-xs font-bold text-emerald-950 block">
                Pipeline Terisolasi: {currentUser?.name}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                Hanya menampilkan leads yang terhubung ke nomor WhatsApp khusus Anda (📱 {currentUser?.phone})
              </span>
            </div>
          </div>

          <span className="text-xs font-bold font-mono px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-emerald-800">
            {filteredLeads.length} Leads Terpantau
          </span>
        </div>
      )}

      {/* PIPELINE SELECTOR & NAVIGATION TABS BAR (WHITE THEME) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {isBusDev ? `Pipeline BusDev: ${currentUser?.name}` : currentPipeline.name}
                </h2>
                {currentPipeline.roundRobin && !isBusDev && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    Round Robin Aktif
                  </span>
                )}
                {assignedOwner && !isBusDev && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold border border-blue-200 font-mono">
                    Owner: {assignedOwner.name} ({assignedOwner.formattedPhone || assignedOwner.phone})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Pindahkan lead antar kolom tahapan atau klik kartu untuk melihat detail formulasi maklon.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isBusDev && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pipeline Baru</span>
              </button>
            )}

            <button
              onClick={() => onOpenIntake(currentPipeline.id)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Lead Baru</span>
            </button>
          </div>
        </div>

        {/* Pipelines Carousel (Admin Only) */}
        {!isBusDev && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {pipelinesList.map((pipe) => {
              const isSelected = pipe.id === selectedPipelineId;
              const owner = (state.busDevs || []).find((b) => b.id === pipe.assignedBusDevId);
              const pCount = (state.leads || []).filter((l) =>
                pipe.id === 'pipe_round_robin'
                  ? true
                  : l.pipelineId === pipe.id || (pipe.assignedBusDevId && l.assignedTo === pipe.assignedBusDevId)
              ).length;

              return (
                <button
                  key={pipe.id}
                  onClick={() => setSelectedPipelineId(pipe.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm border-blue-600'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span className="truncate max-w-[140px]">{pipe.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {pCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama lead, brand, phone..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Source Filter */}
            <select
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Sumber Trafik</option>
              {allSources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Tag Produk</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 font-bold">Total Nilai Pipeline:</span>
            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              Rp {(totalValue / 1000000).toFixed(0)} Juta
            </span>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS (WHITE THEME WITH CRISP ACCENT BORDERS) */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin min-h-[580px] items-start">
        {(currentPipeline.stages || []).map((stage) => {
          const leadsInStage = filteredLeads.filter((l) => l.stageId === stage.id);
          const stageValue = leadsInStage.reduce((acc, l) => acc + (l.value || 0), 0);

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              className="w-72 bg-slate-100/90 border border-slate-200 rounded-2xl flex flex-col max-h-[calc(100vh-230px)] shrink-0 shadow-2xs"
            >
              {/* Stage Header */}
              <div className="p-3 border-b border-slate-200/80 bg-white rounded-t-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-slate-900 truncate">
                    {stage.name}
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border border-slate-200">
                    {leadsInStage.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Estimasi Omset:</span>
                  <span className="font-bold text-emerald-700">
                    Rp {(stageValue / 1000000).toFixed(0)} Jt
                  </span>
                </div>
              </div>

              {/* Leads Card Container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {leadsInStage.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl bg-white/50">
                    Tarik lead ke sini
                  </div>
                ) : (
                  leadsInStage.map((lead) => {
                    const assignee = getAssigneeInfo(lead.assignedTo);
                    const msgCount = getLeadMessageCount(lead.id);
                    const srcStyle = getSourceBadgeStyle(lead.source);

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        onClick={() => onOpenLeadDetail(lead)}
                        className="bg-white border border-slate-200 hover:border-blue-400 p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700 truncate">
                            {lead.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            #{lead.id}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 line-clamp-2">
                          {lead.notes || 'Belum ada catatan spesifikasi maklon.'}
                        </div>

                        {/* Source and Tags */}
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${srcStyle.bg} ${srcStyle.text} ${srcStyle.border}`}
                          >
                            {srcStyle.icon} {lead.source}
                          </span>
                          {(lead.tags || []).slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[100px]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Card Footer: Assignee & Action */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-slate-600">
                            <User className="w-3 h-3 text-blue-600" />
                            <span className="truncate max-w-[90px] font-medium">
                              {assignee.name.split(' ')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectLeadForChat(lead.id);
                              }}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1 cursor-pointer"
                              title="Buka WhatsApp Coexistence Chat"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>{msgCount}</span>
                            </button>

                            <span className="font-mono font-bold text-slate-900">
                              Rp {((lead.value || 0) / 1000000).toFixed(0)} Jt
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
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
