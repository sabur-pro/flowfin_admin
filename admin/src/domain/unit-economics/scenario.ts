import type { Rate, Usd } from '../shared/types';
import { JURISDICTIONS, type JurisdictionId } from './jurisdiction';
import { MARKETS, type MarketId } from './market';
import type { SalesChannelId } from './sales-channel';

export type BillingPeriod = 'monthly' | 'annual';

export interface Pricing {
  /** Цена месяца при помесячной оплате. Годовая считается из неё и скидки. */
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
  readonly marketId: MarketId;
  readonly channelId: SalesChannelId;
  readonly pricing: Pricing;
  readonly usage: Usage;
  readonly growth: Growth;
  /** Ставку налога можно переопределить: у Free Zone она нулевая. */
  readonly corporateTaxRate: Rate;
  readonly consumptionTaxRate: Rate;
}

/** Годовая цена, которую видит клиент. */
export function annualPriceUsd(pricing: Pricing): Usd {
  return pricing.monthlyPriceUsd * 12 * (1 - pricing.annualDiscount);
}

/** Выручка в пересчёте на месяц независимо от периодичности оплаты. */
export function grossMonthlyUsd(pricing: Pricing): Usd {
  return pricing.billingPeriod === 'annual'
    ? annualPriceUsd(pricing) / 12
    : pricing.monthlyPriceUsd;
}

/** Сколько раз в месяц с клиента списывают — важно для фикс-комиссии. */
export function transactionsPerMonth(pricing: Pricing): number {
  return pricing.billingPeriod === 'annual' ? 1 / 12 : 1;
}

/**
 * Годовые подписчики уходят кратно реже помесячных: решение об отказе они
 * принимают раз в год, а не двенадцать раз. Коэффициент — консервативная треть.
 */
const ANNUAL_RETENTION_FACTOR = 1 / 3;

export function effectiveChurn(scenario: Scenario): Rate {
  const base = scenario.usage.churnMonthly;
  return scenario.pricing.billingPeriod === 'annual'
    ? base * ANNUAL_RETENTION_FACTOR
    : base;
}

/**
 * Сценарий по умолчанию для пары «откуда продаём — кому продаём». Канал берётся
 * первый доступный в юрисдикции, цена и отток — из ориентиров рынка.
 */
export function defaultScenario(
  jurisdictionId: JurisdictionId,
  marketId: MarketId,
): Scenario {
  const jurisdiction = JURISDICTIONS[jurisdictionId];
  const market = MARKETS[marketId];

  return {
    jurisdictionId,
    marketId,
    channelId: jurisdiction.channels[0],
    pricing: {
      monthlyPriceUsd: market.benchmark.proUsd,
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

/** Канал, недоступный в юрисдикции, молча не подставляем — это ошибка ввода. */
export function isChannelAvailable(scenario: Scenario): boolean {
  return JURISDICTIONS[scenario.jurisdictionId].channels.includes(
    scenario.channelId,
  );
}
