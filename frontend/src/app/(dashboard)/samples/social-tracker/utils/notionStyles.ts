import { SocialPlatform, ContentType, PostStatus, ContentPillar } from '../types';

export const platformConfig: Record<SocialPlatform, { name: string; bg: string; text: string; border: string; icon: string }> = {
  instagram: {
    name: 'Instagram',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: '📸',
  },
  facebook: {
    name: 'Facebook',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: '👤',
  },
  tiktok: {
    name: 'TikTok',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
    icon: '🎵',
  },
  threads: {
    name: 'Threads',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
    icon: '🧵',
  },
  youtube: {
    name: 'YouTube',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: '▶️',
  },
  linkedin: {
    name: 'LinkedIn',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: '💼',
  },
};

export const statusConfig: Record<PostStatus, { name: string; bg: string; text: string; border: string; dotColor: string }> = {
  idea: {
    name: '💡 Idea',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
  scripting: {
    name: '✍️ Scripting',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  review: {
    name: '👀 Review',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dotColor: 'bg-purple-500',
  },
  scheduled: {
    name: '⏰ Scheduled',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  published: {
    name: '✅ Published',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  archived: {
    name: '📦 Archived',
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
};

export const pillarConfig: Record<ContentPillar, { name: string; bg: string; text: string; border: string }> = {
  'Educational': { name: 'Educational', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Promotional': { name: 'Promotional', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Behind The Scenes': { name: 'Behind The Scenes', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Entertainment': { name: 'Entertainment', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Community': { name: 'Community', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Product Highlight': { name: 'Product Highlight', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Tips & Tricks': { name: 'Tips & Tricks', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

export const contentTypeConfig: Record<ContentType, { name: string; icon: string }> = {
  reel: { name: 'Reels / Video', icon: '🎬' },
  carousel: { name: 'Carousel', icon: '📑' },
  single_post: { name: 'Single Post', icon: '🖼️' },
  story: { name: 'Story', icon: '⚡' },
  video: { name: 'Long Video', icon: '🎥' },
  live: { name: 'Live Stream', icon: '🔴' },
};

export function formatNumber(num?: number): string {
  if (num === undefined || num === null) return '-';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toLocaleString('id-ID');
}

export function formatDateIndonesian(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getMonthKey(dateString: string): string {
  if (!dateString) return 'unspecified';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'unspecified';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch {
    return 'unspecified';
  }
}

export function getMonthName(monthKey: string): string {
  if (!monthKey || monthKey === 'unspecified' || monthKey === 'all') return 'Semua Bulan';
  const [yearStr, monthStr] = monthKey.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const mIndex = parseInt(monthStr, 10) - 1;
  if (mIndex >= 0 && mIndex < 12) {
    return `${monthNames[mIndex]} ${yearStr}`;
  }
  return monthKey;
}

export interface MonthGroupSummary<T> {
  monthKey: string;
  monthName: string;
  items: T[];
  count: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  publishedCount: number;
  scheduledCount: number;
  ideasCount: number;
}

export function groupPostsByMonth(posts: { scheduledDate: string; performance?: { reach?: number; impressions?: number; likes?: number; comments?: number; shares?: number; saves?: number }; status: string }[]): MonthGroupSummary<any>[] {
  const groups: Record<string, MonthGroupSummary<any>> = {};

  posts.forEach((post) => {
    const key = getMonthKey(post.scheduledDate);
    if (!groups[key]) {
      groups[key] = {
        monthKey: key,
        monthName: getMonthName(key),
        items: [],
        count: 0,
        totalReach: 0,
        totalImpressions: 0,
        totalEngagement: 0,
        publishedCount: 0,
        scheduledCount: 0,
        ideasCount: 0,
      };
    }
    groups[key].items.push(post);
    groups[key].count += 1;
    if (post.performance?.reach) groups[key].totalReach += post.performance.reach;
    if (post.performance?.impressions) groups[key].totalImpressions += post.performance.impressions;
    const eng = (post.performance?.likes || 0) + (post.performance?.comments || 0) + (post.performance?.shares || 0) + (post.performance?.saves || 0);
    groups[key].totalEngagement += eng;

    if (post.status === 'published') groups[key].publishedCount += 1;
    else if (post.status === 'scheduled') groups[key].scheduledCount += 1;
    else if (post.status === 'idea' || post.status === 'scripting' || post.status === 'review') groups[key].ideasCount += 1;
  });

  // Sort groups chronologically desc (newest month first)
  return Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}
