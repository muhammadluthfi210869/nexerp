import { PdfEngineService } from '../../../src/modules/document-automation/services/pdf-engine.service';

jest.setTimeout(30000);

// A browser binary is absent in CI and on the test host alike, and every case below except
// R1 stays on the deterministic engine (setup-fast-pdf.cjs). R1 is the one that walks into
// the real renderer, so it pins the failure the production server actually produced.
jest.mock('html-pdf-node', () => ({
  __esModule: true,
  default: {
    generatePdf: jest.fn().mockRejectedValue(
      new Error(
        'spawn /app/node_modules/puppeteer/.local-chromium/linux-901912/chrome-linux/chrome ENOENT',
      ),
    ),
  },
}));

describe('PdfEngineService — Unit Tests', () => {
  let service: PdfEngineService;

  beforeEach(() => {
    service = new PdfEngineService();
  });

  const baseData = {
    clientName: 'PT Test Client',
    brandName: 'Test Brand',
    items: [
      {
        productName: 'Serum Vitamin C',
        quantity: 1000,
        unitPrice: 50000,
        subtotal: 50000000,
      },
      {
        productName: 'Moisturizer',
        quantity: 500,
        unitPrice: 30000,
        subtotal: 15000000,
      },
    ],
    notes: 'Test notes',
  };

  function isPdfBuffer(buf: Buffer): boolean {
    return (
      buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46
    ); // %PDF
  }

  describe('generatePdf — all document types', () => {
    it('B1: QUOTATION → valid PDF buffer', async () => {
      const result = await service.generatePdf(
        'QUOTATION',
        baseData,
        'QUO-2606-001',
      );
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(100);
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B2: INVOICE_DP → valid PDF', async () => {
      const data = {
        ...baseData,
        type: 'DP',
        dueDate: '2026-07-01',
        soNumber: 'SO-001',
      };
      const result = await service.generatePdf(
        'INVOICE_DP',
        data,
        'INV-2606-001',
      );
      expect(result).toBeInstanceOf(Buffer);
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B3: INVOICE_FINAL → valid PDF', async () => {
      const data = {
        ...baseData,
        type: 'FINAL_PAYMENT',
        dueDate: '2026-07-01',
      };
      const result = await service.generatePdf(
        'INVOICE_FINAL',
        data,
        'INV-2606-002',
      );
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B4: DELIVERY_ORDER → valid PDF', async () => {
      const data = {
        ...baseData,
        shippingAddress: 'Jakarta Selatan',
        shipDate: '2026-06-20',
      };
      const result = await service.generatePdf(
        'DELIVERY_ORDER',
        data,
        'DO-2606-001',
      );
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B5: SURAT_JALAN → valid PDF', async () => {
      const data = {
        ...baseData,
        shippingAddress: 'Bandung',
        vehicleNumber: 'B 1234 CD',
      };
      const result = await service.generatePdf(
        'SURAT_JALAN',
        data,
        'SJ-2606-001',
      );
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B6: PURCHASE_REQUEST → valid PDF', async () => {
      const data = {
        ...baseData,
        priority: 'HIGH',
        warehouseName: 'Gudang Utama',
      };
      const result = await service.generatePdf(
        'PURCHASE_REQUEST',
        data,
        'PR-2606-001',
      );
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B7: JOURNAL_ENTRY → valid PDF', async () => {
      const data = {
        description: 'Journal for Delivery',
        lines: [
          {
            accountCode: '1200',
            accountName: 'Piutang Dagang',
            debit: 50000000,
            credit: 0,
          },
          {
            accountCode: '4100',
            accountName: 'Pendapatan',
            debit: 0,
            credit: 50000000,
          },
        ],
      };
      const result = await service.generatePdf(
        'JOURNAL_ENTRY',
        data,
        'JRN-2606-001',
      );
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B8: unknown type → valid PDF (generic fallback)', async () => {
      const result = await service.generatePdf(
        'UNKNOWN',
        { foo: 'bar' },
        'DOC-001',
      );
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B9: SALES_ORDER → valid PDF', async () => {
      const result = await service.generatePdf(
        'SALES_ORDER',
        baseData,
        'SO-2609-001',
      );
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B10: BATCH_RECORD → valid PDF & template matches', async () => {
      const html = service.renderTemplate('BATCH_RECORD', baseData, 'BR-2609-001');
      expect(html).toContain('BATCH RECORD');
      expect(html).toContain('Informasi Sales');
      const result = await service.generatePdf('BATCH_RECORD', baseData, 'BR-2609-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B11: SCHEDULE_MIXING → valid PDF & includes upscale formula', async () => {
      const html = service.renderTemplate('SCHEDULE_MIXING', { ...baseData, targetQty: 100, nettoPerPcs: 50 }, 'SM-2609-001');
      expect(html).toContain('JADWAL MIXING');
      expect(html).toContain('Perhitungan Upscale');
      const result = await service.generatePdf('SCHEDULE_MIXING', baseData, 'SM-2609-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B12: SCHEDULE_PACKAGING → valid PDF & includes secondary packaging', async () => {
      const html = service.renderTemplate('SCHEDULE_PACKAGING', baseData, 'SP-2609-001');
      expect(html).toContain('JADWAL PACKAGING');
      expect(html).toContain('Detail Kemasan Sekunder');
      const result = await service.generatePdf('SCHEDULE_PACKAGING', baseData, 'SP-2609-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B13: KWITANSI → valid PDF & contains LUNAS stamp', async () => {
      const html = service.renderTemplate('KWITANSI', baseData, 'KWT-2609-001');
      expect(html).toContain('LUNAS');
      expect(html).toContain('KWITANSI PEMBAYARAN');
      const result = await service.generatePdf('KWITANSI', baseData, 'KWT-2609-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B14: REQUEST_COGS → valid PDF & contains HPP calculation', async () => {
      const html = service.renderTemplate('REQUEST_COGS', baseData, 'RCG-2609-001');
      expect(html).toContain('HARGA POKOK PENJUALAN (HPP)');
      const result = await service.generatePdf('REQUEST_COGS', baseData, 'RCG-2609-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B15: SALES_SAMPLE → valid PDF & contains sensory characteristics', async () => {
      const html = service.renderTemplate('SALES_SAMPLE', baseData, 'SS-2609-001');
      expect(html).toContain('SALES SAMPLE');
      expect(html).toContain('Deskripsi Sales Sample');
      const result = await service.generatePdf('SALES_SAMPLE', baseData, 'SS-2609-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B16: GOODS_TRANSFER → valid PDF', async () => {
      const html = service.renderTemplate('GOODS_TRANSFER', baseData, 'GT-2609-001');
      expect(html).toContain('BUKTI TRANSFER BARANG');
      const result = await service.generatePdf('GOODS_TRANSFER', baseData, 'GT-2609-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B17: STOCK_OPNAME → valid PDF & contains summary box', async () => {
      const html = service.renderTemplate('STOCK_OPNAME', baseData, 'STO-2609-001');
      expect(html).toContain('STOCK OPNAME');
      expect(html).toContain('Ringkasan');
      const result = await service.generatePdf('STOCK_OPNAME', baseData, 'STO-2609-001');
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B18: PO_WAREHOUSE → valid PDF & is warehouse copy', async () => {
      const html = service.renderTemplate('PO_WAREHOUSE', baseData, 'PO-2609-001');
      expect(html).toContain('Warehouse Copy');
      const result = await service.generatePdf('PO_WAREHOUSE', baseData, 'PO-2609-001');
      expect(isPdfBuffer(result)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('B9: empty items → valid PDF', async () => {
      const result = await service.generatePdf(
        'QUOTATION',
        { clientName: 'Test', items: [] },
        'QUO-001',
      );
      expect(isPdfBuffer(result)).toBe(true);
    });

    it('B10: with tax → valid PDF', async () => {
      const data = {
        clientName: 'Test',
        items: [
          {
            productName: 'Item',
            quantity: 1,
            unitPrice: 100000,
            subtotal: 100000,
          },
        ],
        taxRate: 11,
      };
      const result = await service.generatePdf('INVOICE_DP', data, 'INV-001');
      expect(isPdfBuffer(result)).toBe(true);
    });
  });

  // Every assertion above only checks "%PDF" and a length over 100 bytes — which the
  // one-page placeholder satisfies too. They passed for months against a server where the
  // renderer was dead. This block is the one that can tell the two apart.
  describe('a failed render must reach the caller', () => {
    it('R1: rejects instead of returning a placeholder when the browser is missing', async () => {
      const savedFastPdf = process.env.FAST_PDF;
      delete process.env.FAST_PDF;
      try {
        await expect(
          service.generatePdf('QUOTATION', baseData, 'QUO-RED-001'),
        ).rejects.toThrow();
      } finally {
        if (savedFastPdf === undefined) delete process.env.FAST_PDF;
        else process.env.FAST_PDF = savedFastPdf;
      }
    });
  });
});
