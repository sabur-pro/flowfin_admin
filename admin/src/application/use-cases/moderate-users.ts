import type { AdminGateway } from '../ports';
import { err, ok, type Result } from '@/domain/shared/result';

/** Совпадает с потолком на бэке — защита от опечатки «10000000». */
export const MAX_AI_LIMIT = 100_000;

/**
 * Лимит из формы: пустое поле — вернуть общий лимит (null), иначе целое
 * число от 0 до MAX_AI_LIMIT. 0 — фактически запрет ИИ для пользователя.
 */
export function parseAiLimit(raw: string): Result<number | null> {
  const value = raw.trim();
  if (value === '') return ok(null);
  if (!/^\d+$/.test(value)) return err('Лимит — целое число без знаков');
  const limit = Number(value);
  if (limit > MAX_AI_LIMIT) return err(`Не больше ${MAX_AI_LIMIT} в день`);
  return ok(limit);
}

export async function setUserAiLimit(
  gateway: AdminGateway,
  userId: string,
  raw: string,
): Promise<Result<number | null>> {
  const parsed = parseAiLimit(raw);
  if (!parsed.ok) return parsed;
  await gateway.setAiLimit(userId, parsed.value);
  return parsed;
}

export function blockUser(
  gateway: AdminGateway,
  userId: string,
  reason: string,
): Promise<void> {
  return gateway.blockUser(userId, reason.trim() || null);
}
