-- Add recurrence, classifications, and user-owned payment accounts without changing existing expense amounts.
-- Existing rows remain monthly: their legacy monthlyCost remains the per-charge amount.

ALTER TABLE finance_expenses
  ADD COLUMN IF NOT EXISTS recurrence_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS recurrence_anchor DATE,
  ADD COLUMN IF NOT EXISTS last_day_of_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS necessity VARCHAR(20) NOT NULL DEFAULT 'essential',
  ADD COLUMN IF NOT EXISTS cost_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'autopay';

-- A stable leap-year anchor preserves each existing monthly charge day. Day 31 intentionally
-- becomes an explicit "last day" rule so it remains meaningful in short months.
UPDATE finance_expenses
SET recurrence_anchor = make_date(2000, 1, LEAST(GREATEST("chargeDay", 1), 31))
WHERE recurrence_anchor IS NULL;

UPDATE finance_expenses
SET last_day_of_month = 1
WHERE "chargeDay" = 31 AND last_day_of_month = 0;

ALTER TABLE finance_expenses
  ALTER COLUMN recurrence_anchor SET DEFAULT '2000-01-01',
  ALTER COLUMN recurrence_anchor SET NOT NULL;

CREATE TABLE IF NOT EXISTS finance_payment_accounts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_payment_accounts_user_id
  ON finance_payment_accounts(user_id);
