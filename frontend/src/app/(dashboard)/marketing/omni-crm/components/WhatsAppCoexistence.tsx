import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Send,
  User,
  CheckCheck,
  PhoneCall,
  Sparkles,
  MessageSquare,
  Shield,
  ArrowRightLeft,
  Clock,
  Check,
  Bot,
  Tag,
  Filter,
  Search,
  Plus,
  Zap,
  Phone,
  Mail,
  Building,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  ChevronLeft,
  Settings,
  Flame,
  LayoutDashboard,
  Users,
  Radio,
  FileText,
  PieChart,
  Sliders,
  Paperclip,
  Smile,
  Mic,
  Eye,
  RefreshCw,
  ExternalLink,
  Copy,
  AlertTriangle,
  CheckCircle2,
  X,
  Volume2,
  ShieldCheck,
  FlaskConical,
  Lock,
  UserCheck,
} from 'lucide-react';
import { CRMState, Lead, MessageChannel, MessageDirection, WhatsAppMessage, AppAccount } from '../types';
import { detectMessageTags, generateUniqueId } from '../services/crmEngine';

interface WhatsAppCoexistenceProps {
  state: CRMState;
  currentUser?: AppAccount;
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  onSendMessage: (
    leadId: string,
    message: string,
    direction: MessageDirection,
    channel: MessageChannel
  ) => void;
  onTagMessage?: (messageId: string, tag: string) => void;
  onTagLead?: (leadId: string, tag: string) => void;
  onMoveLead?: (leadId: string, targetPipelineId: string, targetStageId: string, reason?: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export const WhatsAppCoexistence: React.FC<WhatsAppCoexistenceProps> = ({
  state,
  currentUser,
  selectedLeadId,
  onSelectLead,
  onSendMessage,
  onTagMessage,
  onTagLead,
  onMoveLead,
  onNavigateTab,
}) => {
  // View mode: Kommo 3-Column layout (default) or Dual-Device Coexistence Matrix
  const [viewMode, setViewMode] = useState<'kommo_studio' | 'dual_matrix'>('kommo_studio');

  // Input states
  const [activeChannelMode, setActiveChannelMode] = useState<MessageChannel>('CRM_WEB');
  const [chatComposerText, setChatComposerText] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [clientInput, setClientInput] = useState('');

  // UI state in Kommo Lead Column
  const [isLeadPanelCollapsed, setIsLeadPanelCollapsed] = useState(false);
  const [activeLeadTab, setActiveLeadTab] = useState<'utama' | 'form' | 'statistik' | 'media' | 'produk'>('utama');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [filterMode, setFilterMode] = useState<'open' | 'all' | 'unread' | 'mine'>('open');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [busDevFilter, setBusDevFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable Lead fields state
  const [copiedPhone, setCopiedPhone] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Security / Role Isolation:
  // If currentUser is a BusDev, ONLY allow access to leads assigned to them.
  const isBusDevAccount = currentUser && !currentUser.isSuperAdmin;

  const visibleLeads = useMemo(() => {
    let leads = state.leads || [];
    if (isBusDevAccount && currentUser) {
      leads = leads.filter((l) => l.assignedTo === currentUser.id);
    } else if (busDevFilter !== 'ALL') {
      leads = leads.filter((l) => l.assignedTo === busDevFilter);
    }
    return leads;
  }, [state.leads, isBusDevAccount, currentUser, busDevFilter]);

  // Filtered leads for Left Column Inbox
  const filteredLeads = useMemo(() => {
    return visibleLeads.filter((lead) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchPhone = lead.phone.includes(q);
        const matchNum =
          lead.leadNumber?.toLowerCase().includes(q) ||
          lead.conversationNumber?.toLowerCase().includes(q);
        const matchNote = lead.notes?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNum && !matchNote) return false;
      }

      // Source filter
      if (sourceFilter !== 'ALL' && lead.source !== sourceFilter) {
        return false;
      }

      // Status filter
      if (filterMode === 'open') {
        return lead.stageId !== 'stage_client_deal' && lead.stageId !== 'stage_junk_leads';
      }
      if (filterMode === 'unread') {
        const hasUnread = (state.messages || []).some(
          (m) => m.leadId === lead.id && m.direction === 'INBOUND' && !m.tags?.includes('read')
        );
        return hasUnread;
      }
      return true;
    });
  }, [visibleLeads, searchQuery, sourceFilter, filterMode, state.messages]);

