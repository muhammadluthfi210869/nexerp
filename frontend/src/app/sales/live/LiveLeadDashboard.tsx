"use client";

// LiveLeadDashboard.tsx — Real-time sales dashboard.
// Connects to backend Socket.IO namespace /lead-events, subscribes to
// sales:managers room, renders live counters + recent leads table.
//
// Usage:
//   <LiveLeadDashboard salesUserId={user.id} />
//
// In Fase 3 / final polish: split into smaller components, add Recharts
// for top-source chart, add filter chips (channel/campaign). For now
// keep one file to ship the live feature fast.
import { useEffect, useMemo, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, Zap, Users, Target } from 'lucide-react';

interface LeadEvent {
  id: string;
  trackingCode?: string;
  channel?: string;
  campaign?: string;
  fullName?: string;
  phone?: string;
  assignedTo?: string;
  source?: string;
  createdAt: string;
}

interface LiveLeadDashboardProps {
  salesUserId: string;
  apiBase?: string;
}

export default function LiveLeadDashboard({
  salesUserId,
  apiBase,
}: LiveLeadDashboardProps) {
  const [leads, setLeads] = useState<LeadEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const socketBase = useMemo(() => {
    if (apiBase) return apiBase;
    if (typeof window === 'undefined') return '';
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }, [apiBase]);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = window.localStorage.getItem('token');
      return raw || '';
    } catch {
      return '';
    }
  }, []);

  const onLead = useCallback((payload: LeadEvent, kind: string) => {
    setLeads((prev) => [{ ...payload, createdAt: payload.createdAt || new Date().toISOString() }, ...prev].slice(0, 50));
    setLastEvent(`${kind} @ ${new Date().toLocaleTimeString()}`);
  }, []);

  useEffect(() => {
    if (!token || !socketBase) return;
    const socket: Socket = io(`${socketBase}/lead-events`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connected', () => setConnected(true));
    socket.on('lead.created', (p: LeadEvent) => onLead(p, 'lead.created'));
    socket.on('lead.attributed', (p: LeadEvent) => onLead(p, 'lead.attributed'));
    socket.on('lead.assigned', (p: LeadEvent) => onLead(p, 'lead.assigned'));
    socket.on('qr.scanned', (p: LeadEvent) => onLead(p, 'qr.scanned'));
    socket.on('qr.attributed', (p: LeadEvent) => onLead(p, 'qr.attributed'));

    return () => {
      socket.disconnect();
    };
  }, [token, socketBase, onLead]);

  // Quick stats (last 5 minutes)
  const stats = useMemo(() => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    const recent = leads.filter((l) => new Date(l.createdAt).getTime() >= cutoff);
    const channels = recent.reduce<Record<string, number>>((acc, l) => {
      const k = l.channel || l.source || 'unknown';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total: recent.length,
      perMinute: (recent.length / 5).toFixed(1),
      channels,
    };
  }, [leads]);

  return (
    <div className="space-y-4 p-4">
      {/* Connection status */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}
          aria-hidden="true"
        />
        <span className="font-medium">
          {connected ? 'Live' : 'Disconnected'}
        </span>
        {lastEvent && (
          <span className="text-slate-500">— last: {lastEvent}</span>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Zap className="h-4 w-4" />} label="Last 5 min" value={stats.total} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Per minute" value={stats.perMinute} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Top channel" value={topKey(stats.channels) ?? '—'} />
        <StatCard icon={<Target className="h-4 w-4" />} label="Sales" value={salesUserId.slice(0, 8)} />
      </div>

      {/* Recent leads */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold">
          Recent leads ({leads.length})
        </div>
        <ul className="divide-y divide-slate-100">
          {leads.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              Waiting for first event…
            </li>
          )}
          {leads.map((l, idx) => (
            <li key={`${l.id}-${idx}`} className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className="font-mono text-xs text-slate-400">{l.trackingCode ?? l.id?.slice(0, 8)}</span>
              <span className="flex-1">{l.fullName ?? l.phone ?? 'Anonymous'}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                {l.channel ?? l.source ?? '—'}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(l.createdAt).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function topKey(obj: Record<string, number>): string | null {
  let best: string | null = null;
  let bestN = -1;
  for (const k of Object.keys(obj)) {
    if (obj[k] > bestN) {
      best = k;
      bestN = obj[k];
    }
  }
  return best;
}