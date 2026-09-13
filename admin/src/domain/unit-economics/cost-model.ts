import type { Usd } from '../shared/types';
import type { PlanFeatures } from './plan';

/**
 * Себестоимость обслуживания одного подписчика. Числа замерены по рабочему
 * коду, а не взяты на глаз:
 *
 * — один голосовой разбор это 3260 входных и 220 выходных токенов на
 *   gemini-3.5-flash-lite ($0.15 / $1.25 за 1M). Замер сделан по системному
 *   промпту из back/src/voice/voice.service.ts: 6701 символ, 59% кириллицы.
 * — распознавание речи идёт на устройстве (expo-speech-recognition) и
 *   не стоит ничего.
 * — сервер: VPS с Postgres и Nest примерно на 1000 аккаунтов, то есть $0.025
 *   на пользователя в месяц. Эти деньги разложены на две части, потому что
 *   тариф без синхронизации не платит за хранение и трафик: учётная запись
 *   стоит копейки, основную нагрузку создаёт синхронизация.
 */
export interface CostModel {
  readonly voiceRequestUsd: Usd;
  /** Учётка, пуши, обновление конфигурации — есть на любом тарифе. */
  readonly accountPerUserMonthUsd: Usd;
  /** Хранение и трафик синхронизации — только там, где она включена. */
  readonly syncPerUserMonthUsd: Usd;
}

export const DEFAULT_COST_MODEL: CostModel = {
  voiceRequestUsd: 0.00076,
  accountPerUserMonthUsd: 0.004,
  syncPerUserMonthUsd: 0.021,
};

/** Слагаемые дают ровно totalUsd — так разбивку можно показывать как есть. */
export interface VariableCost {
  readonly accountUsd: Usd;
  readonly syncUsd: Usd;
  readonly aiUsd: Usd;
  readonly totalUsd: Usd;
  /** Сколько разборов реально оплачивается: ноль на тарифе без ИИ. */
  readonly billedVoiceRequestsPerMonth: number;
}

export const DAYS_PER_MONTH = 30;

/**
 * Переменные расходы на одного активного подписчика за месяц. Фичи тарифа
 * решают, какие слагаемые вообще появляются: голосовые запросы на тарифе без
 * ИИ не тарифицируются, сколько бы их ни накрутили ползунком.
 */
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

/** Во что обойдётся один разбор и месяц такой активности — для подписей в UI. */
export function voiceCostPerMonth(
  voiceRequestsPerDay: number,
  costs: CostModel = DEFAULT_COST_MODEL,
): Usd {
  return voiceRequestsPerDay * DAYS_PER_MONTH * costs.voiceRequestUsd;
}
