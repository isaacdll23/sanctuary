-- Ledger of actual charge occurrences for recurring expenses.
-- One record per expense per scheduled charge date; amount_cents is the amount actually
-- charged in integer cents, which may differ from the projected per-charge amount.

CREATE TABLE IF NOT EXISTS finance_expense_charges (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expense_id INTEGER NOT NULL REFERENCES finance_expenses(id) ON DELETE CASCADE,
  charge_date DATE NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS finance_expense_charges_expense_date_unique
  ON finance_expense_charges(expense_id, charge_date);

CREATE INDEX IF NOT EXISTS finance_expense_charges_user_id_idx
  ON finance_expense_charges(user_id);
