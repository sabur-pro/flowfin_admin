import type { AdminGateway } from '../ports';
import { parseWorkspace, type Workspace } from '@/domain/unit-economics';

const KEY = 'unit-economics' as const;

/**
 * Рабочая модель, сохранённая на сервере. workspace === null означает либо
 * «ещё не сохраняли», либо «сохранено прошлой версией модели» — в обоих
 * случаях админка открывается на заводских ориентирах.
 */
export interface SavedWorkspace {
  readonly workspace: Workspace | null;
  readonly updatedAt: string | null;
  readonly updatedByEmail: string | null;
}

/**
 * Загрузка не должна ронять страницу: недоступный API, отсутствующий пока
 * эндпоинт или устаревший формат — это повод показать заводские настройки,
 * а не пустой экран.
 *
 * Исключение — протухшая сессия: её нельзя проглотить, иначе человек
 * останется на странице, где ничего не сохраняется, вместо формы входа.
 */
export async function loadSavedWorkspace(
  gateway: AdminGateway,
): Promise<SavedWorkspace> {
  try {
    const record = await gateway.getSetting(KEY);
    return {
      workspace: parseWorkspace(record.value),
      updatedAt: record.updatedAt,
      updatedByEmail: record.updatedByEmail,
    };
  } catch (cause) {
    if (isUnauthorized(cause)) throw cause;
    return { workspace: null, updatedAt: null, updatedByEmail: null };
  }
}

/** 401 и 403 от API: транспорт сюда не протаскиваем, хватает признака. */
function isUnauthorized(cause: unknown): boolean {
  if (typeof cause !== 'object' || cause === null || !('status' in cause)) {
    return false;
  }
  const { status } = cause as { status: number };
  return status === 401 || status === 403;
}

/**
 * Сохранение, наоборот, обязано быть строгим: на сервер уезжает то, что станет
 * дефолтом для всех, поэтому сначала разбор, а потом запись.
 */
export async function saveWorkspace(
  gateway: AdminGateway,
  raw: unknown,
): Promise<SavedWorkspace> {
  const workspace = parseWorkspace(raw);
  if (!workspace) throw new Error('Настройки не прошли разбор и не сохранены');

  const record = await gateway.saveSetting(KEY, workspace);

  return {
    workspace: parseWorkspace(record.value) ?? workspace,
    updatedAt: record.updatedAt,
    updatedByEmail: record.updatedByEmail,
  };
}
