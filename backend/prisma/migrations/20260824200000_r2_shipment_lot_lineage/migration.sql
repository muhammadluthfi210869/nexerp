-- R2 FINAL: additive lineage for SHIPPED finished-stock consumption.
-- Records exactly which FinishedGood lots a shipment decremented and by how
-- much, so audit can reconstruct Shipment → ShipmentItem → FinishedGood lot
-- even when FIFO consumed multiple lots for one ShipmentItem.
CREATE TABLE IF NOT EXISTS "shipment_consumed_lots" (
  "id"            UUID NOT NULL,
  "shipmentId"    UUID NOT NULL,
  "shipmentItemId" UUID NOT NULL,
  "finishedGoodId" UUID NOT NULL,
  "qtyRemoved"     DECIMAL(15, 3) NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_consumed_lots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "shipment_consumed_lots_shipmentId_idx"
  ON "shipment_consumed_lots"("shipmentId");
CREATE INDEX IF NOT EXISTS "shipment_consumed_lots_finishedGoodId_idx"
  ON "shipment_consumed_lots"("finishedGoodId");
CREATE INDEX IF NOT EXISTS "shipment_consumed_lots_shipmentItemId_idx"
  ON "shipment_consumed_lots"("shipmentItemId");
