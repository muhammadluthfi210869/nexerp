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
        className="group p-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition cursor-pointer"
      >
        {/* Left Checkbox & Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(post.id, isDone ? 'idea' : 'published');
            }}
            className="text-slate-400 hover:text-emerald-600 transition cursor-pointer border-none bg-transparent p-0"
          >
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Circle className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${platform.bg} ${platform.text} ${platform.border}`}>
                {platform.icon} {platform.name}
              </span>
              <span className={`font-semibold text-[12px] truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
                {post.title}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatDateIndonesian(post.scheduledDate)}
              </span>
              <span>•</span>
              <span className="text-[10px] font-medium">{pillar.name}</span>
            </div>
          </div>
        </div>

        {/* Right Status & Metric */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${status.bg} ${status.text} ${status.border}`}>
            {status.name}
          </span>

          {post.performance?.reach ? (
            <div className="flex items-center gap-1 font-mono text-emerald-700 text-[11px] font-bold tabular-nums">
              <Eye className="w-3.5 h-3.5" />
              <span>{formatNumber(post.performance.reach)}</span>
            </div>
          ) : null}

          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition" />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl pb-12 pt-1 font-sans">
      {groupByMonth && monthGroups.length > 0 ? (
        <div className="space-y-4">
          {monthGroups.map((group) => {
            const isCollapsed = collapsedMonths[group.monthKey];
            const defaultAddDate = `${group.monthKey}-15T10:00`;

            return (
              <div 
                key={group.monthKey}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
              >
                {/* Month Group Header */}
                <div className="bg-slate-50/90 px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200 select-none">
                  <div 
                    onClick={() => toggleMonth(group.monthKey)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="font-bold text-[13px] text-slate-900 flex items-center gap-1.5">
                      <span>🗓️</span>
                      <span>{group.monthName}</span>
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono bg-slate-200/80 px-2 py-0.5 rounded-full font-bold">
                      {group.count} konten
                    </span>
                    {group.totalReach > 0 && (
                      <span className="hidden sm:inline-block text-[11px] text-emerald-700 font-mono font-bold">
                        • {formatNumber(group.totalReach)} reach
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onAddNewPost(defaultAddDate)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer border-none bg-transparent"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah</span>
                  </button>
                </div>

                {/* Items in this month */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {group.items.map((post: PostItem) => renderItem(post))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {posts.map((post) => renderItem(post))}

          {/* Add Row in List */}
          <button
            onClick={() => onAddNewPost()}
            className="w-full flex items-center gap-2 p-3 text-[12px] font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>+ Tambah Konten ke Daftar...</span>
          </button>
        </div>
      )}
    </div>
  );
};

