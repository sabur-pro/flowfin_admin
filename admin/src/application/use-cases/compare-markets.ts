import {
  JURISDICTIONS,
  MARKETS,
  defaultScenario,
  type JurisdictionId,
  type Market,
  type MarketId,
  type PlanId,
  type Scenario,
} from '@/domain/unit-economics';
import {
  buildUnitEconomicsReport,
  type UnitEconomicsReport,
} from './build-unit-economics-report';

export interface MarketComparisonRow {
  readonly market: Market;
  readonly report: UnitEconomicsReport;
}

/**
 * Один и тот же продукт на всех рынках сразу — так видно, что экономику
 * определяет не себестоимость, а цена, канал и стоимость привлечения.
 *
 * Цена берётся рыночная: сравнивать $9.99 в Таджикистане с $9.99 в США
 * бессмысленно, там разная платёжеспособность. Чтобы сравнить при одной цене,
 * передайте `fixedPriceUsd`.
 */
export function compareMarkets(
  jurisdictionId: JurisdictionId,
  options: { readonly fixedPriceUsd?: number; readonly planId?: PlanId } = {},
): readonly MarketComparisonRow[] {
  return marketIds().map((marketId) => {
    const base = defaultScenario(jurisdictionId, marketId, options.planId);
    const scenario = options.fixedPriceUsd
      ? withPrice(base, options.fixedPriceUsd)
      : base;

    return { market: MARKETS[marketId], report: buildUnitEconomicsReport(scenario) };
  });
}

/**
 * Один рынок из всех доступных юрисдикций: показывает, во что обходится
 * продавать из Душанбе вместо Дубая.
 */
export function compareJurisdictions(
  marketId: MarketId,
): readonly UnitEconomicsReport[] {
  return jurisdictionIds().map((jurisdictionId) =>
    buildUnitEconomicsReport(defaultScenario(jurisdictionId, marketId)),
  );
}

function withPrice(scenario: Scenario, monthlyPriceUsd: number): Scenario {
  return {
    ...scenario,
    pricing: { ...scenario.pricing, monthlyPriceUsd },
  };
}

const marketIds = (): readonly MarketId[] =>
  Object.keys(MARKETS) as MarketId[];

const jurisdictionIds = (): readonly JurisdictionId[] =>
  Object.keys(JURISDICTIONS) as JurisdictionId[];
