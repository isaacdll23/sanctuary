import { useMemo, useState } from "react";
import { ArrowPathIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { useFetcher } from "react-router";
import type { Route } from "./+types/income";
import { pageAccessAction, pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getExpectedPaycheckCents, getPayDatesAfter, getReferenceDateKey } from "~/modules/finance/paySchedule";
import { formatDateKey, parseDateKey } from "~/modules/finance/recurrence";
import { getIncomeOverviewForUser, saveIncomeOverviewForUser, validateIncomeForm } from "~/modules/services/IncomeService";
import type { IncomeActionResult, IncomeFormErrors } from "~/types/income";
import FinanceSubnav from "~/components/finance/FinanceSubnav";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Income" }];
}

export const loader = pageAccessLoader("finance", async (user) => ({
  ...await getIncomeOverviewForUser(user.id),
  asOfDate: getReferenceDateKey(user.timeZone),
}));

export const action = pageAccessAction("finance", async (user, request): Promise<IncomeActionResult> => {
  const parsed = validateIncomeForm(await request.formData());
  if (!parsed.success) return parsed.result;
  const saved = await saveIncomeOverviewForUser(user.id, parsed.data);
  return saved.ok ? { ok: true, message: "Income and pay schedule saved." } : saved;
});

export default function Income({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<IncomeActionResult>();
  const schedule = loaderData.paySchedule;
  const initiallyScheduled = Boolean(schedule && schedule.isEnabled !== 0);
  const [scheduleEnabled, setScheduleEnabled] = useState(initiallyScheduled);
  const [firstNominalDay, setFirstNominalDay] = useState(String(schedule?.firstNominalDay ?? 15));
  const [weekendAdjustment, setWeekendAdjustment] = useState(schedule?.weekendAdjustment ?? "previous-friday");
  const [netPaycheckAmount, setNetPaycheckAmount] = useState(schedule?.netPaycheckAmountCents != null ? (schedule.netPaycheckAmountCents / 100).toFixed(2) : "");
  const [depositAccountId, setDepositAccountId] = useState(String(schedule?.depositAccountId ?? ""));
  const expected = getExpectedPaycheckCents(
    { ...schedule, netPaycheckAmountCents: netPaycheckAmount ? Math.round(Number(netPaycheckAmount) * 100) : null },
    loaderData.income?.annualGrossIncome,
    loaderData.income?.taxDeductionPercentage
  );
  const preview = useMemo(
    () => scheduleEnabled ? getPayDatesAfter({ ...schedule, firstNominalDay: Number(firstNominalDay), weekendAdjustment }, parseDateKey(loaderData.asOfDate), 6) : [],
    [schedule, scheduleEnabled, firstNominalDay, weekendAdjustment, loaderData.asOfDate]
  );
  const errors = fetcher.data && !fetcher.data.ok ? fetcher.data : undefined;
  const taxRate = loaderData.income?.taxDeductionPercentage;
  const annualNetIncome = loaderData.income ? loaderData.income.annualGrossIncome * (1 - (taxRate ?? 0) / 100) : null;

  const fieldError = (field: keyof IncomeFormErrors) => errors?.fieldErrors?.[field];
  const fieldClass = (field: keyof IncomeFormErrors) =>
    `mt-1.5 w-full rounded-lg border bg-gray-100 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-gray-100 ${fieldError(field) ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-gray-400 dark:border-gray-600 dark:focus:ring-gray-600"}`;
  const fieldA11y = (field: keyof IncomeFormErrors) => ({
    "aria-invalid": Boolean(fieldError(field)),
    "aria-describedby": fieldError(field) ? `${field}-error` : undefined,
  });

  return (
    <div className="min-h-screen bg-transparent p-4 text-gray-100 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">Income</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Set annual income and a primary paycheck schedule for clearer cash flow.</p>
        </header>

        <FinanceSubnav />

        {fetcher.data && <Feedback result={fetcher.data} />}

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Annual gross income" value={loaderData.income ? `$${loaderData.income.annualGrossIncome.toLocaleString()}` : "Not configured"} />
          <Metric label="Tax deduction rate" value={taxRate == null ? "Not configured" : `${taxRate}%`} />
          <Metric label="Estimated annual net income" value={annualNetIncome == null ? "Not configured" : `$${annualNetIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <Metric label={expected.isEstimate ? "Estimated net paycheck" : "Configured net paycheck"} value={scheduleEnabled ? `$${formatMoney(expected.amountCents)}` : "No schedule"} />
        </div>

        <section className="rounded-xl border border-gray-300 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Income and primary pay schedule</h2>
          <fetcher.Form method="post" className="mt-5 space-y-5">
            {errors && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{errors.error}</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Annual gross income" field="annualGrossIncome" error={fieldError("annualGrossIncome")}>
                <div className="relative"><span aria-hidden="true" className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600 dark:text-gray-400">$</span><input id="annualGrossIncome" name="annualGrossIncome" type="number" min="0" step="1" inputMode="decimal" required defaultValue={loaderData.income?.annualGrossIncome} className={`${fieldClass("annualGrossIncome")} pl-7`} {...fieldA11y("annualGrossIncome")} /></div>
              </Field>
              <Field label="Tax deduction percentage" field="taxDeductionPercentage" error={fieldError("taxDeductionPercentage")}>
                <div className="relative"><input id="taxDeductionPercentage" name="taxDeductionPercentage" type="number" min="0" max="100" step="1" inputMode="decimal" required defaultValue={loaderData.income?.taxDeductionPercentage} className={`${fieldClass("taxDeductionPercentage")} pr-8`} {...fieldA11y("taxDeductionPercentage")} /><span aria-hidden="true" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 dark:text-gray-400">%</span></div>
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300">
              <input type="checkbox" name="scheduleEnabled" value="1" checked={scheduleEnabled} onChange={(event) => setScheduleEnabled(event.target.checked)} className="rounded" />
              <span><span className="font-medium">Use a primary pay schedule</span><span className="block text-xs text-gray-600 dark:text-gray-400">Enables paycheck-period cash flow on Expenses.</span></span>
            </label>

            <fieldset disabled={!scheduleEnabled} aria-describedby="schedule-controls-help" className="space-y-5 disabled:opacity-75">
              <legend className="sr-only">Primary pay schedule settings</legend>
              <p id="schedule-controls-help" className="text-sm text-gray-600 dark:text-gray-400">{scheduleEnabled ? "Configure the dates and expected deposit for this primary schedule." : "Enable the primary pay schedule above to edit these settings."}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlySetting label="Schedule type" value="Semi-monthly" />
                <Field label="First nominal payday" field="firstNominalDay" error={fieldError("firstNominalDay")}>
                  <select id="firstNominalDay" value={firstNominalDay} onChange={(event) => setFirstNominalDay(event.target.value)} className={fieldClass("firstNominalDay")} {...fieldA11y("firstNominalDay")}>
                    {Array.from({ length: 27 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{ordinal(day)} of each month</option>)}
                  </select>
                </Field>
                <ReadOnlySetting label="Second payday" value="Last calendar day" />
                <Field label="Weekend adjustment" field="weekendAdjustment" error={fieldError("weekendAdjustment")}>
                  <select id="weekendAdjustment" value={weekendAdjustment} onChange={(event) => setWeekendAdjustment(event.target.value)} className={fieldClass("weekendAdjustment")} {...fieldA11y("weekendAdjustment")}><option value="previous-friday">Previous Friday</option><option value="none">No adjustment</option></select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Actual net amount per paycheck (optional)" field="netPaycheckAmount" error={fieldError("netPaycheckAmount")}>
                  <input id="netPaycheckAmount" value={netPaycheckAmount} onChange={(event) => setNetPaycheckAmount(event.target.value)} type="number" min="0" step="0.01" placeholder="Use annual-income estimate" className={fieldClass("netPaycheckAmount")} {...fieldA11y("netPaycheckAmount")} />
                </Field>
                <Field label="Deposit account (optional)" field="depositAccountId" error={fieldError("depositAccountId")}>
                  <select id="depositAccountId" value={depositAccountId} onChange={(event) => setDepositAccountId(event.target.value)} className={fieldClass("depositAccountId")} {...fieldA11y("depositAccountId")}><option value="">Unassigned</option>{loaderData.paymentAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>
                </Field>
              </div>
            </fieldset>

            <input type="hidden" name="scheduleType" value="semi-monthly" />
            <input type="hidden" name="firstNominalDay" value={firstNominalDay} />
            <input type="hidden" name="secondPaydayRule" value="last-day" />
            <input type="hidden" name="weekendAdjustment" value={weekendAdjustment} />
            <input type="hidden" name="netPaycheckAmount" value={netPaycheckAmount} />
            <input type="hidden" name="depositAccountId" value={depositAccountId} />

            <button type="submit" disabled={fetcher.state !== "idle"} className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-60 dark:bg-gray-700 dark:hover:bg-gray-600">
              {fetcher.state !== "idle" ? <><ArrowPathIcon className="h-4 w-4 animate-spin" />Saving...</> : "Save income and pay schedule"}
            </button>
          </fetcher.Form>
        </section>

        {scheduleEnabled && <UpcomingPaydays preview={preview} weekendAdjustment={weekendAdjustment} expected={expected} />}
      </div>
    </div>
  );
}

function Feedback({ result }: { result: IncomeActionResult }) {
  return <div role={result.ok ? "status" : "alert"} aria-live="polite" className={`mb-6 rounded-lg border px-4 py-3 text-sm ${result.ok ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"}`}>{result.ok ? result.message : result.error}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><p className="text-xs leading-snug text-gray-600 dark:text-gray-400">{label}</p><p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">{value}</p></div>;
}

function Field({ label, field, error, children }: { label: string; field: string; error?: string; children: React.ReactNode }) {
  return <div><label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>{children}{error && <p id={`${field}-error`} className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p>}</div>;
}

function ReadOnlySetting({ label, value }: { label: string; value: string }) {
  return <div><p className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p><p className="mt-1.5 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-700/60 dark:text-gray-300">{value}</p></div>;
}

function UpcomingPaydays({ preview, weekendAdjustment, expected }: { preview: Date[]; weekendAdjustment: string; expected: { amountCents: number; isEstimate: boolean } }) {
  return <section className="mt-6 rounded-xl border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
    <div className="flex items-center gap-2">
      <CalendarDaysIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Next scheduled paydays</h2>
    </div>
    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
      {weekendAdjustment === "previous-friday" ? "Weekend paydays move to the previous Friday." : "Weekend paydays remain on their calendar date."} ${formatMoney(expected.amountCents)} per paycheck{expected.isEstimate ? " (estimate)" : ""}.
    </p>
    <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {preview.slice(0, 4).map((date) => <li key={formatDateKey(date)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 dark:bg-gray-700 dark:text-gray-100">{formatShortPayday(date)}</li>)}
    </ol>
  </section>;
}

function ordinal(day: number) {
  const suffix = day % 10 === 1 && day % 100 !== 11 ? "st" : day % 10 === 2 && day % 100 !== 12 ? "nd" : day % 10 === 3 && day % 100 !== 13 ? "rd" : "th";
  return `${day}${suffix}`;
}

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatShortPayday(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}
