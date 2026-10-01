import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';

/**
 * Resolves the AR-side `customers` row for an incoming customer id.
 *
 * Why this exists: the AR tables (`sales_invoices`, `ar_receipts`, `client_escrows`)
 * all hold a NOT NULL FK to `customers`, but nothing in the application ever wrote to
 * that table — every "customer" screen reads and writes `sales_leads` instead. So the id
 * the UI actually holds is a `sales_leads` id, and the AR services could never find it.
 *
 * This is deliberately NOT a merge of the two entities. `sales_leads` stays the lead/CRM
 * record (SampleRequest, WorkOrder and NPF point at it); `customers` stays the AR record.
 * This only materialises the missing AR row on demand, and remembers the link so the same
 * lead always resolves to the same customer.
 */
@Injectable()
export class CustomerLinkHelper {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns the `customers` row for `id`, creating it from the matching `sales_leads`
   * row when `id` names a lead. Throws NotFoundException when neither table has it.
   */
  async resolveCustomer(id: string) {
    if (!id) throw new NotFoundException('customerId is required');

    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (existing) return existing;

    const lead = await this.prisma.salesLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException(`Customer ${id} not found`);

    // A lead that was already converted must resolve to the same customer every time,
    // so the conversion marker is the lead's brandCode, which is unique per customer.
    const code = lead.brandCode || `CUST-${lead.id.substring(0, 8).toUpperCase()}`;
    const byCode = await this.prisma.customer.findUnique({ where: { code } });
    if (byCode) return byCode;

    return this.prisma.customer.create({
      data: {
        id: lead.id,
        code,
        name: lead.clientName,
        brand: lead.brandName,
        contactPerson: null,
        email: lead.email,
        phone: lead.contactInfo,
        address: lead.addressDetail,
        creditLimit: lead.estimatedValue,
        isActive: lead.status !== 'LOST',
      },
    });
  }

  /**
   * Same as resolveCustomer but returns the id only — for call sites that just need
   * the FK value and do not read the customer.
   */
  async resolveCustomerId(id: string): Promise<string> {
    const customer = await this.resolveCustomer(id);
    return customer.id;
  }
}
