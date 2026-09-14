import React, { useState } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Sparkles,
  Layers,
  Users,
  Target,
  Video,
  Globe,
  Megaphone
} from 'lucide-react';
import { Instagram, Youtube } from '../utils/socialIcons';
import { ActivePage, Member, Brand, Task } from '../types';

const DIGITAL_CHANNELS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    iconColor: 'text-pink-600',
    iconBg: 'bg-pink-50',
    plannerChannel: 'Instagram',
    reportTab: 'weekly',
    desc: 'Feed, Reels & Stories'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-slate-900 text-white',
    plannerChannel: 'TikTok',
    reportTab: 'tiktok',
    desc: 'Hooks, Sounds & Views'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    plannerChannel: 'YouTube',
    reportTab: 'youtube',
    desc: 'Shorts & Masterclass'
  },
  {
    id: 'website',
    name: 'Website & SEO',
    icon: Globe,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    plannerChannel: 'Website',
    reportTab: 'website',
    desc: 'Tasks, SERP & Queries'
  },
  {
    id: 'ads',
    name: 'Paid Ads',
    icon: Megaphone,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    plannerChannel: 'Paid Ads',
    reportTab: 'ads',
    desc: 'Meta & Google Ads'
  }
];

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  members: Member[];
  brands: Brand[];
  tasks: Task[];
  onOpenAddBrandModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  members,
  brands,
  tasks,
  onOpenAddBrandModal
}) => {
  // Brand expanded state for submenus
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({
    Dreamlab: true,
    Toribio: true
  });

  const toggleBrandExpand = (brandName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBrands(prev => ({
      ...prev,
      [brandName]: !prev[brandName]
    }));
  };

  // Quick stats
  const lateTasksCount = tasks.filter(t => t.status === 'Late').length;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed inset-y-0 left-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-tighter shadow-sm">
            DL
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
              Dreamlab
            </div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 mt-1 uppercase flex items-center gap-1.5">
              <span>WORKSPACE ERP</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        
        {/* SECTION: MANAGEMENT TASK */}
        <div>
          <div className="px-2 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              Management Task
            </span>
            {lateTasksCount > 0 && (
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                {lateTasksCount} Late
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            {/* Overview */}
            <button
              id="sidebar-nav-overview"
              onClick={() => onNavigate({ type: 'overview' })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activePage.type === 'overview'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Overview & All Tasks</span>
              </div>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                {tasks.length}
              </span>
            </button>

            {/* Team Members List */}
            <div className="pt-2 pb-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                Team Members
              </div>
              {members.map(member => {
                const isSelected = activePage.type === 'member' && activePage.memberName === member.name;
                const memberTasks = tasks.filter(t => t.assignee === member.name);
                const hasLate = memberTasks.some(t => t.status === 'Late');

                return (
                  <button
                    key={member.id}
                    id={`sidebar-member-${member.name.toLowerCase()}`}
                    onClick={() => onNavigate({ type: 'member', memberName: member.name })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-700 shrink-0 border border-slate-200"
                        style={{ backgroundColor: member.avatarBg }}
                      >
                        {member.initial}
                      </div>
                      <div className="truncate text-left">
                        <div className="truncate leading-tight">{member.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasLate && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" title="Ada task overdue/late" />
                      )}
                      <span className="text-[10px] text-slate-400">
                        {memberTasks.filter(t => t.status === 'Completed').length}/{memberTasks.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION: SOCIAL MEDIA PLAN & REPORTING */}
        <div>
          <div className="px-2 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              Social Media Brands
            </span>
            <button
              onClick={onOpenAddBrandModal}
              title="Tambah Brand Baru"
              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {brands.map(brand => {
              const isExpanded = expandedBrands[brand.name] !== false;
              const isPlannerActive = activePage.type === 'social-planner' && activePage.brandName === brand.name;
              const isReportActive = activePage.type === 'social-report' && activePage.brandName === brand.name;
              const isAnyBrandActive = isPlannerActive || isReportActive;

              return (
                <div key={brand.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-1.5">
                  {/* Brand Row Header */}
                  <div 
                    onClick={() => {
                      // Navigate to planner by default if clicking header
                      onNavigate({ type: 'social-planner', brandName: brand.name });
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      isAnyBrandActive ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-6 h-6 rounded-md text-white flex items-center justify-center font-bold text-[10px] shrink-0"
                        style={{ backgroundColor: brand.color }}
                      >
                        {brand.initial}
                      </div>
                      <div className="truncate">
                        <div className="text-xs truncate">{brand.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">{brand.handle}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => toggleBrandExpand(brand.name, e)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Brand Sub-menus: Leads Funnel, Executive Report, and Per-Channel Planner & Reporting */}
                  {isExpanded && (
                    <div className="mt-1.5 pl-1.5 space-y-2">
                      {/* Overview & Goals Hub */}
                      <div className="space-y-1">
                        {/* Leads Funnel Pipeline (Goals) */}
                        <button
                          id={`sidebar-brand-${brand.name.toLowerCase()}-funnel`}
                          onClick={() => onNavigate({ 
                            type: 'social-report', 
                            brandName: brand.name, 
                            initialTab: 'funnel' 
                          })}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition ${
                            activePage.type === 'social-report' && activePage.brandName === brand.name && activePage.initialTab === 'funnel'
                              ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-2xs'
                              : 'text-slate-700 hover:bg-white hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-semibold">Leads Funnel (Goals)</span>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200">
                            GOALS
                          </span>
                        </button>

                        {/* All-in-One Executive Summary */}
                        <button
                          id={`sidebar-brand-${brand.name.toLowerCase()}-all-report`}
                          onClick={() => onNavigate({ 
                            type: 'social-report', 
                            brandName: brand.name, 
                            initialTab: 'all' 
                          })}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition ${
                            activePage.type === 'social-report' && activePage.brandName === brand.name && (activePage.initialTab === 'all' || !activePage.initialTab)
                              ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200 shadow-2xs'
                              : 'text-slate-700 hover:bg-white hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Executive Summary</span>
                          </div>
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            ALL
                          </span>
                        </button>
                      </div>

                      {/* Sub-Channels Section: Each channel has its own Planner & Reporting */}
                      <div className="pt-1.5 border-t border-slate-200/70">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 px-1 mb-1.5 flex items-center justify-between">
                          <span>Sub-Kanal Digital</span>
                          <span className="text-[8px] font-normal text-slate-400">Planner & Report</span>
                        </div>

                        <div className="space-y-1.5">
                          {DIGITAL_CHANNELS.map(ch => {
                            const isChannelPlannerActive = 
                              activePage.type === 'social-planner' && 
                              activePage.brandName === brand.name && 
                              (activePage.initialChannel === ch.plannerChannel || (!activePage.initialChannel && ch.id === 'instagram'));
                            
                            const isChannelReportActive = 
                              activePage.type === 'social-report' && 
                              activePage.brandName === brand.name && 
                              activePage.initialTab === ch.reportTab;

                            const Icon = ch.icon;

                            return (
                              <div 
                                key={ch.id} 
                                className={`rounded-lg border p-1.5 transition ${
                                  isChannelPlannerActive || isChannelReportActive
                                    ? 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-100'
                                    : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${ch.iconBg}`}>
                                      <Icon className={`w-2.5 h-2.5 ${ch.iconColor}`} />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-800 truncate">
                                      {ch.name}
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-slate-400 truncate max-w-[80px]">
                                    {ch.desc}
                                  </span>
                                </div>

                                {/* Channel Actions: Planner & Report */}
                                <div className="grid grid-cols-2 gap-1">
                                  <button
                                    id={`sidebar-${brand.name.toLowerCase()}-${ch.id}-planner`}
                                    onClick={() => onNavigate({ 
                                      type: 'social-planner', 
                                      brandName: brand.name, 
                                      initialChannel: ch.plannerChannel 
                                    })}
                                    className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10px] transition ${
                                      isChannelPlannerActive
                                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-medium'
                                    }`}
                                    title={`Buka Content Planner ${ch.name}`}
                                  >
                                    <Calendar className="w-2.5 h-2.5" />
                                    <span>Planner</span>
                                  </button>

                                  <button
                                    id={`sidebar-${brand.name.toLowerCase()}-${ch.id}-report`}
                                    onClick={() => onNavigate({ 
                                      type: 'social-report', 
                                      brandName: brand.name, 
                                      initialTab: ch.reportTab 
                                    })}
                                    className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10px] transition ${
                                      isChannelReportActive
                                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-medium'
                                    }`}
                                    title={`Buka Report & Analytics ${ch.name}`}
                                  >
                                    <BarChart3 className="w-2.5 h-2.5" />
                                    <span>Report</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={onOpenAddBrandModal}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-slate-400 hover:text-slate-800 transition bg-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Brand Baru</span>
            </button>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-slate-500 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-600">Dreamlab ERP v2.4</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Sync
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Task Management & Planner</div>
      </div>
    </aside>
  );
};
