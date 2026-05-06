-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "inventoryId" UUID,
ADD COLUMN     "unitValueAtTransaction" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "material_requisitions" ADD COLUMN     "materialInventoryId" UUID;

-- AlterTable
ALTER TABLE "production_logs" ADD COLUMN     "materialInventoryId" UUID,
ADD COLUMN     "unitValueAtTransaction" DECIMAL(15,2);

-- AddForeignKey
ALTER TABLE "material_requisitions" ADD CONSTRAINT "material_requisitions_materialInventoryId_fkey" FOREIGN KEY ("materialInventoryId") REFERENCES "material_inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_materialInventoryId_fkey" FOREIGN KEY ("materialInventoryId") REFERENCES "material_inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "material_inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
