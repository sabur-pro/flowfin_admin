import type { Rate, Usd } from '../shared/types';
import { JURISDICTIONS, type JurisdictionId } from './jurisdiction';
import { MARKETS, benchmarkPriceUsd, type MarketId } from './market';
import { PLANS, type PlanFeatures, type PlanId } from './plan';
import type { SalesChannelId } from './sales-channel';

export type BillingPeriod = 'monthly' | 'annual';

/**
 * Горизонт расчёта. Три года — предел, дальше прогноз по оттоку и росту
 * превращается в фантазию; один год честнее показывает, сколько денег нужно
 * прямо сейчас, а не когда-нибудь.
 */
export type HorizonYears = 1 | 2 | 3;

export const HORIZON_YEARS: readonly HorizonYears[] = [1, 2, 3];

export const DEFAULT_HORIZON_YEARS: HorizonYears = 3;

export const MONTHS_PER_YEAR = 12;

export const isHorizonYears = (value: unknown): value is HorizonYears =>
  value === 1 || value === 2 || value === 3;

export interface Pricing {
  readonly monthlyPriceUsd: Usd;
  readonly billingPeriod: BillingPeriod;
  readonly annualDiscount: Rate;
}

export interface Usage {
  readonly voiceRequestsPerDay: number;
  readonly churnMonthly: Rate;
}

export interface Growth {
  readonly firstMonthPayingUsers: number;
  readonly monthlyGrowth: Rate;
  readonly cacUsd: Usd;
  readonly fixedMonthlyCostUsd: Usd;
}

export interface Scenario {
  readonly jurisdictionId: JurisdictionId;
  readonly horizonYears: HorizonYears;
  readonly marketId: MarketId;
  readonly channelId: SalesChannelId;
  readonly planId: PlanId;
  readonly pricing: Pricing;
  readonly usage: Usage;
  readonly growth: Growth;
  readonly corporateTaxRate: Rate;
  readonly consumptionTaxRate: Rate;
}

export function annualPriceUsd(pricing: Pricing): Usd {
  return pricing.monthlyPriceUsd * MONTHS_PER_YEAR * (1 - pricing.annualDiscount);
}

export function grossMonthlyUsd(pricing: Pricing): Usd {
  return pricing.billingPeriod === 'annual'
    ? annualPriceUsd(pricing) / MONTHS_PER_YEAR
    : pricing.monthlyPriceUsd;
}

export function transactionsPerMonth(pricing: Pricing): number {
  return pricing.billingPeriod === 'annual' ? 1 / MONTHS_PER_YEAR : 1;
}

export function planFeatures(scenario: Scenario): PlanFeatures {
  return PLANS[scenario.planId].features;
}

const ANNUAL_RETENTION_FACTOR = 1 / 3;

export function effectiveChurn(scenario: Scenario): Rate {
  const base = scenario.usage.churnMonthly;
  return scenario.pricing.billingPeriod === 'annual'
    ? base * ANNUAL_RETENTION_FACTOR
    : base;
}

export function defaultScenario(
  jurisdictionId: JurisdictionId,
  marketId: MarketId,
  planId: PlanId = 'pro',
): Scenario {
  const jurisdiction = JURISDICTIONS[jurisdictionId];
  const market = MARKETS[marketId];

  return {
    jurisdictionId,
    horizonYears: DEFAULT_HORIZON_YEARS,
    marketId,
    channelId: jurisdiction.channels[0],
    planId,
    pricing: {
      monthlyPriceUsd: benchmarkPriceUsd(market, planId),
      billingPeriod: 'monthly',
      annualDiscount: 0.33,
    },
    usage: {
      voiceRequestsPerDay: market.voiceRequestsPerDay,
      churnMonthly: market.churnMonthly,
    },
    growth: {
      firstMonthPayingUsers: 200,
      monthlyGrowth: 0.1,
      cacUsd: market.cacUsd,
      fixedMonthlyCostUsd: 15_000,
    },
    corporateTaxRate: jurisdiction.corporateTaxRate,
    consumptionTaxRate: market.consumptionTaxRate,
  };
}

export function withPlan(scenario: Scenario, planId: PlanId): Scenario {
  return {
    ...scenario,
    planId,
    pricing: {
      ...scenario.pricing,
      monthlyPriceUsd: benchmarkPriceUsd(MARKETS[scenario.marketId], planId),
    },
  };
}

export function isChannelAvailable(scenario: Scenario): boolean {
  return JURISDICTIONS[scenario.jurisdictionId].channels.includes(
    scenario.channelId,
  );
}
