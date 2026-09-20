import {
  failureRate,
  forecast,
  monthlyCostPerUserUsd,
  type AiUsageSummary,
  type PricingSource,
} from '@/domain/ai';
import { Card } from './Card';
import { DataTable, type Column } from './DataTable';
import { StatGrid, StatTile } from './StatTile';
import {
  date as fmtDate,
  groupDigits,
  percent,
  signedPercent,
  tokens as fmtTokens,
  usdMicro,
} from '../format';

const PRICING_SOURCE: Readonly<Record<PricingSource, string>> = {
  table: 'встроенный прайс',
  env: 'ставки заданы в .env',
  family: 'оценка по семейству модели',
};

/** Сколько дней показывать в таблице — дальше она перестаёт читаться. */
const DAILY_ROWS = 30;

export function AiSpendReport({
  summary,
}: {
  readonly summary: AiUsageSummary;
}) {
  const plan = forecast(summary);
  const { current, range, lifetime, currentMonth, previousMonth } = summary;
  const estimated = current.pricingSource === 'family';

  if (lifetime.requests === 0) {
    return (
      <Card title="Расход на ИИ">
        <p className="note">
          Вызовов Gemini ещё не записано. Счётчик включается с первого
          голосового разбора после обновления сервера: до этого момента данных о
          токенах просто не существовало — Google историю по ключу наружу не
          отдаёт. Сейчас сервер отвечает моделью <strong>{current.model}</strong>{' '}
          по ставкам {usdMicro(current.inputUsdPerMillion)} за миллион входящих
          и {usdMicro(current.outputUsdPerMillion)} за миллион исходящих токенов
          ({PRICING_SOURCE[current.pricingSource]}).
        </p>
      </Card>
    );
  }

  return (
    <>
      <StatGrid>
        <StatTile
          label={`Потрачено за ${summary.rangeDays} дней`}
          value={usdMicro(range.costUsd)}
          hint={`${groupDigits(range.requests)} разборов · ${fmtTokens(range.totalTokens)} токенов`}
        />
        <StatTile
          label="За всё время"
          value={usdMicro(lifetime.costUsd)}
          hint={`${groupDigits(lifetime.requests)} разборов с ${fmtDate(lifetime.firstCallAt)}`}
        />
        <StatTile
          label="В этом месяце"
          value={usdMicro(currentMonth.costUsd)}
          hint={`${currentMonth.daysElapsed} из ${currentMonth.daysInMonth} дней · прогноз ${usdMicro(plan.monthEndUsd)}`}
        />
        <StatTile
          label="Темп"
          value={`${usdMicro(plan.dailyUsd)}/день`}
          hint={`${plan.dailyRequests.toFixed(1)} разборов и ${fmtTokens(plan.dailyTokens)} токенов в сутки, среднее за ${plan.windowDays} дней`}
        />
      </StatGrid>

      <Card
        title="Прогноз, если темп не изменится"
        description={`Считаем по среднему расходу за последние ${plan.windowDays} дней — дни без единого запроса тоже идут в делитель. Это продолжение факта, а не план: всплеск активности или смена модели ломает его мгновенно.`}
      >
        <DataTable
          columns={forecastColumns}
          rows={[
            {
              key: 'rest',
              label: 'Остаток этого месяца',
              value: usdMicro(plan.monthRemainingUsd),
              note: `${currentMonth.daysInMonth - currentMonth.daysElapsed} дней до конца месяца`,
            },
            {
              key: 'month',
              label: 'Весь текущий месяц',
              value: usdMicro(plan.monthEndUsd),
              note: previousMonth
                ? `${usdMicro(currentMonth.costUsd)} уже потрачено · прошлый месяц ${usdMicro(previousMonth.costUsd)}${
                    plan.monthOverMonth === null
                      ? ''
                      : ` (${signedPercent(plan.monthOverMonth)})`
                  }`
                : `${usdMicro(currentMonth.costUsd)} уже потрачено`,
            },
            {
              key: 'next',
              label: 'Следующий месяц',
              value: usdMicro(plan.nextMonthUsd),
              note: 'полный месяц по текущему темпу',
            },
            {
              key: 'year',
              label: 'Двенадцать месяцев',
              value: usdMicro(plan.yearUsd),
              note: 'тот же темп, растянутый на год',
            },
          ]}
          rowKey={(row) => row.key}
        />
        {estimated && (
          <p className="note">
            Ставки для модели <strong>{current.model}</strong> взяты по
            семейству: в прайсе этой модели нет. Числа сойдутся по порядку
            величины, но не по счёту. Точные ставки задаются переменными{' '}
            <code>GEMINI_INPUT_USD_PER_MILLION</code> и{' '}
            <code>GEMINI_OUTPUT_USD_PER_MILLION</code> — после этого расход
            начнёт считаться по ним.
          </p>
        )}
      </Card>

      <Card
        title="Что стоит один разбор"
        description="Себестоимость голосового ввода из факта, а не из настроек юнит-экономики. Это то число, которое там задаётся ползунком."
      >
        <DataTable
          columns={forecastColumns}
          rows={[
            {
              key: 'per-request',
              label: 'Один разбор фразы',
              value: usdMicro(plan.costPerRequestUsd),
              note: `${fmtTokens(plan.tokensPerRequest)} токенов на запрос`,
            },
            {
              key: 'per-user',
              label: 'Один активный пользователь в месяц',
              value: usdMicro(monthlyCostPerUserUsd(summary)),
              note: `${groupDigits(range.users)} человек пользовались голосом за ${summary.rangeDays} дней`,
            },
            {
              key: 'tokens',
              label: 'Токены за период',
              value: fmtTokens(range.totalTokens),
              note: `${fmtTokens(range.promptTokens)} вход · ${fmtTokens(range.outputTokens + range.thoughtsTokens)} выход`,
            },
            {
              key: 'failed',
              label: 'Неудачные вызовы',
              value: groupDigits(range.failedRequests),
              note:
                range.failedRequests > 0
                  ? `${percent(failureRate(range))} запросов не дошли до модели — денег не стоят, но пользователь остался без разбора`
                  : 'все запросы дошли до модели',
            },
          ]}
          rowKey={(row) => row.key}
        />
      </Card>

      <Card
        title="По моделям"
        description={`Сервер сейчас отвечает моделью «${current.model}»: ${usdMicro(current.inputUsdPerMillion)} за миллион входящих и ${usdMicro(current.outputUsdPerMillion)} за миллион исходящих токенов, ${PRICING_SOURCE[current.pricingSource]}. Старые строки остаются с теми ставками, по которым их посчитали.`}
      >
        <DataTable
          columns={modelColumns}
          rows={summary.byModel}
          rowKey={(row) => row.model}
          highlight={(row) => row.model === current.model}
          empty="За период не было вызовов"
        />
      </Card>

      <Card title={`По дням, последние ${DAILY_ROWS}`}>
        <DataTable
          columns={dailyColumns}
          rows={[...summary.daily].slice(-DAILY_ROWS).reverse()}
          rowKey={(row) => row.date}
          empty="За период не было вызовов"
        />
      </Card>

      <Card
        title="Кто расходует больше всех"
        description="Десять пользователей с наибольшим расходом за период. Нужно, чтобы увидеть, не съедает ли бюджет один человек с автоматом вместо сотни живых."
      >
        <DataTable
          columns={userColumns}
          rows={summary.topUsers}
          rowKey={(row) => row.userId ?? 'deleted'}
          empty="За период не было вызовов"
        />
      </Card>
    </>
  );
}

