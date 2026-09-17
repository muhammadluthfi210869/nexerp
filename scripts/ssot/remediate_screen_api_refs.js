const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../../docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json');
const doc = JSON.parse(fs.readFileSync(file, 'utf8'));

// Explicit contract-to-contract renames only. These do not invent endpoints;
// every destination already exists in 05_API_CONTRACT.yaml.
const replacements = [
  ['/api/v1/users/me', '/api/v1/profile'],
  ['/api/v1/warehouses/{warehouseId}/access/{userId}', '/api/v1/warehouse-access/{userId}/{warehouseId}'],
  ['/api/v1/warehouses/{warehouseId}/access', '/api/v1/warehouse-access'],
  ['/api/v1/warehouses/{id}/access/{userId}', '/api/v1/warehouse-access/{userId}/{id}'],
  ['/api/v1/warehouses/{id}/access', '/api/v1/warehouse-access'],
  ['/api/v1/sales-sample-payments', '/api/v1/sales/samples/{id}/payments'],
  ['/api/v1/sales-return-ins', '/api/v1/sales/sales-return-in'],
  ['/api/v1/sales-categories', '/api/v1/customer-categories'],
  ['/api/v1/sales-down-payments', '/api/v1/sales/down-payments'],
  ['/api/v1/sales/sales-orders/{id}/down-payment', '/api/v1/sales/down-payments'],
  ['/api/v1/purchase-down-payments', '/api/v1/purchase/down-payments'],
  ['/api/v1/purchase/orders/{id}/down-payment', '/api/v1/purchase/down-payments'],
  ['/api/v1/purchase-return-outs', '/api/v1/purchase/return-out'],
  ['/api/v1/purchase-requests', '/api/v1/purchase/requests'],
  ['/api/v1/purchase-orders', '/api/v1/purchase/orders'],
  ['/api/v1/goods-receipts', '/api/v1/purchase/goods-receipts'],
  ['/api/v1/purchase-invoices', '/api/v1/purchase/invoices'],
  ['/api/v1/purchase-payments', '/api/v1/purchase/payments'],
  ['/api/v1/purchase-returns', '/api/v1/purchase/returns'],
  ['/api/v1/sales-samples', '/api/v1/sales/samples'],
  ['/api/v1/sales-orders', '/api/v1/sales/sales-orders'],
  ['/api/v1/sales-invoices', '/api/v1/sales/sales-invoices'],
  ['/api/v1/sales-payments', '/api/v1/sales/sales-payments'],
  ['/api/v1/sales-returns', '/api/v1/sales/sales-returns'],
  ['/api/v1/sales-targets', '/api/v1/sales/sales-targets'],
  ['/api/v1/leads', '/api/v1/sales/leads'],
  ['/api/v1/batch-records', '/api/v1/production/batch-records'],
  ['/api/v1/schedules/mixing', '/api/v1/production/schedule-mixing'],
  ['/api/v1/schedules/filling', '/api/v1/production/schedule-filling'],
  ['/api/v1/schedules/packaging', '/api/v1/production/schedule-packaging'],
  ['/api/v1/production-runs/mixing', '/api/v1/production/production-mixing'],
  ['/api/v1/production-runs/filling', '/api/v1/production/production-filling'],
  ['/api/v1/production-runs/packaging', '/api/v1/production/production-packaging'],
  ['/api/v1/delivery-outs', '/api/v1/production/delivery-out'],
  ['/api/v1/public/delivery-outs/verify/{token}', '/api/v1/production/delivery-out/{id}/verify'],
  ['/api/v1/public/production/delivery-out/verify/{token}', '/api/v1/production/delivery-out/{id}/verify'],
  ['/api/v1/goods-transfers', '/api/v1/warehouse/goods-transfer'],
  ['/api/v1/stock-opnames', '/api/v1/warehouse/stock-opname'],
  ['/api/v1/stock-adjustments', '/api/v1/warehouse/stock-adjustment'],
  ['/api/v1/formulations', '/api/v1/rnd/formulations'],
  ['/api/v1/request-cogs', '/api/v1/rnd/request-cogs'],
  ['/api/v1/qc-inspections', '/api/v1/production/qc-inspections'],
  ['/api/v1/cash-banks', '/api/v1/finance/cash-banks'],
  ['/api/v1/journal-entries', '/api/v1/finance/journal-entries'],
  ['/api/v1/taxes', '/api/v1/finance/tax-setup'],
  ['/api/v1/fixed-assets', '/api/v1/finance/fixed-assets'],
  ['/api/v1/checklist-categories', '/api/v1/checklist/categories'],
  ['/api/v1/reports/goods-mutation', '/api/v1/reports/mutation-goods'],
  ['/api/v1/audit-logs', '/api/v1/audit/logs'],
  ['/api/v1/{entityType}/{entityId}/notes', '/api/v1/entities/{type}/{id}/notes'],
  ['/api/v1/{entityType}/{entityId}/comments', '/api/v1/entities/{type}/{id}/comments'],
  ['/api/v1/{entityType}/{entityId}/attachments', '/api/v1/entities/{type}/{id}/attachments'],
  ['/api/v1/{entityType}/{entityId}/tags', '/api/v1/entities/{type}/{id}/tags'],
  ['/api/v1/{entityType}/{entityId}/status-transitions', '/api/v1/entities/{type}/{id}/transitions'],
  ['/api/v1/{entity}/{id}/notes', '/api/v1/entities/{type}/{id}/notes'],
  ['/api/v1/{entity}/{id}/comments', '/api/v1/entities/{type}/{id}/comments'],
  ['/api/v1/{entity}/{id}/attachments', '/api/v1/entities/{type}/{id}/attachments'],
  ['/api/v1/{entity}/{id}/status-transitions', '/api/v1/entities/{type}/{id}/transitions'],
  ['/api/v1/{entity}/{id}/tags', '/api/v1/entities/{type}/{id}/tags'],
  ['/api/v1/{entity}/{id}', '/api/v1/entities/{type}/{id}/tags'],
];

