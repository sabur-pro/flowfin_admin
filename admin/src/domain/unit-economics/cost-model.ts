import type { Usd } from '../shared/types';
import type { PlanFeatures } from './plan';


export interface CostModel {
  readonly voiceRequestUsd: Usd;
  readonly accountPerUserMonthUsd: Usd;
  readonly syncPerUserMonthUsd: Usd;
}

export const DEFAULT_COST_MODEL: CostModel = {
  voiceRequestUsd: 0.00076,
  accountPerUserMonthUsd: 0.004,
  syncPerUserMonthUsd: 0.021,
};

export interface VariableCost {
  readonly accountUsd: Usd;
  readonly syncUsd: Usd;
  readonly aiUsd: Usd;
  readonly totalUsd: Usd;
  readonly billedVoiceRequestsPerMonth: number;
}

export const DAYS_PER_MONTH = 30;

export function variableCostFor(
  features: PlanFeatures,
  voiceRequestsPerDay: number,
  costs: CostModel = DEFAULT_COST_MODEL,
): VariableCost {
  const billedRequests = features.aiVoice
    ? voiceRequestsPerDay * DAYS_PER_MONTH
    : 0;

  const accountUsd = costs.accountPerUserMonthUsd;
  const syncUsd = features.cloudSync ? costs.syncPerUserMonthUsd : 0;
  const aiUsd = billedRequests * costs.voiceRequestUsd;

  return {
    accountUsd,
    syncUsd,
    aiUsd,
    totalUsd: accountUsd + syncUsd + aiUsd,
    billedVoiceRequestsPerMonth: billedRequests,
  };
}
export function voiceCostPerMonth(
  voiceRequestsPerDay: number,
  costs: CostModel = DEFAULT_COST_MODEL,
): Usd {
  return voiceRequestsPerDay * DAYS_PER_MONTH * costs.voiceRequestUsd;
}
