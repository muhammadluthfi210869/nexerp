import React, { useState } from 'react';
import { 
  Plus, 
  Clock, 
  Eye, 
  Flame,
  Calendar as CalendarIcon,
  Layers
} from 'lucide-react';
import { PostItem, PostStatus } from '../../types';
import { 
  platformConfig, 
  statusConfig, 
  pillarConfig, 
  contentTypeConfig, 
  formatNumber, 
  formatDateIndonesian,
  groupPostsByMonth,
  getMonthKey,
  getMonthName
} from '../../utils/notionStyles';

interface BoardViewProps {
  posts: PostItem[];
  onOpenPost: (post: PostItem) => void;
  onUpdateStatus: (postId: string, newStatus: PostStatus) => void;
  onAddNewPostWithStatus?: (status: PostStatus, initialDate?: string) => void;
}

const STATUS_COLUMNS: { id: PostStatus; label: string; dotColor: string }[] = [
  { id: 'idea', label: '💡 Idea', dotColor: 'bg-neutral-400' },
  { id: 'scripting', label: '✍️ Scripting', dotColor: 'bg-amber-400' },
  { id: 'review', label: '👀 Review', dotColor: 'bg-purple-400' },
  { id: 'scheduled', label: '⏰ Scheduled', dotColor: 'bg-blue-400' },
  { id: 'published', label: '✅ Published', dotColor: 'bg-emerald-500' },
];

export const BoardView: React.FC<BoardViewProps> = ({
  posts,
  onOpenPost,
  onUpdateStatus,
  onAddNewPostWithStatus,
}) => {
  const [boardGrouping, setBoardGrouping] = useState<'status' | 'month'>('status');

  const monthGroups = groupPostsByMonth(posts);

  const renderCard = (post: PostItem) => {
    const platform = platformConfig[post.platform];
    const status = statusConfig[post.status];
    const pillar = pillarConfig[post.pillar];
    const contentType = contentTypeConfig[post.contentType];

    return (
      <div
        key={post.id}
        onClick={() => onOpenPost(post)}
        className="group bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex flex-col gap-2 relative"
      >
        {/* Cover Thumbnail if exists */}
        {post.coverImage && (
          <div className="h-28 -mx-3 -mt-3 mb-1 overflow-hidden rounded-t-xl relative">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
            />
            <div className="absolute top-2 left-2 flex gap-1">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border backdrop-blur-md shadow-2xs ${platform.bg} ${platform.text} ${platform.border}`}>
                {platform.icon} {platform.name}
              </span>
            </div>
          </div>
        )}

        {/* Platform & Format tags (if no cover) */}
        {!post.coverImage && (
          <div className="flex items-center justify-between gap-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${platform.bg} ${platform.text} ${platform.border}`}>
              <span>{platform.icon}</span>
              <span>{platform.name}</span>
            </span>
            <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md font-semibold">
              {contentType.icon} {contentType.name}
            </span>
          </div>
        )}

        {/* Post Title */}
        <h4 className="text-[12px] font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition">
          {post.title}
        </h4>

        {/* Content Pillar Tag & Status Tag */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${pillar.bg} ${pillar.text} ${pillar.border}`}>
            {pillar.name}
          </span>
          {boardGrouping === 'month' && (
            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${status.bg} ${status.text} ${status.border}`}>
              {status.name}
            </span>
          )}
        </div>

        {/* Date & Performance Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatDateIndonesian(post.scheduledDate)}</span>
          </div>

          {post.performance?.reach ? (
            <div className="flex items-center gap-1 text-emerald-700 font-mono font-bold text-[11px] tabular-nums">
              <Eye className="w-3 h-3" />
              <span>{formatNumber(post.performance.reach)}</span>
            </div>
          ) : (
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-4 h-4 rounded-full object-cover border border-slate-200"
              title={post.author.name}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-12 pt-1 font-sans">
      {/* Board Grouping Toggle Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-slate-600 font-medium">Kelompokkan Board:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setBoardGrouping('status')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border-none ${
                boardGrouping === 'status'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Per Status</span>
            </button>
            <button
              onClick={() => setBoardGrouping('month')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border-none ${
                boardGrouping === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Pisahkan per Bulan</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono font-medium">
          Total: {posts.length} konten
        </div>
      </div>

      {/* Board Columns: Grouped by Status */}
      {boardGrouping === 'status' && (
        <div className="flex gap-3.5 min-w-[1100px] items-start">
          {STATUS_COLUMNS.map((col) => {
            const colPosts = posts.filter((p) => p.status === col.id);

            return (
              <div
                key={col.id}
                className="w-64 flex-shrink-0 bg-slate-50/80 rounded-xl p-3 border border-slate-200 flex flex-col max-h-[calc(100vh-260px)] shadow-2xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="text-[12px] font-bold text-slate-900">
                      {col.label}
                    </span>
                    <span className="text-[10px] bg-slate-200/80 text-slate-700 font-mono px-1.5 py-0.5 rounded-full font-bold">
                      {colPosts.length}
                    </span>
                  </div>

                  <button
                    onClick={() => onAddNewPostWithStatus && onAddNewPostWithStatus(col.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer border-none bg-transparent"
                    title="Tambah kartu"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                  {colPosts.map((post) => renderCard(post))}

                  {colPosts.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                      Belum ada konten
                    </div>
                  )}
                </div>

                {/* Add Card to Column */}
                <button
                  onClick={() => onAddNewPostWithStatus && onAddNewPostWithStatus(col.id)}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-dashed border-slate-200 bg-transparent transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Konten</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Board Columns: Grouped by Month */}
      {boardGrouping === 'month' && (
        <div className="flex gap-3.5 min-w-[1100px] items-start">
          {monthGroups.map((group) => {
            const defaultDate = `${group.monthKey}-15T10:00`;

            return (
              <div
                key={group.monthKey}
                className="w-72 flex-shrink-0 bg-slate-50/80 rounded-xl p-3 border border-slate-200 flex flex-col max-h-[calc(100vh-260px)] shadow-2xs"
              >
                {/* Month Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🗓️</span>
                        <span>{group.monthName}</span>
                      </span>
                      <span className="text-[10px] bg-slate-200/80 text-slate-700 font-mono px-1.5 py-0.5 rounded-full font-bold">
                        {group.count}
                      </span>
                    </div>
                    {group.totalReach > 0 && (
                      <div className="text-[10px] text-emerald-700 font-mono font-bold mt-0.5">
                        {formatNumber(group.totalReach)} reach total
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onAddNewPostWithStatus && onAddNewPostWithStatus('idea', defaultDate)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer border-none bg-transparent"
                    title={`Tambah konten untuk ${group.monthName}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                  {group.items.map((post: PostItem) => renderCard(post))}

                  {group.items.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                      Belum ada konten
                    </div>
                  )}
                </div>

                {/* Add Card to Month Column */}
                <button
                  onClick={() => onAddNewPostWithStatus && onAddNewPostWithStatus('idea', defaultDate)}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-dashed border-slate-200 bg-transparent transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah di Bulan Ini</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

