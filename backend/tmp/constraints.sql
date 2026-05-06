-- 1. Constraint for Materials (Mapped to 'materials')
ALTER TABLE IF EXISTS "materials" DROP CONSTRAINT IF EXISTS stock_qty_non_negative;
ALTER TABLE "materials" ADD CONSTRAINT stock_qty_non_negative CHECK (stock_qty >= 0);

-- 2. Constraint for FinishedGoods (Assuming it's mapped or same name)
-- I'll check the exact name in a moment but let's try 'finished_goods' as it's common convention
ALTER TABLE IF EXISTS "finished_goods" DROP CONSTRAINT IF EXISTS fg_stock_qty_non_negative;
ALTER TABLE "finished_goods" ADD CONSTRAINT fg_stock_qty_non_negative CHECK (stock_qty >= 0);
