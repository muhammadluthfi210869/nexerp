import {
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import React, { useState } from 'react';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Calendar as CalendarIcon,
  Eye,
  Flame,
  CheckCircle2,
  Clock
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
  getMonthName,
  getMonthKey
} from '../../utils/notionStyles';

interface TableViewProps {
  posts: PostItem[];
  groupByMonth?: boolean;
  onOpenPost: (post: PostItem) => void;
  onUpdateStatus: (postId: string, newStatus: PostStatus) => void;
  onAddNewPost: (initialDate?: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  posts,
  groupByMonth = true,
  onOpenPost,
  onUpdateStatus,
  onAddNewPost,
}) => {
  // Collapsible state for each month group
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (monthKey: string) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const monthGroups = groupPostsByMonth(posts);

  const renderPostRow = (post: PostItem) => {
    const platform = platformConfig[post.platform];
    const status = statusConfig[post.status];
    const pillar = pillarConfig[post.pillar];
    const contentType = contentTypeConfig[post.contentType];

    return (
      <DnaTableRow
        key={post.id}
        className="h-[42px] hover:bg-slate-50/60 transition-colors cursor-pointer group border-b border-slate-100"
        onClick={() => onOpenPost(post)}
      >
        {/* Title & Preview */}
        <DnaTd className="py-2.5 px-3 font-semibold text-slate-900 text-[12px]">
          <div className="flex items-center gap-2">
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt="Thumbnail"
                className="w-6 h-6 rounded-md object-cover flex-shrink-0 border border-slate-200"
              />
            ) : (
              <span className="text-slate-400 text-sm">📄</span>
            )}
            <span className="group-hover:text-blue-600 truncate">
              {post.title}
            </span>
          </div>
        </DnaTd>

        {/* Platform */}
        <DnaTd className="py-2.5 px-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${platform.bg} ${platform.text} ${platform.border}`}>
            <span>{platform.icon}</span>
            <span>{platform.name}</span>
          </span>
        </DnaTd>

        {/* Format */}
        <DnaTd className="py-2.5 px-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700">
            <span>{contentType.icon}</span>
            <span>{contentType.name}</span>
          </span>
        </DnaTd>

        {/* Status Dropdown */}
        <DnaTd className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
          <select
            value={post.status}
            onChange={(e) => onUpdateStatus(post.id, e.target.value as PostStatus)}
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md cursor-pointer border outline-none ${status.bg} ${status.text} ${status.border}`}
          >
            <option value="idea">💡 Idea</option>
            <option value="scripting">✍️ Scripting</option>
            <option value="review">👀 Review</option>
            <option value="scheduled">⏰ Scheduled</option>
            <option value="published">✅ Published</option>
            <option value="archived">📦 Archived</option>
          </select>
        </DnaTd>

        {/* Date */}
        <DnaTd className="py-2.5 px-3 text-slate-600 tabular-nums text-[11px]">
          {formatDateIndonesian(post.scheduledDate)}
        </DnaTd>

        {/* Pillar */}
        <DnaTd className="py-2.5 px-3">
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${pillar.bg} ${pillar.text} ${pillar.border}`}>
            {pillar.name}
          </span>
        </DnaTd>

        {/* Creative Brief */}
        <DnaTd className="py-2.5 px-3 text-[11px] text-slate-600">
          <div className="max-w-[220px] truncate" title={post.notes || post.caption || post.title}>
            {post.notes ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-amber-600 font-semibold">📝</span>
                <span className="truncate text-slate-800 font-medium">{post.notes}</span>
              </span>
            ) : post.caption ? (
              <span className="text-slate-500 truncate italic">{post.caption.slice(0, 40)}...</span>
            ) : (
              <span className="text-slate-400 italic text-[11px]">+ Tambah brief</span>
            )}
          </div>
        </DnaTd>

        {/* Reach */}
        <DnaTd className="py-2.5 px-3 tabular-nums text-[12px] font-semibold text-slate-800 tabular-nums">
          {post.performance?.reach ? (
            formatNumber(post.performance.reach)
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </DnaTd>

        {/* Engagement */}
        <DnaTd className="py-2.5 px-3 tabular-nums text-[12px] tabular-nums">
          {post.performance?.engagementRate ? (
            <span className="text-slate-800 font-semibold">
              {formatNumber(post.performance.likes + post.performance.comments)}{' '}
              <span className="text-emerald-700 font-semibold">({post.performance.engagementRate}%)</span>
            </span>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </DnaTd>

        {/* Author */}
        <DnaTd className="py-2.5 px-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-4 h-4 rounded-full object-cover"
            />
            <span className="truncate">{post.author.name}</span>
          </div>
        </DnaTd>

        {/* Arrow */}
        <DnaTd className="py-2.5 px-2 text-right">
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
        </DnaTd>
      </DnaTableRow>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden mt-[18px]">
      <div className="overflow-x-auto">
        <DnaTable>
          {/* Table Header */}
          <DnaTableHead>
            <DnaTableRow className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider h-10 sticky top-0 z-10">
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[280px]">Content Title</DnaTh>
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[130px]">Platform</DnaTh>
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[110px]">Format</DnaTh>
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[130px]">Status</DnaTh>
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[140px]">Date</DnaTh>
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[130px]">Pillar</DnaTh>
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[220px]">Creative Brief</DnaTh>
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[110px]">Reach</DnaTh>
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[120px]">Engagement</DnaTh>
              <DnaTh className="py-2.5 px-3 font-semibold min-w-[120px]">Author</DnaTh>
              <DnaTh className="py-2.5 px-2 w-8"></DnaTh>
            </DnaTableRow>
          </DnaTableHead>

          {/* Grouped by Month */}
          {groupByMonth && monthGroups.length > 0 ? (
            monthGroups.map((group) => {
              const isCollapsed = collapsedMonths[group.monthKey];
              const defaultAddDate = `${group.monthKey}-15T10:00`;

              return (
                <DnaTableBody key={group.monthKey}>
                  {/* Month Group Header Row */}
                  <DnaTableRow className="bg-slate-50/90 text-slate-800 select-none border-b border-slate-200">
                    <DnaTd colSpan={11} className="py-2 px-3">
                      <div className="flex items-center justify-between">
                        <div 
                          onClick={() => toggleMonth(group.monthKey)}
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="font-bold text-[12px] text-slate-900 flex items-center gap-1.5">
                            <span>🗓️</span>
                            <span>{group.monthName}</span>
                          </span>
                          <span className="text-[10px] text-slate-600 tabular-nums bg-slate-200/80 px-2 py-0.5 rounded-full font-bold">
                            {group.count} konten
                          </span>

                          {/* Month Micro-Stats Badges */}
                          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-600 ml-3">
                            {group.totalReach > 0 && (
                              <span className="flex items-center gap-1 tabular-nums text-emerald-700 font-bold">
                                <Eye className="w-3 h-3" />
                                {formatNumber(group.totalReach)} reach
                              </span>
                            )}
                            {group.publishedCount > 0 && (
                              <span className="text-emerald-700 font-medium">
                                • {group.publishedCount} Published
                              </span>
                            )}
                            {group.scheduledCount > 0 && (
                              <span className="text-blue-700 font-medium">
                                • {group.scheduledCount} Scheduled
                              </span>
                            )}
                            {group.ideasCount > 0 && (
                              <span className="text-amber-700 font-medium">
                                • {group.ideasCount} Draft/Idea
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddNewPost(defaultAddDate);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer border-none bg-transparent"
                          title={`Tambah konten baru untuk ${group.monthName}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah di {group.monthName.split(' ')[0]}</span>
                        </button>
                      </div>
                    </DnaTd>
                  </DnaTableRow>

                  {/* Month Group Items */}
                  {!isCollapsed && group.items.map((post: PostItem) => renderPostRow(post))}
                </DnaTableBody>
              );
            })
          ) : (
            <DnaTableBody>
              {posts.map((post) => renderPostRow(post))}
            </DnaTableBody>
          )}
        </DnaTable>
      </div>

      {/* Global Add Row Inline button */}
      <button
        onClick={() => onAddNewPost()}
        className="w-full flex items-center gap-2 py-2.5 px-3 text-[12px] font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50/80 transition cursor-pointer border-t border-slate-100 border-none bg-transparent"
      >
        <Plus className="w-3.5 h-3.5 text-slate-500" />
        <span>+ Tambah Konten Baru</span>
      </button>
    </div>
  );
};

