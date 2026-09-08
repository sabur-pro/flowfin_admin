import type { Usd } from '../shared/types';

/**
 * Себестоимость обслуживания одного подписчика. Числа замерены по рабочему
 * коду, а не взяты на глаз:
 *
 * — один голосовой разбор это 3260 входных и 220 выходных токенов на
 *   gemini-3.5-flash-lite ($0.15 / $1.25 за 1M). Замер сделан по системному
 *   промпту из back/src/voice/voice.service.ts: 6701 символ, 59% кириллицы.
 * — распознавание речи идёт на устройстве (expo-speech-recognition) и
 *   не стоит ничего.
 * — сервер: VPS с Postgres и Nest примерно на 1000 аккаунтов.
 */
export interface CostModel {
  readonly voiceRequestUsd: Usd;
  readonly infrastructurePerUserMonthUsd: Usd;
}

export const DEFAULT_COST_MODEL: CostModel = {
  voiceRequestUsd: 0.00076,
  infrastructurePerUserMonthUsd: 0.025,
};

const DAYS_PER_MONTH = 30;

/** Переменные расходы на одного активного подписчика за месяц. */
export function monthlyVariableCost(
  voiceRequestsPerDay: number,
  costs: CostModel = DEFAULT_COST_MODEL,
): Usd {
  return (
    costs.infrastructurePerUserMonthUsd +
    voiceRequestsPerDay * DAYS_PER_MONTH * costs.voiceRequestUsd
  );
}
