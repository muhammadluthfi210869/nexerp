export interface KpiMetricGovernanceDefinition {
  metricId: string;
  name: string;
  ownerRole: string;
  formulaExpression: string;
  grain: 'DAILY' | 'MONTHLY' | 'EVENT';
  sourceEntities: string[];
  freshnessSlaSeconds: number;
  targetThreshold: number;
  direction: 'higher-better' | 'lower-better' | 'zero-target';
  description: string;
}

export const KPI_GOVERNANCE_REGISTRY: KpiMetricGovernanceDefinition[] = [
  {
    metricId: 'KPI-FIN-001',
    name: 'Revenue MTD Target Realization',
    ownerRole: 'FINANCE',
    formulaExpression: 'SUM(Invoice.amountDue WHERE status=PAID AND category=RECEIVABLE) / target * 100',
    grain: 'MONTHLY',
    sourceEntities: ['Invoice', 'Payment'],
    freshnessSlaSeconds: 300,
    targetThreshold: 5000000000,
    direction: 'higher-better',
    description: 'Reconciled monthly revenue against company sales target',
  },
  {
    metricId: 'KPI-FIN-002',
    name: 'Overdue Accounts Receivable Ratio',
    ownerRole: 'FINANCE',
    formulaExpression: 'SUM(Invoice.outstandingAmount WHERE dueDate < NOW) / totalAR * 100',
    grain: 'DAILY',
    sourceEntities: ['Invoice'],
    freshnessSlaSeconds: 300,
    targetThreshold: 0,
    direction: 'zero-target',
    description: 'Overdue invoice tracking with H-3 and H-7 proactive buckets',
  },
  {
    metricId: 'KPI-OPS-001',
    name: 'Production Timeliness (On-Time Delivery)',
    ownerRole: 'PRODUCTION',
    formulaExpression: 'COUNT(ProductionPlan WHERE status=COMPLETED AND completedAt <= targetDate) / totalPlans * 100',
    grain: 'MONTHLY',
    sourceEntities: ['ProductionPlan'],
    freshnessSlaSeconds: 300,
    targetThreshold: 90,
    direction: 'higher-better',
    description: 'Ratio of work orders completed within scheduled timeline',
  },
  {
    metricId: 'KPI-QC-001',
    name: 'First Pass Yield (FPY)',
    ownerRole: 'QC',
    formulaExpression: 'COUNT(QCAudit WHERE status=APPROVED) / totalAudits * 100',
    grain: 'MONTHLY',
    sourceEntities: ['QCAudit'],
    freshnessSlaSeconds: 300,
    targetThreshold: 95,
    direction: 'higher-better',
    description: 'National and global lean manufacturing quality benchmark FPY >= 90%',
  },
  {
    metricId: 'KPI-WH-001',
    name: 'Critical Stock Shortage Incidents',
    ownerRole: 'WAREHOUSE',
    formulaExpression: 'COUNT(MaterialItem WHERE stockQty <= minLevel AND isCritical=TRUE)',
    grain: 'DAILY',
    sourceEntities: ['MaterialItem', 'MaterialInventory'],
    freshnessSlaSeconds: 60,
    targetThreshold: 0,
    direction: 'zero-target',
    description: 'Zero tolerance for unmitigated critical material stockouts',
  },
  {
    metricId: 'KPI-BD-001',
    name: 'Sales Lead Conversion Rate',
    ownerRole: 'COMMERCIAL',
    formulaExpression: 'COUNT(SalesLead WHERE status=WON_DEAL) / totalLeads * 100',
    grain: 'MONTHLY',
    sourceEntities: ['SalesLead'],
    freshnessSlaSeconds: 300,
    targetThreshold: 15,
    direction: 'higher-better',
    description: 'Conversion rate from intake lead to contracted sales order',
  },
  {
    metricId: 'KPI-HR-001',
    name: 'Attendance & Roster Compliance',
    ownerRole: 'HR',
    formulaExpression: 'COUNT(Attendance WHERE status=ON_TIME) / totalScheduledDays * 100',
    grain: 'MONTHLY',
    sourceEntities: ['Attendance', 'Employee'],
    freshnessSlaSeconds: 300,
    targetThreshold: 95,
    direction: 'higher-better',
    description: 'Punctuality compliance verified via factory geofence radius',
  },
];