function rewrite(value) {
  if (typeof value === 'string') {
    let result = value;
    for (const [from, to] of replacements) result = result.replace(from, to);
    result = result.replace('PUT /api/v1/entities/{type}/{id}/tags', 'POST /api/v1/entities/{type}/{id}/tags');
    result = result.replace('/api/v1/rnd/formulations/{id}/adjustmentss', '/api/v1/rnd/formulations/{id}/adjustments');
    if (result.endsWith('/api/v1/rnd/formulations/{id}/adjustment')) {
      result = result.replace('/api/v1/rnd/formulations/{id}/adjustment', '/api/v1/rnd/formulations/{id}/adjustments');
    }
    const permissionAliases = {
      'audit-log.read': 'audit_log.read',
      'audit-log.export': 'audit_log.export',
      'coa.read': 'coa-manage.read',
      'coa.create': 'coa-manage.create',
      'coa.update': 'coa-manage.update',
      'coa-auto.read': 'coa-auto-manage.read',
      'coa-auto.create': 'coa-auto-manage.create',
      'journal-entry.read': 'general-journal.read',
      'journal-entry.create': 'general-journal.create',
      'journal-entry.update': 'general-journal.update',
      'journal-entry.post': 'general-journal.approve',
      'journal-entry.reverse': 'general-journal.approve',
      'notification-pref.update': 'notification.configure',
      'report-bs.read': 'report-balance-sheet.read',
      'report-followup.read': 'report-follow-up-customer.read',
      'report-gl.read': 'report-general-ledger.read',
      'report-guestbook.read': 'report-guest-book.read',
      'report-mutation.read': 'report-mutation-goods.read',
      'report-pl.read': 'report-profit-loss.read',
      'report-tb.read': 'report-trial-balance.read',
    };
    if (permissionAliases[result]) result = permissionAliases[result];
    return result;
  }
  if (Array.isArray(value)) return value.map(rewrite);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = rewrite(value[key]);
  }
  return value;
}

rewrite(doc);
fs.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Rewrote canonical screen API references in ${file}`);
