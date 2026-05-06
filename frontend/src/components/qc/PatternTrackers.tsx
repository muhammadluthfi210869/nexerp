"use client";

import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card } from "@/components/ui/card";

export const SupplierRadar = ({ data }: any) => {
  return (
    <Card className="p-6 border-none shadow-sm rounded-2xl bg-white h-[400px]">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Supplier Quality Radar</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Performance per core category</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} />
          <Radar
            name="Pass Rate"
            dataKey="value"
            stroke="#2563EB"
            fill="#2563EB"
            fillOpacity={0.4}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export const DefectPareto = ({ data }: any) => {
  return (
    <Card className="p-6 border-none shadow-sm rounded-2xl bg-white h-[400px]">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Defect Pareto Analysis</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Focus on 80/20 impact rule</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="reason" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} axisLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
          />
          <Bar dataKey="count" fill="#E11D48" radius={[8, 8, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export const QualityFunnel = ({ data }: any) => {
  return (
    <Card className="p-6 border-none shadow-sm rounded-2xl bg-white h-[400px]">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Yield Degradation Funnel</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Stage-by-stage unit leakage</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis dataKey="stage" type="category" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} axisLine={false} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="qty"
            stroke="#059669"
            fill="#059669"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

