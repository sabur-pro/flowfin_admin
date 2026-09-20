export {
  DAYS_PER_MONTH,
  DEFAULT_COST_MODEL,
  variableCostFor,
  voiceCostPerMonth,
} from './cost-model';
export type { CostModel, VariableCost } from './cost-model';

export { JURISDICTIONS } from './jurisdiction';
export type { Jurisdiction, JurisdictionId } from './jurisdiction';

export { MARKETS, benchmarkPriceUsd, inLocalCurrency } from './market';
export type { Market, MarketId } from './market';

export { PLANS, PLAN_IDS, isPlanId } from './plan';
export type { Plan, PlanFeatures, PlanId } from './plan';

export { SALES_CHANNELS, channelFeeFor } from './sales-channel';
export type { ChannelFee, SalesChannel, SalesChannelId } from './sales-channel';

export {
  DEFAULT_HORIZON_YEARS,
  HORIZON_YEARS,
  MONTHS_PER_YEAR,
  annualPriceUsd,
  defaultScenario,
  effectiveChurn,
  grossMonthlyUsd,
  isChannelAvailable,
  isHorizonYears,
  planFeatures,
  transactionsPerMonth,
  withPlan,
} from './scenario';
export type {
  BillingPeriod,
  Growth,
  HorizonYears,
  Pricing,
  Scenario,
  Usage,
} from './scenario';

export { parseScenario, parseWorkspace } from './scenario-codec';

export {
  activeScenario,
  createWorkspace,
  keyOf,
  resetActive,
  scenarioKey,
  switchTo,
  updateActive,
  workspaceFingerprint,
} from './workspace';
export type { ScenarioKey, ScenarioTarget, Workspace } from './workspace';

export { calculateSubscriberEconomics } from './subscriber-economics';
export type { SubscriberEconomics } from './subscriber-economics';

export {
  DEFAULT_HORIZON_MONTHS,
  horizonMonthsOf,
  project,
} from './projection';
export type { FiscalYear, MonthlyResult, Projection } from './projection';
