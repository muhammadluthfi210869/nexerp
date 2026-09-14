import React, { useState } from 'react';
import { 
  Clock, 
  Eye, 
  Flame, 
  Heart, 
  Bookmark, 
  MessageCircle, 
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { PostItem } from '../../types';
import { 
  platformConfig, 
  statusConfig, 
  pillarConfig, 
  contentTypeConfig, 
  formatNumber, 
  formatDateIndonesian,
  groupPostsByMonth 
} from '../../utils/notionStyles';

interface GalleryViewProps {
  posts: PostItem[];
  groupByMonth?: boolean;
  onOpenPost: (post: PostItem) => void;
  onAddNewPost: (initialDate?: string) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  posts,
  groupByMonth = true,
  onOpenPost,
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

  const renderCard = (post: PostItem) => {
    const platform = platformConfig[post.platform];
    const status = statusConfig[post.status];
    const pillar = pillarConfig[post.pillar];
    const contentType = contentTypeConfig[post.contentType];

    return (
      <div
        key={post.id}
        onClick={() => onOpenPost(post)}
        className="group bg-white dark:bg-[#202020] rounded-xl border border-[#e9e8e4] dark:border-[#2f2f2f] overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer flex flex-col"
      >
        {/* Media Card Banner */}
        <div className="h-44 w-full relative bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
              <span className="text-3xl">📝</span>
              <span className="text-xs">No Cover</span>
            </div>
          )}

          {/* Floating Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-md shadow-xs ${platform.bg} ${platform.text}`}>
              {platform.icon} {platform.name}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-md shadow-xs ${status.bg} ${status.text}`}>
              {status.name}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                {contentType.icon} {contentType.name}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pillar.bg} ${pillar.text}`}>
                {pillar.name}
              </span>
            </div>

            <h3 className="text-xs font-semibold text-[#37352f] dark:text-[#f0f0f0] line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
              {post.title}
            </h3>

            {post.caption && (
              <p className="text-[11px] text-[#787774] dark:text-[#909090] line-clamp-2 mt-1.5 leading-relaxed">
                {post.caption}
              </p>
            )}
          </div>

          {/* Performance & Creator Footer */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-zinc-400 font-mono text-[10px]">
              <Clock className="w-3 h-3" />
              <span>{formatDateIndonesian(post.scheduledDate)}</span>
            </div>

            {post.performance?.reach ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[10px]">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(post.performance.reach)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="truncate max-w-[80px]">{post.author.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-12 pt-2">
      {groupByMonth && monthGroups.length > 0 ? (
        <div className="space-y-8">
          {monthGroups.map((group) => {
            const isCollapsed = collapsedMonths[group.monthKey];
            const defaultAddDate = `${group.monthKey}-15T10:00`;

            return (
              <div key={group.monthKey} className="space-y-3">
                {/* Month Section Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#ececec] dark:border-[#2f2f2f]">
                  <div 
                    onClick={() => toggleMonth(group.monthKey)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition select-none"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-[#787774]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#787774]" />
                    )}
                    <h3 className="font-semibold text-sm text-[#37352f] dark:text-white flex items-center gap-1.5">
                      <span>🗓️</span>
                      <span>{group.monthName}</span>
                    </h3>
                    <span className="text-xs font-mono bg-[#efefef] dark:bg-[#2a2a2a] text-[#787774] dark:text-[#909090] px-1.5 py-0.2 rounded">
                      {group.count} konten
                    </span>
                    {group.totalReach > 0 && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono hidden sm:inline-block">
                        • {formatNumber(group.totalReach)} reach
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onAddNewPost(defaultAddDate)}
                    className="flex items-center gap-1 text-xs text-[#787774] hover:text-[#37352f] dark:hover:text-white px-2.5 py-1 rounded hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah di {group.monthName.split(' ')[0]}</span>
                  </button>
                </div>

                {/* Grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {group.items.map((post: PostItem) => renderCard(post))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {posts.map((post) => renderCard(post))}

          {/* Add Card in Gallery */}
          <div
            onClick={() => onAddNewPost()}
            className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl min-h-[260px] flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition p-6 text-center"
          >
            <Plus className="w-8 h-8" />
            <span className="text-xs font-semibold">Buat Kartu Konten Baru</span>
          </div>
        </div>
      )}
    </div>
  );
};

