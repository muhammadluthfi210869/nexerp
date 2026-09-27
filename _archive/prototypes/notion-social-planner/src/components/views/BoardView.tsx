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
        className="group bg-white dark:bg-[#252525] rounded-md border border-[#ececec] dark:border-[#2f2f2f] p-2.5 shadow-xs hover:border-[#37352f] dark:hover:border-[#555] transition cursor-pointer flex flex-col gap-1.5 relative"
      >
        {/* Cover Thumbnail if exists */}
        {post.coverImage && (
          <div className="h-28 -mx-2.5 -mt-2.5 mb-1 overflow-hidden rounded-t-md relative">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
            />
            <div className="absolute top-1.5 left-1.5 flex gap-1">
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-medium backdrop-blur-md ${platform.bg} ${platform.text}`}>
                {platform.icon} {platform.name}
              </span>
            </div>
          </div>
        )}

        {/* Platform & Format tags (if no cover) */}
        {!post.coverImage && (
          <div className="flex items-center justify-between gap-1">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium border ${platform.bg} ${platform.text} ${platform.border}`}>
              <span>{platform.icon}</span>
              <span>{platform.name}</span>
            </span>
            <span className="text-[10px] text-[#787774] dark:text-[#909090] bg-[#efefef] dark:bg-[#2a2a2a] px-1 rounded">
              {contentType.icon} {contentType.name}
            </span>
          </div>
        )}

        {/* Post Title */}
        <h4 className="text-xs font-semibold text-[#37352f] dark:text-white line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
          {post.title}
        </h4>

        {/* Content Pillar Tag & Status Tag */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium ${pillar.bg} ${pillar.text}`}>
            {pillar.name}
          </span>
          {boardGrouping === 'month' && (
            <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-medium ${status.bg} ${status.text}`}>
              {status.name}
            </span>
          )}
        </div>

        {/* Date & Performance Footer */}
        <div className="pt-1.5 border-t border-[#ececec] dark:border-[#2f2f2f] flex items-center justify-between text-[10px] text-[#787774] dark:text-[#909090]">
          <div className="flex items-center gap-1 font-mono">
            <Clock className="w-2.5 h-2.5 text-[#a0a0a0]" />
            <span>{formatDateIndonesian(post.scheduledDate)}</span>
          </div>

          {post.performance?.reach ? (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              <Eye className="w-2.5 h-2.5" />
              <span>{formatNumber(post.performance.reach)}</span>
            </div>
          ) : (
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-3.5 h-3.5 rounded-full object-cover"
              title={post.author.name}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-12 pt-2 font-sans">
      {/* Board Grouping Toggle Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#ececec] dark:border-[#2f2f2f]">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#787774] dark:text-[#909090]">Kelompokkan Board:</span>
          <div className="flex items-center bg-[#efefef] dark:bg-[#252525] p-0.5 rounded-md border border-[#ececec] dark:border-[#333]">
            <button
              onClick={() => setBoardGrouping('status')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                boardGrouping === 'status'
                  ? 'bg-white dark:bg-[#333] text-[#37352f] dark:text-white font-medium shadow-xs'
                  : 'text-[#787774] hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Per Status</span>
            </button>
            <button
              onClick={() => setBoardGrouping('month')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                boardGrouping === 'month'
                  ? 'bg-white dark:bg-[#333] text-[#37352f] dark:text-white font-medium shadow-xs'
                  : 'text-[#787774] hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Pisahkan per Bulan</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-[#787774] dark:text-[#909090] font-mono">
          Total: {posts.length} konten
        </div>
      </div>

      {/* Board Columns: Grouped by Status */}
      {boardGrouping === 'status' && (
        <div className="flex gap-3 min-w-[1100px] items-start">
          {STATUS_COLUMNS.map((col) => {
            const colPosts = posts.filter((p) => p.status === col.id);

            return (
              <div
                key={col.id}
                className="w-64 flex-shrink-0 bg-[#fbfbfa] dark:bg-[#1f1f1f] rounded-lg p-2.5 border border-[#ececec] dark:border-[#2c2c2c] flex flex-col max-h-[calc(100vh-280px)] shadow-xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ececec] dark:border-[#2c2c2c]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="text-xs font-semibold text-[#37352f] dark:text-white">
                      {col.label}
                    </span>
                    <span className="text-[10px] bg-[#efefef] dark:bg-[#2a2a2a] text-[#787774] dark:text-[#909090] font-mono px-1 rounded">
                      {colPosts.length}
                    </span>
                  </div>

                  <button
                    onClick={() => onAddNewPostWithStatus && onAddNewPostWithStatus(col.id)}
                    className="p-0.5 text-[#787774] hover:text-[#37352f] dark:hover:text-white rounded hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] transition cursor-pointer"
                    title="Add card"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                  {colPosts.map((post) => renderCard(post))}

                  {colPosts.length === 0 && (
                    <div className="py-6 text-center text-xs text-[#787774] border border-dashed border-[#ececec] dark:border-[#2f2f2f] rounded">
                      Belum ada konten
                    </div>
                  )}
                </div>

                {/* Add Card to Column */}
                <button
                  onClick={() => onAddNewPostWithStatus && onAddNewPostWithStatus(col.id)}
                  className="mt-2 w-full flex items-center justify-center gap-1 py-1 text-xs text-[#787774] hover:text-[#37352f] dark:hover:text-white hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] rounded transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Board Columns: Grouped by Month */}
      {boardGrouping === 'month' && (
        <div className="flex gap-3 min-w-[1100px] items-start">
          {monthGroups.map((group) => {
            const defaultDate = `${group.monthKey}-15T10:00`;

            return (
              <div
                key={group.monthKey}
                className="w-72 flex-shrink-0 bg-[#fbfbfa] dark:bg-[#1f1f1f] rounded-lg p-2.5 border border-[#ececec] dark:border-[#2c2c2c] flex flex-col max-h-[calc(100vh-280px)] shadow-xs"
              >
                {/* Month Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ececec] dark:border-[#2c2c2c]">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#37352f] dark:text-white flex items-center gap-1">
                        <span>🗓️</span>
                        <span>{group.monthName}</span>
                      </span>
                      <span className="text-[10px] bg-[#efefef] dark:bg-[#2a2a2a] text-[#787774] dark:text-[#909090] font-mono px-1 rounded">
                        {group.count}
                      </span>
                    </div>
                    {group.totalReach > 0 && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {formatNumber(group.totalReach)} reach total
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onAddNewPostWithStatus && onAddNewPostWithStatus('idea', defaultDate)}
                    className="p-0.5 text-[#787774] hover:text-[#37352f] dark:hover:text-white rounded hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] transition cursor-pointer"
                    title={`Tambah konten untuk ${group.monthName}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                  {group.items.map((post: PostItem) => renderCard(post))}

                  {group.items.length === 0 && (
                    <div className="py-6 text-center text-xs text-[#787774] border border-dashed border-[#ececec] dark:border-[#2f2f2f] rounded">
                      Belum ada konten bulan ini
                    </div>
                  )}
                </div>

                {/* Add Card to Month Column */}
                <button
                  onClick={() => onAddNewPostWithStatus && onAddNewPostWithStatus('idea', defaultDate)}
                  className="mt-2 w-full flex items-center justify-center gap-1 py-1 text-xs text-[#787774] hover:text-[#37352f] dark:hover:text-white hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] rounded transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah di {group.monthName.split(' ')[0]}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

