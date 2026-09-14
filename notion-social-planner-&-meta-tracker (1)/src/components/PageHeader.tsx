import React, { useState } from 'react';
import { 
  Smile, 
  Image as ImageIcon, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Plus, 
  Share2, 
  CheckCircle2, 
  Activity,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Eye,
  Flame,
  Users,
  DollarSign
} from 'lucide-react';
import { DatabaseViewType, MetaAccountConfig } from '../types';
import { formatNumber } from '../utils/notionStyles';

interface PageHeaderProps {
  activeView?: DatabaseViewType;
  title?: string;
  setTitle?: (t: string) => void;
  icon?: string;
  setIcon?: (i: string) => void;
  coverImage?: string;
  setCoverImage?: (c: string) => void;
  metaAccount?: MetaAccountConfig;
  onOpenNewPost?: () => void;
  onAddNewPost?: () => void;
  onOpenAiStudio?: () => void;
  onSyncMeta?: () => void;
  isSyncing?: boolean;
  onExportData?: () => void;
  totalPosts?: number;
  publishedCount?: number;
  scheduledPosts?: number;
  totalReach?: number;
  avgEngagement?: number;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=80',
];

const PRESET_EMOJIS = ['📊', '🗓️', '📱', '🚀', '✨', '💼', '🎬', '🔥', '💡', '🎨', '🎯', '📈'];

