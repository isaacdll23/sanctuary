import { useMemo } from "react";

interface IncomeCalculations {
  annualTax: number;
  monthlyTax: number;
  annualNetIncome: number;
  monthlyNetIncome: number;
  netRemainingYearly: number;
  netRemainingMonthly: number;
}

/**
 * Hook for calculating income, taxes, and remaining balance
 * Used in expenses and income pages for financial calculations
 */
export function calculateIncomeCents(
  annualGrossIncomeCents: number | undefined,
  taxDeductionPercentage: number | undefined,
  totalMonthlyCost: number = 0
): IncomeCalculations {
  const grossIncome = annualGrossIncomeCents || 0;
  const taxPercentage = taxDeductionPercentage || 0;
  const monthlyExpenses = totalMonthlyCost;

  const annualTax = (grossIncome * taxPercentage) / 100;
  const monthlyTax = annualTax / 12;
  const annualNetIncome = grossIncome * (1 - taxPercentage / 100);
  const monthlyNetIncome = annualNetIncome / 12;
  const netRemainingYearly = annualNetIncome - monthlyExpenses * 12;
  const netRemainingMonthly = monthlyNetIncome - monthlyExpenses;

  return {
    annualTax,
    monthlyTax,
    annualNetIncome,
    monthlyNetIncome,
    netRemainingYearly,
    netRemainingMonthly,
  };
}

/** All inputs and outputs are integer cents, except the tax percentage. */
export function useIncomeCalculations(
  annualGrossIncomeCents: number | undefined,
  taxDeductionPercentage: number | undefined,
  totalMonthlyCost: number = 0
): IncomeCalculations {
  return useMemo(
    () => calculateIncomeCents(annualGrossIncomeCents, taxDeductionPercentage, totalMonthlyCost),
    [annualGrossIncomeCents, taxDeductionPercentage, totalMonthlyCost]
  );
}
