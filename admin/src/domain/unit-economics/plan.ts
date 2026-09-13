/**
 * Что входит в тариф. Себестоимость обслуживания зависит именно от этого:
 * без синхронизации сервер не хранит данные пользователя, без ИИ не уходит
 * ни одного запроса в Gemini.
 */
export interface PlanFeatures {
  readonly cloudSync: boolean;
  readonly aiVoice: boolean;
}

export type PlanId = 'free' | 'plus' | 'pro';

export interface Plan {
  readonly id: PlanId;
  readonly name: string;
  /** Короткая подпись для селектора и таблиц. */
  readonly shortName: string;
  readonly features: PlanFeatures;
  readonly note: string;
}

export const PLANS: Readonly<Record<PlanId, Plan>> = {
  free: {
    id: 'free',
    name: 'Free — только на устройстве',
    shortName: 'Free',
    features: { cloudSync: false, aiVoice: false },
    note: 'Выручки нет, данные лежат на устройстве. Стоит ровно столько, сколько стоит держать учётную запись: это плата за верх воронки, а не бизнес.',
  },
  plus: {
    id: 'plus',
    name: 'Plus — синхронизация',
    shortName: 'Plus',
    features: { cloudSync: true, aiVoice: false },
    note: 'Облачная синхронизация без ИИ. Голосовые запросы на этом тарифе недоступны, поэтому в себестоимость не попадают — остаются только сервер и хранение.',
  },
  pro: {
    id: 'pro',
    name: 'Pro — синхронизация и ИИ',
    shortName: 'Pro',
    features: { cloudSync: true, aiVoice: true },
    note: 'Синхронизация плюс голосовой ввод через Gemini. Единственный тариф, где расход на ИИ растёт вместе с активностью пользователя.',
  },
};

export const PLAN_IDS: readonly PlanId[] = ['free', 'plus', 'pro'];

export const isPlanId = (value: unknown): value is PlanId =>
  typeof value === 'string' && value in PLANS;
