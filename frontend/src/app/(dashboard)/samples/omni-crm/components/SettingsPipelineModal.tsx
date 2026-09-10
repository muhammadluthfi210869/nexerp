import React, { useState } from 'react';
import {
  X,
  Plus,
  Bot,
  Settings,
  Search,
  Check,
  Zap,
  Edit2,
  Trash2,
  Layers,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Tag,
  ArrowRight,
  Globe,
  Radio,
  Share2,
  Copy,
  ExternalLink,
  Filter,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { CRMState, Pipeline, Stage, TrafficSourceConfig } from '../types';
import { FIVE_STAGE_FUNNEL } from '../data/initialState';

interface SettingsPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CRMState;
  onSelectPipeline?: (pipelineId: string) => void;
  onOpenSalesbotFlow?: () => void;
  onCreatePipeline: (name: string) => void;
  onUpdatePipelineName: (pipelineId: string, newName: string) => void;
  onToggleRoundRobin?: (pipelineId: string) => void;
  onApplyFiveStageFunnel?: (pipelineId: string) => void;
  onApplyFiveStagesToAll?: () => void;
  onAddTrafficSource?: (params: {
    name: string;
    platform: 'META' | 'GOOGLE' | 'TIKTOK' | 'WHATSAPP' | 'OFFLINE' | 'WEBSITE' | 'REFERRAL' | 'OTHER';
    utmSource?: string;
    autoTag?: string;
    color?: string;
    icon?: string;
  }) => void;
  onDeleteTrafficSource?: (sourceId: string) => void;
}

