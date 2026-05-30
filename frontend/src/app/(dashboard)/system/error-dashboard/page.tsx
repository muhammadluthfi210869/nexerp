"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  TrendingUp,
  Clock,
  Route,
  Layers,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";
import { DnaBadge, DnaButton, TableWrapper } from "@/components/dna";

const LEVEL_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  fatal: { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50", label: "Fatal" },
  error: { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50", label: "Error" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", label: "Warning" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50", label: "Info" },
};

export default function ErrorDashboardPage() {
  const [hours, setHours] = useState(24);

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ["error-summary", hours],
    queryFn: async () => {
      const res = await api.get(`/system/errors/summary?hours=${hours}`);
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: timeline } = useQuery({
    queryKey: ["error-timeline", hours],
    queryFn: async () => {
      const res = await api.get(`/system/errors/timeline?hours=${hours}`);
      return res.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <QueryLoading message="Loading error analytics..." />;
  if (isError) return <QueryError error="Failed to load error data" onRetry={() => window.location.reload()} />;

  const maxBucket = Math.max(1, ...(timeline || []).map((b: any) => b.error + b.warning + b.fatal));

  return (
    <DashboardShell
      title="Error"
      titleAccent="Surveillance"
      subtitle="Real-time system error monitoring & diagnostics"
      actions={
        <div className="flex gap-2">
          {[1, 6, 24, 72].map((h) => (
            <DnaButton
              key={h}
              variant={hours === h ? "primary" : "outline"}
              size="sm"
              onClick={() => setHours(h)}
              className={cn(
                hours === h ? "bg-gray-700 text-white" : "border-slate-200"
              )}
            >
              {h}h
            </DnaButton>
          ))}
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          label="Total Errors"
          value={summary?.totalErrors || 0}
          icon={<ShieldAlert className="w-5 h-5" />}
          color="text-red-600"
          bg="bg-red-50"
        />
        <StatCard
          label="Critical"
          value={summary?.criticalErrors || 0}
          icon={<Zap className="w-5 h-5" />}
          color="text-rose-600"
          bg="bg-rose-50"
        />
        <StatCard
          label="Unique Routes"
          value={summary?.byRoute?.length || 0}
          icon={<Route className="w-5 h-5" />}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <StatCard
          label="Last {hours}h"
          value={hours}
          icon={<Clock className="w-5 h-5" />}
          color="text-slate-600"
          bg="bg-slate-50"
          suffix="hrs"
        />
      </div>

      {/* Timeline Chart */}
      <Card className="p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Error Timeline</span>
        </div>
        <div className="flex items-end gap-1 h-32">
          {(timeline || []).map((bucket: any, i: number) => {
            const total = bucket.error + bucket.warning + bucket.fatal;
            const height = maxBucket > 0 ? (total / maxBucket) * 100 : 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end group relative"
                title={`${bucket.hour.slice(11, 16)}: ${total} errors`}
              >
                <div
                  className="w-full rounded-t bg-rose-200 group-hover:bg-rose-400 transition-colors cursor-pointer"
                  style={{ height: `${Math.max(height, total > 0 ? 4 : 0)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
          <span>{hours}h ago</span>
          <span>Now</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Routes */}
        <Card className="p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Top Affected Routes</span>
          </div>
          <div className="space-y-2">
            {(summary?.byRoute || []).slice(0, 10).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <code className="text-xs font-medium text-slate-700 truncate flex-1">{item.route || "/"}</code>
                <DnaBadge className="ml-2">
                  {item.count}
                </DnaBadge>
              </div>
            ))}
            {(!summary?.byRoute || summary.byRoute.length === 0) && (
              <p className="text-xs text-slate-300 text-center py-8">No errors recorded</p>
            )}
          </div>
        </Card>

        {/* By Level */}
        <Card className="p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">By Severity</span>
          </div>
          <div className="space-y-3">
            {(summary?.byLevel || []).map((item: any, i: number) => {
              const config = LEVEL_CONFIG[item.level] || LEVEL_CONFIG.error;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}>
                    <config.icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-slate-600">{config.label}</span>
                      <span className="text-xs font-black text-slate-900">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", 
                          item.level === "fatal" ? "bg-red-500" :
                          item.level === "error" ? "bg-rose-500" :
                          item.level === "warning" ? "bg-amber-500" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min(100, (item.count / Math.max(1, summary?.totalErrors || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Errors Table */}
      <TableWrapper>
        <div className="p-6 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Recent Errors</span>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50/70">
            <tr className="border-slate-100">
              <th className="py-3 pl-8 text-table-header text-slate-400">Level</th>
              <th className="text-table-header text-slate-400">Message</th>
              <th className="text-table-header text-slate-400">Route</th>
              <th className="text-table-header text-slate-400">Count</th>
              <th className="pr-8 text-table-header text-slate-400">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.recentErrors || []).slice(0, 20).map((err: any) => {
              const config = LEVEL_CONFIG[err.level] || LEVEL_CONFIG.error;
              return (
                <tr key={err.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                  <td className="py-2.5 pl-8">
                    <DnaBadge className={cn(config.bg, config.color)}>
                      {config.label}
                    </DnaBadge>
                  </td>
                  <td>
                    <p className="text-xs font-medium text-slate-700 truncate max-w-[300px]">{err.message}</p>
                    {err.componentName && (
                      <p className="text-[9px] text-slate-300 font-medium">{err.componentName}</p>
                    )}
                  </td>
                  <td>
                    <code className="text-[10px] text-slate-400 font-medium">{err.route}</code>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-slate-600">{err.count}x</span>
                  </td>
                  <td className="pr-8">
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(err.lastSeenAt).toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!summary?.recentErrors || summary.recentErrors.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-xs text-slate-300 font-medium">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                  No errors detected — system is healthy
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableWrapper>
    </DashboardShell>
  );
}

function StatCard({ label, value, icon, color, bg, suffix }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  suffix?: string;
}) {
  return (
    <Card className="p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:translate-y-[-2px] transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg)}>
          <span className={color}>{icon}</span>
        </div>
                        <span className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">
          {value}{suffix && <span className="text-sm text-slate-400 ml-1">{suffix}</span>}
        </span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-4">{label}</p>
    </Card>
  );
}
