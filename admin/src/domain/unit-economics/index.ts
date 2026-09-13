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
  annualPriceUsd,
  defaultScenario,
  effectiveChurn,
  grossMonthlyUsd,
  isChannelAvailable,
  planFeatures,
  transactionsPerMonth,
  withPlan,
} from './scenario';
export type {
  BillingPeriod,
  Growth,
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
} from './workspace';
export type { ScenarioKey, ScenarioTarget, Workspace } from './workspace';

export { calculateSubscriberEconomics } from './subscriber-economics';
export type { SubscriberEconomics } from './subscriber-economics';

export { DEFAULT_HORIZON_MONTHS, project } from './projection';
export type { FiscalYear, MonthlyResult, Projection } from './projection';
