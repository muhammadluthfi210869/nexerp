'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { PaidAdsRow } from '../types/digimar.types';

interface Props {
  rows: PaidAdsRow[];
}

export function CpaChart({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Belum ada data</p>
      </div>
    );
  }

  const byMonth = new Map<string, { spend: number; leads: number; samples: number }>();
  rows.forEach(r => {
    if (!r.month) return;
    const m = byMonth.get(r.month) || { spend: 0, leads: 0, samples: 0 };
    m.spend += r.spend || 0;
    m.leads += r.leads || 0;
    m.samples += r.samples || 0;
    byMonth.set(r.month, m);
  });

  const chartData = Array.from(byMonth.entries())
    .map(([month, d]) => ({
      month: month.slice(0, 3),
      CPL: d.leads > 0 ? Math.round(d.spend / d.leads) : 0,
      CPA: d.samples > 0 ? Math.round(d.spend / d.samples) : 0,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Belum ada data CPA</p>
      </div>
    );
  }

  const formatRp = (val: number) => `Rp ${val.toLocaleString()}`;

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fontWeight: 600, fill: '#6B7280' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fontWeight: 600, fill: '#6B7280' }}
            tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              background: '#fff',
              boxShadow: '0 16px 30px -22px rgba(15,23,42,0.28)',
              fontSize: '12px',
              fontWeight: 600,
            }}
            formatter={(val: any) => [formatRp(Number(val)), '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, fontWeight: 700 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            dataKey="CPL"
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
            name="CPL (Cost/Lead)"
            maxBarSize={32}
          />
          <Bar
            dataKey="CPA"
            fill="#8B5CF6"
            radius={[4, 4, 0, 0]}
            name="CPA (Cost/Acquisition)"
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
