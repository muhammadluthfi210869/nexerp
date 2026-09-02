'use client';

import { BarChart3 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardCard } from '@/components/dna/DashboardCard';
import { formatDate, formatInteger } from '../lib/format';

export function LeadTrendChart({ data }: { data: Array<{ date: string; leads: number }> }) {
  return (
    <DashboardCard className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[var(--gray-900)]">Aliran lead</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Lead baru dari CRM internal per hari.</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--insight-action-bg)] text-[var(--status-action)]">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-5 h-64" aria-label="Grafik lead per hari">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="leadGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--status-action)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--status-action)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--gray-100)" strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(String(value)).replace(/\s\d{4}$/, '')}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--gray-500)' }}
              minTickGap={24}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--gray-500)' }} />
            <Tooltip
              labelFormatter={(value) => formatDate(String(value))}
              formatter={(value) => [formatInteger(Number(value)), 'Lead']}
              contentStyle={{ borderRadius: 14, borderColor: 'var(--border-color)', fontSize: 12 }}
            />
            <Area type="monotone" dataKey="leads" name="Lead" stroke="var(--status-action)" strokeWidth={2.5} fill="url(#leadGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
