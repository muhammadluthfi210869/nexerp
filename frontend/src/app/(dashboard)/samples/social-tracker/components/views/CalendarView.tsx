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
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden mt-[18px] font-sans">
      {/* Calendar Navigation & Month Statistics Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <span>{monthNames[month]} {year}</span>
            </h3>

            <div className="flex items-center gap-2">
              <span className="font-mono bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {currentMonthPosts.length} konten
              </span>
              {totalMonthReach > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 font-mono text-emerald-700 text-[11px] font-bold">
                  <TrendingUp className="w-3 h-3" />
                  {formatNumber(totalMonthReach)} Reach
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={today}
              className="px-3 py-1 text-[12px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              Hari Ini
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={prevMonth}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer border-none bg-transparent"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer border-none bg-transparent"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Month Switcher Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[12px]">
          <span className="text-slate-500 text-[11px] mr-1 flex-shrink-0 font-medium">Pilih Bulan:</span>
          {availableMonthsList.map((mItem) => {
            const isSelected = currentMonthKey === mItem.key;
            const countInMonth = posts.filter(p => p.scheduledDate.startsWith(mItem.key)).length;

            return (
              <button
                key={mItem.key}
                onClick={() => jumpToMonth(mItem.y, mItem.m)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span>{mItem.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {countInMonth}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 bg-slate-50/75">
        <div>Senin</div>
        <div>Selasa</div>
        <div>Rabu</div>
        <div>Kamis</div>
        <div>Jumat</div>
        <div className="text-blue-600">Sabtu</div>
        <div className="text-rose-600">Minggu</div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 border-l border-t border-slate-200">
        {calendarCells.map((cell, idx) => {
          const cellPosts = getPostsForDate(cell.year, cell.month, cell.day);
          const isToday = cell.year === 2026 && cell.month === 7 && cell.day === 31; // Aug 31, 2026

          const formattedDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}T18:00`;

          return (
            <div
              key={idx}
              className={`min-h-[110px] md:min-h-[130px] p-2 border-r border-b border-slate-200 transition flex flex-col group/day relative ${
                cell.isCurrentMonth
                  ? 'bg-white'
                  : 'bg-slate-50/50 opacity-60'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : cell.isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {cell.day}
                </span>

                {/* Quick Add Button */}
                <button
                  onClick={() => onAddNewPostForDate && onAddNewPostForDate(formattedDateStr)}
                  className="opacity-0 group-hover/day:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition border-none bg-transparent cursor-pointer"
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
                      className={`p-1.5 rounded-md text-[11px] font-medium border transition cursor-pointer hover:scale-[1.02] shadow-2xs ${platform.bg} ${platform.text} ${platform.border}`}
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

