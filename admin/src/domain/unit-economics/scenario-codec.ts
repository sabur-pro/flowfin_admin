import { JURISDICTIONS, type JurisdictionId } from './jurisdiction';
import { MARKETS, type MarketId } from './market';
import { isPlanId } from './plan';
import { SALES_CHANNELS, type SalesChannelId } from './sales-channel';
import type { BillingPeriod, Scenario } from './scenario';
import { keyOf, type Workspace } from './workspace';

/**
 * Разбор рабочего набора: словарь сценариев по комбинациям плюс активная.
 * Запись, которая не соответствует собственному ключу, выбрасывается целиком —
 * такой сценарий подсунули бы не тому рынку, а это хуже потери настроек.
 */
export function parseWorkspace(raw: unknown): Workspace | null {
  if (!isRecord(raw) || !isRecord(raw.scenarios)) return null;

  const scenarios: Record<string, Scenario> = {};
  for (const [key, value] of Object.entries(raw.scenarios)) {
    const scenario = parseScenario(value);
    if (scenario && keyOf(scenario) === key) scenarios[key] = scenario;
  }

  const activeKey = typeof raw.activeKey === 'string' ? raw.activeKey : null;
  if (!activeKey || !scenarios[activeKey]) return null;

  return { activeKey, scenarios };
}

/**
 * Разбор сценария, пришедшего снаружи — из localStorage или ссылки. Данные
 * могли быть записаны прошлой версией модели, поэтому доверять им нельзя:
 * что угодно непонятное превращается в null, а вызывающий берёт дефолт.
 */
export function parseScenario(raw: unknown): Scenario | null {
  if (!isRecord(raw)) return null;

  const jurisdictionId = pick(raw.jurisdictionId, JURISDICTIONS);
  const marketId = pick(raw.marketId, MARKETS);
  const channelId = pick(raw.channelId, SALES_CHANNELS);
  const planId = isPlanId(raw.planId) ? raw.planId : null;

  if (!jurisdictionId || !marketId || !channelId || !planId) return null;

  // Канал из другой юрисдикции — не «почти верный» сценарий, а рассинхрон
  // модели: у таджикского юрлица не может быть App Store.
  if (!JURISDICTIONS[jurisdictionId].channels.includes(channelId)) return null;

  const pricing = isRecord(raw.pricing) ? raw.pricing : null;
  const usage = isRecord(raw.usage) ? raw.usage : null;
  const growth = isRecord(raw.growth) ? raw.growth : null;
  if (!pricing || !usage || !growth) return null;

  const billingPeriod = isBillingPeriod(pricing.billingPeriod)
    ? pricing.billingPeriod
    : null;
  if (!billingPeriod) return null;

  const monthlyPriceUsd = num(pricing.monthlyPriceUsd);
  const annualDiscount = num(pricing.annualDiscount);
  const voiceRequestsPerDay = num(usage.voiceRequestsPerDay);
  const churnMonthly = num(usage.churnMonthly);
  const firstMonthPayingUsers = num(growth.firstMonthPayingUsers);
  const monthlyGrowth = num(growth.monthlyGrowth);
  const cacUsd = num(growth.cacUsd);
  const fixedMonthlyCostUsd = num(growth.fixedMonthlyCostUsd);
  const corporateTaxRate = num(raw.corporateTaxRate);
  const consumptionTaxRate = num(raw.consumptionTaxRate);

  if (
    monthlyPriceUsd === null ||
    annualDiscount === null ||
    voiceRequestsPerDay === null ||
    firstMonthPayingUsers === null ||
    monthlyGrowth === null ||
    cacUsd === null ||
    fixedMonthlyCostUsd === null ||
    corporateTaxRate === null ||
    consumptionTaxRate === null
  ) {
    return null;
  }

  // Нулевой отток дал бы бесконечный срок жизни и деление на ноль в LTV.
  if (churnMonthly === null || churnMonthly <= 0) return null;

  return {
    jurisdictionId,
    marketId,
    channelId,
    planId,
    pricing: { monthlyPriceUsd, billingPeriod, annualDiscount },
    usage: { voiceRequestsPerDay, churnMonthly },
    growth: {
      firstMonthPayingUsers,
      monthlyGrowth,
      cacUsd,
      fixedMonthlyCostUsd,
    },
    corporateTaxRate,
    consumptionTaxRate,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;

const isBillingPeriod = (value: unknown): value is BillingPeriod =>
  value === 'monthly' || value === 'annual';

/** Строка, которая действительно является ключом справочника. */
function pick<T extends JurisdictionId | MarketId | SalesChannelId>(
  value: unknown,
  dictionary: Readonly<Record<T, unknown>>,
): T | null {
  return typeof value === 'string' && value in dictionary ? (value as T) : null;
}
