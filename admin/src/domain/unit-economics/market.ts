import type { Rate, Usd } from '../shared/types';

export type MarketId = 'tajikistan' | 'cis' | 'europe' | 'usa' | 'gulf';

/**
 * Кому продаём. Рынок задаёт налог с продажи, сидящий в цене, платёжеспособность
 * и то, сколько стоит привести оттуда платящего пользователя.
 */
export interface Market {
  readonly id: MarketId;
  readonly name: string;
  readonly currency: string;
  /** Сколько единиц местной валюты в долларе — только для отображения цен. */
  readonly unitsPerUsd: number;
  /** НДС или его аналог, включённый в цену для потребителя. */
  readonly consumptionTaxRate: Rate;
  /** Ориентир цены, к которому привык рынок. */
  readonly benchmark: { readonly plusUsd: Usd; readonly proUsd: Usd };
  readonly churnMonthly: Rate;
  readonly cacUsd: Usd;
  readonly voiceRequestsPerDay: number;
  readonly note: string;
}

export const MARKETS: Readonly<Record<MarketId, Market>> = {
  tajikistan: {
    id: 'tajikistan',
    name: 'Таджикистан',
    currency: 'TJS',
    unitsPerUsd: 11.5,
    consumptionTaxRate: 0,
    benchmark: { plusUsd: 1.65, proUsd: 3.39 },
    churnMonthly: 0.08,
    cacUsd: 2,
    voiceRequestsPerDay: 3,
    note: 'Цены в сомони, оплата через AlifPay. Международных карт у большинства нет.',
  },
  cis: {
    id: 'cis',
    name: 'СНГ',
    currency: 'USD',
    unitsPerUsd: 1,
    consumptionTaxRate: 0,
    benchmark: { plusUsd: 2.99, proUsd: 4.99 },
    churnMonthly: 0.08,
    cacUsd: 8,
    voiceRequestsPerDay: 4,
    note: 'Российские карты отрезаны от Visa и Mastercard, белорусские отключают поэтапно.',
  },
  europe: {
    id: 'europe',
    name: 'Европа',
    currency: 'EUR',
    unitsPerUsd: 0.92,
    consumptionTaxRate: 0.21,
    benchmark: { plusUsd: 4.99, proUsd: 9.99 },
    churnMonthly: 0.06,
    cacUsd: 45,
    voiceRequestsPerDay: 5,
    note: 'НДС в среднем 21% и обязателен с первой продажи. Великобритания считается отдельно.',
  },
  usa: {
    id: 'usa',
    name: 'США',
    currency: 'USD',
    unitsPerUsd: 1,
    consumptionTaxRate: 0,
    benchmark: { plusUsd: 4.99, proUsd: 9.99 },
    churnMonthly: 0.06,
    cacUsd: 40,
    voiceRequestsPerDay: 5,
    note: 'Sales tax на SaaS есть не во всех штатах, в сторах его берут на себя.',
  },
  gulf: {
    id: 'gulf',
    name: 'Залив и богатые рынки',
    currency: 'AED',
    unitsPerUsd: 3.67,
    consumptionTaxRate: 0.05,
    benchmark: { plusUsd: 4.99, proUsd: 9.99 },
    churnMonthly: 0.06,
    cacUsd: 35,
    voiceRequestsPerDay: 5,
    note: 'ОАЭ и Саудовская Аравия: высокая платёжеспособность, НДС 5%, дешевле трафик, чем в США.',
  },
};

/** Цена в валюте рынка — только для подписи, расчёт всегда в долларах. */
export function inLocalCurrency(market: Market, usd: Usd): number {
  return usd * market.unitsPerUsd;
}
