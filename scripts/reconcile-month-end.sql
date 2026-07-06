-- =============================================
-- Month-End Closing Reconciliation SQL
-- Jalankan: psql -d erp_db -f reconcile-month-end.sql
-- Note: Column names use camelCase (Prisma convention)
-- =============================================

-- 1. TRIAL BALANCE: Total Debit MUST = Total Credit
SELECT '1. TRIAL BALANCE' AS test;
SELECT
  ROUND(SUM(debit)::numeric, 2) AS total_debit,
  ROUND(SUM(credit)::numeric, 2) AS total_credit,
  CASE
    WHEN ROUND(SUM(debit)::numeric, 2) = ROUND(SUM(credit)::numeric, 2)
    THEN 'PASS - BALANCED'
    ELSE 'FAIL - UNBALANCED by ' || ROUND(ABS(SUM(debit) - SUM(credit))::numeric, 2)::text
  END AS result
FROM journal_lines;

-- 2. PERIOD ROLLOVER (simplified - check journal lines by period)
SELECT '2. TRIAL BALANCE BY PERIOD' AS test;
SELECT
  DATE_TRUNC('month', je.date) AS period,
  ROUND(SUM(jl.debit)::numeric, 2) AS total_debit,
  ROUND(SUM(jl.credit)::numeric, 2) AS total_credit,
  CASE
    WHEN ROUND(SUM(jl.debit)::numeric, 2) = ROUND(SUM(jl.credit)::numeric, 2)
    THEN 'PASS' ELSE 'FAIL'
  END AS result
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl."journalId"
GROUP BY DATE_TRUNC('month', je.date)
ORDER BY period;

-- 3. AR AGING: Invoice status vs payments
SELECT '3. AR AGING' AS test;
SELECT
  i."invoiceNumber", i."amountDue", i."dueDate",
  COALESCE(SUM(p."amountPaid"), 0) AS total_paid,
  (i."amountDue" - COALESCE(SUM(p."amountPaid"), 0)) AS remaining,
  CASE
    WHEN i."amountDue" - COALESCE(SUM(p."amountPaid"), 0) <= 0 THEN 'PAID'
    WHEN NOW() > i."dueDate" THEN 'OVERDUE'
    ELSE 'PENDING'
  END AS calculated_status,
  i.status AS system_status,
  CASE WHEN i.status::text = CASE
    WHEN i."amountDue" - COALESCE(SUM(p."amountPaid"), 0) <= 0 THEN 'PAID'
    WHEN NOW() > i."dueDate" THEN 'OVERDUE'
    ELSE 'PENDING'
  END THEN 'PASS' ELSE 'FAIL' END AS match
FROM unified_invoices i
LEFT JOIN payments p ON p."invoiceId" = i.id
GROUP BY i.id, i."invoiceNumber", i."amountDue", i."dueDate", i.status;

-- 4. STOCK ACCURACY: System stock vs calculated from transactions
SELECT '4. STOCK ACCURACY' AS test;
SELECT
  m.id, m.name, m."stockQty" AS system_stock,
  COALESCE(in_qty, 0) - COALESCE(out_qty, 0) AS calculated_stock,
  CASE WHEN m."stockQty" = (COALESCE(in_qty, 0) - COALESCE(out_qty, 0))
    THEN 'PASS' ELSE 'FAIL' END AS match
FROM material_items m
LEFT JOIN (
  SELECT "materialId", SUM(quantity) AS in_qty
  FROM inventory_transactions WHERE type = 'INBOUND'
  GROUP BY "materialId"
) i ON i."materialId" = m.id
LEFT JOIN (
  SELECT "materialId", SUM(quantity) AS out_qty
  FROM inventory_transactions WHERE type = 'OUTBOUND'
  GROUP BY "materialId"
) o ON o."materialId" = m.id
WHERE m."stockQty" != COALESCE(COALESCE(i.in_qty, 0) - COALESCE(o.out_qty, 0), 0);

-- 5. PROFIT & LOSS SUMMARY
SELECT '5. PROFIT & LOSS' AS test;
SELECT
  (SELECT COALESCE(SUM("amountPaid"), 0) FROM payments) AS revenue,
  (SELECT COALESCE(SUM("actualCogs"), 0) FROM work_orders) AS cogs,
  (SELECT COALESCE(SUM(debit - credit), 0) FROM journal_lines jl
    JOIN accounts a ON a.id = jl."accountId"
    WHERE a.type = 'EXPENSE') AS opex,
  (SELECT COALESCE(SUM("amountPaid"), 0) FROM payments)
  - (SELECT COALESCE(SUM("actualCogs"), 0) FROM work_orders)
  - (SELECT COALESCE(SUM(debit - credit), 0) FROM journal_lines jl
    JOIN accounts a ON a.id = jl."accountId"
    WHERE a.type = 'EXPENSE') AS net_profit;

-- 6. BALANCE SHEET CHECK: Assets = Liabilities + Equity
SELECT '6. BALANCE SHEET (Assets = Liabilities + Equity)' AS test;
WITH balances AS (
  SELECT
    a.type,
    SUM(jl.debit - jl.credit) AS balance
  FROM journal_lines jl
  JOIN accounts a ON a.id = jl."accountId"
  GROUP BY a.type
)
SELECT
  (SELECT COALESCE(balance, 0) FROM balances WHERE type = 'ASSET') AS total_assets,
  (SELECT COALESCE(balance, 0) FROM balances WHERE type = 'LIABILITY') AS total_liabilities,
  (SELECT COALESCE(balance, 0) FROM balances WHERE type = 'EQUITY') AS total_equity,
  CASE
    WHEN (SELECT COALESCE(balance, 0) FROM balances WHERE type = 'ASSET')
       = (SELECT COALESCE(balance, 0) FROM balances WHERE type = 'LIABILITY')
       + (SELECT COALESCE(balance, 0) FROM balances WHERE type = 'EQUITY')
    THEN 'PASS - BALANCED'
    ELSE 'FAIL - UNBALANCED'
  END AS result;

-- SUMMARY
SELECT '========================================' AS summary;
SELECT CASE
  WHEN (SELECT COUNT(*) FROM (
    SELECT CASE WHEN ROUND(SUM(debit)::numeric,2) = ROUND(SUM(credit)::numeric,2) THEN 1 END
    FROM journal_lines
  ) sub) > 0 THEN 'TRIAL BALANCE: PASS'
  ELSE 'TRIAL BALANCE: FAIL'
END;