interface Line {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly note: string;
}

const forecastColumns: readonly Column<Line>[] = [
  { key: 'label', header: '', align: 'left', render: (row) => row.label },
  { key: 'value', header: 'Сумма', render: (row) => row.value },
  {
    key: 'note',
    header: 'Из чего',
    align: 'left',
    render: (row) => <span className="cost-detail">{row.note}</span>,
  },
];

const modelColumns: readonly Column<AiUsageSummary['byModel'][number]>[] = [
  { key: 'model', header: 'Модель', align: 'left', render: (r) => r.model },
  { key: 'requests', header: 'Вызовов', render: (r) => groupDigits(r.requests) },
  { key: 'in', header: 'Вход', render: (r) => fmtTokens(r.promptTokens) },
  {
    key: 'out',
    header: 'Выход',
    render: (r) => fmtTokens(r.outputTokens + r.thoughtsTokens),
  },
  { key: 'total', header: 'Токенов', render: (r) => fmtTokens(r.totalTokens) },
  { key: 'cost', header: 'Стоимость', render: (r) => usdMicro(r.costUsd) },
];

const dailyColumns: readonly Column<AiUsageSummary['daily'][number]>[] = [
  { key: 'date', header: 'Дата', align: 'left', render: (r) => r.date },
  { key: 'requests', header: 'Вызовов', render: (r) => groupDigits(r.requests) },
  { key: 'tokens', header: 'Токенов', render: (r) => fmtTokens(r.totalTokens) },
  { key: 'cost', header: 'Стоимость', render: (r) => usdMicro(r.costUsd) },
];

const userColumns: readonly Column<AiUsageSummary['topUsers'][number]>[] = [
  {
    key: 'user',
    header: 'Пользователь',
    align: 'left',
    render: (r) => r.email ?? r.userId ?? 'удалённый пользователь',
  },
  { key: 'requests', header: 'Разборов', render: (r) => groupDigits(r.requests) },
  { key: 'tokens', header: 'Токенов', render: (r) => fmtTokens(r.totalTokens) },
  { key: 'cost', header: 'Стоимость', render: (r) => usdMicro(r.costUsd) },
];
