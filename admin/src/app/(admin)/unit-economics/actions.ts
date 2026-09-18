'use server';

import { unstable_rethrow as rethrowNextControl } from 'next/navigation';
import { saveWorkspace, type SavedWorkspace } from '@/application/use-cases';
import { requireAdminContext, withSession } from '@/infrastructure/container';

export type SaveResult =
  | { readonly ok: true; readonly saved: SavedWorkspace }
  | { readonly ok: false; readonly error: string };

export async function saveWorkspaceAction(raw: unknown): Promise<SaveResult> {
  const { gateway } = await requireAdminContext();

  try {
    const saved = await withSession(() => saveWorkspace(gateway, raw));
    return { ok: true, saved };
  } catch (cause) {

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
