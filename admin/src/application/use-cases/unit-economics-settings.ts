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
 * Загрузка не должна ронять страницу: недоступный API или устаревший формат —
 * это повод показать заводские настройки, а не пустой экран.
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
  } catch {
    return { workspace: null, updatedAt: null, updatedByEmail: null };
  }
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
