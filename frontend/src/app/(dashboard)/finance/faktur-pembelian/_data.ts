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

export const INITIAL_BILLS_DATA: PurchaseBillItem[] = [
  {
    id: "bill-1",
    billNumber: "FB-202609-0001",
    vendorName: "PT Bahan Kimia Farma",
    poNumber: "PO-202608-00030",
    grNumber: "GR-202609-000006",
    billDate: "2026-09-01",
    dueDate: "2026-10-01",
    subTotal: 12800000,
    taxAmount: 1408000,
    grandTotal: 14208000,
    paidAmount: 0,
    paymentStatus: "UNPAID",
    unpaidReason: "Menunggu jatuh tempo termin Net 30",
    items: [
      {
        id: "item-1",
        itemCode: "RAW-NIA-001",
        itemName: "Niacinamide USP Grade",
        qty: 50,
        unitPrice: 200000,
        subtotal: 10000000,
      },
      {
        id: "item-2",
        itemCode: "RAW-GLY-002",
        itemName: "Glycerin 99.7%",
        qty: 140,
        unitPrice: 20000,
        subtotal: 2800000,
      },
    ],
  },
  {
    id: "bill-2",
    billNumber: "FB-202609-0002",
    vendorName: "CV Kemasan Lestari",
    poNumber: "PO-202608-00031",
    grNumber: "GR-202609-000007",
    billDate: "2026-08-25",
    dueDate: "2026-09-10",
    subTotal: 8500000,
    taxAmount: 935000,
    grandTotal: 9435000,
    paidAmount: 5000000,
    paymentStatus: "PARTIAL",
    items: [
      {
        id: "item-3",
        itemCode: "PKG-BTL-020",
        itemName: "Botol Dropper 20ml Amber",
        qty: 5000,
        unitPrice: 1700,
        subtotal: 8500000,
      },
    ],
  },
  {
    id: "bill-3",
    billNumber: "FB-202608-0019",
    vendorName: "PT Surya Label Prima",
    poNumber: "PO-202608-00015",
    grNumber: "GR-202608-000022",
    billDate: "2026-08-10",
    dueDate: "2026-08-25",
    subTotal: 4500000,
    taxAmount: 495000,
    grandTotal: 4995000,
    paidAmount: 4995000,
    paymentStatus: "PAID",
    items: [
      {
        id: "item-4",
        itemCode: "PKG-LBL-001",
        itemName: "Stiker Vinyl Serum Acne",
        qty: 10000,
        unitPrice: 450,
        subtotal: 4500000,
      },
    ],
  },
];
