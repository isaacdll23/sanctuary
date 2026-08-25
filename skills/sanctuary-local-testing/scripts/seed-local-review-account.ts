import { hash } from "argon2";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const reviewUsername = "test";
const reviewEmail = "test@sanctuary.local";
const reviewPassword = "test";

const expected = new URL(
  databaseUrl ?? "postgresql://localhost"
);

if (
  expected.hostname !== "127.0.0.1" ||
  expected.port !== "5434" ||
  expected.username !== "sanctuary" ||
  !expected.pathname.startsWith("/sanctuary_local")
) {
  throw new Error(
    "Refusing to seed an account outside Sanctuary's local test database."
  );
}

const client = new Client({ connectionString: databaseUrl });

interface ExpenseSeed {
  name: string;
  monthlyCostCents: number;
  chargeDay: number;
  category: string;
  recurrenceFrequency: "monthly" | "weekly" | "biweekly" | "quarterly" | "yearly";
  recurrenceAnchor: string;
  necessity: "essential" | "discretionary";
  costType: "fixed" | "variable";
  paymentMethod: "autopay" | "manual";
  accountName: string | null;
  isActive: number;
}

const expenses: ExpenseSeed[] = [
  { name: "Rent", monthlyCostCents: 185000, chargeDay: 1, category: "Housing", recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", necessity: "essential", costType: "fixed", paymentMethod: "autopay", accountName: "Checking", isActive: 1 },
  { name: "Groceries", monthlyCostCents: 52000, chargeDay: 5, category: "Groceries", recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", necessity: "essential", costType: "variable", paymentMethod: "manual", accountName: "Credit Card", isActive: 1 },
  { name: "Internet", monthlyCostCents: 8000, chargeDay: 3, category: "Utilities", recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", necessity: "essential", costType: "fixed", paymentMethod: "autopay", accountName: "Checking", isActive: 1 },
  { name: "Electricity", monthlyCostCents: 11000, chargeDay: 8, category: "Utilities", recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", necessity: "essential", costType: "variable", paymentMethod: "autopay", accountName: "Checking", isActive: 1 },
  { name: "Netflix", monthlyCostCents: 1599, chargeDay: 12, category: "Entertainment", recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", necessity: "discretionary", costType: "fixed", paymentMethod: "autopay", accountName: "Credit Card", isActive: 1 },
  { name: "Spotify", monthlyCostCents: 1199, chargeDay: 15, category: "Entertainment", recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", necessity: "discretionary", costType: "fixed", paymentMethod: "autopay", accountName: "Credit Card", isActive: 1 },
  { name: "Gym membership", monthlyCostCents: 4500, chargeDay: 10, category: "Fitness", recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", necessity: "discretionary", costType: "fixed", paymentMethod: "autopay", accountName: "Credit Card", isActive: 1 },
  { name: "Car insurance", monthlyCostCents: 12800, chargeDay: 20, category: "Insurance", recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", necessity: "essential", costType: "fixed", paymentMethod: "autopay", accountName: "Checking", isActive: 1 },
  { name: "Lunch budget", monthlyCostCents: 6000, chargeDay: 24, category: "Food", recurrenceFrequency: "weekly", recurrenceAnchor: "2026-08-24", necessity: "discretionary", costType: "variable", paymentMethod: "manual", accountName: "Credit Card", isActive: 1 },
  { name: "Gas", monthlyCostCents: 9000, chargeDay: 10, category: "Transportation", recurrenceFrequency: "biweekly", recurrenceAnchor: "2026-08-10", necessity: "essential", costType: "variable", paymentMethod: "manual", accountName: "Credit Card", isActive: 1 },
  { name: "Water bill", monthlyCostCents: 7500, chargeDay: 15, category: "Utilities", recurrenceFrequency: "quarterly", recurrenceAnchor: "2026-06-01", necessity: "essential", costType: "fixed", paymentMethod: "manual", accountName: "Checking", isActive: 1 },
  { name: "Amazon Prime", monthlyCostCents: 13900, chargeDay: 1, category: "Entertainment", recurrenceFrequency: "yearly", recurrenceAnchor: "2026-02-01", necessity: "discretionary", costType: "fixed", paymentMethod: "autopay", accountName: "Credit Card", isActive: 1 },
  { name: "Adobe Creative Cloud", monthlyCostCents: 23988, chargeDay: 1, category: "Software", recurrenceFrequency: "yearly", recurrenceAnchor: "2026-07-01", necessity: "discretionary", costType: "fixed", paymentMethod: "autopay", accountName: "Credit Card", isActive: 1 },
  { name: "Old cable (paused)", monthlyCostCents: 8900, chargeDay: 18, category: "Entertainment", recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", necessity: "discretionary", costType: "fixed", paymentMethod: "manual", accountName: null, isActive: 0 },
];

try {
  await client.connect();
  const passwordHash = await hash(reviewPassword);

  const { rows: userRows } = await client.query(
    `INSERT INTO users (username, email, "passwordHash", role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (username)
     DO UPDATE SET
       email = EXCLUDED.email,
       "passwordHash" = EXCLUDED."passwordHash",
       role = 'admin'
     RETURNING id`,
    [reviewUsername, reviewEmail, passwordHash]
  );
  const userId = userRows[0].id;

  await client.query("BEGIN");

  await client.query(`DELETE FROM finance_expenses WHERE "userId" = $1`, [userId]);
  await client.query(`DELETE FROM finance_pay_schedules WHERE user_id = $1`, [userId]);
  await client.query(`DELETE FROM finance_income WHERE "userId" = $1`, [userId]);
  await client.query(`DELETE FROM finance_payment_accounts WHERE user_id = $1`, [userId]);

  const accountNameToId = new Map<string, number>();
  for (const accountName of ["Checking", "Credit Card", "Savings"]) {
    const { rows } = await client.query(
      `INSERT INTO finance_payment_accounts (user_id, name)
       VALUES ($1, $2) RETURNING id`,
      [userId, accountName]
    );
    accountNameToId.set(accountName, rows[0].id);
  }

  for (const expense of expenses) {
    const accountId = expense.accountName ? accountNameToId.get(expense.accountName) : null;
    await client.query(
      `INSERT INTO finance_expenses
         ("userId", name, "monthlyCost", "chargeDay", category, account_id,
          recurrence_frequency, recurrence_anchor, last_day_of_month,
          necessity, cost_type, payment_method, is_active)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12)`,
      [userId, expense.name, expense.monthlyCostCents, expense.chargeDay, expense.category, accountId,
        expense.recurrenceFrequency, expense.recurrenceAnchor, expense.necessity, expense.costType,
        expense.paymentMethod, expense.isActive]
    );
  }

  const checkingId = accountNameToId.get("Checking")!;

  await client.query(
    `INSERT INTO finance_income ("userId", "annualGrossIncome", "taxDeductionPercentage", account_id, pay_frequency)
     VALUES ($1, $2, $3, $4, 'semi-monthly')`,
    [userId, 90000, 24, checkingId]
  );

  await client.query(
    `INSERT INTO finance_pay_schedules
       (user_id, is_enabled, schedule_type, first_nominal_day, second_payday_rule,
        weekend_adjustment, net_paycheck_amount_cents, deposit_account_id)
     VALUES ($1, 1, 'semi-monthly', 15, 'last-day', 'previous-friday', $2, $3)`,
    [userId, 285000, checkingId]
  );

  await client.query("COMMIT");

  console.log(`Seeded local admin review account: ${reviewUsername}`);
  console.log(`  ${expenses.length} expenses, 3 payment accounts, income, and a pay schedule`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}