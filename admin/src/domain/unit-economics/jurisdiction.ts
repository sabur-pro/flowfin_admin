import type { Rate, Usd } from '../shared/types';
import type { SalesChannelId } from './sales-channel';

export type JurisdictionId = 'uae' | 'tajikistan';

/**
 * Откуда продаём. Юрисдикция определяет налог на прибыль и то, какие каналы
 * вообще доступны: у таджикского юрлица нет мерчант-аккаунта в сторах, а
 * значит и продавать через них оно не может.
 */
export interface Jurisdiction {
  readonly id: JurisdictionId;
  readonly name: string;
  readonly corporateTaxRate: Rate;
  /** Прибыль, не облагаемая налогом за год. */
  readonly taxFreeAllowanceUsd: Usd;
  /**
   * Непустой список: юрисдикция без единого способа принять деньги не имеет
   * смысла, поэтому это гарантия типа, а не проверка в рантайме.
   */
  readonly channels: readonly [SalesChannelId, ...SalesChannelId[]];
  readonly restrictions: readonly string[];
}

export const JURISDICTIONS: Readonly<Record<JurisdictionId, Jurisdiction>> = {
  uae: {
    id: 'uae',
    name: 'ОАЭ, Дубай',
    corporateTaxRate: 0.09,
    taxFreeAllowanceUsd: 102_000,
    channels: ['appstore-15', 'appstore-30', 'stripe', 'merchant-of-record'],
    restrictions: [
      'Продажа европейскому потребителю требует регистрации Non-Union OSS — НДС с первой продажи, порога нет.',
      'Free Zone с qualifying income и Small Business Relief дают 0% — поставьте ставку налога в ноль, чтобы это увидеть.',
    ],
  },
  tajikistan: {
    id: 'tajikistan',
    name: 'Таджикистан',
    corporateTaxRate: 0.25,
    taxFreeAllowanceUsd: 0,
    channels: ['alif'],
    restrictions: [
      'Google Play не поддерживает регистрацию мерчанта в Таджикистане: публиковать бесплатные приложения можно, продавать подписки — нет.',
      'Таджикистана нет в списке стран для выплат Apple, поэтому IAP тоже недоступен.',
      'Остаётся оплата на своём сайте через AlifPay, а в приложении — только вход в уже оплаченный аккаунт.',
    ],
  },
};
