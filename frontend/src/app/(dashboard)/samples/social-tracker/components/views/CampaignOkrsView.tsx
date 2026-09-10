import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';
import { CampaignOKR, PostItem } from '../../types';
import { formatNumber } from '../../utils/notionStyles';

interface CampaignOkrsViewProps {
  okrs: CampaignOKR[];
  posts: PostItem[];
  onOpenPost: (post: PostItem) => void;
}

export const CampaignOkrsView: React.FC<CampaignOkrsViewProps> = ({
  okrs,
  posts,
  onOpenPost,
}) => {
  return (
    <div className="w-full max-w-5xl pb-16 pt-2 space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-[#37352f] dark:text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-red-500" />
          <span>Strategic Goals & Campaign OKRs</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Lacak pencapaian target metrik sosial media dan kampanye Meta Ads per kuartal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {okrs.map((okr) => {
          const progressPercent = Math.min(100, Math.round((okr.currentValue / okr.targetValue) * 100));
          const linkedPosts = posts.filter((p) => okr.associatedPosts.includes(p.id));

          return (
            <div
              key={okr.id}
              className="bg-white dark:bg-[#202020] rounded-xl p-5 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    style={{ backgroundColor: `${okr.color}20`, color: okr.color }}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  >
                    {okr.targetMetric}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      okr.status === 'completed'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {okr.status === 'completed' ? '✅ Completed' : '🚀 On Track'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#37352f] dark:text-white">
                  {okr.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {okr.objective}
                </p>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-bold font-mono mb-1.5">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {formatNumber(okr.currentValue)} {okr.unit}
                  </span>
                  <span className="text-zinc-400">
                    Target: {formatNumber(okr.targetValue)} {okr.unit} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%`, backgroundColor: okr.color }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Linked Content Planning items */}
              {linkedPosts.length > 0 && (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                    Konten Pendukung Terkait:
                  </span>
                  <div className="space-y-1">
                    {linkedPosts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onOpenPost(p)}
                        className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition cursor-pointer text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="truncate max-w-[280px]">📄 {p.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
