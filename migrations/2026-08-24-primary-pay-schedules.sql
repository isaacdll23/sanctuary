-- Optional primary paycheck schedules. Existing income rows are intentionally left unscheduled.
-- Docker deployment uses drizzle-kit push; this idempotent file documents manual migration semantics.
CREATE TABLE IF NOT EXISTS finance_pay_schedules (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  is_enabled INTEGER NOT NULL DEFAULT 0,
  schedule_type VARCHAR(30) NOT NULL DEFAULT 'semi-monthly',
  first_nominal_day INTEGER NOT NULL DEFAULT 15,
  second_payday_rule VARCHAR(30) NOT NULL DEFAULT 'last-day',
  weekend_adjustment VARCHAR(30) NOT NULL DEFAULT 'previous-friday',
  net_paycheck_amount_cents INTEGER,
  deposit_account_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_pay_schedules_deposit_account
  ON finance_pay_schedules(deposit_account_id);
