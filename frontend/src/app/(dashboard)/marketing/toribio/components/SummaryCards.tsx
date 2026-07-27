'use client';

import React from 'react';
import { Users, FlaskConical, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { PaidAdsData, TrackerRow } from '../types/digimar.types';

interface Props {
  paidAds?: PaidAdsData;
  igTracker?: TrackerRow[];
  ttTracker?: TrackerRow[];
  selectedMonth?: string;
}

// ── Format helpers ──
function formatCompact(val: number): string {
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)} Rb`;
  return `Rp ${val}`;
}

// ── Risk thresholds ──
const CPL_RISK_THRESHOLD = 500_000;
const CPA_RISK_THRESHOLD = 1_500_000;

export function SummaryCards({ paidAds, igTracker, ttTracker, selectedMonth }: Props) {
  const getMonthData = (tracker?: TrackerRow[]): { leads: number; samples: number; spend: number } | null => {
    if (!tracker || tracker.length === 0) return null;
    let leads = 0, samples = 0, spend = 0;

    if (selectedMonth && selectedMonth !== 'all') {
      const row = tracker.find(r => r.month.toLowerCase() === selectedMonth.toLowerCase());
      if (row) {
        leads = row.leads || 0;
        samples = row.samples || 0;
        spend = row.spend || 0;
      }
    } else {
      tracker.forEach(r => {
        leads += r.leads || 0;
        samples += r.samples || 0;
        spend += r.spend || 0;
      });
    }
    return { leads, samples, spend };
  };

  const igData = getMonthData(igTracker);
  const ttData = getMonthData(ttTracker);

  const totalLeads = (igData?.leads ?? 0) + (ttData?.leads ?? 0) + (paidAds?.totalLeads ?? 0);
  const totalSamples = (igData?.samples ?? 0) + (ttData?.samples ?? 0) + (paidAds?.totalSamples ?? 0);
  const totalSpend = (igData?.spend ?? 0) + (ttData?.spend ?? 0) + (paidAds?.totalSpend ?? 0);
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : null;
  const cpa = totalSamples > 0 ? totalSpend / totalSamples : null;

  const isCplRisk = cpl !== null && cpl > CPL_RISK_THRESHOLD;
  const isCpaRisk = cpa !== null && cpa > CPA_RISK_THRESHOLD;

  const cards: {
    label: string;
    value: string;
    subValue?: string;
    icon: React.ReactNode;
    isMonetary?: boolean;
    isRisk?: boolean;
  }[] = [
    {
      label: 'Total Leads',
      value: totalLeads.toLocaleString(),
      icon: <Users className="text-emerald-500" />,
    },
    {
      label: 'Total Samples',
      value: totalSamples.toLocaleString(),
      icon: <FlaskConical className="text-blue-600" />,
    },
    {
      label: 'Total Spend',
      value: formatCompact(totalSpend),
      subValue: `Rp ${totalSpend.toLocaleString()}`,
      icon: <DollarSign className="text-amber-500" />,
      isMonetary: true,
    },
    {
      label: 'CPL',
      value: cpl !== null ? formatCompact(Math.round(cpl)) : '-',
      subValue: cpl !== null ? `Rp ${Math.round(cpl).toLocaleString()}` : undefined,
      icon: <TrendingUp className={isCplRisk ? 'text-rose-500' : 'text-blue-600'} />,
      isRisk: isCplRisk,
    },
    {
      label: 'CPA',
      value: cpa !== null ? formatCompact(Math.round(cpa)) : '-',
      subValue: cpa !== null ? `Rp ${Math.round(cpa).toLocaleString()}` : undefined,
      icon: <Activity className={isCpaRisk ? 'text-rose-500' : 'text-blue-600'} />,
      isRisk: isCpaRisk,
    },
  ];

  // Split ke 2 baris: 3 card atas (Leads, Samples, Spend), 2 card bawah (CPL, CPA)
  const topRow = cards.slice(0, 3);
  const bottomRow = cards.slice(3);

  const renderCard = (card: typeof cards[number]) => {
    const borderClass = card.isRisk ? 'border-rose-300' : 'border-gray-100';
    const valueClass = card.isRisk ? 'text-rose-600' : 'text-gray-900';
    const iconBoxClass = card.isRisk
      ? 'bg-rose-50 text-rose-400'
      : 'bg-slate-50 text-slate-400';

    return (
      <div
        key={card.label}
        className={`rounded-[24px] border ${borderClass} bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05)] group relative overflow-hidden`}
      >
        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              {card.label}
            </p>
            <p
              className={`mt-1.5 font-black tracking-[-0.02em] tabular-nums leading-tight truncate ${valueClass} ${
                card.isMonetary ? 'text-[24px]' : 'text-[32px]'
              }`}
            >
              {card.value}
            </p>
            {card.subValue && (
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                {card.subValue}
              </p>
            )}
          </div>
          <div className={`p-3.5 rounded-xl shrink-0 ml-3 ${iconBoxClass} group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm`}>
            <span className="[&>svg]:w-[16px] [&>svg]:h-[16px]">{card.icon}</span>
          </div>
        </div>
        {/* Background decorative icon */}
        <div className="absolute -bottom-5 -right-5 pointer-events-none select-none z-0 opacity-[0.08]">
          {React.cloneElement(card.icon as React.ReactElement<SVGElement>, {
            className: 'w-[110px] h-[110px] stroke-[0.75px]',
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {topRow.map(renderCard)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[66%]">
        {bottomRow.map(renderCard)}
      </div>
    </div>
  );
}
