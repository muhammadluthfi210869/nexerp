import { PdfEngineService } from '../../../src/modules/document-automation/services/pdf-engine.service';

jest.setTimeout(30000);

describe('PdfEngineService — Unit Tests', () => {
  let service: PdfEngineService;

  beforeEach(() => {
    service = new PdfEngineService();
  });

  const baseData = {
    clientName: 'PT Test Client',
    brandName: 'Test Brand',
    items: [
      { productName: 'Serum Vitamin C', quantity: 1000, unitPrice: 50000, subtotal: 50000000 },
      { productName: 'Moisturizer', quantity: 500, unitPrice: 30000, subtotal: 15000000 },
    ],
    notes: 'Test notes',
  };

  function isPdfBuffer(buf: Buffer): boolean {
    return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF
  }

  describe('generatePdf — all document types', () => {
    it('B1: QUOTATION → valid PDF buffer', async () => {
      const result = await service.generatePdf('QUOTATION', baseData, 'QUO-2606-001');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(100);
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B2: INVOICE_DP → valid PDF', async () => {
      const data = { ...baseData, type: 'DP', dueDate: '2026-07-01', soNumber: 'SO-001' };
      const result = await service.generatePdf('INVOICE_DP', data, 'INV-2606-001');
      expect(result).toBeInstanceOf(Buffer);
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B3: INVOICE_FINAL → valid PDF', async () => {
      const data = { ...baseData, type: 'FINAL_PAYMENT', dueDate: '2026-07-01' };
      const result = await service.generatePdf('INVOICE_FINAL', data, 'INV-2606-002');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B4: DELIVERY_ORDER → valid PDF', async () => {
      const data = { ...baseData, shippingAddress: 'Jakarta Selatan', shipDate: '2026-06-20' };
      const result = await service.generatePdf('DELIVERY_ORDER', data, 'DO-2606-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B5: SURAT_JALAN → valid PDF', async () => {
      const data = { ...baseData, shippingAddress: 'Bandung', vehicleNumber: 'B 1234 CD' };
      const result = await service.generatePdf('SURAT_JALAN', data, 'SJ-2606-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B6: PURCHASE_REQUEST → valid PDF', async () => {
      const data = { ...baseData, priority: 'HIGH', warehouseName: 'Gudang Utama' };
      const result = await service.generatePdf('PURCHASE_REQUEST', data, 'PR-2606-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B7: JOURNAL_ENTRY → valid PDF', async () => {
      const data = {
        description: 'Journal for Delivery',
        lines: [
          { accountCode: '1200', accountName: 'Piutang Dagang', debit: 50000000, credit: 0 },
          { accountCode: '4100', accountName: 'Pendapatan', debit: 0, credit: 50000000 },
        ],
      };
      const result = await service.generatePdf('JOURNAL_ENTRY', data, 'JRN-2606-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B8: unknown type → valid PDF (generic fallback)', async () => {
      const result = await service.generatePdf('UNKNOWN', { foo: 'bar' }, 'DOC-001');
      expect(isPdfBuffer(result)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('B9: empty items → valid PDF', async () => {
      const result = await service.generatePdf('QUOTATION', { clientName: 'Test', items: [] }, 'QUO-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B10: with tax → valid PDF', async () => {
      const data = {
        clientName: 'Test',
        items: [{ productName: 'Item', quantity: 1, unitPrice: 100000, subtotal: 100000 }],
        taxRate: 11,
      };
      const result = await service.generatePdf('INVOICE_DP', data, 'INV-001');
      expect(isPdfBuffer(result)).toBe(true);
    });
  });
});
