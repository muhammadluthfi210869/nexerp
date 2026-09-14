import React, { useState, useEffect } from 'react';
import { X, Smartphone, Eye, TrendingUp, Sparkles, ArrowUpRight, ArrowDownRight, Check } from 'lucide-react';
import { BrandReport } from '../types';
import { formatNumber, getPreviousMonth, calcComparison } from '../utils/helpers';

interface MonthlyStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  monthYear: string;
  currentReport?: BrandReport;
  previousReport?: BrandReport;
  onSave: (totalStoriesCreated: number, totalStoryViews: number) => void;
}

export const MonthlyStoriesModal: React.FC<MonthlyStoriesModalProps> = ({
  isOpen,
  onClose,
  brandName,
  monthYear,
  currentReport,
  previousReport,
  onSave
}) => {
  const previousMonthLabel = getPreviousMonth(monthYear) || 'Bulan Sebelumnya';

  const [storiesCount, setStoriesCount] = useState<number>(20);
  const [totalViews, setTotalViews] = useState<number>(48100);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialStories = currentReport?.storiesRecap?.totalStoriesCreated 
        ?? currentReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.storiesCount || 0), 0)
        ?? 20;
      const initialViews = currentReport?.storiesRecap?.totalStoryViews 
        ?? currentReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.totalViews || 0), 0)
        ?? 48100;

      setStoriesCount(initialStories);
      setTotalViews(initialViews);
      setIsCopied(false);
    }
  }, [isOpen, currentReport]);

  if (!isOpen) return null;

  // Previous month values for comparison & quick copy
  const prevStories = previousReport?.storiesRecap?.totalStoriesCreated 
    ?? previousReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.storiesCount || 0), 0)
    ?? 0;
  const prevViews = previousReport?.storiesRecap?.totalStoryViews 
    ?? previousReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.totalViews || 0), 0)
    ?? 0;
  const prevAvg = prevStories > 0 ? Math.round(prevViews / prevStories) : (previousReport?.storiesRecap?.avgViewsPerStory || 0);

  // Live calculation
  const calculatedAvgViews = storiesCount > 0 ? Math.round(totalViews / storiesCount) : 0;

  // Live comparisons
  const storiesCmp = calcComparison(storiesCount, prevStories);
  const viewsCmp = calcComparison(totalViews, prevViews);
  const avgCmp = calcComparison(calculatedAvgViews, prevAvg);

  const handleCopyFromPrevious = () => {
    if (prevStories > 0 || prevViews > 0) {
      setStoriesCount(prevStories);
      setTotalViews(prevViews);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(Number(storiesCount), Number(totalViews));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50/70 to-indigo-50/40 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                REKAP STORIES BULANAN
              </span>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {brandName} · {monthYear}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Edit Rekap Stories ({monthYear})
            </h2>
            <p className="text-xs text-slate-500">
              Input manual berapa stories yang dibuat dan total kuantitas views bulan ini.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PREVIOUS MONTH COMPARISON CARD & COPY BUTTON */}
        <div className="bg-purple-50/50 p-4 border-b border-purple-100 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Perbandingan Data Bulan Sebelumnya ({previousMonthLabel})</span>
            </span>
            {(prevStories > 0 || prevViews > 0) && (
              <button
                type="button"
                onClick={handleCopyFromPrevious}
                className="text-[10px] font-bold text-purple-700 bg-white hover:bg-purple-100/70 px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs transition cursor-pointer flex items-center gap-1"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                <span>{isCopied ? 'Tersalin!' : `Salin Data ${previousMonthLabel}`}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-purple-100 shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Stories Dibuat</span>
              <strong className="text-slate-800 text-xs">{formatNumber(prevStories)} Stories</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Total Views</span>
              <strong className="text-slate-800 text-xs">{formatNumber(prevViews)} Views</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Avg / Story</span>
              <strong className="text-slate-800 text-xs">~{formatNumber(prevAvg)}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* FIELD 1: BERAPA STORIES DIBUAT BULAN INI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Berapa Stories yang Dibuat dalam Bulan Ini?</span>
              </label>
              {prevStories > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  storiesCmp.isPositive ? 'bg-emerald-100/80 text-emerald-800' : storiesCmp.isNegative ? 'bg-rose-100/80 text-rose-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {storiesCmp.isPositive && <ArrowUpRight className="w-3 h-3" />}
                  {storiesCmp.isNegative && <ArrowDownRight className="w-3 h-3" />}
                  {storiesCmp.formattedDiff} vs {previousMonthLabel}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                required
                value={storiesCount}
                onChange={e => setStoriesCount(Math.max(0, Number(e.target.value)))}
                placeholder="Contoh: 20"
                className="w-full px-3.5 py-2.5 bg-purple-50/30 border border-purple-300 text-purple-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-black text-base"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-purple-700 text-xs pointer-events-none">
                Stories
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total jumlah story Instagram/TikTok yang diposting tim pada periode {monthYear}.</p>
          </div>

          {/* FIELD 2: TOTAL KUANTITAS VIEWS STORIES */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Total Kuantitas Views Stories Bulan Ini</span>
              </label>
              {prevViews > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  viewsCmp.isPositive ? 'bg-emerald-100/80 text-emerald-800' : viewsCmp.isNegative ? 'bg-rose-100/80 text-rose-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {viewsCmp.isPositive && <ArrowUpRight className="w-3 h-3" />}
                  {viewsCmp.isNegative && <ArrowDownRight className="w-3 h-3" />}
                  {viewsCmp.formattedDiff} vs {previousMonthLabel}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                required
                value={totalViews}
                onChange={e => setTotalViews(Math.max(0, Number(e.target.value)))}
                placeholder="Contoh: 48100"
                className="w-full px-3.5 py-2.5 bg-blue-50/30 border border-blue-300 text-blue-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 font-black text-base"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-blue-700 text-xs pointer-events-none">
                Views
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total penonton kumulatif dari seluruh stories pada bulan {monthYear}.</p>
          </div>

          {/* FIELD 3: AVERAGE VIEWS / STORY (AUTOMATICALLY CALCULATED) */}
          <div className="p-4 bg-gradient-to-br from-emerald-50/90 to-teal-50/40 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rata-Rata View per Story (Otomatis)</span>
                </span>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  ~{formatNumber(calculatedAvgViews)} <span className="text-xs font-bold text-emerald-700">views / story</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-700 font-semibold block">Formula:</span>
                <span className="text-[11px] text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {formatNumber(totalViews)} ÷ {storiesCount || 1}
                </span>
              </div>
            </div>
            {prevAvg > 0 && (
              <div className="mt-2.5 pt-2 border-t border-emerald-200/60 text-[11px] flex items-center justify-between text-emerald-800 font-medium">
                <span>Perbandingan vs {previousMonthLabel}:</span>
                <span className={`font-bold inline-flex items-center gap-0.5 ${
                  avgCmp.isPositive ? 'text-emerald-700' : avgCmp.isNegative ? 'text-rose-700' : 'text-slate-700'
                }`}>
                  {avgCmp.isPositive && <ArrowUpRight className="w-3 h-3" />}
                  {avgCmp.isNegative && <ArrowDownRight className="w-3 h-3" />}
                  {avgCmp.formattedDiff}
                </span>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              Simpan Rekap Stories
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
