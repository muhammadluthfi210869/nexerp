import React, { useState } from 'react';
import { 
  Layers, 
  LayoutGrid, 
  Calendar as CalendarIcon, 
  Bookmark, 
  FileText, 
  BarChart3, 
  Share2, 
  Target, 
  Sparkles, 
  Filter, 
  ArrowUpDown, 
  Search, 
  X,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { DatabaseViewType, ViewFilter, ViewSort, SocialPlatform, PostStatus, ContentPillar } from '../types';

interface DatabaseViewTabsProps {
  activeView: DatabaseViewType;
  setActiveView: (view: DatabaseViewType) => void;
  filter: ViewFilter;
  setFilter: React.Dispatch<React.SetStateAction<ViewFilter>>;
  sort: ViewSort;
  setSort: React.Dispatch<React.SetStateAction<ViewSort>>;
  counts: {
    total: number;
    ideas: number;
    scheduled: number;
    published: number;
  };
}

export const DatabaseViewTabs: React.FC<DatabaseViewTabsProps> = ({
  activeView,
  setActiveView,
  filter,
  setFilter,
  sort,
  setSort,
  counts,
}) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const isFilterActive = filter.platform !== 'all' || filter.status !== 'all' || filter.pillar !== 'all' || Boolean(filter.search);

  const resetFilters = () => {
    setFilter({
      platform: 'all',
      status: 'all',
      pillar: 'all',
      search: '',
    });
  };

  return (
    <div className="border-b border-[#ececec] dark:border-[#2f2f2f] bg-transparent">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-1">
          {/* Notion View Switcher Tabs */}
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none text-sm text-[#787774] dark:text-[#909090]">
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1.5 pb-1 transition cursor-pointer whitespace-nowrap ${
                activeView === 'table'
                  ? 'font-medium text-[#37352f] dark:text-white border-b-2 border-[#37352f] dark:border-white'
                  : 'hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <span>📋</span>
              <span>Table View</span>
              <span className="text-[11px] text-[#787774] font-mono">({counts.total})</span>
            </button>

            <button
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-1.5 pb-1 transition cursor-pointer whitespace-nowrap ${
                activeView === 'board'
                  ? 'font-medium text-[#37352f] dark:text-white border-b-2 border-[#37352f] dark:border-white'
                  : 'hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <span>📌</span>
              <span>Board View</span>
            </button>

            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-1.5 pb-1 transition cursor-pointer whitespace-nowrap ${
                activeView === 'calendar'
                  ? 'font-medium text-[#37352f] dark:text-white border-b-2 border-[#37352f] dark:border-white'
                  : 'hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <span>🗓️</span>
              <span>Calendar View</span>
            </button>

            <button
              onClick={() => setActiveView('gallery')}
              className={`flex items-center gap-1.5 pb-1 transition cursor-pointer whitespace-nowrap ${
                activeView === 'gallery'
                  ? 'font-medium text-[#37352f] dark:text-white border-b-2 border-[#37352f] dark:border-white'
                  : 'hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <span>🖼️</span>
              <span>Gallery View</span>
            </button>

            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 pb-1 transition cursor-pointer whitespace-nowrap ${
                activeView === 'list'
                  ? 'font-medium text-[#37352f] dark:text-white border-b-2 border-[#37352f] dark:border-white'
                  : 'hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <span>📄</span>
              <span>List View</span>
            </button>

            <div className="h-3.5 w-[1px] bg-[#ececec] dark:bg-[#333] mx-0.5" />

            <button
              onClick={() => setActiveView('meta_analytics')}
              className={`flex items-center gap-1.5 pb-1 transition cursor-pointer whitespace-nowrap ${
                activeView === 'meta_analytics'
                  ? 'font-medium text-[#37352f] dark:text-white border-b-2 border-[#37352f] dark:border-white'
                  : 'hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <span>📈</span>
              <span>Performance Tracker</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>

            <button
              onClick={() => setActiveView('api_hub')}
              className={`flex items-center gap-1.5 pb-1 transition cursor-pointer whitespace-nowrap ${
                activeView === 'api_hub'
                  ? 'font-medium text-[#37352f] dark:text-white border-b-2 border-[#37352f] dark:border-white'
                  : 'hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <span className="text-[#1877F2] font-bold text-xs">f</span>
              <span>Meta API Hub</span>
            </button>

            <button
              onClick={() => setActiveView('campaign_okrs')}
              className={`flex items-center gap-1.5 pb-1 transition cursor-pointer whitespace-nowrap ${
                activeView === 'campaign_okrs'
                  ? 'font-medium text-[#37352f] dark:text-white border-b-2 border-[#37352f] dark:border-white'
                  : 'hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <span>🎯</span>
              <span>OKRs</span>
            </button>
          </div>

          {/* Search, Filter & Sort Bar */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774]" />
              <input
                type="text"
                placeholder="Search..."
                value={filter.search || ''}
                onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full pl-7 pr-6 py-1 text-xs bg-white dark:bg-[#202020] border border-[#ececec] dark:border-[#2f2f2f] rounded outline-none focus:border-[#37352f] text-[#37352f] dark:text-[#d4d4d4] placeholder-[#787774]"
              />
              {filter.search && (
                <button
                  onClick={() => setFilter((prev) => ({ ...prev, search: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#787774] hover:text-[#37352f]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition cursor-pointer ${
                  isFilterActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-white dark:bg-[#202020] border-[#ececec] dark:border-[#2f2f2f] text-[#787774] dark:text-[#909090] hover:text-[#37352f]'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>Filter</span>
                {isFilterActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </button>

              {/* Filter Popover */}
              {showFilterDropdown && (
                <div className="absolute right-0 top-9 z-50 p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 w-64 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-700">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Filter Konten</span>
                    {isFilterActive && (
                      <button onClick={resetFilters} className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Platform Filter */}
                  <div>
                    <label className="text-[11px] text-zinc-500 font-medium block mb-1">Platform</label>
                    <select
                      value={filter.platform || 'all'}
                      onChange={(e) => setFilter((prev) => ({ ...prev, platform: e.target.value as any }))}
                      className="w-full text-xs p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="all">Semua Platform</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                      <option value="threads">Threads</option>
                      <option value="youtube">YouTube</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-[11px] text-zinc-500 font-medium block mb-1">Status</label>
                    <select
                      value={filter.status || 'all'}
                      onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value as any }))}
                      className="w-full text-xs p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="all">Semua Status</option>
                      <option value="idea">💡 Idea</option>
                      <option value="scripting">✍️ Scripting</option>
                      <option value="review">👀 In Review</option>
                      <option value="scheduled">⏰ Scheduled</option>
                      <option value="published">✅ Published</option>
                    </select>
                  </div>

                  {/* Pillar Filter */}
                  <div>
                    <label className="text-[11px] text-zinc-500 font-medium block mb-1">Pilar Konten</label>
                    <select
                      value={filter.pillar || 'all'}
                      onChange={(e) => setFilter((prev) => ({ ...prev, pillar: e.target.value as any }))}
                      className="w-full text-xs p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="all">Semua Pilar</option>
                      <option value="Educational">Educational</option>
                      <option value="Promotional">Promotional</option>
                      <option value="Behind The Scenes">Behind The Scenes</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Community">Community</option>
                      <option value="Product Highlight">Product Highlight</option>
                      <option value="Tips & Tricks">Tips & Tricks</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-[#f7f6f3] dark:bg-[#2a2a2a] border border-[#e9e8e4] dark:border-[#383838] text-zinc-600 dark:text-zinc-300 hover:bg-[#eae8e1] transition cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort</span>
              </button>

              {/* Sort Popover */}
              {showSortDropdown && (
                <div className="absolute right-0 top-9 z-50 p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 w-56 space-y-2">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 pb-1 border-b border-zinc-100 dark:border-zinc-700">
                    Urutkan Berdasarkan
                  </div>
                  <button
                    onClick={() => {
                      setSort({ field: 'scheduledDate', direction: 'desc' });
                      setShowSortDropdown(false);
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    📅 Tanggal Jadwal (Terbaru)
                  </button>
                  <button
                    onClick={() => {
                      setSort({ field: 'performance.reach', direction: 'desc' });
                      setShowSortDropdown(false);
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    📈 Meta Reach Tertinggi
                  </button>
                  <button
                    onClick={() => {
                      setSort({ field: 'performance.engagementRate', direction: 'desc' });
                      setShowSortDropdown(false);
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    🔥 Engagement Rate Tertinggi
                  </button>
                  <button
                    onClick={() => {
                      setSort({ field: 'title', direction: 'asc' });
                      setShowSortDropdown(false);
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    🔤 Judul (A - Z)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
