'use server';

import { unstable_rethrow as rethrowNextControl } from 'next/navigation';
import { saveWorkspace, type SavedWorkspace } from '@/application/use-cases';
import { requireAdminContext, withSession } from '@/infrastructure/container';

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
    const saved = await withSession(() => saveWorkspace(gateway, raw));
    return { ok: true, saved };
  } catch (cause) {
    // Редирект на форму входа Next тоже бросает исключением: проглотить его
    // здесь значит показать «ошибку сохранения» вместо перехода на /login.
    rethrowNextControl(cause);

    return {
      ok: false,
      error:
        cause instanceof Error
          ? cause.message
          : 'Не удалось сохранить настройки',
    };
  }
}
