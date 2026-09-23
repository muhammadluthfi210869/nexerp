import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP10App, P10App, p10Message } from './p10-http-harness';
import { UserRole, PaymentStatus, PurchaseReturnStatus } from '@prisma/client';

describe('P10 - S5: Accounts Payable (AP) Payments, Reversals, Returns & Debit Notes', () => {
  let p10: P10App;
  let adminToken: string;
  let financeToken: string;
  let tenantId: string;
  let supplierId: string;
  let materialId: string;
  let billId: string;

  const testPrefix = `nex_p10_s5_${Date.now()}`;

  beforeAll(async () => {
    p10 = await bootP10App();
    tenantId = randomUUID();

    const admin = await p10.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const fin = await p10.createUser(`${testPrefix}_fin`, [UserRole.FINANCE], tenantId);

    adminToken = admin.token;
    financeToken = fin.token;

    const sup = await p10.prisma.supplier.create({
      data: {
        name: `${testPrefix}_Supplier_AP`,
        phone: '08555555555',
      },
    });
    supplierId = sup.id;

    const mat = await p10.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_Material_AP`,
        code: `MAT-${Date.now()}-AP`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 50000,
        stockQty: 50, // 50 in stock for return test
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
      },
    });
    materialId = mat.id;

    // Create a Bill with grandTotal = 2,000,000, paidAmount = 0
    const bill = await p10.prisma.bill.create({
      data: {
        billNumber: `FP-${Date.now().toString().slice(-6)}-5555`,
        vendorId: supplierId,
        procurementCategory: 'Bahan Baku (11510)',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 2000000,
        taxAmount: 0,
        grandTotal: 2000000,
        paidAmount: 0,
        paymentStatus: PaymentStatus.PENDING,
        pic: 'Finance Staff',
        items: {
          create: [
            {
              itemCode: 'MAT-001',
              itemName: 'Material AP',
              qty: 40,
              unit: 'KG',
              price: 50000,
              total: 2000000,
            },
          ],
        },
      },
    });
    billId = bill.id;
  });

  afterAll(async () => {
    try {
      await p10.prisma.purchaseReturnItem.deleteMany({
        where: { materialId },
      });
      await p10.prisma.purchaseReturn.deleteMany({
        where: { supplierId },
      });
      await p10.prisma.billAllocation.deleteMany({
        where: { billId },
      });
      await p10.prisma.aPPayment.deleteMany({
        where: { vendorId: supplierId },
      });
      await p10.prisma.billLineItem.deleteMany({
        where: { billId },
      });
      await p10.prisma.bill.deleteMany({
        where: { id: billId },
      });
      await p10.prisma.materialItem.deleteMany({
        where: { id: materialId },
      });
      await p10.prisma.supplier.deleteMany({
        where: { id: supplierId },
      });
      await p10.prisma.user.deleteMany({
        where: { email: { contains: testPrefix } },
      });
    } catch {}
    await p10.app.close();
  });

  it('1. Rejects payment when amount exceeds remaining bill balance', async () => {
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        vendorId: supplierId,
        billId,
        amount: 2500000, // Exceeds 2,000,000
        paymentMethod: 'BANK_TRANSFER',
      });

    expect(res.status).toBe(400);
    expect(p10Message(res)).toContain('melebihi sisa tagihan');
  });

  it('2. Records partial AP payment and transitions bill status to PARTIAL', async () => {
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        vendorId: supplierId,
        billId,
        amount: 1000000,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'TRF-BCA-12345',
      });

    expect(res.status).toBe(201);
    expect(res.body.paymentNumber).toMatch(/^(BPB|PAY)-\d+/);
    expect(res.body.allocations).toHaveLength(1);

    // Verify bill paidAmount and status
    const bill = await p10.prisma.bill.findUnique({ where: { id: billId } });
    expect(Number(bill?.paidAmount)).toBe(1000000);
    expect(bill?.paymentStatus).toBe(PaymentStatus.PARTIAL);
  });

  it('3. Reverses payment and restores bill outstanding balance', async () => {
    // Find the payment created above
    const payment = await p10.prisma.aPPayment.findFirst({
      where: { vendorId: supplierId },
    });

    const res = await request(p10.app.getHttpServer())
      .post(`/purchase/payments/${payment?.id}/reverse`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({ reason: 'Incorrect vendor bank account' });

    expect(res.status).toBe(201);
    expect(res.body.notes).toContain('[REVERSED: Incorrect vendor bank account]');

    // Verify bill paidAmount returned to 0
    const bill = await p10.prisma.bill.findUnique({ where: { id: billId } });
    expect(Number(bill?.paidAmount)).toBe(0);
    expect(bill?.paymentStatus).toBe(PaymentStatus.PENDING);
  });

  it('4. Creates Purchase Return with stock validation and generates Debit Note upon approval', async () => {
    // Initial stock is 50
    const returnRes = await request(p10.app.getHttpServer())
      .post('/purchase/returns')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        supplierId,
        reason: 'Expired batch received',
        items: [
          {
            materialId,
            quantity: 10,
            unitPrice: 50000,
            reason: 'Quality defect',
          },
        ],
      });

    expect(returnRes.status).toBe(201);
    expect(returnRes.body.returnNumber).toMatch(/^PRT-\d+/);
    expect(returnRes.body.status).toBe(PurchaseReturnStatus.WAITING_APPROVAL);

    const returnId = returnRes.body.id;

    // Approve Return
    const approveRes = await request(p10.app.getHttpServer())
      .post(`/purchase/returns/${returnId}/approve`)
      .set('Authorization', `Bearer ${financeToken}`);

    expect(approveRes.status).toBe(201);
    expect(approveRes.body.status).toBe(PurchaseReturnStatus.COMPLETED);
    expect(approveRes.body.debitNoteNumber).toMatch(/^DN-\d+/);
    expect(Number(approveRes.body.debitNoteAmount)).toBe(500000); // 10 * 50,000

    // Verify stock decreased by 10 (from 50 to 40)
    const matAfter = await p10.prisma.materialItem.findUnique({
      where: { id: materialId },
    });
    expect(Number(matAfter?.stockQty)).toBe(40);
  });
});
