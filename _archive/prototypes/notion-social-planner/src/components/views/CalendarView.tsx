import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Eye,
  Calendar as CalendarIcon,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { PostItem } from '../../types';
import { platformConfig, statusConfig, formatNumber, getMonthKey } from '../../utils/notionStyles';

interface CalendarViewProps {
  posts: PostItem[];
  onOpenPost: (post: PostItem) => void;
  onAddNewPostForDate?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  onOpenPost,
  onAddNewPostForDate,
}) => {
  // Current viewed month state (default to August 2026)
  const [currentDate, setCurrentDate] = useState(new Date('2026-08-31'));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  // Calculate month statistics
  const currentMonthPosts = posts.filter(p => p.scheduledDate.startsWith(currentMonthKey));
  const publishedMonthCount = currentMonthPosts.filter(p => p.status === 'published').length;
  const scheduledMonthCount = currentMonthPosts.filter(p => p.status === 'scheduled').length;
  const totalMonthReach = currentMonthPosts.reduce((acc, p) => acc + (p.performance?.reach || 0), 0);

  // Helper to get first day of month (0 = Sun, 1 = Mon)
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday = 0
  // Adjust so Monday is 0
  const adjustedFirstDay = (firstDayIndex + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpToMonth = (targetYear: number, targetMonthIndex: number) => {
    setCurrentDate(new Date(targetYear, targetMonthIndex, 1));
  };

  const today = () => {
    setCurrentDate(new Date('2026-08-31'));
  };

  // Generate calendar grid days
  const calendarCells = [];

  // Previous month trailing days
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete grid (42 cells = 6 weeks)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  const getPostsForDate = (cellYear: number, cellMonth: number, cellDay: number) => {
    const monthStr = String(cellMonth + 1).padStart(2, '0');
    const dayStr = String(cellDay).padStart(2, '0');
    const datePrefix = `${cellYear}-${monthStr}-${dayStr}`;

    return posts.filter((p) => p.scheduledDate.startsWith(datePrefix));
  };

  const availableMonthsList = [
    { key: '2026-07', label: 'Juli 2026', y: 2026, m: 6 },
    { key: '2026-08', label: 'Agustus 2026', y: 2026, m: 7 },
    { key: '2026-09', label: 'September 2026', y: 2026, m: 8 },
    { key: '2026-10', label: 'Oktober 2026', y: 2026, m: 9 },
  ];

  return (
    <div className="w-full pb-12 pt-1 font-sans">
      {/* Calendar Navigation Bar & Quick Month Selectors */}
      <div className="space-y-3 pb-3 border-b border-[#e9e8e4] dark:border-[#2f2f2f] mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[#37352f] dark:text-[#f0f0f0] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              <span>{monthNames[month]} {year}</span>
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#909090]">
              <span className="font-mono bg-[#efefef] dark:bg-[#2a2a2a] px-2 py-0.5 rounded text-[11px]">
                {currentMonthPosts.length} konten
              </span>
              {totalMonthReach > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                  <TrendingUp className="w-3 h-3" />
                  {formatNumber(totalMonthReach)} Reach
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={today}
              className="px-2.5 py-1 text-xs font-medium bg-[#f7f6f3] dark:bg-[#2a2a2a] border border-[#e9e8e4] dark:border-[#353535] rounded text-zinc-700 dark:text-zinc-300 hover:bg-[#eae8e1] transition cursor-pointer"
            >
              Hari Ini
            </button>

            <div className="flex items-center gap-1 bg-[#efefef] dark:bg-[#252525] p-0.5 rounded-md">
              <button
                onClick={prevMonth}
                className="p-1 rounded hover:bg-white dark:hover:bg-[#333] text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 rounded hover:bg-white dark:hover:bg-[#333] text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Month Switcher Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[#787774] dark:text-[#909090] text-[11px] mr-1 flex-shrink-0">Pilih Bulan:</span>
          {availableMonthsList.map((mItem) => {
            const isSelected = currentMonthKey === mItem.key;
            const countInMonth = posts.filter(p => p.scheduledDate.startsWith(mItem.key)).length;

            return (
              <button
                key={mItem.key}
                onClick={() => jumpToMonth(mItem.y, mItem.m)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#37352f] text-white dark:bg-white dark:text-[#202020] shadow-xs'
                    : 'bg-[#f7f6f3] dark:bg-[#252525] text-[#787774] hover:text-[#37352f] dark:hover:text-white border border-[#ececec] dark:border-[#333]'
                }`}
              >
                <span>{mItem.label}</span>
                <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-white/20 dark:bg-black/20' : 'bg-[#e5e4df] dark:bg-[#383838]'}`}>
                  {countInMonth}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-[#e9e8e4] dark:border-[#2f2f2f] text-center text-xs font-semibold text-[#787774] dark:text-[#909090] py-2 bg-[#fcfbf9] dark:bg-[#191919]">
        <div>Senin</div>
        <div>Selasa</div>
        <div>Rabu</div>
        <div>Kamis</div>
        <div>Jumat</div>
        <div className="text-blue-600 dark:text-blue-400">Sabtu</div>
        <div className="text-red-500">Minggu</div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 border-l border-t border-[#e9e8e4] dark:border-[#2f2f2f]">
        {calendarCells.map((cell, idx) => {
          const cellPosts = getPostsForDate(cell.year, cell.month, cell.day);
          const isToday = cell.year === 2026 && cell.month === 7 && cell.day === 31; // Aug 31, 2026

          const formattedDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}T18:00`;

          return (
            <div
              key={idx}
              className={`min-h-[110px] md:min-h-[130px] p-1.5 border-r border-b border-[#e9e8e4] dark:border-[#2f2f2f] transition flex flex-col group/day relative ${
                cell.isCurrentMonth
                  ? 'bg-white dark:bg-[#1e1e1e]'
                  : 'bg-[#faf9f6] dark:bg-[#161616] opacity-60'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    isToday
                      ? 'bg-red-500 text-white shadow-xs'
                      : cell.isCurrentMonth
                      ? 'text-[#37352f] dark:text-[#d4d4d4]'
                      : 'text-zinc-400'
                  }`}
                >
                  {cell.day}
                </span>

                {/* Quick Add Button */}
                <button
                  onClick={() => onAddNewPostForDate && onAddNewPostForDate(formattedDateStr)}
                  className="opacity-0 group-hover/day:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                  title="Tambah konten di tanggal ini"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day's Scheduled Posts */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {cellPosts.map((post) => {
                  const platform = platformConfig[post.platform];
                  const status = statusConfig[post.status];

                  return (
                    <div
                      key={post.id}
                      onClick={() => onOpenPost(post)}
                      className={`p-1.5 rounded text-[11px] font-medium border transition cursor-pointer hover:scale-[1.02] shadow-2xs ${platform.bg} ${platform.text} ${platform.border}`}
                      title={`${post.title} (${status.name})`}
                    >
                      <div className="flex items-center gap-1 font-semibold truncate">
                        <span>{platform.icon}</span>
                        <span className="truncate">{post.title}</span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] mt-0.5 opacity-80">
                        <span>{post.scheduledDate.split('T')[1] || '18:00'}</span>
                        {post.performance?.reach ? (
                          <span className="font-mono">{formatNumber(post.performance.reach)} reach</span>
                        ) : (
                          <span>{status.name.split(' ')[0]}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

