"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  AtSign,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  useDnaToast,
} from "@/components/dna";
import { api } from "@/lib/api";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  referenceType?: string | null;
  referenceId?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useDnaToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: 100 };
      if (filterRead === "UNREAD") params.read = false;
      if (filterRead === "READ") params.read = true;
      if (filterType !== "ALL") params.type = filterType;

      const res = await api.get("/notifications", { params });
      const data = res.data?.data || res.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({
        title: "Gagal memuat notifikasi",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterRead, filterType]);

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/mark-all-read");
      toast({
        title: "Berhasil",
        description: "Semua notifikasi telah ditandai sebagai sudah dibaca",
      });
      fetchNotifications();
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // Non-blocking
    }
  };

  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const mentionCount = notifications.filter((n) => n.type === "MENTION").length;
  const slaBreachCount = notifications.filter(
    (n) => n.type === "SLA_BREACH" || n.type === "SLA_WARNING",
  ).length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "MENTION":
        return <DnaBadge variant="info">@Mention</DnaBadge>;
      case "SLA_BREACH":
        return <DnaBadge variant="danger">SLA Breach</DnaBadge>;
      case "SLA_WARNING":
        return <DnaBadge variant="warning">SLA Warning</DnaBadge>;
      case "APPROVAL_REQUEST":
        return <DnaBadge variant="primary">Approval</DnaBadge>;
      case "GATE_OPENED":
        return <DnaBadge variant="success">Gate Open</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{type}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <DnaPageHeader
        title="Pusat Notifikasi & Aktivitas"
        description="Kelola seluruh notifikasi sistem, @mention, peringatan SLA, dan status approval secara terpusat."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pusat Notifikasi" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Tandai Semua Dibaca
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid
        columns={4}
        cards={[
          {
            title: "Total Notifikasi",
            value: totalCount.toString(),
            icon: Bell,
            variant: "blue",
          },
          {
            title: "Belum Dibaca",
            value: unreadCount.toString(),
            icon: Clock,
            variant: unreadCount > 0 ? "amber" : "emerald",
          },
          {
            title: "@Mention Anda",
            value: mentionCount.toString(),
            icon: AtSign,
            variant: "blue",
          },
          {
            title: "Peringatan SLA",
            value: slaBreachCount.toString(),
            icon: AlertTriangle,
            variant: slaBreachCount > 0 ? "rose" : "emerald",
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground mr-2">
            Status:
          </span>
          <DnaButton
            variant={filterRead === "ALL" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterRead("ALL")}
          >
            Semua
          </DnaButton>
          <DnaButton
            variant={filterRead === "UNREAD" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterRead("UNREAD")}
          >
            Belum Dibaca
          </DnaButton>
          <DnaButton
            variant={filterRead === "READ" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterRead("READ")}
          >
            Sudah Dibaca
          </DnaButton>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground mr-2">
            Tipe:
          </span>
          {["ALL", "MENTION", "APPROVAL_REQUEST", "SLA_BREACH"].map((t) => (
            <DnaButton
              key={t}
              variant={filterType === t ? "outline" : "ghost"}
              size="sm"
              onClick={() => setFilterType(t)}
            >
              {t === "ALL" ? "Semua Tipe" : t.replace("_", " ")}
            </DnaButton>
          ))}
        </div>
      </div>

      <DnaDataTableCard
        title="Daftar Notifikasi Masuk"
        description={`Menampilkan ${notifications.length} notifikasi`}
      >
        {loading ? (
          <div className="flex justify-center items-center py-16 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Memuat notifikasi...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-base">Tidak ada notifikasi</p>
            <p className="text-sm">Semua notifikasi telah dibaca atau belum ada aktivitas baru.</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) handleMarkAsRead(n.id);
                  if (n.link) router.push(n.link);
                  else router.push(`/notifications/${n.id}`);
                }}
                className={`p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  !n.isRead ? "bg-primary/5 font-medium" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getTypeBadge(n.type)}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {n.title}
                      {!n.isRead && (
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(n.createdAt).toLocaleString("id-ID")}</span>
                      {n.referenceType && (
                        <span>
                          Ref: {n.referenceType} #{n.referenceId?.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {n.link && (
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!n.isRead) handleMarkAsRead(n.id);
                        router.push(n.link!);
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </DnaButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DnaDataTableCard>
    </div>
  );
}
