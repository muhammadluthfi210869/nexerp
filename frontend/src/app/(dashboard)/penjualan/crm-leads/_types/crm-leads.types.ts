export interface SalesMember {
  name: string;
  phone: string;
  active: boolean;
}

export interface LeadConversion {
  id: string;
  visitId?: string;
  pageUrl: string;
  pageTitle?: string;
  source: string;
  nama?: string;
  perusahaan?: string;
  hp?: string;
  produk?: string;
  trafficSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  assignedTo?: string;
  assignedPhone?: string;
  status: string;
  timestamp: string;
}

export interface OperationalLeadItem {
  penerima: string;
  qty: number;
}

export interface OperationalLeadBatch {
  id: string;
  tanggalLeads: string;
  catatan: string;
  totalQtyLeads: number;
  items: OperationalLeadItem[];
}

export type CRMTab = "operational" | "leads" | "sales" | "stats";

export interface CRMDistributionStats {
  sales: [string, number][];
  pages: [string, number][];
  traffics: [string, number][];
  products: [string, number][];
}

export interface CRMFilterOptions {
  sources: string[];
  traffics: string[];
}

export const INITIAL_BATCHES: OperationalLeadBatch[] = [
  {
    id: "LEAD-2026-001",
    tanggalLeads: "2026-09-15",
    catatan: "Distribusi Leads Kampanye TikTok Skincare Glow",
    totalQtyLeads: 45,
    items: [
      { penerima: "Edi (BusDev)", qty: 15 },
      { penerima: "Rendi (BusDev)", qty: 15 },
      { penerima: "Rina (BusDev)", qty: 15 },
    ],
  },
  {
    id: "LEAD-2026-002",
    tanggalLeads: "2026-09-12",
    catatan: "Inbound Leads Expo Kosmetik Jakarta 2026",
    totalQtyLeads: 30,
    items: [
      { penerima: "Siti (BusDev)", qty: 10 },
      { penerima: "Budi (BusDev)", qty: 10 },
      { penerima: "Maya (BusDev)", qty: 10 },
    ],
  },
  {
    id: "LEAD-2026-003",
    tanggalLeads: "2026-09-08",
    catatan: "Batch Leads Digital Ads Serum Retinol Anti Aging",
    totalQtyLeads: 60,
    items: [
      { penerima: "Edi (BusDev)", qty: 20 },
      { penerima: "Rina (BusDev)", qty: 20 },
      { penerima: "Maya (BusDev)", qty: 20 },
    ],
  },
  {
    id: "LEAD-2026-004",
    tanggalLeads: "2026-09-01",
    catatan: "Batch Leads Brand Body Lotion Tone Up",
    totalQtyLeads: 25,
    items: [
      { penerima: "Rendi (BusDev)", qty: 12 },
      { penerima: "Siti (BusDev)", qty: 13 },
    ],
  },
];

export const AVAILABLE_RECEIVERS: string[] = [
  "Edi (BusDev)",
  "Rendi (BusDev)",
  "Rina (BusDev)",
  "Siti (BusDev)",
  "Budi (BusDev)",
  "Maya (BusDev)",
];
