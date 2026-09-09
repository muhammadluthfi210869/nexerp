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
        className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-400 transition cursor-pointer flex flex-col"
      >
        {/* Media Card Banner */}
        <div className="h-44 w-full relative bg-slate-100 overflow-hidden">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="text-3xl">📝</span>
              <span className="text-[11px] font-medium">No Cover</span>
            </div>
          )}

          {/* Floating Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-2xs border ${platform.bg} ${platform.text} ${platform.border}`}>
              {platform.icon} {platform.name}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-2xs border ${status.bg} ${status.text} ${status.border}`}>
              {status.name}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md font-semibold">
                {contentType.icon} {contentType.name}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${pillar.bg} ${pillar.text} ${pillar.border}`}>
                {pillar.name}
              </span>
            </div>

            <h3 className="text-[13px] font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition leading-snug">
              {post.title}
            </h3>
          </div>

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
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-4 h-4 rounded-full object-cover border border-slate-200"
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
        <div className="space-y-6">
          {monthGroups.map((group) => {
            const isCollapsed = collapsedMonths[group.monthKey];
            const defaultAddDate = `${group.monthKey}-15T10:00`;

            return (
              <div key={group.monthKey} className="space-y-3">
                {/* Month Section Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <div 
                    onClick={() => toggleMonth(group.monthKey)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition select-none"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                    <h3 className="font-bold text-[13px] text-slate-900 flex items-center gap-1.5">
                      <span>🗓️</span>
                      <span>{group.monthName}</span>
                    </h3>
                    <span className="text-[10px] font-mono bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {group.count} konten
                    </span>
                    {group.totalReach > 0 && (
                      <span className="text-[11px] text-emerald-700 font-mono font-bold hidden sm:inline-block">
                        • {formatNumber(group.totalReach)} reach
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onAddNewPost(defaultAddDate)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer border-none bg-transparent"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah di {group.monthName.split(' ')[0]}</span>
                  </button>
                </div>

                {/* Grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {group.items.map((post: PostItem) => renderCard(post))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post) => renderCard(post))}

          {/* Add Card in Gallery */}
          <div
            onClick={() => onAddNewPost()}
            className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/50 rounded-xl min-h-[260px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 cursor-pointer transition p-6 text-center shadow-2xs"
          >
            <Plus className="w-8 h-8" />
            <span className="text-[12px] font-semibold">Buat Kartu Konten Baru</span>
          </div>
        </div>
      )}
    </div>
  );
}