export const PageHeader: React.FC<PageHeaderProps> = ({
  activeView = 'table',
  title = 'Social Media Performance',
  setTitle,
  icon = '📊',
  setIcon,
  coverImage,
  setCoverImage,
  metaAccount,
  onOpenNewPost,
  onAddNewPost,
  onOpenAiStudio,
  onSyncMeta,
  isSyncing = false,
  onExportData,
  totalPosts = 12,
  publishedCount = 8,
  scheduledPosts = 3,
  totalReach = 842500,
  avgEngagement = 8.4,
}) => {
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [internalTitle, setInternalTitle] = useState(title);
  const [internalIcon, setInternalIcon] = useState(icon);

  const handleNewPost = onOpenNewPost || onAddNewPost;

  return (
    <div className="w-full font-sans">
      {/* High Density Top Breadcrumb Header Bar */}
      <header className="h-[45px] border-b border-[#ececec] dark:border-[#2c2c2c] flex items-center px-4 md:px-8 text-[13px] md:text-[14px] justify-between bg-white dark:bg-[#191919] sticky top-0 z-20">
        <div className="flex items-center gap-2 text-[#787774] dark:text-[#909090]">
          <span className="hover:text-[#37352f] dark:hover:text-white cursor-pointer">Workspace</span>
          <span className="text-[#a0a0a0]">/</span>
          <span className="text-[#37352f] dark:text-white font-medium">Performance Tracker</span>
        </div>

        <div className="flex items-center gap-3 text-[#787774] dark:text-[#909090] text-[12px]">
          {onSyncMeta && (
            <button
              onClick={onSyncMeta}
              disabled={isSyncing}
              className="flex items-center gap-1 hover:text-[#37352f] dark:hover:text-white cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          )}

          {onOpenAiStudio && (
            <button
              onClick={onOpenAiStudio}
              className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Notion AI</span>
            </button>
          )}

          {onExportData && (
            <button
              onClick={onExportData}
              className="hover:text-[#37352f] dark:hover:text-white cursor-pointer"
            >
              Export
            </button>
          )}

          <span className="hover:text-[#37352f] dark:hover:text-white cursor-pointer">Share</span>
          <span className="hover:text-[#37352f] dark:hover:text-white cursor-pointer">Updates</span>
          <span className="hover:text-[#37352f] dark:hover:text-white cursor-pointer">Favorite</span>

          {handleNewPost && (
            <button
              onClick={handleNewPost}
              className="ml-1 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#2383e2] hover:bg-[#1a73cb] rounded shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Page Top Section */}
      <section className="px-6 md:px-12 pt-8 pb-4 max-w-7xl mx-auto w-full">
        {/* Title and Subtitle */}
        <div className="mb-6">
          <div className="text-[38px] mb-1 leading-none select-none relative inline-block group/emoji">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="hover:scale-105 transition cursor-pointer"
              title="Change icon"
            >
              {internalIcon}
            </button>

            {showEmojiPicker && (
              <div className="absolute left-0 top-12 z-50 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-[#ececec] dark:border-[#2f2f2f] grid grid-cols-6 gap-1.5 w-52 text-xl">
                {PRESET_EMOJIS.map((e, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInternalIcon(e);
                      if (setIcon) setIcon(e);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 rounded hover:bg-[#efefef] dark:hover:bg-zinc-700 transition"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {isEditingTitle ? (
              <input
                type="text"
                value={internalTitle}
                onChange={(e) => {
                  setInternalTitle(e.target.value);
                  if (setTitle) setTitle(e.target.value);
                }}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="text-3xl md:text-4xl font-bold text-[#37352f] dark:text-white bg-transparent border-b border-blue-500 outline-none w-full"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-3xl md:text-4xl font-bold text-[#37352f] dark:text-white hover:bg-[#efefef] dark:hover:bg-[#262626] px-1 py-0.5 -ml-1 rounded cursor-text transition"
                title="Click to edit title"
              >
                {internalTitle}
              </h1>
            )}
          </div>

          <p className="text-[#787774] dark:text-[#909090] text-sm mt-1.5">
            Live tracking data from Meta Business Suite API. Last updated: 2 mins ago.
          </p>
        </div>

        {/* 4 High Density Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Total Reach */}
          <div className="p-3 border border-[#ececec] dark:border-[#2f2f2f] rounded-lg bg-white dark:bg-[#1f1f1f] shadow-xs">
            <div className="text-[12px] text-[#787774] dark:text-[#909090] mb-1 uppercase font-semibold">
              Total Reach
            </div>
            <div className="text-2xl font-bold font-mono text-[#37352f] dark:text-white">
              {formatNumber(totalReach)}
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 text-[11px] mt-1 font-medium flex items-center gap-0.5">
              <span>↑ 12.4% vs last mo.</span>
            </div>
          </div>

          {/* Engagement */}
          <div className="p-3 border border-[#ececec] dark:border-[#2f2f2f] rounded-lg bg-white dark:bg-[#1f1f1f] shadow-xs">
            <div className="text-[12px] text-[#787774] dark:text-[#909090] mb-1 uppercase font-semibold">
              Engagement
            </div>
            <div className="text-2xl font-bold font-mono text-[#37352f] dark:text-white">
              {formatNumber(18294)}
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 text-[11px] mt-1 font-medium flex items-center gap-0.5">
              <span>↑ {avgEngagement}% avg rate</span>
            </div>
          </div>

          {/* Followers Gained */}
          <div className="p-3 border border-[#ececec] dark:border-[#2f2f2f] rounded-lg bg-white dark:bg-[#1f1f1f] shadow-xs">
            <div className="text-[12px] text-[#787774] dark:text-[#909090] mb-1 uppercase font-semibold">
              Followers Gained
            </div>
            <div className="text-2xl font-bold font-mono text-[#37352f] dark:text-white">
              +2,140
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 text-[11px] mt-1 font-medium flex items-center gap-0.5">
              <span>↑ 1.2% vs last mo.</span>
            </div>
          </div>

          {/* Active Campaign / Ad Spend */}
          <div className="p-3 border border-[#ececec] dark:border-[#2f2f2f] rounded-lg bg-white dark:bg-[#1f1f1f] shadow-xs">
            <div className="text-[12px] text-[#787774] dark:text-[#909090] mb-1 uppercase font-semibold">
              Content Status
            </div>
            <div className="text-2xl font-bold font-mono text-[#37352f] dark:text-white">
              {scheduledPosts} Scheduled
            </div>
            <div className="text-[#787774] dark:text-[#909090] text-[11px] mt-1">
              {totalPosts} Total Posts Active
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
