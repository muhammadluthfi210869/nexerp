"use client";

// Lead detail page — /marketing/omnicrm/leads/[id].
// Drill-down from the overview table. Shows:
// - Phone + editable displayName (PATCH /crm/leads/:id/displayName)
// - Stage badge + stage-change select (PATCH /crm/leads/:id/stage)
// - Buku Tamu approval status (link to /guestbook to act)
// - Chat timeline (GET /crm/leads/:id/messages)

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { DnaBadge, DnaButton, DnaSearchableSelect, type DnaSelectOption } from "@/components/dna";

type CrmStage = "LEADS_MASUK" | "COLD" | "WARM" | "HOT" | "SAMPLE" | "JUNK_LEADS" | "CLIENT_DEAL" | "CLOSED_LOST";
type BukuTamuStatus = "PENDING" | "APPROVED" | "REJECTED";

interface LeadDetail {
  id: string;
  trackingCode: string | null;
  stage: CrmStage;
  displayName: string | null;
  phone: string;
  source: string;
  pageUrl: string | null;
  pageTitle: string | null;
  assignedToId: string | null;
  createdAt: string;
  guestbookEvent: { id: string; approvalStatus: BukuTamuStatus } | null;
}

interface LeadMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  phone: string | null;
  waName: string | null;
  body: string;
  createdAt: string;
}

const STAGE_OPTIONS: DnaSelectOption[] = [
  { value: "LEADS_MASUK", label: "Leads Masuk" },
  { value: "COLD", label: "Cold" },
  { value: "WARM", label: "Warm" },
  { value: "HOT", label: "Hot" },
  { value: "SAMPLE", label: "Sample" },
  { value: "JUNK_LEADS", label: "Junk Leads" },
  { value: "CLIENT_DEAL", label: "Client Deal" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [stage, setStage] = useState<CrmStage | "">("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const [leadRes, msgRes] = await Promise.all([
        api.get<LeadDetail>(`/crm/leads/${id}`),
        api.get<LeadMessage[]>(`/crm/leads/${id}/messages`),
      ]);
      setLead(leadRes.data);
      setDisplayName(leadRes.data.displayName ?? "");
      setStage(leadRes.data.stage);
      setMessages(msgRes.data);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat lead");
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const saveDisplayName = async () => {
    setSaving(true);
    try {
      await api.patch(`/crm/leads/${id}/displayName`, { displayName });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Gagal menyimpan nama");
    } finally {
      setSaving(false);
    }
  };

  const saveStage = async (newStage: string) => {
    setSaving(true);
    try {
      await api.patch(`/crm/leads/${id}/stage`, { stage: newStage });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Gagal mengubah stage");
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (error && !lead) {
    return <div className="p-6 text-sm text-red-600" data-testid="lead-detail-error">{error}</div>;
  }
  if (!lead) return <div className="p-6 text-sm text-muted-foreground">Memuat…</div>;

  return (
    <div className="flex flex-col gap-4 p-6 md:p-8" data-testid="lead-detail">
      <div className="flex items-center gap-3">
        <Link href="/marketing/omnicrm" className="text-sm text-muted-foreground hover:underline">
          ← Kembali ke Live Capture
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{lead.displayName ?? "(belum ada nama)"}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{lead.trackingCode ?? lead.id}</span>
          <DnaBadge status="default">{lead.source}</DnaBadge>
          <DnaBadge status={lead.stage === "CLIENT_DEAL" ? "default" : lead.stage === "JUNK_LEADS" || lead.stage === "CLOSED_LOST" ? "warning" : "default"}>
            {lead.stage.replace(/_/g, " ")}
          </DnaBadge>
          {lead.guestbookEvent && (
            <DnaBadge status={lead.guestbookEvent.approvalStatus === "APPROVED" ? "default" : "warning"}>
              Buku Tamu: {lead.guestbookEvent.approvalStatus}
            </DnaBadge>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Phone</h3>
          <p className="mt-1 text-lg font-medium tabular-nums" data-testid="lead-detail-phone">{lead.phone}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Thankyou Page</h3>
          <p className="mt-1 truncate text-sm" title={lead.pageUrl ?? ""}>{lead.pageTitle ?? lead.pageUrl ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Created</h3>
          <p className="mt-1 text-sm tabular-nums">{new Date(lead.createdAt).toLocaleString("id-ID")}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold">Edit Display Name</h3>
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={120}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              data-testid="lead-detail-displayname-input"
            />
          </div>
          <DnaButton variant="primary" onClick={saveDisplayName} disabled={saving} data-testid="lead-detail-displayname-save">
            Simpan
          </DnaButton>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Override <code>extractedFullName</code> dari AI. Jika kosong, akan tampil "(belum ada nama)".
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold">Stage</h3>
        <div className="flex items-center gap-2">
          <DnaSearchableSelect
            options={STAGE_OPTIONS}
            value={stage}
            onChange={(v) => { setStage(v as CrmStage); saveStage(String(v)); }}
            placeholder="Pilih stage"
            disabled={saving}
            data-testid="lead-detail-stage-select"
          />
          {saving && <span className="text-xs text-muted-foreground">Menyimpan…</span>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Stage machine guard berlaku: hanya transisi yang diizinkan (lihat <code>phase-omnicrm-contract.json</code> §5).
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold">Chat Timeline ({messages.length})</h3>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada pesan.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`flex flex-col gap-1 rounded-md border p-2 text-xs ${m.direction === "INBOUND" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}
                data-testid={`lead-detail-message-${m.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{m.waName ?? m.phone ?? "(unknown)"}</span>
                  <span className="text-muted-foreground">{new Date(m.createdAt).toLocaleString("id-ID")}</span>
                </div>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