export const SettingsPipelineModal: React.FC<SettingsPipelineModalProps> = ({
  isOpen,
  onClose,
  state,
  onSelectPipeline,
  onOpenSalesbotFlow,
  onCreatePipeline,
  onUpdatePipelineName,
  onToggleRoundRobin,
  onApplyFiveStageFunnel,
  onApplyFiveStagesToAll,
  onAddTrafficSource,
  onDeleteTrafficSource,
}) => {
  const [activeTab, setActiveTab] = useState<'pipelines' | 'sources' | 'integrations' | 'general'>(
    'pipelines'
  );
  const pipelinesList = state.pipelines || [];
  const [selectedPipeId, setSelectedPipeId] = useState<string>(
    pipelinesList[0]?.id || 'pipe_round_robin'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingPipe, setIsAddingPipe] = useState(false);
  const [newPipeName, setNewPipeName] = useState('');

  const [editingName, setEditingName] = useState(false);
  const [pipelineTitle, setPipelineTitle] = useState('');

  // Source form states
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourcePlatform, setNewSourcePlatform] = useState<
    'META' | 'GOOGLE' | 'TIKTOK' | 'WHATSAPP' | 'OFFLINE' | 'WEBSITE' | 'REFERRAL' | 'OTHER'
  >('META');
  const [newSourceUtm, setNewSourceUtm] = useState('');
  const [newSourceAutoTag, setNewSourceAutoTag] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const currentPipeline =
    pipelinesList.find((p) => p.id === selectedPipeId) || pipelinesList[0] || {
      id: 'pipe_round_robin',
      name: 'Pipeline Round Robin',
      roundRobin: true,
      stages: [],
    };

  React.useEffect(() => {
    if (currentPipeline) {
      setPipelineTitle(currentPipeline.name);
    }
  }, [selectedPipeId, currentPipeline]);

  if (!isOpen) return null;

  const filteredPipelines = pipelinesList.filter((p) =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveTitle = () => {
    if (pipelineTitle.trim() && currentPipeline) {
      onUpdatePipelineName(currentPipeline.id, pipelineTitle.trim());
      setEditingName(false);
    }
  };

  const handleCreatePipelineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPipeName.trim()) {
      onCreatePipeline(newPipeName.trim());
      setNewPipeName('');
      setIsAddingPipe(false);
    }
  };

  const handleCreateSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;

    if (onAddTrafficSource) {
      const platformIcons: Record<string, string> = {
        META: '📱',
        GOOGLE: '🔍',
        TIKTOK: '🎵',
        WHATSAPP: '💬',
        OFFLINE: '🏢',
        WEBSITE: '🌐',
        REFERRAL: '🤝',
        OTHER: '🏷️',
      };

      onAddTrafficSource({
        name: newSourceName.trim(),
        platform: newSourcePlatform,
        utmSource: newSourceUtm.trim() || newSourceName.toLowerCase().replace(/\s+/g, '_'),
        autoTag: newSourceAutoTag.trim() || newSourceName.trim(),
        icon: platformIcons[newSourcePlatform] || '🏷️',
      });

      setNewSourceName('');
      setNewSourceUtm('');
      setNewSourceAutoTag('');
    }
  };

  // Compile active sources with live counts from leads
  const trafficSources: TrafficSourceConfig[] = (state.trafficSources || []).map((src) => {
    const matchingLeads = (state.leads || []).filter(
      (l) => (l.source || '').toLowerCase() === src.name.toLowerCase()
    );
    const totalVal = matchingLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);
    return {
      ...src,
      leadCount: matchingLeads.length,
      totalValue: totalVal,
    };
  });

  const totalAllLeads = state.leads?.length || 0;
  const totalPipelineRevenue = (state.leads || []).reduce((sum, l) => sum + (l.value || 0), 0);

  const copyUtmLink = (srcName: string) => {
    const link = `https://wa.me/6281110001?text=Halo%20Dreamlab,%20saya%20tertarik%20maklon%20dari%20${encodeURIComponent(
      srcName
    )}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(srcName);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div
      id="settings-pipeline-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[95vw] h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Navigation Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Settings className="w-4 h-4" />
              </div>
              <span>Pengaturan OmniCRM</span>
            </div>

            {/* Breadcrumb Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('pipelines')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'pipelines'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengaturan Pipeline & Stages ({state.pipelines.length})
              </button>
              <button
                onClick={() => setActiveTab('sources')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'sources'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sumber Leads & Traffic Channels ({trafficSources.length})
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'integrations'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pusat Integrasi (WhatsApp & Ads)
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'general'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengaturan Umum & Akses Tim
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-salesbot-top"
              onClick={onOpenSalesbotFlow}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              Buka Salesbot Flow Editor
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Pipelines & Stages View */}
        {activeTab === 'pipelines' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar: List of Pipelines */}
            <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-200">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari pipeline..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Pipeline List Scrollable */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredPipelines.map((pipe) => {
                  const isSelected = pipe.id === (currentPipeline?.id || '');
                  return (
                    <button
                      key={pipe.id}
                      onClick={() => {
                        setSelectedPipeId(pipe.id);
                        if (onSelectPipeline) onSelectPipeline(pipe.id);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Layers
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{pipe.name}</span>
                      </div>
                      {pipe.roundRobin && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                            isSelected
                              ? 'bg-blue-800/80 text-blue-100'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          RR
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Add Pipeline Button */}
              <div className="p-3 border-t border-slate-200 bg-white">
                {isAddingPipe ? (
                  <form onSubmit={handleCreatePipelineSubmit} className="space-y-2">
                    <input
                      type="text"
                      autoFocus
                      value={newPipeName}
                      onChange={(e) => setNewPipeName(e.target.value)}
                      placeholder="Nama pipeline baru..."
                      className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex gap-1.5">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white text-xs py-1 rounded font-medium hover:bg-blue-700 cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingPipe(false)}
                        className="px-2 bg-slate-100 text-slate-600 text-xs py-1 rounded hover:bg-slate-200 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingPipe(true)}
                    className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Tambahkan pipeline
                  </button>
                )}
              </div>
            </div>

            {/* Right Main Stage Workflow Columns Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/60">
              {/* Header inside Workflow Canvas */}
              <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pipelineTitle}
                        onChange={(e) => setPipelineTitle(e.target.value)}
                        className="text-base font-bold text-slate-900 border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleSaveTitle}
                        className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded font-medium cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {currentPipeline?.name}
                      </h2>
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        title="Ubah nama pipeline"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="text-xs text-slate-400">&bull;</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">
                      Funnel: <strong className="text-blue-700">LEADS MASUK &rarr; COLD &rarr; WARM &rarr; HOT &rarr; SAMPLE &rarr; CLIENT DEAL</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onApplyFiveStagesToAll && (
                    <button
                      onClick={onApplyFiveStagesToAll}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Sinkronkan struktur tahapan 5-Stage ke semua 13 pipelines"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Terapkan 5-Stage ke Semua Pipeline
                    </button>
                  )}

                  <button
                    onClick={onOpenSalesbotFlow}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Salesbot Flow
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Stages Workflow Grid */}
              <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex gap-4 items-stretch">
                {currentPipeline?.stages.map((stage: Stage, idx: number) => {
                  const hasSalesbot = Boolean(stage.salesbotTrigger);
                  const isWon = stage.isWonStage;
                  const isLoss = stage.isLossStage;

                  return (
                    <div
                      key={stage.id}
                      className="w-72 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col shrink-0 overflow-hidden hover:border-slate-300 transition-all"
                    >
                      {/* Stage Column Header with Color Bar */}
                      <div
                        className={`px-3.5 py-2.5 border-b font-bold text-xs flex items-center justify-between ${
                          isWon
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isLoss
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : hasSalesbot
                            ? 'bg-indigo-50/80 text-indigo-900 border-indigo-100'
                            : stage.name.includes('HOT')
                            ? 'bg-orange-50 text-orange-800 border-orange-200'
                            : stage.name.includes('WARM')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : stage.name.includes('COLD')
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : stage.name.includes('SAMPLE')
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-slate-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-5 h-5 rounded-full bg-white/80 border border-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-mono font-bold">
                            {stage.order}
                          </span>
                          <span className="truncate font-extrabold">{stage.name}</span>
                        </div>
                      </div>

                      {/* Stage Body Card with Automation Rules & Instructions */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 text-xs bg-slate-50/40">
                        <div className="space-y-2.5">
                          {/* Instruction text */}
                          {stage.description && (
                            <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs leading-relaxed">
                              {stage.description}
                            </div>
                          )}

                          {/* Salesbot Trigger Badge */}
                          {stage.salesbotTrigger && (
                            <button
                              onClick={onOpenSalesbotFlow}
                              className="w-full text-left bg-indigo-50/90 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 p-2 rounded-lg font-medium text-[11px] flex items-center gap-2 transition-colors cursor-pointer group"
                            >
                              <Bot className="w-3.5 h-3.5 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
                              <div className="truncate">
                                <span className="text-[10px] text-indigo-600 block uppercase font-bold">
                                  Salesbot Otomasi:
                                </span>
                                <span className="font-semibold">{stage.salesbotTrigger}</span>
                              </div>
                            </button>
                          )}

                          {/* Auto Tag Badge */}
                          {stage.autoTag && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80">
                              <Tag className="w-3 h-3 text-blue-500" />
                              <span className="text-slate-500">Auto Tag:</span>
                              <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {stage.autoTag}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Add Trigger action button */}
                        <button
                          onClick={onOpenSalesbotFlow}
                          className="w-full border border-dashed border-slate-300 hover:border-blue-400 hover:bg-white text-slate-500 hover:text-blue-600 rounded-lg py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          + Tambahkan pemicu salesbot
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Traffic Sources & Channels Management */}
        {activeTab === 'sources' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6 text-slate-800">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-1">Total Traffic Channel</div>
                <div className="text-2xl font-black text-slate-900">{trafficSources.length} Channel</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  100% Terintegrasi Auto-Tagging
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-1">Total Prospek Masuk</div>
                <div className="text-2xl font-black text-blue-600">{totalAllLeads} Leads</div>
                <div className="text-[11px] text-slate-500 mt-1">Terbagi di 13 Pipeline Sales</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-1">Total Nilai Pipeline</div>
                <div className="text-2xl font-black text-indigo-600">
                  Rp {(totalPipelineRevenue / 1000000).toFixed(0)} Juta
                </div>
                <div className="text-[11px] text-indigo-500 mt-1">Estimasi HPP & Kontrak</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-1">Channel Terbanyak</div>
                <div className="text-xl font-black text-emerald-600">
                  {trafficSources.sort((a, b) => (b.leadCount || 0) - (a.leadCount || 0))[0]?.name || 'Meta Ads'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Kontribusi Prospek Terbesar</div>
              </div>
            </div>

            {/* Form Add New Source */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Tambah Sumber Leads Baru (Traffic Source / Campaign)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Daftarkan channel baru untuk iklan, influencer, event pameran, atau website. Lead yang masuk dari channel ini akan otomatis terdeteksi di filter CRM.
              </p>

              <form onSubmit={handleCreateSourceSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Channel / Source:</label>
                  <input
                    type="text"
                    required
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="Contoh: Instagram Story Ads atau Event JCC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kategori Platform:</label>
                  <select
                    value={newSourcePlatform}
                    onChange={(e: any) => setNewSourcePlatform(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="META">Meta Ads (Instagram / FB)</option>
                    <option value="GOOGLE">Google (Ads / Organic)</option>
                    <option value="TIKTOK">TikTok (Ads / Live)</option>
                    <option value="WHATSAPP">WhatsApp Direct</option>
                    <option value="OFFLINE">Offline / Booth Expo</option>
                    <option value="WEBSITE">Website / Link Tree</option>
                    <option value="REFERRAL">Referral B2B</option>
                    <option value="OTHER">Lainnya (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">UTM Source Parameter:</label>
                  <input
                    type="text"
                    value={newSourceUtm}
                    onChange={(e) => setNewSourceUtm(e.target.value)}
                    placeholder="Contoh: ig_story_maklon"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Simpan Source Baru
                  </button>
                </div>
              </form>
            </div>

            {/* List of Active Traffic Sources */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Daftar Sumber Leads Terdaftar</h4>
                  <p className="text-[11px] text-slate-500">
                    Setiap lead yang masuk dari sumber ini dapat difilter secara langsung di Papan Kanban & Overview
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {trafficSources.map((src) => {
                  return (
                    <div key={src.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-slate-100">{src.icon || '🏷️'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{src.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {src.platform}
                            </span>
                            {src.active && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                Aktif Terdeteksi
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                            <span>UTM: {src.utmSource || src.name.toLowerCase().replace(/\s+/g, '_')}</span>
                            <span>&bull;</span>
                            <span>Auto-Tag: [{src.autoTag || src.name}]</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-blue-700">{src.leadCount || 0} Leads Masuk</div>
                          <div className="text-xs font-semibold text-slate-600">
                            Rp {((src.totalValue || 0) / 1000000).toLocaleString('id-ID')} Juta
                          </div>
                        </div>

                        <button
                          onClick={() => copyUtmLink(src.name)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Salin tautan WhatsApp link dengan auto-tag source"
                        >
                          <Share2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{copiedLink === src.name ? 'Tersalin!' : 'Salin Link WA Iklan'}</span>
                        </button>

                        {onDeleteTrafficSource && (
                          <button
                            onClick={() => onDeleteTrafficSource(src.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus source"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Integrations Center */}
        {activeTab === 'integrations' && (
          <div className="p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto flex-1 text-slate-800">
            <h3 className="text-lg font-bold text-slate-900">Pusat Integrasi Saluran Iklan & WhatsApp</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    WhatsApp Coexistence Dual-Device
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-semibold">
                    Terhubung
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Sinkronisasi riwayat obrolan dua arah antara HP BusDev/Sales dan CRM Web OmniCRM secara otomatis.
                </p>
              </div>

              <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                    Meta Ads & Instagram Direct Inbound
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-semibold">
                    Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Routing otomatis pesan yang masuk dari iklan Instagram Story, Feed, dan Reels ke tahap LEADS MASUK dengan tag Meta Ads.
                </p>
              </div>

              <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                    Google Search & Google Ads Webhook
                  </div>
                  <span className="bg-sky-100 text-sky-800 text-xs px-2 py-0.5 rounded font-semibold">
                    Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Mendeteksi kata kunci Google Ads & Organic, mengarahkan lead ke LEADS MASUK dengan auto-tag Google Ads.
                </p>
              </div>

              <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
                    Bio Link Tree & Website Form Integrator
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-semibold">
                    Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Menangkap klik dari tautan Linktree di Bio sosial media dan memindahkan ke LEADS MASUK dengan tag Link Tree.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: General Settings */}
        {activeTab === 'general' && (
          <div className="p-8 max-w-3xl mx-auto space-y-6 overflow-y-auto flex-1 text-slate-800">
            <h3 className="text-lg font-bold text-slate-900">Pengaturan Sistem & Distribusi Round-Robin</h3>
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Round-Robin Otomatis BusDev</h4>
                  <p className="text-xs text-slate-500">
                    Membagikan lead secara bergilir adil kepada sales BusDev yang sedang berstatus AKTIF.
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded font-bold">
                  AKTIF (Pipeline Round Robin)
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Auto-Tagging & Pesan Coexistence</h4>
                  <p className="text-xs text-slate-500">
                    Otomatis mengekstrak kata kunci Meta Ads, Google Ads, Sample, dan menempelkan tag kontak.
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded font-bold">
                  AKTIF
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