  // Active Lead selection fallback
  const activeLead = useMemo(() => {
    if (selectedLeadId) {
      const found = visibleLeads.find((l) => l.id === selectedLeadId);
      if (found) return found;
    }
    return filteredLeads[0] || visibleLeads[0] || null;
  }, [selectedLeadId, visibleLeads, filteredLeads]);

  // Active messages
  const activeMessages = useMemo(() => {
    if (!activeLead) return [];
    return (state.messages || []).filter((m) => m.leadId === activeLead.id);
  }, [state.messages, activeLead]);

  // Assigned Sales / BusDev info
  const assignedSales = useMemo(() => {
    if (!activeLead) return null;
    return (state.busDevs || []).find((b) => b.id === activeLead.assignedTo);
  }, [state.busDevs, activeLead]);

  // Current lead pipeline stages
  const activePipeline = useMemo(() => {
    if (!activeLead) return (state.pipelines || [])[0];
    return (
      (state.pipelines || []).find((p) => p.id === activeLead.pipelineId) ||
      (state.pipelines || [])[0]
    );
  }, [state.pipelines, activeLead]);

  const pipelineStages = activePipeline?.stages || [
    { id: 'stage_lead_masuk', name: 'Leads Masuk', color: 'slate' },
    { id: 'stage_cold', name: 'Cold', color: 'blue' },
    { id: 'stage_warm', name: 'Warm', color: 'amber' },
    { id: 'stage_hot', name: 'Hot', color: 'orange' },
    { id: 'stage_sample', name: 'Sample', color: 'purple' },
    { id: 'stage_client_deal', name: 'Client DEAL', color: 'emerald' },
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Get last message helper
  const getLastMessage = (leadId: string) => {
    const msgs = (state.messages || []).filter((m) => m.leadId === leadId);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  // Handle Send from Kommo Composer
  const handleSendKommoMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatComposerText.trim() || !activeLead) return;

    const direction: MessageDirection =
      activeChannelMode === 'WHATSAPP_CLIENT' ? 'INBOUND' : 'OUTBOUND';

    onSendMessage(activeLead.id, chatComposerText.trim(), direction, activeChannelMode);
    setChatComposerText('');
  };

  // Handle Quick Client simulation
  const handleQuickClientMessage = (text: string) => {
    if (!activeLead) return;
    onSendMessage(activeLead.id, text, 'INBOUND', 'WHATSAPP_CLIENT');
  };

