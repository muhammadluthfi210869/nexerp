import React, { useState } from 'react';
import { 
  Calendar, Users, UserPlus, UserMinus, TrendingUp, TrendingDown,
  Heart, MessageCircle, Share2, Bookmark, Eye, Smartphone, Edit3, Plus,
  ArrowUpRight, ArrowDownRight, Sparkles, BarChart2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Brand, BrandReport, WeeklyReportData } from '../types';
import { formatNumber } from '../utils/helpers';
import { WeeklyMetricModal } from './WeeklyMetricModal';

interface WeeklyReportingSectionProps {
  brand: Brand;
  report: BrandReport;
  currentPeriod: string;
  onUpdateWeeklyReports: (updatedReports: WeeklyReportData[]) => void;
}

export const WeeklyReportingSection: React.FC<WeeklyReportingSectionProps> = ({
  brand,
  report,
  currentPeriod,
  onUpdateWeeklyReports
}) => {
  // Default fallback weeks if report.weeklyReports is empty
  const weeklyData: WeeklyReportData[] = (report.weeklyReports && report.weeklyReports.length > 0)
    ? report.weeklyReports
    : (report.weeklyTrends && report.weeklyTrends.length > 0)
      ? report.weeklyTrends.map((wt, idx) => {
          const gained = wt.followersGained || Math.round(report.followersGained / 4);
          const unfoll = wt.followersUnfollowed || Math.round(report.followersUnfollowed / 4);
          const net = gained - unfoll;
          const storiesCt = Math.max(1, Math.round((report.storiesRecap?.totalStoriesCreated || 20) / 4));
          const storyVw = Math.round((report.storiesRecap?.totalStoryViews || 48000) / 4);
          return {
            id: `wr-gen-${idx + 1}`,
            weekNumber: idx + 1,
            weekLabel: wt.week || `Minggu ${idx + 1}`,
            dateRange: idx === 0 ? '1 - 7 Sep 2026' : idx === 1 ? '8 - 14 Sep 2026' : idx === 2 ? '15 - 21 Sep 2026' : '22 - 28 Sep 2026',
            followersGained: gained,
            followersUnfollowed: unfoll,
            netGrowth: net,
            endingFollowers: (report.totalFollowers || 28000) - (3 - idx) * 350,
            views: wt.views || Math.round(report.totalViews / 4),
            reach: wt.reach || Math.round(report.totalReach / 4),
            totalEngagement: wt.engagement || Math.round(report.totalEngagements / 4),
            engagementRate: Number(report.engagementRate || 5.0),
            likes: Math.round((report.totalLikes || 4000) / 4),
            comments: Math.round((report.totalComments || 350) / 4),
            shares: Math.round((report.totalShares || 1200) / 4),
            saves: Math.round((report.totalSaves || 2400) / 4),
            storiesCount: storiesCt,
            totalStoryViews: storyVw,
            avgViewsPerStory: storiesCt > 0 ? Math.round(storyVw / storiesCt) : 0,
            storyReplies: Math.round((storyVw * 0.003)),
            storyCompletionRate: report.storiesRecap?.completionRate || 78
          };
        })
      : [];

  // Active view: 'all' or specific week id
  const [selectedWeekId, setSelectedWeekId] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<WeeklyReportData | null>(null);

  // Summary aggregates for 'all'
  const totals = weeklyData.reduce(
    (acc, curr) => ({
      followersGained: acc.followersGained + (curr.followersGained || 0),
      followersUnfollowed: acc.followersUnfollowed + (curr.followersUnfollowed || 0),
      netGrowth: acc.netGrowth + (curr.netGrowth || 0),
      views: acc.views + (curr.views || 0),
      reach: acc.reach + (curr.reach || 0),
      totalEngagement: acc.totalEngagement + (curr.totalEngagement || 0),
      likes: acc.likes + (curr.likes || 0),
      comments: acc.comments + (curr.comments || 0),
      shares: acc.shares + (curr.shares || 0),
      saves: acc.saves + (curr.saves || 0),
      storiesCount: acc.storiesCount + (curr.storiesCount || 0),
      totalStoryViews: acc.totalStoryViews + (curr.totalStoryViews || 0)
    }),
    {
      followersGained: 0,
      followersUnfollowed: 0,
      netGrowth: 0,
      views: 0,
      reach: 0,
      totalEngagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      storiesCount: 0,
      totalStoryViews: 0
    }
  );

  const activeWeek = weeklyData.find(w => w.id === selectedWeekId) || null;

  const handleOpenEdit = (w: WeeklyReportData) => {
    setEditingWeek(w);
    setModalOpen(true);
  };

  const handleOpenAddNew = () => {
    const nextWeekNum = weeklyData.length + 1;
    setEditingWeek({
      id: `wr-${Date.now()}`,
      weekNumber: nextWeekNum,
      weekLabel: `Minggu ${nextWeekNum}`,
      dateRange: `${22 + (nextWeekNum - 4) * 7} - ${28 + (nextWeekNum - 4) * 7} Sep 2026`,
      followersGained: 400,
      followersUnfollowed: 100,
      netGrowth: 300,
      endingFollowers: report.totalFollowers || 28000,
      views: 50000,
      reach: 35000,
      totalEngagement: 1800,
      engagementRate: 4.8,
      likes: 900,
      comments: 80,
      shares: 250,
      saves: 570,
      storiesCount: 5,
      totalStoryViews: 12000,
      avgViewsPerStory: 2400,
      storyReplies: 35,
      storyCompletionRate: 78
    });
    setModalOpen(true);
  };

  const handleSaveWeek = (savedWeek: WeeklyReportData) => {
    const exists = weeklyData.some(w => w.id === savedWeek.id);
    let updated: WeeklyReportData[];
    if (exists) {
      updated = weeklyData.map(w => (w.id === savedWeek.id ? savedWeek : w));
    } else {
      updated = [...weeklyData, savedWeek];
    }
    // sort by weekNumber
    updated.sort((a, b) => a.weekNumber - b.weekNumber);
    onUpdateWeeklyReports(updated);
    setSelectedWeekId(savedWeek.id);
  };

  return (
    <div id="weekly-reporting-container" className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-6">
      {/* Top Header of Weekly Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight">
              Laporan Mingguan (Weekly Report)
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {currentPeriod}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau pertumbuhan followers mingguan (Followers Baru vs Unfoll), akumulasi engagement, dan performa stories per week.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddNew}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Minggu</span>
          </button>
        </div>
      </div>

      {/* Week Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setSelectedWeekId('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            selectedWeekId === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Semua Minggu (Rekap)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedWeekId === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {weeklyData.length} W
          </span>
        </button>

        {weeklyData.map(w => {
          const isSelected = selectedWeekId === w.id;
          return (
            <button
              key={w.id}
              onClick={() => setSelectedWeekId(w.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <span>{w.weekLabel}</span>
              <span className={`text-[10px] font-semibold opacity-85 ${
                isSelected ? 'text-blue-100' : 'text-slate-500'
              }`}>
                ({w.dateRange})
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                isSelected 
                  ? 'bg-blue-700 text-blue-100' 
                  : w.netGrowth >= 0 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {w.netGrowth >= 0 ? `+${w.netGrowth}` : w.netGrowth}
              </span>
            </button>
          );
        })}
      </div>

      {/* THREE KEY METRIC CARDS: FOLLOWERS, ENGAGEMENT, STORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CARD 1: METRIK FOLLOWERS & PERTUMBUHAN PER WEEK */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4.5 space-y-4 shadow-2xs hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Followers &amp; Dinamika Churn
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {activeWeek ? `${activeWeek.weekLabel} (${activeWeek.dateRange})` : 'Akumulasi Semua Minggu'}
                </span>
              </div>
            </div>
            {activeWeek && (
              <button
                onClick={() => handleOpenEdit(activeWeek)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                title="Edit Metrik Minggu Ini"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Net Growth Primary Stat */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pertumbuhan Bersih (Net Growth)
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                (activeWeek ? activeWeek.netGrowth : totals.netGrowth) >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {(activeWeek ? activeWeek.netGrowth : totals.netGrowth) >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-rose-600" />
                )}
                <span>
                  {(activeWeek ? activeWeek.netGrowth : totals.netGrowth) >= 0 ? 'NET POSITIF' : 'NET DEFISIT'}
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className={`text-2xl font-black ${
                (activeWeek ? activeWeek.netGrowth : totals.netGrowth) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {(activeWeek ? activeWeek.netGrowth : totals.netGrowth) >= 0 ? '+' : ''}
                {formatNumber(activeWeek ? activeWeek.netGrowth : totals.netGrowth)}
              </span>
              <span className="text-xs font-semibold text-slate-500">followers bersih</span>
            </div>
          </div>

          {/* Gained vs Unfollowed Breakdown */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-emerald-50/50 border border-emerald-100/80 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <UserPlus className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Followers Baru</span>
              </div>
              <div className="text-base font-black text-emerald-800 mt-1">
                +{formatNumber(activeWeek ? activeWeek.followersGained : totals.followersGained)}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">+Follow mingguan</span>
            </div>

            <div className="bg-rose-50/50 border border-rose-100/80 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-rose-700">
                <UserMinus className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Unfollowers</span>
              </div>
              <div className="text-base font-black text-rose-800 mt-1">
                -{formatNumber(activeWeek ? activeWeek.followersUnfollowed : totals.followersUnfollowed)}
              </div>
              <span className="text-[10px] text-rose-600 font-medium">-Unfoll mingguan</span>
            </div>
          </div>

          {/* Ending Followers or Churn Ratio */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="text-[11px] font-medium text-slate-500">Followers Akhir Minggu:</span>
            <span className="font-bold text-slate-900">
              {formatNumber(activeWeek ? activeWeek.endingFollowers : (report.totalFollowers || 28000))} akun
            </span>
          </div>
        </div>

        {/* CARD 2: METRIK ENGAGEMENT & INTERAKSI MINGGUAN */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4.5 space-y-4 shadow-2xs hover:border-indigo-200 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Heart className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Engagement &amp; Interaksi
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {activeWeek ? `${activeWeek.weekLabel} (${activeWeek.dateRange})` : 'Akumulasi Semua Minggu'}
                </span>
              </div>
            </div>
            {activeWeek && (
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                ER: {activeWeek.engagementRate}%
              </span>
            )}
          </div>

          {/* Total Interaksi Primary Stat */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Interaksi Mingguan
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Views: <strong>{formatNumber(activeWeek ? activeWeek.views : totals.views)}</strong>
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-black text-indigo-700">
                {formatNumber(activeWeek ? activeWeek.totalEngagement : totals.totalEngagement)}
              </span>
              <span className="text-xs font-semibold text-slate-500">interaksi</span>
            </div>
          </div>

          {/* 4 Interaction Metrics: Likes, Comments, Shares, Saves */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white border border-slate-200/60 p-2 rounded-xl">
              <div className="flex items-center justify-center text-rose-500 mb-0.5">
                <Heart className="w-3 h-3" />
              </div>
              <div className="text-xs font-black text-slate-800">
                {formatNumber(activeWeek ? activeWeek.likes : totals.likes)}
              </div>
              <span className="text-[9px] text-slate-400 font-semibold">Likes</span>
            </div>

            <div className="bg-white border border-slate-200/60 p-2 rounded-xl">
              <div className="flex items-center justify-center text-blue-500 mb-0.5">
                <MessageCircle className="w-3 h-3" />
              </div>
              <div className="text-xs font-black text-slate-800">
                {formatNumber(activeWeek ? activeWeek.comments : totals.comments)}
              </div>
              <span className="text-[9px] text-slate-400 font-semibold">Comments</span>
            </div>

            <div className="bg-white border border-slate-200/60 p-2 rounded-xl">
              <div className="flex items-center justify-center text-emerald-500 mb-0.5">
                <Share2 className="w-3 h-3" />
              </div>
              <div className="text-xs font-black text-emerald-800">
                {formatNumber(activeWeek ? activeWeek.shares : totals.shares)}
              </div>
              <span className="text-[9px] text-emerald-600 font-semibold">Shares</span>
            </div>

            <div className="bg-white border border-slate-200/60 p-2 rounded-xl">
              <div className="flex items-center justify-center text-indigo-500 mb-0.5">
                <Bookmark className="w-3 h-3" />
              </div>
              <div className="text-xs font-black text-indigo-800">
                {formatNumber(activeWeek ? activeWeek.saves : totals.saves)}
              </div>
              <span className="text-[9px] text-indigo-600 font-semibold">Saves</span>
            </div>
          </div>

          {/* Reach stat */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="text-[11px] font-medium text-slate-500">Jangkauan Akun (Reach):</span>
            <span className="font-bold text-slate-900">
              {formatNumber(activeWeek ? activeWeek.reach : totals.reach)} akun unik
            </span>
          </div>
        </div>

        {/* CARD 3: METRIK STORIES PER WEEK */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4.5 space-y-4 shadow-2xs hover:border-purple-200 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Smartphone className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Performa Stories Mingguan
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {activeWeek ? `${activeWeek.weekLabel} (${activeWeek.dateRange})` : 'Akumulasi Semua Minggu'}
                </span>
              </div>
            </div>
            {activeWeek && (
              <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">
                {activeWeek.storiesCount} Stories
              </span>
            )}
          </div>

          {/* Total yang Terupload Primary Stat */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total yang Terupload
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                {activeWeek ? activeWeek.storiesCount : totals.storiesCount} Stories + Feed
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-black text-purple-700">
                {formatNumber((activeWeek ? activeWeek.storiesCount : totals.storiesCount) + 3)}
              </span>
              <span className="text-xs font-semibold text-slate-500">konten terupload</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Tayangan Stories: {formatNumber(activeWeek ? activeWeek.totalStoryViews : totals.totalStoryViews)}</span>
              <span>Retention: {activeWeek ? activeWeek.storyCompletionRate || 78 : 78}%</span>
            </div>
          </div>

          {/* Avg Views & DM / Replies */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white border border-slate-200/70 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500">Rata-rata View / Story</span>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {formatNumber(
                  activeWeek
                    ? activeWeek.avgViewsPerStory
                    : totals.storiesCount > 0
                      ? Math.round(totals.totalStoryViews / totals.storiesCount)
                      : 0
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">view per tayangan</span>
            </div>

            <div className="bg-white border border-slate-200/70 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500">Balasan / DM Story</span>
              <div className="text-base font-black text-purple-800 mt-0.5">
                {activeWeek
                  ? activeWeek.storyReplies || 0
                  : Math.round(totals.totalStoryViews * 0.003)}
              </div>
              <span className="text-[10px] text-purple-600 font-medium">pesan langsung</span>
            </div>
          </div>

          {/* Stories Tayang stat */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="text-[11px] font-medium text-slate-500">Total Story Tayang:</span>
            <span className="font-bold text-purple-900">
              {activeWeek ? activeWeek.storiesCount : totals.storiesCount} stories
            </span>
          </div>
        </div>
      </div>

      {/* DETAILED WEEKLY COMPARISON MATRIX TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-900">
              Matriks Rekapitulasi &amp; Perbandingan Mingguan
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Klik tombol <strong>Edit</strong> pada baris minggu untuk memperbarui data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Minggu</th>
                <th className="py-3 px-3">Rentang Tanggal</th>
                <th className="py-3 px-3 text-emerald-700">+ Follows</th>
                <th className="py-3 px-3 text-rose-700">- Unfoll</th>
                <th className="py-3 px-3 text-blue-800">Net Growth</th>
                <th className="py-3 px-3">Views Konten</th>
                <th className="py-3 px-3">Interaksi</th>
                <th className="py-3 px-3">ER %</th>
                <th className="py-3 px-3 text-purple-800">Stories Tayang</th>
                <th className="py-3 px-3 text-purple-800">Total Terupload</th>
                <th className="py-3 px-3 text-purple-800">Avg / Story</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weeklyData.map((w) => {
                const isSelected = selectedWeekId === w.id;
                return (
                  <tr 
                    key={w.id} 
                    className={`hover:bg-blue-50/40 transition cursor-pointer ${
                      isSelected ? 'bg-blue-50/60 font-semibold' : ''
                    }`}
                    onClick={() => setSelectedWeekId(w.id)}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{w.weekLabel}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {w.dateRange}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700 whitespace-nowrap">
                      +{formatNumber(w.followersGained)}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-700 whitespace-nowrap">
                      -{formatNumber(w.followersUnfollowed)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                        w.netGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {w.netGrowth >= 0 ? `+${formatNumber(w.netGrowth)}` : formatNumber(w.netGrowth)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {formatNumber(w.views)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {formatNumber(w.totalEngagement)}
                    </td>
                    <td className="py-3 px-3 font-black text-indigo-700 whitespace-nowrap">
                      {w.engagementRate}%
                    </td>
                    <td className="py-3 px-3 font-semibold text-purple-900 whitespace-nowrap">
                      {w.storiesCount} st
                    </td>
                    <td className="py-3 px-3 font-bold text-purple-900 whitespace-nowrap">
                      <div>{w.storiesCount + 3} konten</div>
                      <div className="text-[10px] text-slate-400 font-normal">({formatNumber(w.totalStoryViews)} views)</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {formatNumber(w.avgViewsPerStory)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(w);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition"
                        title="Edit Metrik Minggu Ini"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-100/70 border-t border-slate-200 font-bold text-slate-800">
              <tr>
                <td className="py-3 px-4 font-black">TOTAL AKUMULASI</td>
                <td className="py-3 px-3 text-slate-500 font-semibold">{weeklyData.length} Minggu</td>
                <td className="py-3 px-3 text-emerald-800 font-black">+{formatNumber(totals.followersGained)}</td>
                <td className="py-3 px-3 text-rose-800 font-black">-{formatNumber(totals.followersUnfollowed)}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                    totals.netGrowth >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                  }`}>
                    {totals.netGrowth >= 0 ? `+${formatNumber(totals.netGrowth)}` : formatNumber(totals.netGrowth)}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-900 font-black">{formatNumber(totals.views)}</td>
                <td className="py-3 px-3 text-slate-900 font-black">{formatNumber(totals.totalEngagement)}</td>
                <td className="py-3 px-3 text-indigo-800 font-black">
                  {totals.views > 0 ? ((totals.totalEngagement / totals.views) * 100).toFixed(2) : '5.0'}%
                </td>
                <td className="py-3 px-3 text-purple-900 font-black">{totals.storiesCount} st</td>
                <td className="py-3 px-3 text-purple-900 font-black">
                  <div>{totals.storiesCount + 12} konten</div>
                  <div className="text-[10px] text-slate-400 font-normal">({formatNumber(totals.totalStoryViews)} views)</div>
                </td>
                <td className="py-3 px-3 text-slate-800 font-black">
                  {totals.storiesCount > 0 ? formatNumber(Math.round(totals.totalStoryViews / totals.storiesCount)) : 0}
                </td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* HIGHLIGHTS & STRATEGIC NOTES CARD FOR ACTIVE WEEK */}
      {activeWeek && (activeWeek.highlights || activeWeek.notes) && (
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-4">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Catatan &amp; Evaluasi PIC: {activeWeek.weekLabel}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">({activeWeek.dateRange})</span>
            </div>
            {activeWeek.highlights && (
              <p className="text-slate-700">
                <strong className="text-slate-900">Highlight:</strong> {activeWeek.highlights}
              </p>
            )}
            {activeWeek.notes && (
              <p className="text-slate-600">
                <strong className="text-slate-900">Rekomendasi:</strong> {activeWeek.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDIT / INPUT METRIK MINGGUAN */}
      <WeeklyMetricModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        weekData={editingWeek}
        onSave={handleSaveWeek}
        brandName={brand.name}
        currentPeriod={currentPeriod}
      />
    </div>
  );
};
