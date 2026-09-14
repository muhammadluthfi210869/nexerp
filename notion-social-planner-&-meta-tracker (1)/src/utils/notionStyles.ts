import { SocialPlatform, ContentType, PostStatus, ContentPillar } from '../types';

export const platformConfig: Record<SocialPlatform, { name: string; bg: string; text: string; border: string; icon: string }> = {
  instagram: {
    name: 'Instagram',
    bg: 'bg-[#fbe8f2] dark:bg-pink-950/40',
    text: 'text-[#c13584] dark:text-pink-300',
    border: 'border-[#f4c8df] dark:border-pink-900/60',
    icon: '📸',
  },
  facebook: {
    name: 'Facebook',
    bg: 'bg-[#e7f0fa] dark:bg-blue-950/40',
    text: 'text-[#1877f2] dark:text-blue-300',
    border: 'border-[#c5ddf7] dark:border-blue-900/60',
    icon: '👤',
  },
  tiktok: {
    name: 'TikTok',
    bg: 'bg-[#f0f0f0] dark:bg-zinc-800',
    text: 'text-[#111111] dark:text-zinc-100',
    border: 'border-[#d8d8d8] dark:border-zinc-700',
    icon: '🎵',
  },
  threads: {
    name: 'Threads',
    bg: 'bg-[#f4f4f4] dark:bg-neutral-800',
    text: 'text-[#222222] dark:text-neutral-200',
    border: 'border-[#dcdcdc] dark:border-neutral-700',
    icon: '🧵',
  },
  youtube: {
    name: 'YouTube',
    bg: 'bg-[#fcebeb] dark:bg-red-950/40',
    text: 'text-[#e62117] dark:text-red-300',
    border: 'border-[#f7c1c1] dark:border-red-900/60',
    icon: '▶️',
  },
  linkedin: {
    name: 'LinkedIn',
    bg: 'bg-[#e6f3fa] dark:bg-sky-950/40',
    text: 'text-[#0a66c2] dark:text-sky-300',
    border: 'border-[#c0e0f5] dark:border-sky-900/60',
    icon: '💼',
  },
};

export const statusConfig: Record<PostStatus, { name: string; bg: string; text: string; dotColor: string }> = {
  idea: {
    name: '💡 Idea',
    bg: 'bg-[#efefef] dark:bg-zinc-800',
    text: 'text-[#787774] dark:text-zinc-300',
    dotColor: 'bg-[#9b9a97]',
  },
  scripting: {
    name: '✍️ Scripting',
    bg: 'bg-[#fdecc8] dark:bg-amber-950/40',
    text: 'text-[#965e00] dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  review: {
    name: '👀 Review',
    bg: 'bg-[#eae4f8] dark:bg-purple-950/40',
    text: 'text-[#5b38a7] dark:text-purple-300',
    dotColor: 'bg-purple-500',
  },
  scheduled: {
    name: '⏰ Scheduled',
    bg: 'bg-[#e7f0fa] dark:bg-blue-950/40',
    text: 'text-[#1877f2] dark:text-blue-300',
    dotColor: 'bg-blue-500',
  },
  published: {
    name: '✅ Published',
    bg: 'bg-[#d3f4e2] dark:bg-emerald-950/40',
    text: 'text-[#1e6041] dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  archived: {
    name: '📦 Archived',
    bg: 'bg-[#e3e2de] dark:bg-zinc-800',
    text: 'text-[#5a5854] dark:text-zinc-400',
    dotColor: 'bg-zinc-400',
  },
};

export const pillarConfig: Record<ContentPillar, { name: string; bg: string; text: string }> = {
  'Educational': { name: 'Educational', bg: 'bg-[#e8edf9] dark:bg-blue-950/40', text: 'text-[#2e5aac] dark:text-blue-300' },
  'Promotional': { name: 'Promotional', bg: 'bg-[#faede5] dark:bg-orange-950/40', text: 'text-[#b8561b] dark:text-orange-300' },
  'Behind The Scenes': { name: 'Behind The Scenes', bg: 'bg-[#f3eaf8] dark:bg-purple-950/40', text: 'text-[#743896] dark:text-purple-300' },
  'Entertainment': { name: 'Entertainment', bg: 'bg-[#fbe8f2] dark:bg-pink-950/40', text: 'text-[#b83377] dark:text-pink-300' },
  'Community': { name: 'Community', bg: 'bg-[#e4f5ed] dark:bg-emerald-950/40', text: 'text-[#1e6b45] dark:text-emerald-300' },
  'Product Highlight': { name: 'Product Highlight', bg: 'bg-[#ebe8f8] dark:bg-indigo-950/40', text: 'text-[#4b3db2] dark:text-indigo-300' },
  'Tips & Tricks': { name: 'Tips & Tricks', bg: 'bg-[#e4f4f4] dark:bg-teal-950/40', text: 'text-[#1d7575] dark:text-teal-300' },
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
