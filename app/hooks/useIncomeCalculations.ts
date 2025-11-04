import { useMemo } from "react";

interface IncomeData {
  annualGrossIncome: number;
  taxDeductionPercentage: number;
  totalMonthlyCost: number;
}

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
export function useIncomeCalculations(
  annualGrossIncome: number | undefined,
  taxDeductionPercentage: number | undefined,
  totalMonthlyCost: number = 0
): IncomeCalculations {
  return useMemo(() => {
    const grossIncome = annualGrossIncome || 0;
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
  }, [annualGrossIncome, taxDeductionPercentage, totalMonthlyCost]);
}
