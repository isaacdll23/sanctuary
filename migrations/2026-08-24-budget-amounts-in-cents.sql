-- Store budget and transaction currency as integer cents to avoid float arithmetic.
-- Existing decimal(12,2) dollar values are converted to cents (multiply by 100).

ALTER TABLE budgets
  RENAME COLUMN "totalAmount" TO "total_amount_cents";

ALTER TABLE budgets
  ALTER COLUMN "total_amount_cents" TYPE INTEGER
  USING ROUND("total_amount_cents" * 100);

ALTER TABLE budget_transactions
  RENAME COLUMN "amount" TO "amount_cents";

ALTER TABLE budget_transactions
  ALTER COLUMN "amount_cents" TYPE INTEGER
  USING ROUND("amount_cents" * 100);