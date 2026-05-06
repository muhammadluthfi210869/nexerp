export const BUSSDEV_EVENTS = {
  STAGE_UPDATED: 'lead.stage_updated',
  PAYMENT_VALIDATED: 'finance.payment_validated',
  FORMULA_LOCKED: 'rnd.formula_locked',
  ORDER_SHIPPED: 'warehouse.order_shipped',
};

export interface BussdevStageUpdatedEvent {
  leadId: string;
  previousStage: string;
  newStage: string;
  loggedBy: string;
}

export interface FinancePaymentValidatedEvent {
  leadId: string;
  activityId: string;
  amount: number;
  verifiedBy: string;
}

export interface RndFormulaLockedEvent {
  leadId: string;
  formulaId: string;
  lockedBy: string;
}

export interface WarehouseOrderShippedEvent {
  leadId: string;
  orderId: string;
  shippedAt: Date;
}
