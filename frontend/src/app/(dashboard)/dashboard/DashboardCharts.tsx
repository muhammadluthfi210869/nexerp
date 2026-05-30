"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Cell, Pie
} from 'recharts';
import { Activity, BarChart3 } from "lucide-react";

const COLORS = ['#1E3A8A', '#EA580C', '#10B981', '#8B5CF6', '#F59E0B'];

interface AuditData {
  trends: { date: string; leads: number; cpl: number; spend: number }[];
  platform_audit: { platform: string; spend: number; leads: number; cpl: number; cpc: number }[];
}

export function TrendAreaChart({ data }: { data: AuditData['trends'] }) {
  return (
    <div className="bento-card p-[var(--card-px)] bento-card-hover">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-primary border border-slate-100">
          <BarChart3 className="w-4 h-4" />
        </div>
        <h3 className="text-section-label">IV. ANALISA TREN TAHUNAN</h3>
      </div>
      <div className="h-[350px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--status-action)" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="var(--status-action)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              stroke="var(--gray-400)"
              fontSize={10}
              fontWeight="600"
              tickFormatter={(str) => new Date(str).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis stroke="var(--gray-400)" fontSize={10} fontWeight="800" axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
            />
            <Area type="monotone" dataKey="leads" name="Leads" stroke="var(--status-action)" strokeWidth={3} fill="url(#colorLeads)" />
            <Area type="monotone" dataKey="cpl" name="CPL" stroke="var(--gray-400)" strokeWidth={2} fillOpacity={0} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SpendBarChart({ data }: { data: AuditData['trends'] }) {
  return (
    <div className="bento-card p-[var(--card-px)] bento-card-hover">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-emerald-500 border border-slate-100">
          <Activity className="w-4 h-4" />
        </div>
        <h3 className="text-section-label">V. TREN SAMPLES & AKUISISI</h3>
      </div>
      <div className="h-[350px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              stroke="var(--gray-400)"
              fontSize={10}
              fontWeight="600"
              tickFormatter={(str) => new Date(str).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis stroke="var(--gray-400)" fontSize={10} fontWeight="800" axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 4 }}
              contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
            />
            <Bar dataKey="spend" name="Ads Spend" fill="var(--status-action)" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AdSpendPieChart({ data }: { data: AuditData['platform_audit'] }) {
  return (
    <div className="flex flex-col items-center justify-center bg-slate-50/30 p-8 border-l border-slate-50">
      <p className="text-section-label mb-8">Share of Ad Spend</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={8}
              dataKey="spend"
              nameKey="platform"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        {data.map((p, i) => (
          <div key={p.platform} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-micro-label text-slate-400">{p.platform}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
