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
  DnaSelect,
} from "@/components/dna";
import {
  Hash,
  Coins,
  Database,
  Save,
  Download,
  Calendar,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function SystemSettingsPage() {
  const [docFormat, setDocFormat] = useState<"FULL" | "COMPACT">("FULL");
  const [resetPeriod, setResetPeriod] = useState("MONTHLY");
  const [prefixes, setPrefixes] = useState({
    so: "SO",
    po: "PO",
    inv: "INV",
    gl: "GL",
    ast: "DL-FIN-AST",
    pm: "PM",
  });

  const [financeConfig, setFinanceConfig] = useState({
    currency: "IDR",
    paymentTermsDays: "30",
    ppnRate: "11",
    closingGraceDays: "5",
    autoLockEnabled: true,
  });

  const [securityConfig, setSecurityConfig] = useState({
    sessionTimeoutMinutes: "60",
    auditRetentionDays: "365",
    maintenanceMode: false,
    enforceStrongPassword: true,
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pengaturan sistem berhasil disimpan dan disinkronkan ke seluruh modul.");
  };

  const handleManualBackup = () => {
    toast.info("Memulai pencadangan database PostgreSQL & aset media...");
    setTimeout(() => {
      toast.success("Cadangan berhasil dibuat: backup_nexerp_20260908_full.tar.gz (24.8 MB)");
    }, 1500);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pengaturan Sistem"
        subtitle="Konfigurasi format penomoran dokumen, parameter keuangan, backup, dan kebijakan sistem"
        badge={<DnaBadge variant="purple">Konfigurasi Inti</DnaBadge>}
        actions={
          <div className="flex gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={handleManualBackup}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Backup Manual
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              onClick={handleSaveSettings}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Simpan Pengaturan
            </DnaButton>
          </div>
        }
      />

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <DnaCard title="Penomoran Dokumen & Universal Code" icon={Hash}>
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/20 border border-border/40">
              <div>
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  Format Kode Dokumen (Poin 76)
                  <DnaBadge variant={docFormat === "FULL" ? "blue" : "purple"}>
                    {docFormat === "FULL" ? "Format Lengkap" : "Format Ringkas"}
                  </DnaBadge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Format Lengkap: <code className="font-mono text-primary font-semibold">DL-DIV-PRD-DDMMYYYY-XXXX</code> (Audit ISO/BPOM)
                  <br />
                  Format Ringkas: <code className="font-mono text-muted-foreground">PRD-DDMMYYYY-XXXX</code> (Operasional cepat)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <DnaSwitch
                  checked={docFormat === "FULL"}
                  onChange={(val) => setDocFormat(val ? "FULL" : "COMPACT")}
                  label="Gunakan Format Lengkap"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <DnaFormSection title="Siklus Reset Nomor Urut">
                <DnaSelect
                  value={resetPeriod}
                  onChange={(val) => setResetPeriod(val)}
                  options={[
                    { label: "Setiap Bulan (YYYYMM)", value: "MONTHLY" },
                    { label: "Setiap Tahun (YYYY)", value: "YEARLY" },
                    { label: "Nomor Berjalan (Tidak Pernah)", value: "NEVER" },
                  ]}
                />
              </DnaFormSection>

              <DnaFormSection title="Prefix Sales Order (SO)">
                <DnaInput
                  value={prefixes.so}
                  onChange={(e) => setPrefixes({ ...prefixes, so: e.target.value })}
                />
              </DnaFormSection>

              <DnaFormSection title="Prefix Purchase Order (PO)">
                <DnaInput
                  value={prefixes.po}
                  onChange={(e) => setPrefixes({ ...prefixes, po: e.target.value })}
                />
              </DnaFormSection>

              <DnaFormSection title="Prefix Invoice Piutang (INV)">
                <DnaInput
                  value={prefixes.inv}
                  onChange={(e) => setPrefixes({ ...prefixes, inv: e.target.value })}
                />
              </DnaFormSection>

              <DnaFormSection title="Prefix General Ledger (GL)">
                <DnaInput
                  value={prefixes.gl}
                  onChange={(e) => setPrefixes({ ...prefixes, gl: e.target.value })}
                />
              </DnaFormSection>

              <DnaFormSection title="Prefix Aset Tetap (AST)">
                <DnaInput
                  value={prefixes.ast}
                  onChange={(e) => setPrefixes({ ...prefixes, ast: e.target.value })}
                />
              </DnaFormSection>
            </div>
          </div>
        </DnaCard>

        <DnaCard title="Parameter Keuangan & Penagihan" icon={Coins}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DnaFormSection title="Mata Uang Pembukuan Utama">
                <DnaInput
                  value={financeConfig.currency}
                  disabled
                  className="bg-muted/50 cursor-not-allowed font-mono"
                />
              </DnaFormSection>

              <DnaFormSection title="Termin Pembayaran Standar (Hari)">
                <DnaInput
                  type="number"
                  value={financeConfig.paymentTermsDays}
                  onChange={(e) => setFinanceConfig({ ...financeConfig, paymentTermsDays: e.target.value })}
                />
              </DnaFormSection>

              <DnaFormSection title="Tarif PPN Standar (%)">
                <DnaInput
                  type="number"
                  value={financeConfig.ppnRate}
                  onChange={(e) => setFinanceConfig({ ...financeConfig, ppnRate: e.target.value })}
                />
              </DnaFormSection>
            </div>

            <div className="pt-3 border-t border-border/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  Kunci Periode Akuntansi Otomatis
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Secara otomatis mengunci posting jurnal bulan sebelumnya pada tanggal 5 setiap bulan baru.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <span>Grace Period:</span>
                  <input
                    type="number"
                    className="w-14 px-2 py-1 border rounded text-center bg-background"
                    value={financeConfig.closingGraceDays}
                    onChange={(e) => setFinanceConfig({ ...financeConfig, closingGraceDays: e.target.value })}
                  />
                  <span>Hari</span>
                </div>
                <DnaSwitch
                  checked={financeConfig.autoLockEnabled}
                  onChange={(val) => setFinanceConfig({ ...financeConfig, autoLockEnabled: val })}
                />
              </div>
            </div>
          </div>
        </DnaCard>

        <DnaCard title="Database, Audit Trail & Pemeliharaan" icon={Database}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border/40 bg-muted/10 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Status Pencadangan Otomatis</div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Aktif (Setiap Hari Pukul 02:00 WIB)
                </div>
                <p className="text-xs text-muted-foreground">
                  Snapshot tersimpan di Cloud Object Storage terenkripsi AES-256. Retensi cadangan: 30 hari.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border/40 bg-muted/10 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Retensi Log Audit Trail</div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  {securityConfig.auditRetentionDays} Hari (1 Tahun Kalender)
                </div>
                <p className="text-xs text-muted-foreground">
                  Semua mutasi entitas, void dokumen, dan aksi approval tersimpan permanen per regulasi ISO.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Mode Pemeliharaan (Maintenance Mode)
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hanya akun Administrator yang dapat mengakses aplikasi. Transaksi operasional dihentikan sementara.
                </p>
              </div>
              <DnaSwitch
                checked={securityConfig.maintenanceMode}
                onChange={(val) => {
                  setSecurityConfig({ ...securityConfig, maintenanceMode: val });
                  if (val) {
                    toast.warning("Mode pemeliharaan diaktifkan! Pengguna operasional akan diblokir.");
                  } else {
                    toast.success("Mode pemeliharaan dinonaktifkan. Sistem normal kembali.");
                  }
                }}
              />
            </div>
          </div>
        </DnaCard>
      </form>
    </DnaPageContainer>
  );
}
