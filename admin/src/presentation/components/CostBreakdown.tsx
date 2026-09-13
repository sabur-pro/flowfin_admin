import {
  DAYS_PER_MONTH,
  DEFAULT_COST_MODEL,
  type Plan,
  type SubscriberEconomics,
} from '@/domain/unit-economics';
import { groupDigits, percent, usdFine, usdPrecise } from '../format';

interface CostBreakdownProps {
  readonly economics: SubscriberEconomics;
  readonly plan: Plan;
  readonly voiceRequestsPerDay: number;
}

/**
 * Во что обходится один подписчик. Смысл таблицы в том, чтобы расход на ИИ был
 * виден в деньгах, а не в запросах: «10 голосовых в день» ничего не говорит,
 * пока не сказано, что это $0.23 в месяц и сколько это от чека.
 */
export function CostBreakdown({
  economics,
  plan,
  voiceRequestsPerDay,
}: CostBreakdownProps) {
  const { variableCost: cost, grossUsd } = economics;

  const rows = [
    {
      key: 'account',
      label: 'Учётная запись',
      value: cost.accountUsd,
      detail: 'Есть на любом тарифе: авторизация, пуши, конфигурация.',
      included: true,
    },
    {
      key: 'sync',
      label: 'Облачная синхронизация',
      value: cost.syncUsd,
      detail: plan.features.cloudSync
        ? 'Хранение и трафик: основная нагрузка на сервер.'
        : 'Тариф без синхронизации — сервер не хранит данные пользователя.',
      included: plan.features.cloudSync,
    },
    {
      key: 'ai',
      label: 'Голосовой ввод (Gemini)',
      value: cost.aiUsd,
      detail: plan.features.aiVoice
        ? `${groupDigits(cost.billedVoiceRequestsPerMonth)} разборов в месяц по ${usdCents(DEFAULT_COST_MODEL.voiceRequestUsd)} за штуку.`
        : `Тариф без ИИ: ${voiceRequestsPerDay}/день не тарифицируются. Если включить, это ${usdFine(potentialAiUsd(voiceRequestsPerDay))} в месяц.`,
      included: plan.features.aiVoice,
    },
  ];

  return (
    <div className="cost-breakdown">
      <table className="cost-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} data-muted={!row.included}>
              <th scope="row">
                {row.label}
                <span className="cost-detail">{row.detail}</span>
              </th>
              <td className="cost-value">
                {row.included ? usdFine(row.value) : '—'}
              </td>
              <td className="cost-share">
                {row.included && grossUsd > 0
                  ? percent(row.value / grossUsd, 2)
                  : ''}
              </td>
            </tr>
          ))}
          <tr className="cost-total">
            <th scope="row">Итого на подписчика в месяц</th>
            <td className="cost-value">{usdFine(cost.totalUsd)}</td>
            <td className="cost-share">
              {grossUsd > 0 ? percent(cost.totalUsd / grossUsd, 2) : ''}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="note">
        На тысячу активных подписчиков это{' '}
        <strong>{usdPrecise(cost.totalUsd * 1000)} в месяц</strong>, из них на
        ИИ — <strong>{usdPrecise(cost.aiUsd * 1000)}</strong>. Год такой
        активности одного подписчика стоит {usdFine(cost.totalUsd * 12)}.
      </p>
    </div>
  );
}

/** Сколько стоил бы ИИ при текущей активности, будь он в тарифе. */
function potentialAiUsd(voiceRequestsPerDay: number): number {
  return voiceRequestsPerDay * DAYS_PER_MONTH * DEFAULT_COST_MODEL.voiceRequestUsd;
}

/** Доли цента: $0.00076 в обычном формате превратился бы в $0.00. */
function usdCents(value: number): string {
  return `${(value * 100).toFixed(3)}¢`;
}