  // Handle Quick Outbound Phone send
  const handleSendPhoneDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim() || !activeLead) return;
    onSendMessage(activeLead.id, phoneInput.trim(), 'OUTBOUND', 'WHATSAPP_HP');
    setPhoneInput('');
  };

  // Add Tag
  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagText.trim() || !activeLead) return;
    if (onTagLead) {
      onTagLead(activeLead.id, newTagText.trim());
    }
    setNewTagText('');
    setIsAddingTag(false);
  };

  // Stage change handler
  const handleStageChange = (newStageId: string) => {
    if (!activeLead || !onMoveLead) return;
    onMoveLead(activeLead.id, activeLead.pipelineId, newStageId, 'Diubah dari Kommo Chat Interface');
  };

  // Generate AI Suggestions
  const handleTriggerAiAssistant = () => {
    if (!activeLead) return;
    setIsAiSuggesting(true);
    setShowAiModal(true);

    setTimeout(() => {
      const suggestions = [
        `Halo Kak ${activeLead.name}! Baik, untuk formulasi maklon dan sliding box tester sudah kami siapkan detailnya. Mau kami kirimkan draft SPK dan estimasi timeline produksinya?`,
        `Siap Kak ${activeLead.name}! Terkait varian ke-2, tim R&D lab Dreamlab kami bisa buatkan sample dengan aroma yang sama namun formulasi lebih ringan. Kapan kira-kira tester ingin kami kirimkan ke alamat kantor Anda?`,
        `Terima kasih konfirmasinya Kak! Kami pastikan seluruh sertifikasi BPOM, Halal, dan standar CPKB Grade A kami kawal tuntas dari legalitas hingga produk siap edar.`,
      ];
      setAiSuggestions(suggestions);
      setIsAiSuggesting(false);
    }, 400);
  };

  const copyPhoneNumber = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  if (!activeLead) {
    return (
      <div className="p-12 text-center text-slate-600 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 text-base mb-1">
          {isBusDevAccount
            ? `Belum ada pesan WhatsApp yang masuk untuk nomor Anda (${currentUser?.phone})`
            : 'Tidak ada percakapan WhatsApp yang cocok dengan filter saat ini.'}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          {isBusDevAccount
            ? 'Setiap lead baru yang dialokasikan ke akun Anda akan otomatis muncul di sini. Chat dari rekan BusDev lain disembunyikan.'
            : 'Coba ubah filter atau lakukan simulasi lead masuk baru via tombol "+ Lead Baru".'}
        </p>
        <button
          onClick={() => {
            setSearchQuery('');
            setSourceFilter('ALL');
            setFilterMode('all');
            setBusDevFilter('ALL');
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
        >
          Reset Filter Kotak Masuk
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Account Isolation Notice Banner */}
      {isBusDevAccount ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-950">
                  Mode BusDev Terisolasi: {currentUser?.name}
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.2 rounded-full">
                  📱 {currentUser?.phone}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                1 Akun BusDev = 1 Nomor WhatsApp Khusus. Anda hanya dapat melihat dan membalas percakapan milik Anda sendiri.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-bold">
              {filteredLeads.length} Lead Aktif Anda
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-blue-950">
                  Mode Super Admin (Akses Penuh Seluruh Nomor WhatsApp)
                </span>
                <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.2 rounded-full">
                  10 BusDev Connected
                </span>
              </div>
              <p className="text-[11px] text-blue-700 font-medium">
                Super Admin dapat memantau percakapan dari semua nomor BusDev atau memfilter obrolan sales tertentu.
              </p>
            </div>
          </div>

          {/* Admin BusDev Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-900 font-bold hidden md:inline">Filter Nomor BusDev:</span>
            <select
              value={busDevFilter}
              onChange={(e) => setBusDevFilter(e.target.value)}
              className="bg-white border border-blue-300 rounded-lg px-2.5 py-1 text-xs text-blue-950 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="ALL">Semua Nomor BusDev (10 Sales)</option>
              {(state.busDevs || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.formattedPhone || b.phone})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Top Header Mode Switcher Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-bold text-slate-900 tracking-wide uppercase">
              Dreamlab WhatsApp Live Studio
            </span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <p className="text-[12px] text-slate-500 hidden sm:block">
            Coexistence Sinkronisasi Real-Time: HP Sales (<code className="text-emerald-700 font-mono bg-emerald-50 px-1 rounded font-bold">WHATSAPP_HP</code>) ↔ Web CRM (<code className="text-blue-700 font-mono bg-blue-50 px-1 rounded font-bold">CRM_WEB</code>)
          </p>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('kommo_studio')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'kommo_studio'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Studio 3-Kolom</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('dual_matrix')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'dual_matrix'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Dual Matrix Sync</span>
          </button>
        </div>
      </div>

      {/* 3-COLUMN KOMMO-STYLE CRM STUDIO */}
      {viewMode === 'kommo_studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-210px)] min-h-[640px]">
          {/* ========================================================= */}
          {/* COLUMN 1: INBOUND LIST & CONVERSATION FEED (3 cols)      */}
          {/* ========================================================= */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl flex flex-col shadow-2xs overflow-hidden">
            {/* Inbox Filter Header */}
            <div className="p-3 border-b border-slate-200 bg-slate-50/75 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-[12px] font-bold text-slate-900">
                    Kotak Masuk WhatsApp
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {filteredLeads.length} Obrolan
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, nomor WA, tiket..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Segment Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-[11px] font-semibold">
                <button
                  onClick={() => setFilterMode('open')}
                  className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                    filterMode === 'open'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Terbuka
                </button>
                <button
                  onClick={() => setFilterMode('unread')}
                  className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                    filterMode === 'unread'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum Dijawab
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
              </div>

              {/* Quick Source Pill Filters */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] scrollbar-thin">
                <button
                  onClick={() => setSourceFilter('ALL')}
                  className={`px-2 py-0.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    sourceFilter === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Sumber
                </button>
                {['Meta Ads', 'Google Ads', 'Link Tree', 'TikTok Ads', 'WhatsApp Inbound'].map((src) => (
                  <button
                    key={src}
                    onClick={() => setSourceFilter(src)}
                    className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      sourceFilter === src
                        ? 'bg-orange-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isSelected = activeLead?.id === lead.id;
                const lastMsg = getLastMessage(lead.id);
                const isOutbound = lastMsg?.direction === 'OUTBOUND';
                const hasUnread = !isOutbound && lastMsg && !lastMsg.tags?.includes('read');

                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/90 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <span className={`text-xs block truncate ${isSelected ? 'font-bold text-blue-950' : 'font-bold text-slate-900'}`}>
                            {lead.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            +{lead.phone}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-400 font-mono block">
                          {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:30'}
                        </span>
                        {hasUnread && (
                          <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mt-1" />
                        )}
                      </div>
                    </div>

                    {/* Last Message Snippet */}
                    <p className="text-[11px] text-slate-600 line-clamp-1 mb-1.5">
                      {isOutbound && <span className="text-blue-600 font-semibold">Anda: </span>}
                      {lastMsg ? lastMsg.message : lead.notes || 'Belum ada riwayat pesan.'}
                    </p>

                    {/* Meta tags / Channel source */}
                    <div className="flex items-center justify-between text-[9px] gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 border border-orange-200 font-semibold truncate max-w-[120px]">
                        {lead.source}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {lead.stageId.replace('stage_', '').toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMN 2: LEAD METADATA & MAKLON ATTRIBUTES (4 cols)     */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl flex flex-col shadow-2xs overflow-hidden">
            {/* Header with Lead Title & Quick Actions */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/75">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                    {activeLead.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 truncate max-w-[180px]">
                        {activeLead.name}
                      </h2>
                      <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                        #{activeLead.leadNumber || '28981912'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {activeLead.company || 'Brand Owner Maklon Kosmetik'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyPhoneNumber(activeLead.phone)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Salin Nomor WhatsApp"
                >
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>{copiedPhone ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>

              {/* Progress Stage Tracker (KOMMO CRM SEGMENTED BAR) */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                  <span>Tahapan Funnel Maklon:</span>
                  <span className="text-blue-700 uppercase font-mono">
                    {activeLead.stageId.replace('stage_', '').replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {pipelineStages.map((stg, idx) => {
                    const stageOrderMap: Record<string, number> = {
                      stage_lead_masuk: 1,
                      stage_cold: 2,
                      stage_warm: 3,
                      stage_hot: 4,
                      stage_sample: 5,
                      stage_client_deal: 6,
                    };
                    const currentOrder = stageOrderMap[activeLead.stageId] || 1;
                    const thisOrder = stageOrderMap[stg.id] || idx + 1;
                    const isPassed = thisOrder <= currentOrder;
                    const isCurrent = thisOrder === currentOrder;

                    return (
                      <button
                        key={stg.id}
                        onClick={() => handleStageChange(stg.id)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 ring-2 ring-blue-300'
                            : isPassed
                            ? 'bg-blue-400'
                            : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                        title={`Pindahkan ke ${stg.name}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tab Navigation in Lead Column */}
            <div className="flex items-center border-b border-slate-200 bg-white px-2 text-xs font-semibold">
              <button
                onClick={() => setActiveLeadTab('utama')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeLeadTab === 'utama'
                    ? 'border-blue-600 text-blue-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Data Utama
              </button>
              <button
                onClick={() => setActiveLeadTab('produk')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeLeadTab === 'produk'
                    ? 'border-blue-600 text-blue-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Spesifikasi Maklon
              </button>
              <button
                onClick={() => setActiveLeadTab('statistik')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeLeadTab === 'statistik'
                    ? 'border-blue-600 text-blue-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Log Interaksi
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {activeLeadTab === 'utama' && (
                <>
                  {/* Contact Info Card */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Detail Kontak & Perusahaan</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">WhatsApp:</span>
                        <span className="font-mono font-bold text-slate-900">+{activeLead.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Sumber Trafik:</span>
                        <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200 inline-block">
                          {activeLead.source}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Email:</span>
                        <span className="font-medium text-slate-800 truncate block">
                          {activeLead.email || 'belum ada email'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Estimasi Omset / Nilai:</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          Rp {(activeLead.value || 50000000).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Sales BusDev Card */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sales Penanggung Jawab (BusDev)</span>
                    </h4>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                          {assignedSales?.name.charAt(0) || 'D'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {assignedSales?.name || 'Diaz Pratama'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            📱 {assignedSales?.formattedPhone || assignedSales?.phone || '+62 812-7788-9904'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        AKTIF
                      </span>
                    </div>
                  </div>

                  {/* Tags Management */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-orange-600" />
                        <span>Tag Maklon & Kategori</span>
                      </h4>
                      <button
                        onClick={() => setIsAddingTag(!isAddingTag)}
                        className="text-[10px] text-blue-700 font-bold hover:underline cursor-pointer"
                      >
                        + Tambah Tag
                      </button>
                    </div>

                    {isAddingTag && (
                      <form onSubmit={handleAddTagSubmit} className="flex gap-1.5">
                        <input
                          type="text"
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          placeholder="Contoh: Skincare BPOM, Formulasi Serum..."
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Simpan
                        </button>
                      </form>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(activeLead.tags || ['Maklon Skincare', 'CPKB Formulasi', 'Warm Lead']).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CRM Notes */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-900 block">
                      Catatan Spesifikasi & Formulasi:
                    </span>
                    <p className="text-slate-700 leading-relaxed text-[11px] italic bg-white p-2.5 rounded-lg border border-slate-200">
                      "{activeLead.notes || 'Belum ada catatan khusus mengenai formulasi ini.'}"
                    </p>
                  </div>
                </>
              )}

              {activeLeadTab === 'produk' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">Spesifikasi Formulasi Maklon</h4>
                    <div className="space-y-1.5 text-[11px] text-slate-700">
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500">Kategori:</span>
                        <span className="font-bold text-slate-900">Skincare & Serum</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500">Bentuk Kemasan:</span>
                        <span className="font-bold text-slate-900">Sliding Box + Custom Dropper Botol</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500">Estimasi MOQ:</span>
                        <span className="font-bold text-blue-700 font-mono">1.000 - 3.000 Pcs</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500">Status Izin BPOM:</span>
                        <span className="font-bold text-emerald-700">Dalam Pendaftaran (Aman)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeLeadTab === 'statistik' && (
                <div className="space-y-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Waktu Lead Masuk:</span>
                      <span className="font-mono text-slate-800">{new Date(activeLead.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Terakhir Berinteraksi:</span>
                      <span className="font-mono text-slate-800">{new Date(activeLead.updatedAt).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Durasi di Tahap Ini:</span>
                      <span className="font-bold text-orange-700">{activeLead.stageDurationDays || 12} Hari</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMN 3: WHATSAPP CONVERSATION TIMELINE & COMPOSER (5 cols)*/}
          {/* ========================================================= */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl flex flex-col shadow-2xs overflow-hidden">
            {/* Timeline Header */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[12px] font-bold text-slate-900 block">
                    {activeLead.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Nomor Client: +{activeLead.phone}
                  </span>
                </div>
              </div>

              {/* AI Chat Assistant Helper Button */}
              <button
                type="button"
                onClick={handleTriggerAiAssistant}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                title="Rekomendasi Balasan Cerdas AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Rekomendasi AI</span>
              </button>
            </div>

            {/* Messages Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
              {activeMessages.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Belum ada riwayat percakapan. Kirim pesan pertama untuk memulai follow-up.
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isOutbound = msg.direction === 'OUTBOUND';
                  const isHpChannel = msg.channel === 'WHATSAPP_HP';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender Tag */}
                      <span className="text-[9px] text-slate-400 font-medium mb-0.5 px-1">
                        {msg.senderName} • {isOutbound ? (isHpChannel ? '📱 HP Sales' : '💻 CRM Web') : '💬 Client'}
                      </span>

                      {/* Chat Bubble */}
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 shadow-xs text-xs leading-relaxed relative ${
                          isOutbound
                            ? isHpChannel
                              ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-tr-none'
                              : 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.message}</p>

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                            isOutbound && !isHpChannel ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          <span className="font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isOutbound && <CheckCheck className="w-3 h-3 text-current" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Client Replies Simulation Bar */}
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[10px]">
              <span className="text-slate-400 font-bold shrink-0">Simulasi Klien:</span>
              <button
                type="button"
                onClick={() => handleQuickClientMessage('box nya sliding, botol yg kemarin')}
                className="h-6 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-[10px] font-medium whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
              >
                "box nya sliding..."
              </button>
              <button
                type="button"
                onClick={() => handleQuickClientMessage('Bisa kirimkan tester sampelnya ke Jakarta Selatan?')}
                className="h-6 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-[10px] font-medium whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
              >
                "Kirim tester sampel..."
              </button>
              <button
                type="button"
                onClick={() => handleQuickClientMessage('Berapa estimasi HPP per botol untuk MOQ 2000 pcs?')}
                className="h-6 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-[10px] font-medium whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
              >
                "Tanya estimasi HPP..."
              </button>
            </div>

            {/* Message Composer */}
            <form
              onSubmit={handleSendKommoMessage}
              className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2"
            >
              {/* Channel Selector */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Kirim Melalui:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveChannelMode('CRM_WEB')}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors cursor-pointer ${
                        activeChannelMode === 'CRM_WEB'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      💻 CRM Web
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChannelMode('WHATSAPP_HP')}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors cursor-pointer ${
                        activeChannelMode === 'WHATSAPP_HP'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📱 HP Sales WA
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChannelMode('WHATSAPP_CLIENT')}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors cursor-pointer ${
                        activeChannelMode === 'WHATSAPP_CLIENT'
                          ? 'bg-slate-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      💬 Balas sbg Klien
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Input & Submit */}
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={chatComposerText}
                  onChange={(e) => setChatComposerText(e.target.value)}
                  placeholder={`Ketik pesan balasan WhatsApp ke ${activeLead.name}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendKommoMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatComposerText.trim()}
                  className={`h-10 w-10 rounded-xl text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
                    chatComposerText.trim()
                      ? activeChannelMode === 'WHATSAPP_HP'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUAL-DEVICE COEXISTENCE MATRIX (ALTERNATIVE VIEW) */}
      {viewMode === 'dual_matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Device: Physical Phone (WhatsApp HP) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Handphone Fisik Sales ({assignedSales?.name || 'BusDev'})
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Device: {assignedSales?.deviceModel || 'Samsung S24 (WhatsApp Bisnis)'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Online Sync
              </span>
            </div>

            <div className="h-80 overflow-y-auto p-3 bg-slate-50 rounded-xl space-y-2">
              {activeMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl text-xs ${
                    m.direction === 'OUTBOUND'
                      ? 'bg-emerald-600 text-white ml-auto max-w-[80%]'
                      : 'bg-white text-slate-900 border border-slate-200 mr-auto max-w-[80%]'
                  }`}
                >
                  <p>{m.message}</p>
                  <span className="text-[9px] block text-right mt-1 opacity-75 font-mono">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendPhoneDirect} className="flex gap-2">
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Ketik langsung dari HP Sales..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Kirim HP
              </button>
            </form>
          </div>

          {/* Right Device: Web CRM Interface */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Web CRM Hub & Dashboard
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Channel: CRM_WEB (Realtime Webhook)
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                Synced ✓
              </span>
            </div>

            <div className="h-80 overflow-y-auto p-3 bg-slate-50 rounded-xl space-y-2">
              {activeMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl text-xs ${
                    m.direction === 'OUTBOUND'
                      ? 'bg-blue-600 text-white ml-auto max-w-[80%]'
                      : 'bg-white text-slate-900 border border-slate-200 mr-auto max-w-[80%]'
                  }`}
                >
                  <p>{m.message}</p>
                  <span className="text-[9px] block text-right mt-1 opacity-75 font-mono">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!clientInput.trim()) return;
                onSendMessage(activeLead.id, clientInput.trim(), 'OUTBOUND', 'CRM_WEB');
                setClientInput('');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={clientInput}
                onChange={(e) => setClientInput(e.target.value)}
                placeholder="Ketik dari Web CRM..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Kirim CRM
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI SUGGESTION MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-100 text-orange-700 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Rekomendasi Balasan Cerdas AI (Dreamlab Formulasi)
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAiSuggesting ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                <span>Menganalisis riwayat obrolan & spesifikasi maklon...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {aiSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 transition-colors space-y-2"
                  >
                    <p className="leading-relaxed">{suggestion}</p>
                    <button
                      onClick={() => {
                        setChatComposerText(suggestion);
                        setShowAiModal(false);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-xs cursor-pointer"
                    >
                      Gunakan Draf Ini
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
