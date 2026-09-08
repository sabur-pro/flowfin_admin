import type { Rate, Usd } from '../shared/types';

export type SalesChannelId =
  | 'appstore-30'
  | 'appstore-15'
  | 'stripe'
  | 'merchant-of-record'
  | 'alif';

/**
 * Как канал берёт своё. Разница не косметическая: сторы удерживают процент
 * с суммы уже без НДС (налог они снимают и платят сами), а процессинг
 * прогоняет через себя весь чек вместе с налогом.
 */
export type ChannelFee =
  | { readonly kind: 'revenue-share'; readonly rate: Rate }
  | { readonly kind: 'processor'; readonly rate: Rate; readonly fixedUsd: Usd };

export interface SalesChannel {
  readonly id: SalesChannelId;
  readonly name: string;
  readonly fee: ChannelFee;
  /** Платит ли канал НДС за продавца. Влияет на комплаенс, не на деньги. */
  readonly remitsConsumptionTax: boolean;
  readonly note: string;
}

export const SALES_CHANNELS: Readonly<Record<SalesChannelId, SalesChannel>> = {
  'appstore-30': {
    id: 'appstore-30',
    name: 'App Store / Google Play — 30%',
    fee: { kind: 'revenue-share', rate: 0.3 },
    remitsConsumptionTax: true,
    note: 'Стандартная ставка сторов. НДС считают и платят они.',
  },
  'appstore-15': {
    id: 'appstore-15',
    name: 'App Store / Google Play — 15%',
    fee: { kind: 'revenue-share', rate: 0.15 },
    remitsConsumptionTax: true,
    note: 'Small Business Program — пока годовая выручка ниже $1M.',
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe напрямую',
    fee: { kind: 'processor', rate: 0.049, fixedUsd: 0.27 },
    remitsConsumptionTax: false,
    note: '2.9% + AED 1.00, плюс 1% за иностранную карту и 1% за конвертацию. НДС на продавце.',
  },
  'merchant-of-record': {
    id: 'merchant-of-record',
    name: 'Merchant of Record',
    fee: { kind: 'processor', rate: 0.05, fixedUsd: 0.5 },
    remitsConsumptionTax: true,
    note: 'Paddle и подобные: дороже процессинга, но снимают весь НДС-комплаенс.',
  },
  alif: {
    id: 'alif',
    name: 'AlifPay',
    fee: { kind: 'processor', rate: 0.04, fixedUsd: 0 },
    remitsConsumptionTax: false,
    note: 'Локальный эквайринг Таджикистана: Korti Milli, кошелёк, карты.',
  },
};

/** Сколько канал удержит с одного месячного платежа. */
export function channelFeeFor(
  channel: SalesChannel,
  grossMonthlyUsd: Usd,
  netOfTaxUsd: Usd,
  transactionsPerMonth: number,
): Usd {
  const { fee } = channel;
  return fee.kind === 'revenue-share'
    ? netOfTaxUsd * fee.rate
    : grossMonthlyUsd * fee.rate + fee.fixedUsd * transactionsPerMonth;
}
