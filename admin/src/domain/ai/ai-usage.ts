/**
 * Расход на ИИ так, как его отдаёт сервер: факт по каждому вызову Gemini.
 *
 * Важное ограничение, которое видно и в отчёте: Google не показывает наружу
 * ни сумму счёта по ключу, ни остаток. Всё, что есть — число токенов в ответе
 * на каждый запрос. Поэтому деньги здесь наши собственные: токены, умноженные
 * на ставку модели. Это совпадёт со счётом Google с точностью до округлений и
 * бесплатной квоты, но это не выписка из биллинга, и выдавать её за выписку
 * нельзя.
 */

export interface AiUsageTotals {
  readonly requests: number;
  readonly failedRequests: number;
  readonly promptTokens: number;
  readonly outputTokens: number;
  readonly thoughtsTokens: number;
  readonly totalTokens: number;
  readonly costUsd: number;
}

export type PricingSource = 'table' | 'env' | 'family';

export interface AiUsageSummary {
  readonly rangeDays: number;
  readonly current: {
    readonly model: string;
    readonly inputUsdPerMillion: number;
    readonly outputUsdPerMillion: number;
    readonly pricingSource: PricingSource;
  };
  readonly range: AiUsageTotals & { readonly users: number };
  readonly lifetime: AiUsageTotals & { readonly firstCallAt: string | null };
  readonly currentMonth: AiUsageTotals & {
    readonly startedAt: string;
    readonly daysElapsed: number;
    readonly daysInMonth: number;
  };
  readonly previousMonth: (AiUsageTotals & { readonly month: string }) | null;
  readonly byModel: readonly (AiUsageTotals & { readonly model: string })[];
  readonly daily: readonly {
    readonly date: string;
    readonly requests: number;
    readonly totalTokens: number;
    readonly costUsd: number;
  }[];
  readonly topUsers: readonly {
    readonly userId: string | null;
    readonly email: string | null;
    readonly requests: number;
    readonly totalTokens: number;
    readonly costUsd: number;
  }[];
}

/** Окно для темпа: две недели сглаживают выходные, но ещё помнят рост. */
export const RUN_RATE_WINDOW_DAYS = 14;

export interface AiForecast {
  /** По скольким календарным дням считали темп (дни без вызовов — тоже дни). */
  readonly windowDays: number;
  readonly dailyUsd: number;
  readonly dailyRequests: number;
  readonly dailyTokens: number;
  /** Месяц целиком: уже потрачено плюс темп на оставшиеся дни. */
  readonly monthEndUsd: number;
  readonly monthRemainingUsd: number;
  readonly nextMonthUsd: number;
  readonly yearUsd: number;
  /** Рост к прошлому месяцу в долях; null — прошлого месяца ещё не было. */
  readonly monthOverMonth: number | null;
  /** Средняя цена одного удачного разбора. */
  readonly costPerRequestUsd: number;
  readonly tokensPerRequest: number;
  /** Расход на одного активного пользователя за период. */
  readonly costPerUserUsd: number;
}

export function forecast(
  summary: AiUsageSummary,
  today: Date = new Date(),
  windowDays: number = RUN_RATE_WINDOW_DAYS,
): AiForecast {
  // Делить надо на прожитые дни, а не на желаемое окно: в первую неделю после
  // запуска учёта данных меньше, чем окно, и полный делитель занизил бы темп
  // в разы — прогноз обещал бы экономию, которой нет.
  const observed = daysSince(summary.lifetime.firstCallAt, today);
  const window = Math.max(
    1,
    Math.min(windowDays, summary.rangeDays, observed),
  );
  const recent = withinLastDays(summary.daily, today, window);

  const dailyUsd = sum(recent, (d) => d.costUsd) / window;
  const dailyRequests = sum(recent, (d) => d.requests) / window;
  const dailyTokens = sum(recent, (d) => d.totalTokens) / window;

  const { currentMonth, previousMonth, range } = summary;
  const daysLeft = Math.max(
    0,
    currentMonth.daysInMonth - currentMonth.daysElapsed,
  );
  const monthRemainingUsd = dailyUsd * daysLeft;

  const nextMonthDays = daysInNextMonth(today);
  const successful = range.requests - range.failedRequests;

  return {
    windowDays: window,
    dailyUsd,
    dailyRequests,
    dailyTokens,
    monthEndUsd: currentMonth.costUsd + monthRemainingUsd,
    monthRemainingUsd,
    nextMonthUsd: dailyUsd * nextMonthDays,
    yearUsd: dailyUsd * daysInYear(today),
    monthOverMonth:
      previousMonth && previousMonth.costUsd > 0
        ? (currentMonth.costUsd + monthRemainingUsd) / previousMonth.costUsd - 1
        : null,
    costPerRequestUsd: successful > 0 ? range.costUsd / successful : 0,
    tokensPerRequest: successful > 0 ? range.totalTokens / successful : 0,
    costPerUserUsd: range.users > 0 ? range.costUsd / range.users : 0,
  };
}

/** Доля неудачных вызовов: сервер их тоже пишет, денег они не стоят. */
export function failureRate(totals: AiUsageTotals): number {
  return totals.requests > 0 ? totals.failedRequests / totals.requests : 0;
}

/**
 * Во что обходится один активный пользователь в месяц — то самое число,
 * которое в юнит-экономике задаётся вручную. Здесь оно из факта.
 */
export function monthlyCostPerUserUsd(summary: AiUsageSummary): number {
  const { range } = summary;
  if (range.users === 0 || summary.rangeDays === 0) return 0;
  return (range.costUsd / range.users / summary.rangeDays) * 30;
}

/** Сколько суток идёт учёт. Нет ни одного вызова — считаем, что сутки. */
function daysSince(iso: string | null, today: Date): number {
  if (!iso) return 1;
  const from = Date.parse(iso);
  if (!Number.isFinite(from)) return 1;
  return Math.max(1, Math.ceil((today.getTime() - from) / 86_400_000));
}

function withinLastDays(
  daily: AiUsageSummary['daily'],
  today: Date,
  days: number,
): AiUsageSummary['daily'] {
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  const iso = from.toISOString().slice(0, 10);
  return daily.filter((d) => d.date >= iso);
}

function daysInNextMonth(today: Date): number {
  return new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
}

function daysInYear(today: Date): number {
  const year = today.getFullYear();
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

function sum<T>(items: readonly T[], of: (item: T) => number): number {
  return items.reduce((total, item) => total + of(item), 0);
}
