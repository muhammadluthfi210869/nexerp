import React from 'react';
import { 
  Smartphone, 
  Eye, 
  TrendingUp, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { StoriesMonthlyRecap, BrandReport } from '../types';
import { formatNumber, calcComparison, getPreviousMonth } from '../utils/helpers';

interface StoriesRecapSectionProps {
  brandName: string;
  monthYear: string;
  storiesRecap?: StoriesMonthlyRecap;
  previousReport?: BrandReport;
  onOpenStoriesModal: (brandName: string, monthYear: string) => void;
}

export const StoriesRecapSection: React.FC<StoriesRecapSectionProps> = ({
  brandName,
  monthYear,
  storiesRecap,
  previousReport,
  onOpenStoriesModal
}) => {
  const previousMonthLabel = getPreviousMonth(monthYear) || 'Bulan Sebelumnya';

  // Current month stats
  const totalStories = storiesRecap?.totalStoriesCreated 
    ?? storiesRecap?.dailyStories?.reduce((a, c) => a + (c.storiesCount || 0), 0) 
    ?? 0;

  const totalViews = storiesRecap?.totalStoryViews 
    ?? storiesRecap?.dailyStories?.reduce((a, c) => a + (c.totalViews || 0), 0) 
    ?? 0;

  const avgViews = totalStories > 0 
    ? Math.round(totalViews / totalStories) 
    : (storiesRecap?.avgViewsPerStory || 0);

  // Previous month stats
  const prevTotalStories = previousReport?.storiesRecap?.totalStoriesCreated 
    ?? previousReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.storiesCount || 0), 0) 
    ?? 0;

  const prevTotalViews = previousReport?.storiesRecap?.totalStoryViews 
    ?? previousReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.totalViews || 0), 0) 
    ?? 0;

  const prevAvgViews = prevTotalStories > 0 
    ? Math.round(prevTotalViews / prevTotalStories) 
    : (previousReport?.storiesRecap?.avgViewsPerStory || 0);

  // Comparisons
  const storiesCmp = calcComparison(totalStories, prevTotalStories);
  const viewsCmp = calcComparison(totalViews, prevTotalViews);
  const avgCmp = calcComparison(avgViews, prevAvgViews);

  return (
    <div className="bg-white border border-purple-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-purple-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Rekap Stories Bulanan
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {monthYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Total stories yang dibuat dalam bulan {monthYear}, kuantitas views penonton, dan rata-rata view per story.
            </p>
          </div>
        </div>

        {/* Action Button: Edit Stories Bulan Ini */}
        <button
          onClick={() => onOpenStoriesModal(brandName, monthYear)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3.5 py-2 rounded-xl transition shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Stories Bulan Ini</span>
        </button>
      </div>

      {/* 3 FOCUSED MONTHLY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. STORIES DIBUAT */}
        <div className="bg-gradient-to-br from-purple-50/90 via-purple-50/40 to-white p-4 rounded-xl border border-purple-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-purple-900">
            <span>Stories Dibuat</span>
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950 mt-2">
            {formatNumber(totalStories)} <span className="text-sm font-bold text-purple-700">Stories</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="text-slate-400 font-medium">vs {previousMonthLabel}:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 text-[10px] ${
              storiesCmp.isPositive ? 'bg-emerald-100/80 text-emerald-800' : storiesCmp.isNegative ? 'bg-rose-100/80 text-rose-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {storiesCmp.isPositive && <ArrowUpRight className="w-3 h-3" />}
              {storiesCmp.isNegative && <ArrowDownRight className="w-3 h-3" />}
              {storiesCmp.formattedDiff}
            </span>
          </div>
        </div>

        {/* 2. TOTAL VIEWS STORIES */}
        <div className="bg-gradient-to-br from-blue-50/90 via-blue-50/40 to-white p-4 rounded-xl border border-blue-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-900">
            <span>Total Views Stories</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">
            {formatNumber(totalViews)} <span className="text-sm font-bold text-blue-700">Views</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="text-slate-400 font-medium">vs {previousMonthLabel}:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 text-[10px] ${
              viewsCmp.isPositive ? 'bg-emerald-100/80 text-emerald-800' : viewsCmp.isNegative ? 'bg-rose-100/80 text-rose-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {viewsCmp.isPositive && <ArrowUpRight className="w-3 h-3" />}
              {viewsCmp.isNegative && <ArrowDownRight className="w-3 h-3" />}
              {viewsCmp.formattedDiff}
            </span>
          </div>
        </div>

        {/* 3. AVERAGE VIEWS / STORY */}
        <div className="bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white p-4 rounded-xl border border-emerald-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-900">
            <span>Avg Views / Story</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">
            {formatNumber(avgViews)} <span className="text-xs font-semibold text-emerald-700">views / story</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="text-slate-400 font-medium">vs {previousMonthLabel}:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 text-[10px] ${
              avgCmp.isPositive ? 'bg-emerald-100/80 text-emerald-800' : avgCmp.isNegative ? 'bg-rose-100/80 text-rose-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {avgCmp.isPositive && <ArrowUpRight className="w-3 h-3" />}
              {avgCmp.isNegative && <ArrowDownRight className="w-3 h-3" />}
              {avgCmp.formattedDiff}
            </span>
          </div>
        </div>
      </div>

      {/* MONTHLY REFERENCE & INSIGHT FOOTER STRIP */}
      <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>
            Data bulan sebelumnya ({previousMonthLabel}):{' '}
            <strong className="text-slate-900">{formatNumber(prevTotalStories)} Stories</strong> ·{' '}
            <strong className="text-slate-900">{formatNumber(prevTotalViews)} Views</strong>{' '}
            (~{formatNumber(prevAvgViews)} views/story)
          </span>
        </div>

        <button
          onClick={() => onOpenStoriesModal(brandName, monthYear)}
          className="text-purple-700 hover:text-purple-800 font-bold hover:underline self-start sm:self-auto cursor-pointer"
        >
          Perbarui Angka Stories →
        </button>
      </div>
    </div>
  );
};
