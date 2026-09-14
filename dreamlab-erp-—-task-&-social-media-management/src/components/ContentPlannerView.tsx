import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ListFilter, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  Image as ImageIcon,
  Instagram,
  Youtube,
  Globe,
  Megaphone,
  BarChart3,
  Target
} from 'lucide-react';
import { Brand, SocialPost, PostStatus, PostFormat } from '../types';
import { formatDateIndo, getStatusBadgeClass } from '../utils/helpers';

interface ContentPlannerViewProps {
  brand: Brand;
  posts: SocialPost[];
  initialChannel?: string;
  onOpenAddPostModal: (initialDate?: string) => void;
  onViewPostDetail: (post: SocialPost) => void;
  onUpdatePostStatus: (postId: string, status: PostStatus) => void;
  onUpdatePostProgress: (postId: string, progress: number) => void;
  onNavigateToReporting: (targetTab?: string) => void;
}

export const ContentPlannerView: React.FC<ContentPlannerViewProps> = ({
  brand,
  posts,
  initialChannel,
  onOpenAddPostModal,
  onViewPostDetail,
  onUpdatePostStatus,
  onUpdatePostProgress,
  onNavigateToReporting
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [channelFilter, setChannelFilter] = useState<string>(initialChannel || 'All');
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 is September (0-indexed)

  // Sync channelFilter when initialChannel changes from sidebar navigation
  useEffect(() => {
    if (initialChannel) {
      setChannelFilter(initialChannel);
    }
  }, [initialChannel]);

  // Filter posts for this brand
  const brandPosts = useMemo(() => {
    return posts.filter(p => p.brandId === brand.name || p.brandId === brand.id);
  }, [posts, brand]);

  // Channel breakdown counts
  const channelCounts = useMemo(() => {
    return {
      All: brandPosts.length,
      Instagram: brandPosts.filter(p => !p.platform || p.platform === 'Instagram').length,
      TikTok: brandPosts.filter(p => p.platform === 'TikTok').length,
      YouTube: brandPosts.filter(p => p.platform === 'YouTube').length,
      Website: brandPosts.filter(p => p.platform === 'Website').length,
      'Paid Ads': brandPosts.filter(p => p.platform === 'Paid Ads').length,
    };
  }, [brandPosts]);

  // Filter posts by channel
  const channelFilteredPosts = useMemo(() => {
    if (channelFilter === 'All') return brandPosts;
    if (channelFilter === 'Instagram') {
      return brandPosts.filter(p => !p.platform || p.platform === 'Instagram');
    }
    return brandPosts.filter(p => p.platform === channelFilter);
  }, [brandPosts, channelFilter]);

  // Filter posts by status
  const filteredPosts = useMemo(() => {
    if (statusFilter === 'All') return channelFilteredPosts;
    return channelFilteredPosts.filter(p => p.status === statusFilter);
  }, [channelFilteredPosts, statusFilter]);

  const getReportingTabForChannel = (ch: string) => {
    switch (ch) {
      case 'TikTok': return 'tiktok';
      case 'YouTube': return 'youtube';
      case 'Website': return 'website';
      case 'Paid Ads': return 'ads';
      case 'Instagram': return 'weekly';
      default: return 'all';
    }
  };

  const getPlatformBadge = (platform?: string) => {
    switch (platform) {
      case 'TikTok':
        return { label: 'TikTok', bg: 'bg-slate-900 text-cyan-300 border border-slate-700' };
      case 'YouTube':
        return { label: 'YouTube', bg: 'bg-red-50 text-red-600 border border-red-200' };
      case 'Website':
        return { label: 'Website', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
      case 'Paid Ads':
        return { label: 'Paid Ads', bg: 'bg-amber-50 text-amber-800 border border-amber-200' };
      case 'Instagram':
      default:
        return { label: 'Instagram', bg: 'bg-pink-50 text-pink-700 border border-pink-200' };
    }
  };

  // Calendar calculations for September 2026 (or selected month)
  const daysInMonth = useMemo(() => {
    const days = [];
    const date = new Date(currentYear, currentMonth, 1);
    // Find starting day (Mon=0, Tue=1, ..., Sun=6)
    let startDay = date.getDay() - 1;
    if (startDay === -1) startDay = 6; // Sunday becomes 6

    // Total days in month
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Previous padding
    for (let i = 0; i < startDay; i++) {
      days.push({ dayNumber: null, dateStr: '' });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      days.push({ dayNumber: d, dateStr });
    }

    return days;
  }, [currentYear, currentMonth]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Quick summary counts
  const publishedCount = channelFilteredPosts.filter(p => p.status === 'Published').length;
  const inProgressCount = channelFilteredPosts.filter(p => ['Draft', 'Production', 'Review'].includes(p.status)).length;
  const lateCount = channelFilteredPosts.filter(p => p.status === 'Late').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Brand Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0"
            style={{ backgroundColor: brand.color }}
          >
            {brand.initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{brand.name}</h1>
              {channelFilter !== 'All' && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white shadow-2xs">
                  Planner {channelFilter}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">{brand.handle}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                PIC: {brand.pic}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {brand.note}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct link to this brand's reporting */}
          <button
            onClick={() => onNavigateToReporting(getReportingTabForChannel(channelFilter))}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition shadow-2xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Reporting {channelFilter === 'All' ? 'Brand' : channelFilter}</span>
          </button>
          
          <button
            onClick={() => onOpenAddPostModal()}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Konten</span>
          </button>
        </div>
      </div>

      {/* Toolbar & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Month Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Database / List View</span>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-800">
            {monthNames[currentMonth]} {currentYear}
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
          {['All', 'Planning', 'Brief', 'Draft', 'Production', 'Review', 'Published', 'Late'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition ${
                statusFilter === st 
                  ? 'bg-slate-900 text-white font-semibold' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: MONTH CALENDAR */}
      {viewMode === 'calendar' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2.5">
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
            <div>SUN</div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {daysInMonth.map((item, idx) => {
              if (!item.dayNumber) {
                return (
                  <div key={`empty-${idx}`} className="min-h-[125px] bg-slate-50/50 p-2 opacity-50" />
                );
              }

              // Find posts on this date
              const dayPosts = filteredPosts.filter(p => p.date === item.dateStr);

              return (
                <div
                  key={`day-${item.dateStr}`}
                  onClick={() => onOpenAddPostModal(item.dateStr)}
                  className="min-h-[125px] p-2 hover:bg-blue-50/20 transition-colors cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-slate-500 group-hover:text-blue-600">
                      {item.dayNumber}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddPostModal(item.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-white transition text-[10px]"
                      title="Tambah konten pada tanggal ini"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Post Badges inside cell */}
                  <div className="space-y-1.5 flex-1">
                    {dayPosts.map(post => {
                      const isDone = post.status === 'Published';
                      const isLate = post.status === 'Late';

                      return (
                        <div
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewPostDetail(post);
                          }}
                          className={`p-1.5 rounded-lg border text-left transition-all hover:shadow-xs cursor-pointer ${
                            isDone 
                              ? 'bg-emerald-50/80 border-emerald-200 border-l-3 border-l-emerald-600'
                              : isLate
                              ? 'bg-rose-50/80 border-rose-200 border-l-3 border-l-rose-600'
                              : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="font-bold text-[11px] text-slate-800 line-clamp-1 leading-tight">
                            {post.title}
                          </div>
                          <div className="flex items-center justify-between text-[9px] mt-1 gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className={`px-1 py-0.2 rounded font-bold text-[8px] truncate ${getPlatformBadge(post.platform).bg}`}>
                                {getPlatformBadge(post.platform).label}
                              </span>
                              <span className="text-blue-600 font-semibold truncate">{post.format}</span>
                            </div>
                            <span className={`px-1 rounded shrink-0 font-bold ${
                              isDone ? 'text-emerald-700 bg-emerald-100' : isLate ? 'text-rose-700 bg-rose-100' : 'text-slate-600 bg-slate-200'
                            }`}>
                              {post.status}
                            </span>
                          </div>

                          {post.metrics?.leadsContributed && (
                            <div className="mt-1 text-[8px] font-bold text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded flex items-center gap-1 w-fit">
                              <Target className="w-2.5 h-2.5" />
                              <span>+{post.metrics.leadsContributed} Leads</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: NOTION-STYLE DATABASE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Database Content Planner</h3>
              <p className="text-xs text-slate-400">
                Planning konten terstruktur lengkap dengan hook, visual direction, progress, dan penanggung jawab.
              </p>
            </div>
            <button
              onClick={() => onOpenAddPostModal()}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Post</span>
            </button>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-2">Kanal</th>
                  <th className="py-3 px-2">Content & Hook</th>
                  <th className="py-3 px-2">Format</th>
                  <th className="py-3 px-2">Status Post</th>
                  <th className="py-3 px-2">Progress</th>
                  <th className="py-3 px-2">Assign (PIC)</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada konten ditemukan untuk brand {brand.name}.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map(post => (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                      onClick={() => onViewPostDetail(post)}
                    >
                      <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                        {formatDateIndo(post.date)}
                      </td>

                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${getPlatformBadge(post.platform).bg}`}>
                          {getPlatformBadge(post.platform).label}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {post.title}
                        </div>
                        {post.hook && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                            "{post.hook}"
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {post.format}
                        </span>
                      </td>

                      <td className="py-3 px-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <select
                          value={post.status}
                          onChange={(e) => onUpdatePostStatus(post.id, e.target.value as PostStatus)}
                          className={`text-[10px] font-bold px-2 py-1 rounded border cursor-pointer ${getStatusBadgeClass(post.status)}`}
                        >
                          <option value="Planning">Planning</option>
                          <option value="Brief">Brief</option>
                          <option value="Draft">Draft</option>
                          <option value="Production">Production</option>
                          <option value="Review">Review</option>
                          <option value="Published">Published</option>
                          <option value="Late">Late</option>
                        </select>
                      </td>

                      <td className="py-3 px-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                post.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                              }`} 
                              style={{ width: `${post.progress}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8">
                            {post.progress}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold flex items-center justify-center">
                            {post.pic[0]}
                          </span>
                          {post.pic}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewPostDetail(post);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                        >
                          Lihat Brief
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
