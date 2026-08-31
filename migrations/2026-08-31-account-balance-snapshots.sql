-- Balance check-ins per payment account. The latest snapshot per account is the
-- current balance; history is kept for staleness display and future trending.
-- Balances are manual check-ins (no bank sync) and may be negative (overdraft).

CREATE TABLE IF NOT EXISTS finance_account_balance_snapshots (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_id INTEGER NOT NULL REFERENCES finance_payment_accounts(id) ON DELETE CASCADE,
  balance_date DATE NOT NULL,
  balance_cents INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS finance_account_balance_snapshots_account_date_unique
  ON finance_account_balance_snapshots(account_id, balance_date);

CREATE INDEX IF NOT EXISTS finance_account_balance_snapshots_user_id_idx
  ON finance_account_balance_snapshots(user_id);
