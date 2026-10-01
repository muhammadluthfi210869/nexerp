/**
 * Sales Orders (SO) â€” Domain Types & Schemas
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 17, 60, & 120),
 * dan REQUIREMENT.md Poin 38 (Input deadline per PIC), 148 (Format Kode Universal ringkas/lengkap),
 * serta AR Delivery Gatekeeper (HELD vs RELEASED).
 */

export type SalesOrderCategory = "MAKLON_BARU" | "REPEAT_ORDER" | "JUAL_PUTUS";
export type SalesOrderApprovalStatus = "PENDING" | "APPROVED" | "IN_PRODUCTION" | "COMPLETED";
export type SalesOrderGatekeeperStatus = "HELD" | "RELEASED";
export type CodeFormatType = "SHORT" | "FULL";

export interface SalesOrderItemLine {
  id?: string;
  itemName: string;
  netto: string;
  qty: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface SalesOrderDeadlinePic {
  design: string;
  rnd: string;
  scm: string;
  production: string;
}

export interface SalesOrderItem {
  id: string;
  soCode: string; // Universal Code e.g. DL-FIN-SO-202609-0001
  orderDate: string;
  customerName: string;
  brandName: string;
  category: SalesOrderCategory;
  deadlineFinal: string;
  deadlinePic: SalesOrderDeadlinePic;
  items: SalesOrderItemLine[];
  grandTotal: number;
  approvalStatus: SalesOrderApprovalStatus;
  gatekeeperStatus: SalesOrderGatekeeperStatus;
  notes?: string;
}

export interface SalesOrderFormData {
  customerName: string;
  brandName: string;
  category: SalesOrderCategory;
  orderDate: string;
  deadlineFinal: string;
  deadlineDesign: string;
  deadlineRnd: string;
  deadlineScm: string;
  deadlineProduction: string;
  items: SalesOrderItemLine[];
  notes: string;
}
