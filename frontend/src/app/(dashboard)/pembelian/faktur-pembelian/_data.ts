export interface PurchaseBillItem {
  id: string;
  billNumber: string;
  vendorName: string;
  poNumber: string;
  grNumber?: string;
  billDate: string;
  invoiceDate?: string;
  dueDate: string;
  subTotal: number;
  subtotal?: number;
  totalDiscount?: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  unpaidReason?: string;
  procurementCategory?: string;
  pic?: string;
  items: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    qty: number;
    unitPrice: number;
    discount?: number;
    subtotal: number;
    rejectQty?: number;
  }>;
}
