// Regenerate 26 finance entity service+controller+module stubs with PLURAL class names
const fs = require('fs');
const path = require('path');

const entities = [
  { name: 'bills',                    model: 'Bill',                   prisma: 'bill' },
  { name: 'bill-line-items',          model: 'BillLineItem',           prisma: 'billLineItem' },
  { name: 'down-payments',            model: 'DownPayment',            prisma: 'downPayment' },
  { name: 'ap-payments',              model: 'APPayment',              prisma: 'aPPayment' },
  { name: 'sales-invoices',           model: 'SalesInvoice',           prisma: 'salesInvoice' },
  { name: 'sales-invoice-line-items', model: 'SalesInvoiceLineItem',  prisma: 'salesInvoiceLineItem' },
  { name: 'ar-receipts',             model: 'ARReceipt',              prisma: 'aRReceipt' },
  { name: 'sample-fees',             model: 'SampleFee',              prisma: 'sampleFee' },
  { name: 'bank-accounts',           model: 'BankAccount',           prisma: 'bankAccount' },
  { name: 'bank-transactions',        model: 'BankTransaction',      prisma: 'bankTransaction' },
  { name: 'bank-reconciliations',     model: 'BankReconciliation',   prisma: 'bankReconciliation' },
  { name: 'tax-transactions',        model: 'TaxTransaction',       prisma: 'taxTransaction' },
  { name: 'fixed-assets',            model: 'FixedAsset',            prisma: 'fixedAsset' },
  { name: 'depreciation-schedules',  model: 'DepreciationSchedule', prisma: 'depreciationSchedule' },
  { name: 'asset-transfers',         model: 'AssetTransfer',         prisma: 'assetTransfer' },
  { name: 'asset-disposals',         model: 'AssetDisposal',        prisma: 'assetDisposal' },
  { name: 'intangible-assets',      model: 'IntangibleAsset',       prisma: 'intangibleAsset' },
  { name: 'period-locks',           model: 'PeriodLock',            prisma: 'periodLock' },
  { name: 'closing-checklists',      model: 'ClosingChecklist',     prisma: 'closingChecklist' },
  { name: 'adjustment-journals',    model: 'AdjustmentJournal',    prisma: 'adjustmentJournal' },
  { name: 'job-order-costings',      model: 'JobOrderCosting',       prisma: 'jobOrderCosting' },
  { name: 'cost-variances',          model: 'CostVariance',          prisma: 'costVariance' },
  { name: 'product-profitabilities', model: 'ProductProfitability', prisma: 'productProfitability' },
  { name: 'cost-allocations',        model: 'CostAllocation',        prisma: 'costAllocation' },
  { name: 'client-escrows',          model: 'ClientEscrow',          prisma: 'clientEscrow' },
  { name: 'inventory-ownerships',     model: 'InventoryOwnership',    prisma: 'inventoryOwnership' },
];

// Convert to plural form: most need 's', some have special plurals
function toPlural(model) {
  // Special cases for models ending in certain letters
  if (model.endsWith('y')) return model.slice(0, -1) + 'ies'; // InventoryOwnership -> InventoryOwnerships (keep y)
  if (model.endsWith('s')) return model; // already plural
  if (model.endsWith('x')) return model;
  if (model.endsWith('ch')) return model + 'es';
  if (model.endsWith('sh')) return model + 'es';
  if (model.endsWith('ss')) return model; // no change
  return model + 's';
}

const baseDir = path.join(__dirname, '..', 'src', 'modules', 'finance');

entities.forEach(({ name, model, prisma }) => {
  const dir = path.join(baseDir, name);
  fs.mkdirSync(dir, { recursive: true });

  const serviceName = toPlural(model) + 'Service';
  const controllerName = toPlural(model) + 'Controller';
  const moduleName = toPlural(model) + 'Module';

  const serviceContent = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class ${serviceName} {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.${prisma}.findMany();
  }

  async findOne(id: string) {
    return this.prisma.${prisma}.findUnique({ where: { id } });
  }

  // TODO: Sprint 3A/B/C will implement create, update, delete, post logic
}
`;

  const controllerContent = `import { Controller, Get, Param } from '@nestjs/common';
import { ${serviceName} } from './${name}.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/${name}')
export class ${controllerName} {
  constructor(private service: ${serviceName}) {}

  @Get()
  @ApiOperation({ summary: 'List all ${name}' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${name} by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
`;

  const moduleContent = `import { Module } from '@nestjs/common';
import { ${serviceName} } from './${name}.service';
import { ${controllerName} } from './${name}.controller';

@Module({
  controllers: [${controllerName}],
  providers: [${serviceName}],
  exports: [${serviceName}],
})
export class ${moduleName} {}
`;

  fs.writeFileSync(path.join(dir, `${name}.service.ts`), serviceContent);
  fs.writeFileSync(path.join(dir, `${name}.controller.ts`), controllerContent);
  fs.writeFileSync(path.join(dir, `${name}.module.ts`), moduleContent);

  console.log(`Created: ${name}/ (${serviceName}, ${controllerName}, ${moduleName})`);
});

console.log(`\nGenerated ${entities.length} entity stubs in ${baseDir}`);
