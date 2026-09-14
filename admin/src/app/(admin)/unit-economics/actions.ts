'use server';

import { saveWorkspace, type SavedWorkspace } from '@/application/use-cases';
import { requireAdminContext } from '@/infrastructure/container';

export type SaveResult =
  | { readonly ok: true; readonly saved: SavedWorkspace }
  | { readonly ok: false; readonly error: string };

/**
 * Сохранение рабочей модели на сервер. Настройка общая, поэтому право на
 * запись проверяется здесь же — по сессии, а не по тому, что прислал браузер.
 */
export async function saveWorkspaceAction(raw: unknown): Promise<SaveResult> {
  const { gateway } = await requireAdminContext();

  try {
    return { ok: true, saved: await saveWorkspace(gateway, raw) };
  } catch (cause) {
    return {
      ok: false,
      error:
        cause instanceof Error
          ? cause.message
          : 'Не удалось сохранить настройки',
    };
  }
}
