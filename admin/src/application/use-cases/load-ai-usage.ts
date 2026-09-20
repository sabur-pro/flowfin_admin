import type { AdminGateway } from '../ports';
import type { AiUsageSummary } from '@/domain/ai';

/**
 * Отчёт по ИИ не должен ронять страницу финансов: платежи и расход на модель
 * живут отдельно, и если бэкенд ещё не знает про `/admin/ai/usage`
 * (старая версия на сервере) — раздел просто не покажется.
 */
export async function loadAiUsage(
  gateway: AdminGateway,
  days: number,
): Promise<AiUsageSummary | null> {
  try {
    return await gateway.getAiUsage(days);
  } catch (cause) {
    if (isUnauthorized(cause)) throw cause;
    return null;
  }
}

function isUnauthorized(cause: unknown): boolean {
  if (typeof cause !== 'object' || cause === null || !('status' in cause)) {
    return false;
  }
  const { status } = cause as { status: number };
  return status === 401 || status === 403;
}
