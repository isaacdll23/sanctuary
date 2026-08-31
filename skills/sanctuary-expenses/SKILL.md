---
name: sanctuary-expenses
description: Develop, review, or diagnose Sanctuary's recurring Expenses feature, including recurrence schedules, normalized totals, payment accounts, filtering, and expense mutations. Use for work centered on app/routes/finance/expenses.tsx or its supporting finance modules.
---

# Sanctuary Expenses

Preserve the Expenses feature as a recurring-commitments and cash-flow planner. Keep route code focused on orchestration, business rules in services or finance utilities, and all writes behind `pageAccessAction("finance", ...)`.

## Domain invariants

- `finance_expenses.monthlyCost` is a legacy name. It stores the **amount per charge in integer cents**, not necessarily a monthly amount.
- Use `getNormalizedMonthlyCostCents` and `getNormalizedYearlyCostCents` from `app/modules/finance/recurrence.ts` for summaries, income remainder, filtered subtotals, percentage shares, sorting by cost, and dashboard totals.
- Weekly, biweekly, monthly, quarterly, and yearly schedules derive their next occurrence from `recurrenceAnchor`; never persist a next-charge value that becomes stale.
- Use an explicit reference date from loader data for rendered next-charge calculations and sorting. This avoids server/client disagreement around midnight.
- Honor `lastDayOfMonth` for month-based schedules. Numbered days that do not exist in a shorter month clamp to that month's last day.
- Upcoming cash-flow cards represent actual charge occurrences and per-charge amounts. Do not assign an entire normalized monthly amount to a single upcoming date.
- Paused expenses remain visible and editable but are excluded from active totals and upcoming cash flow.
- `finance_expense_charges` is the ledger of actual charge occurrences, unique per (expense, charge date). The projected amount in `monthlyCost` is never mutated when recording what was actually charged; write actual amounts to the ledger via `setExpenseChargeForUser`, which confirms expense ownership before the upsert. Expense deletion cascades to its charge records.
- Headline financial summaries always cover all active expenses. Search, status, and category controls may change only the results list and clearly labeled filtered subtotals.

## Ownership and mutations

- Keep form parsing and database writes in `app/modules/services/ExpenseService.ts`.
- Update, delete, and status predicates must include both expense ID and current user ID.
- Treat a submitted payment-account ID as untrusted. Confirm that it belongs to the current user before assigning it.
- Payment-account deletion unassigns that user's linked expenses; it must not delete expenses or change another user's rows.
- Preserve cents-based validation and typed action results. Surface mutation success and failure outside the modal so table and account actions receive feedback too.

## Schema changes

The production migration container runs `drizzle-kit push --force` from the current Drizzle schema. Raw files under `migrations/` are useful documentation and manual migrations, but are not automatically executed during deployment.

Make additive schema changes safe for existing production rows directly in `app/db/schema.ts`, normally with compatible database defaults before adding `NOT NULL`. Keep any accompanying SQL migration idempotent and consistent with the Drizzle definition.

## Primary files

- `app/routes/finance/expenses.tsx`
- `app/modules/services/ExpenseService.ts`
- `app/modules/finance/recurrence.ts`
- `app/hooks/useExpenseFiltering.ts`
- `app/hooks/useIncomeCalculations.ts`
- `app/components/finance/ExpenseFormModal.tsx`
- `app/components/finance/ExpensesTable.tsx`
- `app/components/finance/PaymentAccountsPanel.tsx`
- `app/db/schema.ts`
- `app/components/finance/ExpensesTable.tsx` — includes `ChargePaidControl` (mark-as-paid / undo)
- `app/components/finance/PaycheckCashFlow.tsx` — per-bill paid badges from the charge ledger

When totals change, also inspect `app/modules/services/DashboardOverviewService.ts` and the dashboard labels.

## Verification

Add focused tests for recurrence boundaries, normalization, validation, and filtering. Before handing off changes, run:

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

For UI changes, review both the mobile card path and desktop table path, including keyboard labels and filtered/true-empty states.
