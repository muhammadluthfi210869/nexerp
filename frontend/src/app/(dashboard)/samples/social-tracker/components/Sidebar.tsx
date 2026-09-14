import React from 'react';
import { 
  Calendar, 
  LayoutGrid, 
  BarChart3, 
  Share2, 
  Sparkles, 
  Target, 
  Plus, 
  Search, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Moon, 
  Sun, 
  Layers, 
  Bookmark,
  FileText,
  Settings,
  Flame,
  Activity
} from 'lucide-react';
import { DatabaseViewType, MetaAccountConfig } from '../types';

interface SidebarProps {
  activeView: DatabaseViewType;
  setActiveView: (view: DatabaseViewType) => void;
  metaAccount: MetaAccountConfig;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onOpenNewPost: () => void;
  postsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  metaAccount,
  isOpen,
  setIsOpen,
  isDarkMode,
  setIsDarkMode,
  onOpenNewPost,
  postsCount,
}) => {
  const [favoritesExpanded, setFavoritesExpanded] = React.useState(true);
  const [plannerExpanded, setPlannerExpanded] = React.useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-2.5 left-3 z-40 p-1.5 rounded-md bg-white dark:bg-[#202020] shadow-xs border border-[#ececec] dark:border-[#2f2f2f] text-[#787774] hover:text-[#37352f] dark:hover:text-white transition cursor-pointer"
        title="Open Sidebar"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="w-[240px] h-screen bg-[#fbfbfa] dark:bg-[#1f1f1f] border-r border-[#ececec] dark:border-[#2c2c2c] flex flex-col flex-shrink-0 select-none text-[13px] font-sans transition-all duration-150 z-30">
      {/* Workspace Header Switcher */}
      <div className="p-3 flex items-center justify-between border-b border-[#ececec] dark:border-[#2c2c2c]">
        <div 
          className="flex items-center gap-2 hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] p-1 rounded-md cursor-pointer flex-1 min-w-0 transition"
        >
          <div className="w-5 h-5 bg-[#37352f] dark:bg-white rounded flex items-center justify-center text-white dark:text-[#1f1f1f] text-[10px] font-bold flex-shrink-0">
            M
          </div>
          <span className="font-semibold text-sm text-[#37352f] dark:text-[#d4d4d4] truncate">
            {metaAccount.pageName || 'Meta Suite Dashboard'}
          </span>
          <span className="text-[#787774] dark:text-[#909090] text-xs">⌄</span>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-[#787774] hover:text-[#37352f] dark:hover:text-white rounded hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] transition cursor-pointer ml-1"
          title="Collapse Sidebar"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      {/* Quick Navigation Items */}
      <nav className="mt-1 flex-1 px-2 space-y-0.5 overflow-y-auto">
        <div 
          onClick={onOpenNewPost}
          className="flex items-center gap-2 px-2 py-1 hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] rounded cursor-pointer text-[#37352f] dark:text-[#d4d4d4] font-medium"
        >
          <Plus className="w-3.5 h-3.5 text-[#787774]" />
          <span>New Post</span>
        </div>

        {/* Favorites Section */}
        <div className="pt-3 pb-1 px-2 flex items-center justify-between text-[11px] font-bold text-[#787774] dark:text-[#909090] uppercase tracking-wider">
          <span>Favorites</span>
          <button 
            onClick={() => setFavoritesExpanded(!favoritesExpanded)}
            className="hover:text-[#37352f] dark:hover:text-white"
          >
            {favoritesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {favoritesExpanded && (
          <div className="space-y-0.5">
            <div
              onClick={() => setActiveView('meta_analytics')}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
                activeView === 'meta_analytics'
                  ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                  : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-sm">📈</span>
              <span className="flex-1 truncate">Performance Tracker</span>
              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1 rounded">
                LIVE
              </span>
            </div>

            <div
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
                activeView === 'table'
                  ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                  : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-sm">📅</span>
              <span className="flex-1 truncate">Content Planner</span>
              <span className="text-[10px] text-[#787774] font-mono">({postsCount})</span>
            </div>
          </div>
        )}

        {/* Database Views Section */}
        <div className="pt-3 pb-1 px-2 flex items-center justify-between text-[11px] font-bold text-[#787774] dark:text-[#909090] uppercase tracking-wider">
          <span>Views</span>
          <button 
            onClick={() => setPlannerExpanded(!plannerExpanded)}
            className="hover:text-[#37352f] dark:hover:text-white"
          >
            {plannerExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {plannerExpanded && (
          <div className="space-y-0.5">
            <div
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
                activeView === 'table'
                  ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                  : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-[#787774]">📋</span>
              <span className="flex-1 truncate">Table View</span>
            </div>

            <div
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
                activeView === 'board'
                  ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                  : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-[#787774]">📌</span>
              <span className="flex-1 truncate">Kanban Board</span>
            </div>

            <div
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
                activeView === 'calendar'
                  ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                  : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-[#787774]">🗓️</span>
              <span className="flex-1 truncate">Calendar View</span>
            </div>

            <div
              onClick={() => setActiveView('gallery')}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
                activeView === 'gallery'
                  ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                  : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-[#787774]">🖼️</span>
              <span className="flex-1 truncate">Gallery View</span>
            </div>

            <div
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
                activeView === 'list'
                  ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                  : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-[#787774]">📄</span>
              <span className="flex-1 truncate">List View</span>
            </div>
          </div>
        )}

        {/* Platforms & Meta Suite Hub */}
        <div className="pt-3 pb-1 px-2 text-[11px] font-bold text-[#787774] dark:text-[#909090] uppercase tracking-wider">
          Meta Suite Hub
        </div>
        <div className="space-y-0.5">
          <div
            onClick={() => setActiveView('api_hub')}
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
              activeView === 'api_hub'
                ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
            }`}
          >
            <span className="text-[#1877F2] font-bold text-xs">f</span>
            <span className="flex-1 truncate">Meta API & Facebook</span>
            {metaAccount.isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </div>

          <div
            onClick={() => setActiveView('meta_analytics')}
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
              activeView === 'meta_analytics'
                ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
            }`}
          >
            <span className="text-[#E1306C] text-xs">📸</span>
            <span className="flex-1 truncate">Instagram Insights</span>
          </div>

          <div
            onClick={() => setActiveView('campaign_okrs')}
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
              activeView === 'campaign_okrs'
                ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
            }`}
          >
            <span className="text-red-500 text-xs">🎯</span>
            <span className="flex-1 truncate">Campaign OKRs</span>
          </div>

          <div
            onClick={() => setActiveView('ai_studio')}
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
              activeView === 'ai_studio'
                ? 'bg-[#efefef] dark:bg-[#2c2c2c] font-medium text-[#37352f] dark:text-white'
                : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#efefef] dark:hover:bg-[#2a2a2a]'
            }`}
          >
            <span className="text-purple-500 text-xs">✨</span>
            <span className="flex-1 truncate">Notion AI Copywriter</span>
            <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold px-1 rounded">
              AI
            </span>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-2 border-t border-[#ececec] dark:border-[#2c2c2c] space-y-1">
        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-[#787774] dark:text-[#909090]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Meta API v19.0
          </span>
          <span className="font-mono text-[10px]">{metaAccount.isConnected ? 'Connected' : 'Ready'}</span>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center justify-between px-2 py-1 text-xs text-[#5f5e5b] dark:text-[#d4d4d4] rounded hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] transition cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            {isDarkMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </span>
          <span className="text-[10px] font-mono text-[#787774]">{isDarkMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </aside>
  );
};
