"use client";

// DnaNotificationCenter — top-bar bell + dropdown panel.
//
// ponytail: polls every 60s (mock fallback for WS). Click outside to close.
// Mark-as-read optimistically. "View all" links to /communications/inbox.
// Page doesn't exist yet — add when scope expands.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bell, Check, AtSign, MessageSquare, ShieldCheck, AlertCircle } from "lucide-react";
import { communicationService } from "@/lib/services/communication-service";
import { useDnaToast } from "@/components/dna/DnaToast";
import type { CommNotification, CommUser, NotificationKind } from "@/types/communication";

export interface DnaNotificationCenterProps {
  viewer: CommUser;
  /** Polling cadence in ms (default 60s; mock fallback until D1.Backend WS ships). */
  pollIntervalMs?: number;
  className?: string;
}

const KIND_ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  mention: AtSign,
  thread_reply: MessageSquare,
  approval: ShieldCheck,
  system: AlertCircle,
};

const KIND_TONE: Record<NotificationKind, string> = {
  mention: "text-blue-600 bg-blue-50 border-blue-200",
  thread_reply: "text-emerald-700 bg-emerald-50 border-emerald-200",
  approval: "text-purple-700 bg-purple-50 border-purple-200",
  system: "text-amber-700 bg-amber-50 border-amber-200",
};

export function DnaNotificationCenter({
  viewer,
  pollIntervalMs = 60_000,
  className,
}: DnaNotificationCenterProps) {
  const toast = useDnaToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CommNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await communicationService.listNotifications(viewer);
      setItems(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memuat notifikasi";
      toast.error("Notifikasi gagal dimuat", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [viewer, toast]);

  useEffect(() => {
    void load();
    const t = setInterval(load, pollIntervalMs);
    return () => clearInterval(t);
  }, [load, pollIntervalMs]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unread = items.filter((n) => !n.readAt).length;

  const markRead = async (n: CommNotification) => {
    // Optimistic
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    try {
      await communicationService.markNotificationRead(viewer, n.id);
    } catch {
      // Roll back on failure
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: null } : x)));
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative rounded-lg hover:bg-slate-100"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-96 max-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl z-50"
          role="menu"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">Notifikasi</span>
              <span className="text-[10px] text-slate-500">{unread} belum dibaca · {items.length} total</span>
            </div>
            <button
              type="button"
              onClick={load}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading && items.length === 0 && (
              <li className="p-6 text-center text-xs text-slate-500">Memuat…</li>
            )}
            {!loading && items.length === 0 && (
              <li className="p-6 text-center text-xs text-slate-500">Tidak ada notifikasi</li>
            )}
            {items.map((n) => (
              <NotificationItem key={n.id} item={n} onClick={() => markRead(n)} />
            ))}
          </ul>

          <div className="px-4 py-2 border-t border-slate-100 text-center">
            <Link
              href="/communications"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              Lihat semua di Communications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ item, onClick }: { item: CommNotification; onClick: () => void }) {
  const Icon = KIND_ICON[item.kind] ?? Bell;
  const tone = KIND_TONE[item.kind] ?? "text-slate-700 bg-slate-50 border-slate-200";
  const isUnread = !item.readAt;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors",
          isUnread && "bg-blue-50/40",
        )}
      >
        <span
          className={cn(
            "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0",
            tone,
          )}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-slate-900 truncate">{item.title}</span>
          {item.preview && <span className="block text-[11px] text-slate-600 line-clamp-2">{item.preview}</span>}
          <span className="block text-[10px] text-slate-400 font-mono mt-1">{item.createdAt}</span>
        </span>
        {isUnread && (
          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" aria-label="Unread" />
        )}
        {!isUnread && <Check className="w-3.5 h-3.5 text-slate-300 mt-1 shrink-0" />}
      </button>
    </li>
  );
}