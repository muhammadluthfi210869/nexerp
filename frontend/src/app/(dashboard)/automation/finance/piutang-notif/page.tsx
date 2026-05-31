"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "Invoice", fields: ["dueDate", "outstandingAmount", "paidAt"] },
  { model: "Notification", fields: ["userId", "title", "type"] },
];

const PREVIEW_COLUMNS = [
  { key: "invoice", label: "Invoice" },
  { key: "customer", label: "Customer" },
  { key: "dueDate", label: "Jatuh Tempo" },
  { key: "outstanding", label: "Outstanding", format: "currency" },
  { key: "daysLeft", label: "H-" },
  { key: "notification", label: "Notifikasi", format: "badge" },
];

const PREVIEW_DATA = [
  { invoice: "INV-001", customer: "PT Maju Jaya", dueDate: "07/06/2026", outstanding: 50000000, daysLeft: "H-7", notification: "Reminder" },
  { invoice: "INV-002", customer: "CV Sinar Abadi", dueDate: "13/06/2026", outstanding: 25000000, daysLeft: "H-1", notification: "Warning" },
  { invoice: "INV-003", customer: "PT Kimia Farma", dueDate: "31/05/2026", outstanding: 75000000, daysLeft: "H+6", notification: "Kritis" },
  { invoice: "INV-004", customer: "UD Maju Bersama", dueDate: "01/05/2026", outstanding: 15000000, daysLeft: "H+36", notification: "Escalation" },
];

export default function PiutangNotifPage() {
  return (
    <AutomationShell
      title="Piutang Aging Auto-Notification"
      division="Finance / BussDev"
      fase={1}
      dataReady={true}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        Cron harian mengecek <strong>Invoice</strong> dengan <code>outstandingAmount &gt; 0</code>:
        H-7 &rarr; notif pengingat, H-1 &rarr; notif warning, H+1 &rarr; notif keterlambatan,
        H+30 &rarr; escalation ke direktur. Menggunakan <strong>NotificationService</strong> yang sudah ada.
      </p>
    </AutomationShell>
  );
}
