import type { Rate, Usd } from '../shared/types';
import { monthlyVariableCost, type CostModel } from './cost-model';
import { SALES_CHANNELS, channelFeeFor } from './sales-channel';
import {
  effectiveChurn,
  grossMonthlyUsd,
  transactionsPerMonth,
  type Scenario,
} from './scenario';

/** Разложение месячного чека одного подписчика. Слагаемые дают ровно gross. */
export interface SubscriberEconomics {
  readonly grossUsd: Usd;
  readonly consumptionTaxUsd: Usd;
  readonly channelFeeUsd: Usd;
  readonly variableCostUsd: Usd;
  /** Что остаётся до маркетинга, постоянных расходов и налога на прибыль. */
  readonly contributionUsd: Usd;
  readonly contributionRate: Rate;
  readonly effectiveChurn: Rate;
  readonly expectedLifetimeMonths: number;
  readonly ltvUsd: Usd;
  /** Бесконечность, если маржа неположительна: CAC не вернётся никогда. */
  readonly cacPaybackMonths: number;
  readonly ltvToCac: number;
}

/** Потолок ожидаемого срока жизни, чтобы LTV не улетал при низком оттоке. */
const MAX_LIFETIME_MONTHS = 60;

export function calculateSubscriberEconomics(
  scenario: Scenario,
  costs?: CostModel,
): SubscriberEconomics {
  const gross = grossMonthlyUsd(scenario.pricing);
  const netOfTax = gross / (1 + scenario.consumptionTaxRate);
  const consumptionTax = gross - netOfTax;

  const channelFee = channelFeeFor(
    SALES_CHANNELS[scenario.channelId],
    gross,
    netOfTax,
    transactionsPerMonth(scenario.pricing),
  );

  const variableCost = monthlyVariableCost(
    scenario.usage.voiceRequestsPerDay,
    costs,
  );

  const contribution = gross - consumptionTax - channelFee - variableCost;
  const churn = effectiveChurn(scenario);
  const lifetime = Math.min(1 / churn, MAX_LIFETIME_MONTHS);
  const ltv = contribution * lifetime;
  const { cacUsd } = scenario.growth;

  return {
    grossUsd: gross,
    consumptionTaxUsd: consumptionTax,
    channelFeeUsd: channelFee,
    variableCostUsd: variableCost,
    contributionUsd: contribution,
    contributionRate: gross > 0 ? contribution / gross : 0,
    effectiveChurn: churn,
    expectedLifetimeMonths: lifetime,
    ltvUsd: ltv,
    cacPaybackMonths:
      contribution > 0 ? cacUsd / contribution : Number.POSITIVE_INFINITY,
    ltvToCac: cacUsd > 0 ? ltv / cacUsd : Number.POSITIVE_INFINITY,
  };
}
