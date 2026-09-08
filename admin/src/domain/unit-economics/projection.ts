import type { MonthIndex, Usd } from '../shared/types';
import { JURISDICTIONS } from './jurisdiction';
import type { Scenario } from './scenario';
import type { SubscriberEconomics } from './subscriber-economics';

export interface MonthlyResult {
  readonly month: MonthIndex;
  readonly newSubscribers: number;
  readonly activeSubscribers: number;
  readonly grossRevenueUsd: Usd;
  readonly contributionUsd: Usd;
  readonly marketingUsd: Usd;
  readonly fixedCostUsd: Usd;
  /** Прибыль до налога. */
  readonly operatingProfitUsd: Usd;
  readonly taxUsd: Usd;
  readonly netProfitUsd: Usd;
  readonly cumulativeProfitUsd: Usd;
}

export interface FiscalYear {
  readonly year: number;
  readonly endingSubscribers: number;
  readonly grossRevenueUsd: Usd;
  readonly contributionUsd: Usd;
  readonly marketingUsd: Usd;
  readonly fixedCostUsd: Usd;
  readonly taxUsd: Usd;
  readonly netProfitUsd: Usd;
}

export interface Projection {
  readonly months: readonly MonthlyResult[];
  readonly years: readonly FiscalYear[];
  readonly cumulativeProfitUsd: Usd;
  readonly endingSubscribers: number;
  /** Месяц, с которого операционная прибыль стала положительной. */
  readonly operatingBreakEvenMonth: MonthIndex | null;
  /** Месяц, в котором вернулись все вложенные деньги. */
  readonly capitalRecoveryMonth: MonthIndex | null;
  /** Самая глубокая точка накопленного минуса — размер потребности в деньгах. */
  readonly peakDrawdownUsd: Usd;
}

export const DEFAULT_HORIZON_MONTHS = 36;

/**
 * Помесячная проекция на три года.
 *
 * Налог считается раз в год, а не размазывается по месяцам: сначала убытки
 * прошлых лет гасят прибыль текущего, затем из остатка вычитается необлагаемая
 * сумма, и только на то, что осталось, начисляется ставка.
 */
export function project(
  scenario: Scenario,
  economics: SubscriberEconomics,
  horizonMonths: number = DEFAULT_HORIZON_MONTHS,
): Projection {
  const { growth } = scenario;
  const allowance = allowanceFor(scenario);

  const months: MonthlyResult[] = [];
  const years: FiscalYear[] = [];

  let active = 0;
  let lossCarryForward = 0;
  let profitThisYear = 0;
  let cumulative = 0;
  let yearBucket = emptyYear(1);

  for (let month = 1; month <= horizonMonths; month += 1) {
    const newSubscribers =
      growth.firstMonthPayingUsers * (1 + growth.monthlyGrowth) ** (month - 1);

    active = active * (1 - economics.effectiveChurn) + newSubscribers;

    const grossRevenue = active * economics.grossUsd;
    const contribution = active * economics.contributionUsd;
    const marketing = newSubscribers * growth.cacUsd;
    const operatingProfit =
      contribution - marketing - growth.fixedMonthlyCostUsd;

    profitThisYear += operatingProfit;

    let tax = 0;
    const isFiscalYearEnd = month % 12 === 0;

    if (isFiscalYearEnd) {
      const settled = settleTax(
        profitThisYear,
        lossCarryForward,
        allowance,
        scenario.corporateTaxRate,
      );
      tax = settled.tax;
      lossCarryForward = settled.lossCarryForward;
      profitThisYear = 0;
    }

    const netProfit = operatingProfit - tax;
    cumulative += netProfit;

    const result: MonthlyResult = {
      month,
      newSubscribers,
      activeSubscribers: active,
      grossRevenueUsd: grossRevenue,
      contributionUsd: contribution,
      marketingUsd: marketing,
      fixedCostUsd: growth.fixedMonthlyCostUsd,
      operatingProfitUsd: operatingProfit,
      taxUsd: tax,
      netProfitUsd: netProfit,
      cumulativeProfitUsd: cumulative,
    };

    months.push(result);
    yearBucket = accumulate(yearBucket, result);

    if (isFiscalYearEnd) {
      years.push(yearBucket);
      yearBucket = emptyYear(years.length + 1);
    }
  }

  return {
    months,
    years,
    cumulativeProfitUsd: cumulative,
    endingSubscribers: active,
    operatingBreakEvenMonth:
      months.find((m) => m.operatingProfitUsd > 0)?.month ?? null,
    capitalRecoveryMonth:
      months.find((m) => m.cumulativeProfitUsd > 0)?.month ?? null,
    peakDrawdownUsd: Math.min(
      0,
      ...months.map((m) => m.cumulativeProfitUsd),
    ),
  };
}

function allowanceFor(scenario: Scenario): Usd {
  // Необлагаемая сумма — свойство юрисдикции, но ставку в сценарии можно
  // переопределить. Если её обнулили, льгота уже ни на что не влияет.
  if (scenario.corporateTaxRate <= 0) return 0;
  return JURISDICTIONS[scenario.jurisdictionId].taxFreeAllowanceUsd;
}

function settleTax(
  yearProfit: Usd,
  lossCarryForward: Usd,
  allowanceUsd: Usd,
  rate: number,
): { tax: Usd; lossCarryForward: Usd } {
  if (yearProfit <= 0) {
    return { tax: 0, lossCarryForward: lossCarryForward - yearProfit };
  }

  const used = Math.min(lossCarryForward, yearProfit);
  const afterLosses = yearProfit - used;
  const taxable = Math.max(0, afterLosses - allowanceUsd);

  return { tax: taxable * rate, lossCarryForward: lossCarryForward - used };
}

function emptyYear(year: number): FiscalYear {
  return {
    year,
    endingSubscribers: 0,
    grossRevenueUsd: 0,
    contributionUsd: 0,
    marketingUsd: 0,
    fixedCostUsd: 0,
    taxUsd: 0,
    netProfitUsd: 0,
  };
}

function accumulate(bucket: FiscalYear, month: MonthlyResult): FiscalYear {
  return {
    year: bucket.year,
    endingSubscribers: month.activeSubscribers,
    grossRevenueUsd: bucket.grossRevenueUsd + month.grossRevenueUsd,
    contributionUsd: bucket.contributionUsd + month.contributionUsd,
    marketingUsd: bucket.marketingUsd + month.marketingUsd,
    fixedCostUsd: bucket.fixedCostUsd + month.fixedCostUsd,
    taxUsd: bucket.taxUsd + month.taxUsd,
    netProfitUsd: bucket.netProfitUsd + month.netProfitUsd,
  };
}
