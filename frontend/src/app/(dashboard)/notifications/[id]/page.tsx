"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bell,
  ArrowLeft,
  Clock,
  ExternalLink,
  Check,
  AlertTriangle,
  AtSign,
  FileText,
} from "lucide-react";
import {
  DnaPageHeader,
  DashboardCard,
  DnaBadge,
  DnaButton,
  useDnaToast,
} from "@/components/dna";
import { api } from "@/lib/api";

interface NotificationDetail {
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

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useDnaToast();
  const id = params?.id as string;

  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/notifications/${id}`);
        const data = res.data?.data || res.data;
        setNotification(data);
        if (data && !data.isRead) {
          await api.post(`/notifications/${id}/read`);
        }
      } catch (err: any) {
        toast({
          title: "Gagal memuat notifikasi",
          description: err.response?.data?.message || err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "MENTION":
        return <DnaBadge variant="info">@Mention</DnaBadge>;
      case "SLA_BREACH":
        return <DnaBadge variant="danger">SLA Breach</DnaBadge>;
      case "SLA_WARNING":
        return <DnaBadge variant="warning">SLA Warning</DnaBadge>;
      case "APPROVAL_REQUEST":
        return <DnaBadge variant="primary">Approval Request</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{type}</DnaBadge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Bell className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
        Memuat detail notifikasi...
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <p className="font-semibold text-lg">Notifikasi tidak ditemukan</p>
        <DnaButton
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/notifications")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Daftar Notifikasi
        </DnaButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <DnaPageHeader
        title="Detail Notifikasi"
        description="Rincian informasi dan tautan aksi terkait pemberitahuan sistem."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pusat Notifikasi", href: "/notifications" },
          { label: "Detail" },
        ]}
        actions={
          <DnaButton
            variant="outline"
            size="sm"
            onClick={() => router.push("/notifications")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </DnaButton>
        }
      />

      <DashboardCard label="Detail Notifikasi">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">{notification.title}</h2>
              <div className="flex items-center gap-2">
                {getTypeBadge(notification.type)}
                {notification.isRead ? (
                  <DnaBadge variant="success">Sudah Dibaca</DnaBadge>
                ) : (
                  <DnaBadge variant="warning">Baru</DnaBadge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              {new Date(notification.createdAt).toLocaleString("id-ID")}
            </div>
          </div>

          <div className="bg-muted/30 p-5 rounded-lg border text-base text-foreground leading-relaxed">
            {notification.body}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/10 p-4 rounded-lg">
            <div>
              <span className="text-muted-foreground block text-xs uppercase font-semibold">
                Tipe Referensi
              </span>
              <span className="font-medium">
                {notification.referenceType || "Pemberitahuan Umum"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase font-semibold">
                ID Dokumen / Objek
              </span>
              <span className="tabular-nums text-xs">
                {notification.referenceId || "—"}
              </span>
            </div>
          </div>

          {notification.link && (
            <div className="pt-4 border-t flex justify-end">
              <DnaButton
                variant="primary"
                onClick={() => router.push(notification.link!)}
              >
                Buka Halaman Terkait
                <ExternalLink className="w-4 h-4 ml-2" />
              </DnaButton>
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
