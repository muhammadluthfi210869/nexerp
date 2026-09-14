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
      <tr
        key={post.id}
        className="hover:bg-[#fbfbfa] dark:hover:bg-[#202020] transition cursor-pointer group"
        onClick={() => onOpenPost(post)}
      >
        {/* Title & Preview */}
        <td className="py-2.5 px-3 font-medium text-[#37352f] dark:text-white">
          <div className="flex items-center gap-2">
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt="Thumbnail"
                className="w-6 h-6 rounded object-cover flex-shrink-0 border border-[#ececec] dark:border-[#2f2f2f]"
              />
            ) : (
              <span className="text-gray-400 text-sm">📄</span>
            )}
            <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
              {post.title}
            </span>
          </div>
        </td>

        {/* Platform */}
        <td className="py-2.5 px-3">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${platform.bg} ${platform.text} ${platform.border}`}>
            <span>{platform.icon}</span>
            <span>{platform.name}</span>
          </span>
        </td>

        {/* Format */}
        <td className="py-2.5 px-3 text-[#787774] dark:text-[#909090] text-xs">
          <span className="inline-flex items-center gap-1 bg-[#efefef] dark:bg-[#2a2a2a] px-1.5 py-0.5 rounded text-[11px] text-[#37352f] dark:text-[#d4d4d4]">
            <span>{contentType.icon}</span>
            <span>{contentType.name}</span>
          </span>
        </td>

        {/* Status Dropdown */}
        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
          <select
            value={post.status}
            onChange={(e) => onUpdateStatus(post.id, e.target.value as PostStatus)}
            className={`text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer border-0 outline-none ${status.bg} ${status.text}`}
          >
            <option value="idea">💡 Idea</option>
            <option value="scripting">✍️ Scripting</option>
            <option value="review">👀 Review</option>
            <option value="scheduled">⏰ Scheduled</option>
            <option value="published">✅ Published</option>
            <option value="archived">📦 Archived</option>
          </select>
        </td>

        {/* Date */}
        <td className="py-2.5 px-3 text-[#787774] dark:text-[#909090] font-mono text-xs">
          {formatDateIndonesian(post.scheduledDate)}
        </td>

        {/* Pillar */}
        <td className="py-2.5 px-3">
          <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${pillar.bg} ${pillar.text}`}>
            {pillar.name}
          </span>
        </td>

        {/* Reach */}
        <td className="py-2.5 px-3 font-mono text-xs text-[#37352f] dark:text-white">
          {post.performance?.reach ? (
            formatNumber(post.performance.reach)
          ) : (
            <span className="text-[#a0a0a0]">-</span>
          )}
        </td>

        {/* Engagement */}
        <td className="py-2.5 px-3 font-mono text-xs">
          {post.performance?.engagementRate ? (
            <span className="text-[#37352f] dark:text-white">
              {formatNumber(post.performance.likes + post.performance.comments)}{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">({post.performance.engagementRate}%)</span>
            </span>
          ) : (
            <span className="text-[#a0a0a0]">-</span>
          )}
        </td>

        {/* Author */}
        <td className="py-2.5 px-3 text-xs text-[#787774] dark:text-[#909090]">
          <div className="flex items-center gap-1.5">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-4 h-4 rounded-full object-cover"
            />
            <span className="truncate">{post.author.name}</span>
          </div>
        </td>

        {/* Arrow */}
        <td className="py-2.5 px-2 text-right">
          <ChevronRight className="w-3.5 h-3.5 text-[#a0a0a0] group-hover:text-[#37352f] dark:group-hover:text-white transition" />
        </td>
      </tr>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-12 font-sans">
      <table className="w-full text-left border-collapse text-sm">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-[#ececec] dark:border-[#2f2f2f] text-[#787774] dark:text-[#909090] text-[12px] font-normal sticky top-0 bg-white dark:bg-[#191919] z-10">
            <th className="py-2.5 px-3 font-normal min-w-[280px]">Content Title</th>
            <th className="py-2.5 px-3 font-normal min-w-[130px]">Platform</th>
            <th className="py-2.5 px-3 font-normal min-w-[110px]">Format</th>
            <th className="py-2.5 px-3 font-normal min-w-[130px]">Status</th>
            <th className="py-2.5 px-3 font-normal min-w-[140px]">Date</th>
            <th className="py-2.5 px-3 font-normal min-w-[130px]">Pillar</th>
            <th className="py-2.5 px-3 font-normal min-w-[110px]">Reach</th>
            <th className="py-2.5 px-3 font-normal min-w-[120px]">Engagement</th>
            <th className="py-2.5 px-3 font-normal min-w-[120px]">Author</th>
            <th className="py-2.5 px-2 w-8"></th>
          </tr>
        </thead>

        {/* Grouped by Month */}
        {groupByMonth && monthGroups.length > 0 ? (
          monthGroups.map((group) => {
            const isCollapsed = collapsedMonths[group.monthKey];
            const defaultAddDate = `${group.monthKey}-15T10:00`;

            return (
              <tbody key={group.monthKey} className="divide-y divide-[#ececec] dark:divide-[#252525] border-b border-[#ececec] dark:border-[#2f2f2f]">
                {/* Month Group Header Row */}
                <tr className="bg-[#f7f6f3] dark:bg-[#202020] text-[#37352f] dark:text-white select-none">
                  <td colSpan={10} className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => toggleMonth(group.monthKey)}
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-[#787774]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#787774]" />
                        )}
                        <span className="font-semibold text-xs flex items-center gap-1.5">
                          <span>🗓️</span>
                          <span>{group.monthName}</span>
                        </span>
                        <span className="text-[11px] text-[#787774] dark:text-[#909090] font-mono bg-[#eae8e1] dark:bg-[#2e2e2e] px-1.5 py-0.2 rounded">
                          {group.count} konten
                        </span>

                        {/* Month Micro-Stats Badges */}
                        <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#787774] dark:text-[#909090] ml-3">
                          {group.totalReach > 0 && (
                            <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                              <Eye className="w-3 h-3" />
                              {formatNumber(group.totalReach)} reach
                            </span>
                          )}
                          {group.publishedCount > 0 && (
                            <span className="text-emerald-700 dark:text-emerald-300">
                              • {group.publishedCount} Published
                            </span>
                          )}
                          {group.scheduledCount > 0 && (
                            <span className="text-blue-600 dark:text-blue-400">
                              • {group.scheduledCount} Scheduled
                            </span>
                          )}
                          {group.ideasCount > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
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
                        className="flex items-center gap-1 text-[11px] text-[#787774] hover:text-[#37352f] dark:hover:text-white px-2 py-0.5 rounded hover:bg-[#eae8e1] dark:hover:bg-[#2c2c2c] transition cursor-pointer"
                        title={`Tambah konten baru untuk ${group.monthName}`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah di {group.monthName.split(' ')[0]}</span>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Month Group Items */}
                {!isCollapsed && group.items.map((post: PostItem) => renderPostRow(post))}
              </tbody>
            );
          })
        ) : (
          <tbody className="divide-y divide-[#ececec] dark:divide-[#252525]">
            {posts.map((post) => renderPostRow(post))}
          </tbody>
        )}
      </table>

      {/* Global Add Row Inline button */}
      <button
        onClick={() => onAddNewPost()}
        className="w-full flex items-center gap-2 py-2 px-3 text-xs text-[#787774] dark:text-[#909090] hover:text-[#37352f] dark:hover:text-white hover:bg-[#fbfbfa] dark:hover:bg-[#202020] border-b border-[#ececec] dark:border-[#2f2f2f] transition cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 text-[#787774]" />
        <span>+ Tambah Halaman Baru</span>
      </button>
    </div>
  );
};

