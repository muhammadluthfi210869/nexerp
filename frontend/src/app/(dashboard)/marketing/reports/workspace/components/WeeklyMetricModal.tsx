import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Users, UserPlus, UserMinus, TrendingUp, 
  Heart, MessageCircle, Share2, Bookmark, Eye, Smartphone, Check, Sparkles
} from 'lucide-react';
import { WeeklyReportData } from '../types';
import { formatNumber } from '../utils/helpers';

interface WeeklyMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekData: WeeklyReportData | null;
  onSave: (updatedWeek: WeeklyReportData) => void;
  brandName: string;
  currentPeriod: string;
}

export const WeeklyMetricModal: React.FC<WeeklyMetricModalProps> = ({
  isOpen,
  onClose,
  weekData,
  onSave,
  brandName,
  currentPeriod
}) => {
  const [weekLabel, setWeekLabel] = useState('Minggu 1');
  const [weekNumber, setWeekNumber] = useState(1);
  const [dateRange, setDateRange] = useState('1 - 7 Sep 2026');

  // Followers
  const [followersGained, setFollowersGained] = useState(500);
  const [followersUnfollowed, setFollowersUnfollowed] = useState(100);
  const [endingFollowers, setEndingFollowers] = useState(25000);

  // Engagement & Traffic
  const [views, setViews] = useState(60000);
  const [reach, setReach] = useState(40000);
  const [likes, setLikes] = useState(1000);
  const [comments, setComments] = useState(90);
  const [shares, setShares] = useState(300);
  const [saves, setSaves] = useState(500);
  const [engagementRate, setEngagementRate] = useState(5.0);

  // Stories
  const [storiesCount, setStoriesCount] = useState(5);
  const [totalStoryViews, setTotalStoryViews] = useState(12000);
  const [storyReplies, setStoryReplies] = useState(40);
  const [storyCompletionRate, setStoryCompletionRate] = useState(78);

  // Notes
  const [highlights, setHighlights] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (weekData) {
      setWeekLabel(weekData.weekLabel || 'Minggu 1');
      setWeekNumber(weekData.weekNumber || 1);
      setDateRange(weekData.dateRange || '1 - 7 Sep 2026');

      setFollowersGained(weekData.followersGained || 0);
      setFollowersUnfollowed(weekData.followersUnfollowed || 0);
      setEndingFollowers(weekData.endingFollowers || 0);

      setViews(weekData.views || 0);
      setReach(weekData.reach || 0);
      setLikes(weekData.likes || 0);
      setComments(weekData.comments || 0);
      setShares(weekData.shares || 0);
      setSaves(weekData.saves || 0);
      setEngagementRate(weekData.engagementRate || 0);

      setStoriesCount(weekData.storiesCount || 0);
      setTotalStoryViews(weekData.totalStoryViews || 0);
      setStoryReplies(weekData.storyReplies || 0);
      setStoryCompletionRate(weekData.storyCompletionRate || 75);

      setHighlights(weekData.highlights || '');
      setNotes(weekData.notes || '');
    } else {
      setWeekLabel('Minggu 1');
      setWeekNumber(1);
      setDateRange('1 - 7 Sep 2026');
      setFollowersGained(500);
      setFollowersUnfollowed(100);
      setEndingFollowers(25000);
      setViews(60000);
      setReach(40000);
      setLikes(1000);
      setComments(90);
      setShares(300);
      setSaves(500);
      setEngagementRate(5.0);
      setStoriesCount(5);
      setTotalStoryViews(12000);
      setStoryReplies(40);
      setStoryCompletionRate(78);
      setHighlights('');
      setNotes('');
    }
  }, [weekData, isOpen]);

  if (!isOpen) return null;

  const netGrowth = Number(followersGained) - Number(followersUnfollowed);
  const totalEngagement = Number(likes) + Number(comments) + Number(shares) + Number(saves);
  const avgViewsPerStory = storiesCount > 0 ? Math.round(Number(totalStoryViews) / Number(storiesCount)) : 0;
  const growthPercent = endingFollowers > 0 ? Number(((netGrowth / endingFollowers) * 100).toFixed(2)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: WeeklyReportData = {
      id: weekData ? weekData.id : `wr-${Date.now()}`,
      weekNumber: Number(weekNumber) || 1,
      weekLabel: weekLabel.trim() || `Minggu ${weekNumber}`,
      dateRange: dateRange.trim(),
      followersGained: Number(followersGained) || 0,
      followersUnfollowed: Number(followersUnfollowed) || 0,
      netGrowth,
      growthPercent,
      endingFollowers: Number(endingFollowers) || 0,
      views: Number(views) || 0,
      reach: Number(reach) || 0,
      totalEngagement,
      engagementRate: Number(engagementRate) || (views > 0 ? Number(((totalEngagement / views) * 100).toFixed(2)) : 0),
      likes: Number(likes) || 0,
      comments: Number(comments) || 0,
      shares: Number(shares) || 0,
      saves: Number(saves) || 0,
      storiesCount: Number(storiesCount) || 0,
      totalStoryViews: Number(totalStoryViews) || 0,
      avgViewsPerStory,
      storyReplies: Number(storyReplies) || 0,
      storyCompletionRate: Number(storyCompletionRate) || 75,
      highlights: highlights.trim(),
      notes: notes.trim()
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
                WEEKLY REPORTING ENTRY
              </span>
              <span className="text-xs text-slate-500 font-semibold">{brandName} · {currentPeriod}</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {weekData ? `Edit Metrik ${weekData.weekLabel}` : 'Input Metrik Mingguan Baru'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Input followers baru, unfollow, pertumbuhan bersih, metrik engagement, dan stories per minggu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Section 1: Identitas Minggu */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Periode &amp; Label Minggu</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Label Minggu</label>
                <input
                  type="text"
                  value={weekLabel}
                  onChange={e => setWeekLabel(e.target.value)}
                  placeholder="e.g. Minggu 1"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Urutan Minggu (1-5)</label>
                <input
                  type="number"
                  value={weekNumber}
                  onChange={e => setWeekNumber(Number(e.target.value))}
                  min={1}
                  max={5}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rentang Tanggal</label>
                <input
                  type="text"
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  placeholder="e.g. 1 - 7 Sep 2026"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Metrik Followers & Pertumbuhan Mingguan */}
          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Users className="w-4 h-4 text-blue-700" />
                <span>Metrik Followers &amp; Pertumbuhan per Week</span>
              </div>
              {/* Real-time Net Growth calculation badge */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-[11px]">Pertumbuhan Bersih:</span>
                <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                  netGrowth >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {netGrowth >= 0 ? `+${formatNumber(netGrowth)}` : formatNumber(netGrowth)} Net
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  Followers Baru (+ Follow)
                </label>
                <input
                  type="number"
                  value={followersGained}
                  onChange={e => setFollowersGained(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                  Unfollowers (- Unfoll)
                </label>
                <input
                  type="number"
                  value={followersUnfollowed}
                  onChange={e => setFollowersUnfollowed(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-700 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Total Followers Akhir Minggu
                </label>
                <input
                  type="number"
                  value={endingFollowers}
                  onChange={e => setEndingFollowers(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Metrik Engagement Mingguan */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Metrik Engagement &amp; Interaksi Mingguan</span>
              </div>
              <span className="text-[11px] font-bold text-slate-600">
                Total Interaksi: <strong className="text-slate-900">{formatNumber(totalEngagement)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Likes</label>
                <input
                  type="number"
                  value={likes}
                  onChange={e => setLikes(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Comments</label>
                <input
                  type="number"
                  value={comments}
                  onChange={e => setComments(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Shares</label>
                <input
                  type="number"
                  value={shares}
                  onChange={e => setShares(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Saves</label>
                <input
                  type="number"
                  value={saves}
                  onChange={e => setSaves(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-indigo-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kuantitas Views Mingguan</label>
                <input
                  type="number"
                  value={views}
                  onChange={e => setViews(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reach (Jangkauan)</label>
                <input
                  type="number"
                  value={reach}
                  onChange={e => setReach(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Engagement Rate (ER %)</label>
                <input
                  type="number"
                  step="0.01"
                  value={engagementRate}
                  onChange={e => setEngagementRate(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-indigo-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Metrik Stories Mingguan */}
          <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>Metrik Stories Mingguan</span>
              </div>
              <span className="text-[11px] font-semibold text-purple-700">
                Avg Views/Story: <strong>{formatNumber(avgViewsPerStory)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Stories Ditayangkan</label>
                <input
                  type="number"
                  value={storiesCount}
                  onChange={e => setStoriesCount(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-purple-900 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Total yang Terupload (Tayangan Stories)</label>
                <input
                  type="number"
                  value={totalStoryViews}
                  onChange={e => setTotalStoryViews(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-purple-900 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Story Replies / DM</label>
                <input
                  type="number"
                  value={storyReplies}
                  onChange={e => setStoryReplies(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Completion Rate (%)</label>
                <input
                  type="number"
                  value={storyCompletionRate}
                  onChange={e => setStoryCompletionRate(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Highlights & Evaluasi */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Sorotan Utama Minggu Ini (Highlight)
              </label>
              <input
                type="text"
                value={highlights}
                onChange={e => setHighlights(e.target.value)}
                placeholder="e.g. Konten BTS lab homogenizer memicu lonjakan reach tertinggi..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Catatan &amp; Rekomendasi Mingguan
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Catatan strategi konten untuk minggu berikutnya..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Metrik Mingguan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
