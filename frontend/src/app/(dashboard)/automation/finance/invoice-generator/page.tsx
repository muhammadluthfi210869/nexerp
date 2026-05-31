"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "Invoice", fields: ["invoiceNumber", "amountDue", "issuedAt", "soId"] },
  { model: "SalesOrder", fields: ["orderNumber", "totalAmount"] },
];

const CONFIG_FIELDS = [
  { name: "template", type: "select", description: "Invoice PDF template", default: "Standard" },
  { name: "autoEmail", type: "boolean", description: "Auto email to customer", default: "false" },
  { name: "includeTax", type: "boolean", description: "Include tax breakdown", default: "true" },
];

const PREVIEW_COLUMNS = [
  { key: "invoice", label: "Invoice" },
  { key: "so", label: "Sales Order" },
  { key: "customer", label: "Customer" },
  { key: "amount", label: "Amount", format: "currency" },
  { key: "pdf", label: "PDF Status", format: "badge" },
];

const PREVIEW_DATA = [
  { invoice: "INV-026", so: "SO-001", customer: "PT Maju Jaya", amount: 50000000, pdf: "Generated" },
  { invoice: "INV-027", so: "SO-002", customer: "CV Sinar Abadi", amount: 25000000, pdf: "Generated" },
  { invoice: "INV-028", so: "SO-003", customer: "PT Kimia Farma", amount: 75000000, pdf: "Pending" },
];

export default function InvoiceGeneratorPage() {
  return (
    <AutomationShell
      title="Invoice Generator (PDF)"
      division="Finance / BussDev"
      fase={2}
      dataReady={false}
      needsConfig={true}
      configFields={CONFIG_FIELDS}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        Dari sales order yang sudah approved, sistem otomatis generate invoice dalam format PDF
        berdasarkan template yang dikonfigurasi. Output bisa langsung dikirim ke email customer.
      </p>
    </AutomationShell>
  );
}
