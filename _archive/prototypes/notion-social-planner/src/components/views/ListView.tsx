import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Eye, 
  Flame, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Calendar as CalendarIcon
} from 'lucide-react';
import { PostItem, PostStatus } from '../../types';
import { 
  platformConfig, 
  statusConfig, 
  pillarConfig, 
  formatNumber, 
  formatDateIndonesian,
  groupPostsByMonth 
} from '../../utils/notionStyles';

interface ListViewProps {
  posts: PostItem[];
  groupByMonth?: boolean;
  onOpenPost: (post: PostItem) => void;
  onUpdateStatus: (postId: string, newStatus: PostStatus) => void;
  onAddNewPost: (initialDate?: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  posts,
  groupByMonth = true,
  onOpenPost,
  onUpdateStatus,
  onAddNewPost,
}) => {
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (monthKey: string) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const monthGroups = groupPostsByMonth(posts);

  const renderItem = (post: PostItem) => {
    const platform = platformConfig[post.platform];
    const status = statusConfig[post.status];
    const pillar = pillarConfig[post.pillar];
    const isDone = post.status === 'published';

    return (
      <div
        key={post.id}
        onClick={() => onOpenPost(post)}
        className="group p-3 flex items-center justify-between gap-4 hover:bg-[#f7f6f3] dark:hover:bg-[#252525] transition cursor-pointer"
      >
        {/* Left Checkbox & Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(post.id, isDone ? 'idea' : 'published');
            }}
            className="text-zinc-400 hover:text-emerald-600 transition cursor-pointer"
          >
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${platform.bg} ${platform.text}`}>
                {platform.icon} {platform.name}
              </span>
              <span className={`font-medium text-xs truncate ${isDone ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-[#37352f] dark:text-[#d4d4d4]'}`}>
                {post.title}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#787774] dark:text-[#909090] mt-0.5">
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <Clock className="w-3 h-3 text-zinc-400" />
                {formatDateIndonesian(post.scheduledDate)}
              </span>
              <span>•</span>
              <span className="text-[10px]">{pillar.name}</span>
            </div>
          </div>
        </div>

        {/* Right Status & Metric */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${status.bg} ${status.text}`}>
            {status.name}
          </span>

          {post.performance?.reach ? (
            <div className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Eye className="w-3.5 h-3.5" />
              <span>{formatNumber(post.performance.reach)}</span>
            </div>
          ) : null}

          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition" />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl pb-12 pt-2">
      {groupByMonth && monthGroups.length > 0 ? (
        <div className="space-y-4">
          {monthGroups.map((group) => {
            const isCollapsed = collapsedMonths[group.monthKey];
            const defaultAddDate = `${group.monthKey}-15T10:00`;

            return (
              <div 
                key={group.monthKey}
                className="bg-white dark:bg-[#202020] rounded-lg border border-[#e9e8e4] dark:border-[#2f2f2f] overflow-hidden shadow-xs"
              >
                {/* Month Group Header */}
                <div className="bg-[#fbfbfa] dark:bg-[#252525] px-3.5 py-2.5 flex items-center justify-between border-b border-[#ececec] dark:border-[#2c2c2c] select-none">
                  <div 
                    onClick={() => toggleMonth(group.monthKey)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-[#787774]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#787774]" />
                    )}
                    <span className="font-semibold text-xs text-[#37352f] dark:text-white flex items-center gap-1.5">
                      <span>🗓️</span>
                      <span>{group.monthName}</span>
                    </span>
                    <span className="text-[11px] text-[#787774] dark:text-[#909090] font-mono bg-[#eae8e1] dark:bg-[#333] px-1.5 py-0.2 rounded">
                      {group.count} konten
                    </span>
                    {group.totalReach > 0 && (
                      <span className="hidden sm:inline-block text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                        • {formatNumber(group.totalReach)} reach
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onAddNewPost(defaultAddDate)}
                    className="flex items-center gap-1 text-[11px] text-[#787774] hover:text-[#37352f] dark:hover:text-white px-2 py-0.5 rounded hover:bg-[#eae8e1] dark:hover:bg-[#333] transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah</span>
                  </button>
                </div>

                {/* Items in this month */}
                {!isCollapsed && (
                  <div className="divide-y divide-[#f0efe9] dark:divide-[#252525]">
                    {group.items.map((post: PostItem) => renderItem(post))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#202020] rounded-lg border border-[#e9e8e4] dark:border-[#2f2f2f] divide-y divide-[#f0efe9] dark:divide-[#252525] overflow-hidden">
          {posts.map((post) => renderItem(post))}

          {/* Add Row in List */}
          <button
            onClick={() => onAddNewPost()}
            className="w-full flex items-center gap-2 p-3 text-xs text-[#787774] dark:text-[#909090] hover:text-[#37352f] dark:hover:text-white hover:bg-[#f7f6f3] dark:hover:bg-[#252525] transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-zinc-400" />
            <span>Tambah Konten ke Daftar...</span>
          </button>
        </div>
      )}
    </div>
  );
};

