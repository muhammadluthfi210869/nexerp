"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaCard,
  DnaFormSection,
  DnaInput,
  DnaButton,
  DnaBadge,
  DnaSwitch,
  DnaInfoCard,
} from "@/components/dna";
import {
  User,
  Shield,
  Bell,
  KeyRound,
  Smartphone,
  Laptop,
  LogOut,
  Clock,
  Building,
  Mail,
  Phone,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function UserProfilePage() {
  const [profile, setProfile] = useState({
    fullName: "Muhammad Luthfi",
    email: "luthfi@divaarya.co.id",
    employeeId: "EMP-2024-0012",
    phone: "+62 812-3456-7890",
    role: "Direktur Keuangan & Operasional",
    department: "Executive Management",
    joinedDate: "15 Januari 2024",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailApproval: true,
    whatsappAlerts: true,
    dailyFinancialDigest: true,
    suspiciousLogin: true,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const sessions = [
    {
      id: "sess-1",
      device: "Chrome / Windows 11 (Perangkat Ini)",
      ip: "103.145.22.10 (Jakarta, ID)",
      lastActive: "Sedang Aktif Sekarang",
      isCurrent: true,
      icon: Laptop,
    },
    {
      id: "sess-2",
      device: "NexERP Mobile / Android 14",
      ip: "114.122.38.92 (Bandung, ID)",
      lastActive: "2 jam yang lalu",
      isCurrent: false,
      icon: Smartphone,
    },
  ];

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profil Anda berhasil diperbarui.");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      toast.error("Masukkan kata sandi saat ini.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    toast.success("Kata sandi berhasil diubah! Silakan gunakan sandi baru untuk login berikutnya.");
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Akun Saya"
        subtitle="Kelola data akun personal, preferensi notifikasi, dan keamanan login"
        badge={<DnaBadge variant="blue">Profil Pengguna</DnaBadge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <DnaCard title="Ringkasan Akun" icon={User}>
            <div className="flex flex-col items-center text-center p-4 border-b border-border/40">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-2xl mb-3 shadow-inner">
                {profile.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-1.5">
                {profile.fullName}
                <BadgeCheck className="w-4 h-4 text-primary" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.role}</p>
              <div className="mt-2 flex gap-2">
                <DnaBadge variant="green">Akun Aktif</DnaBadge>
                <DnaBadge variant="purple">{profile.department}</DnaBadge>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </span>
                <span className="font-mono font-medium">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> No. WhatsApp
                </span>
                <span className="font-mono font-medium">{profile.phone}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> NIK / ID Karyawan
                </span>
                <span className="font-mono font-medium">{profile.employeeId}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Bergabung
                </span>
                <span className="font-medium">{profile.joinedDate}</span>
              </div>
            </div>
          </DnaCard>

          <DnaInfoCard
            variant="blue"
            title="Keamanan Dua Faktor (2FA)"
            description="2FA aktif melindungi akun Anda dari akses yang tidak sah melalui kode OTP WhatsApp/Authenticator."
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <DnaCard title="Biodata Diri" icon={User}>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DnaFormSection title="Nama Lengkap">
                  <DnaInput
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    required
                  />
                </DnaFormSection>
                <DnaFormSection title="Email Resmi">
                  <DnaInput
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                  />
                </DnaFormSection>
                <DnaFormSection title="No. Handphone / WhatsApp">
                  <DnaInput
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    required
                  />
                </DnaFormSection>
                <DnaFormSection title="ID Karyawan (Read-Only)">
                  <DnaInput
                    value={profile.employeeId}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                </DnaFormSection>
              </div>

              <div className="flex justify-end pt-2">
                <DnaButton type="submit" variant="primary" size="sm">
                  Simpan Perubahan Biodata
                </DnaButton>
              </div>
            </form>
          </DnaCard>

          <DnaCard title="Keamanan & Kata Sandi" icon={Shield}>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DnaFormSection title="Password Saat Ini">
                  <DnaInput
                    type="password"
                    placeholder="••••••••"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  />
                </DnaFormSection>
                <DnaFormSection title="Password Baru">
                  <DnaInput
                    type="password"
                    placeholder="Min. 8 karakter"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  />
                </DnaFormSection>
                <DnaFormSection title="Konfirmasi Password">
                  <DnaInput
                    type="password"
                    placeholder="Ulangi sandi baru"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  />
                </DnaFormSection>
              </div>

              <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DnaSwitch
                    checked={twoFactorEnabled}
                    onChange={setTwoFactorEnabled}
                    label="Autentikasi Dua Faktor (2FA OTP)"
                  />
                </div>
                <DnaButton type="submit" variant="outline" size="sm">
                  <KeyRound className="w-4 h-4 mr-1.5" />
                  Perbarui Kata Sandi
                </DnaButton>
              </div>
            </form>
          </DnaCard>

          <DnaCard title="Preferensi Notifikasi & Sesi" icon={Bell}>
            <div className="space-y-5">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saluran Notifikasi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DnaSwitch
                    checked={notifications.emailApproval}
                    onChange={(val) => setNotifications({ ...notifications, emailApproval: val })}
                    label="Notifikasi Email Saat Approval Menunggu"
                    description="Kirim email saat ada dokumen PO, SO, atau Jurnal butuh persetujuan."
                  />
                  <DnaSwitch
                    checked={notifications.whatsappAlerts}
                    onChange={(val) => setNotifications({ ...notifications, whatsappAlerts: val })}
                    label="Notifikasi WhatsApp Dokumen Kritis"
                    description="Kirim pesan WA saat ada pembayaran masuk atau jatuh tempo AR H-3."
                  />
                  <DnaSwitch
                    checked={notifications.dailyFinancialDigest}
                    onChange={(val) => setNotifications({ ...notifications, dailyFinancialDigest: val })}
                    label="Ringkasan Harian Keuangan"
                    description="Laporan kas masuk/keluar setiap jam 17:00 WIB."
                  />
                  <DnaSwitch
                    checked={notifications.suspiciousLogin}
                    onChange={(val) => setNotifications({ ...notifications, suspiciousLogin: val })}
                    label="Peringatan Login Baru"
                    description="Notifikasi instan jika akun diakses dari lokasi atau perangkat baru."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sesi Aktif</h4>
                  <DnaButton
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => toast.success("Semua sesi lain telah dikeluarkan.")}
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    Keluarkan Sesi Lain
                  </DnaButton>
                </div>

                <div className="space-y-2">
                  {sessions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-muted/20 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-background border border-border/50">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-2">
                              {s.device}
                              {s.isCurrent && (
                                <DnaBadge variant="green">
                                  Aktif Sekarang
                                </DnaBadge>
                              )}
                            </div>
                            <div className="text-muted-foreground font-mono text-[11px] mt-0.5">
                              {s.ip} • {s.lastActive}
                            </div>
                          </div>
                        </div>
                        {!s.isCurrent && (
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.success("Sesi perangkat telah dicabut.")}
                          >
                            Cabut
                          </DnaButton>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DnaCard>
        </div>
      </div>
    </DnaPageContainer>
  );
}
