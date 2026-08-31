"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
 Loader2,
 Phone,
 ShieldCheck,
 AlertTriangle,
 Wifi,
 RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { DnaBadge, DnaButton, SectionLabel } from "@/components/dna";

// Authoritative 4 Sales — source of truth is the pre-deploy directive.
// internalCode MUST match the backend's SALES_DEVICES array exactly.
const SALES_ROSTER: ReadonlyArray<{
 internalCode: string;
 displayName: string;
 rawPhone: string;
}> = [
 { internalCode: "SALES-NISA", displayName: "Nisa", rawPhone: "6281952417051" },
 { internalCode: "SALES-JESSICA", displayName: "Jessica", rawPhone: "6287712232389" },
 { internalCode: "SALES-DIAZ", displayName: "Diaz", rawPhone: "6287776550657" },
 { internalCode: "SALES-IRMA", displayName: "Irma", rawPhone: "6285133188827" },
];

// UI-only status set (NOT 1:1 with backend device status).
// The backend exposes SelfQrDeviceStatus with ~11 enum values; we collapse
// it to 4 UI states per the pre-deploy directive.
type UiStatus = "NOT_CONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";

function maskPhone(raw: string): string {
 // 6281952417051 → 0819••••7051 (locale-friendly)
 if (raw.length < 8) return raw;
 const visible = raw.slice(-4);
 const prefix = raw.startsWith("62") ? "0" + raw.slice(2, 6) : raw.slice(0, 4);
 return `${prefix}••••${visible}`;
}

function collapseStatus(raw: string | null | undefined): UiStatus {
 const s = (raw ?? "").toUpperCase();
 if (s === "CONNECTED" || s === "READY") return "CONNECTED";
 if (
 s === "CONNECTING" ||
 s === "PAIRING_CODE_READY" ||
 s === "PAIRING" ||
 s === "SYNCING_HISTORY" ||
 s === "RECONNECTING"
 )
 return "CONNECTING";
 if (s === "ERROR") return "ERROR";
 // UNPAIRED, LOGGED_OUT, SUSPENDED, missing
 return "NOT_CONNECTED";
}

interface BackendDevice {
 deviceId: string | null;
 internalCode: string;
 displayName: string;
 normalizedPhone: string;
 status: string;
 pairedAt: string | null;
 lastError: string | null;
}

