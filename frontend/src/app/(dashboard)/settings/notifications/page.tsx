"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  Clock,
  Save,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  DnaPageHeader,
  DashboardCard,
  DnaButton,
  useDnaToast,
} from "@/components/dna";
import { api } from "@/lib/api";

interface NotificationPreferences {
  in_app: boolean;
  email_digest: boolean;
  whatsapp_alerts: boolean;
  sla_warnings: boolean;
  quiet_hours_enabled: boolean;
}

export default function NotificationPreferencesPage() {
  const { toast } = useDnaToast();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    in_app: true,
    email_digest: true,
    whatsapp_alerts: true,
    sla_warnings: true,
    quiet_hours_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        setLoading(true);
        const res = await api.get("/profile/notification-preferences");
        const data = res.data?.data || res.data;
        if (data) {
          setPrefs({
            in_app: data.in_app ?? true,
            email_digest: data.email_digest ?? true,
            whatsapp_alerts: data.whatsapp_alerts ?? true,
            sla_warnings: data.sla_warnings ?? true,
            quiet_hours_enabled: data.quiet_hours_enabled ?? false,
          });
        }
      } catch (err: any) {
        // Fallback to defaults
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put("/profile/notification-preferences", prefs);
      toast({
        title: "Preferensi Disimpan",
        description: "Pengaturan saluran dan jenis notifikasi Anda berhasil diperbarui.",
      });
    } catch (err: any) {
      toast({
        title: "Gagal Menyimpan",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <DnaPageHeader
        title="Preferensi Notifikasi"
        description="Atur saluran pengiriman notifikasi, pemberitahuan @mention, dan peringatan eskalasi SLA."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pengaturan" },
          { label: "Preferensi Notifikasi" },
        ]}
        actions={
          <DnaButton
            variant="primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </DnaButton>
        }
      />

      <div className="grid grid-cols-1 gap-6">
        <DashboardCard label="Saluran Komunikasi Utama">
          <div className="divide-y">
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">Notifikasi In-App & Badge</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tampilkan badge jumlah pesan belum dibaca di sidebar dan panel atas.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.in_app}
                onChange={() => handleToggle("in_app")}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="py-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-indigo-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">Email Digest & Rangkuman</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kirim email ringkasan tugas, @mention, dan konfirmasi dokumen penting.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.email_digest}
                onChange={() => handleToggle("email_digest")}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="py-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">Pemberitahuan WhatsApp Otomatis</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Terima pesan WhatsApp Cloud API untuk persetujuan mendesak dan status kandidat/payroll.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.whatsapp_alerts}
                onChange={() => handleToggle("whatsapp_alerts")}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard label="Keamanan & Eskalasi SLA">
          <div className="divide-y">
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">Peringatan Keterlambatan SLA (&gt;24 Jam)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Otomatis eskalasi dan beri tanda merah pada approval yang menggantung melebihi 24 jam.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.sla_warnings}
                onChange={() => handleToggle("sla_warnings")}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="py-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-500 mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">Mode Jam Hening (Quiet Hours)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tunda notifikasi non-kritis di luar jam kerja (21:00 - 07:00 WIB).
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.quiet_hours_enabled}
                onChange={() => handleToggle("quiet_hours_enabled")}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
