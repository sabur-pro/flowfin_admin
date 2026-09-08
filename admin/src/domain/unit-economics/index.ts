export { DEFAULT_COST_MODEL, monthlyVariableCost } from './cost-model';
export type { CostModel } from './cost-model';

export { JURISDICTIONS } from './jurisdiction';
export type { Jurisdiction, JurisdictionId } from './jurisdiction';

export { MARKETS, inLocalCurrency } from './market';
export type { Market, MarketId } from './market';

export { SALES_CHANNELS, channelFeeFor } from './sales-channel';
export type { ChannelFee, SalesChannel, SalesChannelId } from './sales-channel';

export {
  annualPriceUsd,
  defaultScenario,
  effectiveChurn,
  grossMonthlyUsd,
  isChannelAvailable,
  transactionsPerMonth,
} from './scenario';
export type {
  BillingPeriod,
  Growth,
  Pricing,
  Scenario,
  Usage,
} from './scenario';

export { calculateSubscriberEconomics } from './subscriber-economics';
export type { SubscriberEconomics } from './subscriber-economics';

export { DEFAULT_HORIZON_MONTHS, project } from './projection';
export type { FiscalYear, MonthlyResult, Projection } from './projection';