export default function WhatsAppSalesClient() {
 const [devices, setDevices] = useState<Record<string, BackendDevice>>({});
 const [loading, setLoading] = useState(true);
 const [fetchError, setFetchError] = useState<string | null>(null);
 const [pendingCode, setPendingCode] = useState<string | null>(null);
 const [actionError, setActionError] = useState<string | null>(null);

 const fetchDevices = useCallback(async () => {
 try {
 const res = await api.get<{ devices: BackendDevice[] }>(
 "/wa-self-qr/sales-devices",
 );
 const map: Record<string, BackendDevice> = {};
 for (const d of res.data?.devices ?? []) {
 map[d.internalCode] = d;
 }
 setDevices(map);
 setFetchError(null);
 } catch (err: any) {
 const status = err?.response?.status;
 // 401 is fine for prototype mode / unauthenticated browsing — surface
 // a soft warning instead of a hard error.
 if (status === 401 || status === 403) {
 setFetchError("Tidak terautentikasi. Hubungkan perangkat setelah login.");
 } else {
 setFetchError(err?.message ?? "Gagal memuat status perangkat.");
 }
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchDevices();
 const t = setInterval(fetchDevices, 10_000);
 return () => clearInterval(t);
 }, [fetchDevices]);

 const onConnect = useCallback(
 async (internalCode: string) => {
 setPendingCode(internalCode);
 setActionError(null);
 try {
 const res = await api.post<{ url: string; token: string; expiresAt: string }>(
 `/wa-self-qr/sales-devices/${internalCode}/connect-token`,
 );
 if (res.data?.url) {
 // Open the connect page in a new tab so the operator can hand the
 // phone to the Sales.
 window.open(res.data.url, "_blank", "noopener,noreferrer");
 }
 } catch (err: any) {
 setActionError(
 err?.response?.data?.message ??
 err?.message ??
 "Gagal membuat tautan koneksi.",
 );
 } finally {
 setPendingCode(null);
 }
 },
 [],
 );

 const roster = useMemo(
 () =>
 SALES_ROSTER.map((s) => {
 const dev = devices[s.internalCode];
 const uiStatus = collapseStatus(dev?.status);
 return {
 ...s,
 backendStatus: dev?.status ?? "UNKNOWN",
 pairedAt: dev?.pairedAt ?? null,
 uiStatus,
 };
 }),
 [devices],
 );

 return (
 <div className="flex flex-col" style={{ gap: "var(--section-gap)" }}>
 <div className="flex items-center justify-between">
 <SectionLabel>4 Sales WhatsApp Aktif</SectionLabel>
 <DnaButton
 variant="ghost"
 size="sm"
 icon={<RefreshCw />}
 onClick={fetchDevices}
 loading={loading}
 >
 Segarkan
 </DnaButton>
 </div>

 {fetchError && (
 <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4" />
 {fetchError}
 </div>
 )}

 {actionError && (
 <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4" />
 {actionError}
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[var(--card-gap)]">
 {roster.map((s) => (
 <SalesCard
 key={s.internalCode}
 sales={s}
 loading={loading}
 pending={pendingCode === s.internalCode}
 onConnect={() => onConnect(s.internalCode)}
 />
 ))}
 </div>

 <div className="bg-white border border-[var(--border-color)] rounded-[16px] p-5 text-xs text-slate-500 leading-relaxed">
 <div className="flex items-start gap-3">
 <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <p className="font-bold uppercase tracking-wide text-slate-600 text-[11px]">
 Passive Collector
 </p>
 <p>
 Self QR hanya menerima dan mencatat pesan masuk. Tidak ada
 pengiriman, balasan otomatis, broadcast, atau template API
 yang diaktifkan dari halaman ini. QR pairing hanya untuk
 menghubungkan akun WhatsApp resmi Sales ke pipeline lead.
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}

function SalesCard({
 sales,
 loading,
 pending,
 onConnect,
}: {
 sales: {
 internalCode: string;
 displayName: string;
 rawPhone: string;
 backendStatus: string;
 pairedAt: string | null;
 uiStatus: UiStatus;
 };
 loading: boolean;
 pending: boolean;
 onConnect: () => void;
}) {
 const status = sales.uiStatus;
 const lastReady = sales.pairedAt
 ? new Date(sales.pairedAt).toLocaleString("id-ID", {
 dateStyle: "short",
 timeStyle: "short",
 })
 : null;

 return (
 <div className="erp-data-card bg-white border border-[var(--border-color)] rounded-[16px] p-6 flex flex-col gap-5 animate-fade-slide-in">
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-1 min-w-0">
 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
 Marketing Sales
 </p>
 <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight truncate">
 {sales.displayName}
 </h3>
 </div>
 <StatusBadge status={status} loading={loading} />
 </div>

 <div className="flex items-center gap-2 text-sm text-slate-500">
 <Phone className="w-4 h-4 shrink-0" />
 <span className="font-medium tabular-nums">
 {maskPhone(sales.rawPhone)}
 </span>
 </div>

 <div className="border-t border-slate-100 pt-4 space-y-1">
 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
 {status === "CONNECTED" ? "Terhubung Sejak" : "Status"}
 </p>
 <p className="text-xs text-slate-600">
 {loading
 ? "Memuat..."
 : status === "CONNECTED"
 ? lastReady ?? "—"
 : status === "CONNECTING"
 ? "Menghubungkan..."
 : status === "ERROR"
 ? "Tidak dapat terhubung"
 : "Belum terhubung"}
 </p>
 </div>

 <div className="mt-auto">
 <ActionButton
 status={status}
 pending={pending}
 onClick={onConnect}
 />
 </div>
 </div>
 );
}

function StatusBadge({
 status,
 loading,
}: {
 status: UiStatus;
 loading: boolean;
}) {
 if (loading) {
 return (
 <DnaBadge status="default">
 <Loader2 className="w-3 h-3 animate-spin" />
 Memuat
 </DnaBadge>
 );
 }
 switch (status) {
 case "CONNECTED":
 return (
 <DnaBadge status="success">
 <Wifi className="w-3 h-3" />
 Terhubung
 </DnaBadge>
 );
 case "CONNECTING":
 return (
 <DnaBadge status="warning">
 <Loader2 className="w-3 h-3 animate-spin" />
 Menghubungkan
 </DnaBadge>
 );
 case "ERROR":
 return (
 <DnaBadge status="critical">
 <AlertTriangle className="w-3 h-3" />
 Error
 </DnaBadge>
 );
 default:
 return (
 <DnaBadge status="default">
 <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
 Belum
 </DnaBadge>
 );
 }
}

function ActionButton({
 status,
 pending,
 onClick,
}: {
 status: UiStatus;
 pending: boolean;
 onClick: () => void;
}) {
 if (status === "CONNECTING") {
 return (
 <DnaButton variant="outline" size="md" disabled icon={<Loader2 className="animate-spin" />}>
 Menghubungkan…
 </DnaButton>
 );
 }
 if (status === "CONNECTED") {
 return (
 <DnaButton variant="secondary" size="md" icon={<Wifi />} disabled>
 Sudah Terhubung
 </DnaButton>
 );
 }
 if (status === "ERROR") {
 return (
 <DnaButton variant="primary" size="md" onClick={onClick} loading={pending}>
 Coba Hubungkan Lagi
 </DnaButton>
 );
 }
 return (
 <DnaButton variant="primary" size="md" onClick={onClick} loading={pending}>
 Hubungkan WhatsApp
 </DnaButton>
 );
}
