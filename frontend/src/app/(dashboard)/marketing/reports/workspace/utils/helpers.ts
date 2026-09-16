import { TaskPriority, TaskStatus, PostStatus } from '../types';

export function calculateDaysLeft(dueDateStr: string): { text: string; isLate: boolean; isToday: boolean; days: number } {
  if (!dueDateStr) return { text: '-', isLate: false, isToday: false, days: 0 };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDateStr + 'T00:00:00');
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return { text: 'Today', isLate: false, isToday: true, days: 0 };
  } else if (diffDays > 0) {
    return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} left`, isLate: false, isToday: false, days: diffDays };
  } else {
    const lateDays = Math.abs(diffDays);
    return { text: `${lateDays} day${lateDays > 1 ? 's' : ''} late`, isLate: true, isToday: false, days: diffDays };
  }
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  } catch {
    return dateStr;
  }
}

export function getStatusBadgeClass(status: TaskStatus | PostStatus): string {
  switch (status) {
    case 'Completed':
    case 'Published':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'In Progress':
    case 'Production':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Review':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Late':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Brief':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Draft':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Planning':
    case 'Pending':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getPriorityBadgeClass(priority: TaskPriority): string {
  switch (priority) {
    case 'High':
      return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'Medium':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'Low':
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  const val = Number(num);
  if (isNaN(val) || !isFinite(val)) return '0';
  return new Intl.NumberFormat('id-ID').format(val);
}

export function getPreviousMonth(monthYear: string): string {
  if (!monthYear) return '';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const parts = monthYear.trim().split(' ');
  if (parts.length < 2) return '';
  const monthName = parts[0];
  const year = parseInt(parts[1], 10);
  const idx = months.indexOf(monthName);
  if (idx > 0) {
    return `${months[idx - 1]} ${year}`;
  } else if (idx === 0) {
    return `Desember ${year - 1}`;
  }
  return '';
}

export function calcComparison(current: number | undefined | null, previous: number | undefined | null): {
  diff: number;
  percent: number;
  isPositive: boolean;
  isNegative: boolean;
  isNeutral: boolean;
  formattedDiff: string;
} {
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;
  const diff = curr - prev;
  let percent = 0;
  if (prev !== 0) {
    percent = Number(((diff / Math.abs(prev)) * 100).toFixed(1));
  } else if (curr > 0) {
    percent = 100;
  }

  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const isNeutral = diff === 0;

  const formattedDiff = isPositive
    ? `+${formatNumber(diff)} (+${percent}%)`
    : isNegative
    ? `${formatNumber(diff)} (${percent}%)`
    : `0 (0%)`;

  return {
    diff,
    percent,
    isPositive,
    isNegative,
    isNeutral,
    formattedDiff
  };
}

const INDO_MONTHS: Record<string, number> = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

export function parsePeriodDates(monthYear: string): { periodStart: string; periodEnd: string } {
  if (!monthYear) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
    return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
  }
  const parts = monthYear.trim().split(/\s+/);
  if (parts.length >= 2) {
    const monthName = parts[0].toLowerCase();
    const year = parseInt(parts[1], 10) || new Date().getFullYear();
    const monthIndex = INDO_MONTHS[monthName] ?? new Date().getMonth();
    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    };
  }
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
  return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

export function getWeekDates(
  monthYear: string,
  weekNumber: number
): { weekStart: string; weekEnd: string } {
  const parts = (monthYear || '').trim().split(/\s+/);
  const now = new Date();
  const year = parts.length >= 2 ? parseInt(parts[1], 10) || now.getFullYear() : now.getFullYear();
  const monthName = parts.length >= 1 ? parts[0].toLowerCase() : '';
  const monthIndex = INDO_MONTHS[monthName] ?? now.getMonth();

  const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getDate();

  let startDay = 1;
  let endDay = 7;
  if (weekNumber === 2) {
    startDay = 8;
    endDay = 14;
  } else if (weekNumber === 3) {
    startDay = 15;
    endDay = 21;
  } else if (weekNumber === 4) {
    startDay = 22;
    endDay = 28;
  } else if (weekNumber >= 5) {
    startDay = 29;
    endDay = lastDayOfMonth;
  }

  const start = new Date(Date.UTC(year, monthIndex, Math.min(startDay, lastDayOfMonth), 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex, Math.min(endDay, lastDayOfMonth), 23, 59, 59, 999));

  return {
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
  };
}
