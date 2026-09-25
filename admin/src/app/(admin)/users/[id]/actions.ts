'use server';

import { redirect, unstable_rethrow as rethrowNextControl } from 'next/navigation';
import { blockUser, setUserAiLimit } from '@/application/use-cases';
import { requireAdminContext, withSession } from '@/infrastructure/container';

/**
 * Действия карточки пользователя. Итог возвращаем в адресе (?notice / ?error):
 * страница серверная, а так результат переживает и перезагрузку.
 */
async function run(userId: string, work: () => Promise<string>): Promise<never> {
  let target: string;
  try {
    const notice = await work();
    target = `?notice=${encodeURIComponent(notice)}`;
  } catch (cause) {
    rethrowNextControl(cause);
    const message = cause instanceof Error ? cause.message : 'Не удалось выполнить действие';
    target = `?error=${encodeURIComponent(message)}`;
  }
  redirect(`/users/${encodeURIComponent(userId)}${target}`);
}

export async function blockUserAction(userId: string, formData: FormData): Promise<never> {
  const { gateway } = await requireAdminContext();
  return run(userId, async () => {
    await withSession(() => blockUser(gateway, userId, String(formData.get('reason') ?? '')));
    return 'Аккаунт заблокирован';
  });
}

export async function unblockUserAction(userId: string): Promise<never> {
  const { gateway } = await requireAdminContext();
  return run(userId, async () => {
    await withSession(() => gateway.unblockUser(userId));
    return 'Блокировка снята';
  });
}

export async function setAiLimitAction(userId: string, formData: FormData): Promise<never> {
  const { gateway } = await requireAdminContext();
  // «Сбросить» отправляет пустое значение — это возврат к общему лимиту.
  const raw = formData.get('reset') ? '' : String(formData.get('limit') ?? '');
  return run(userId, async () => {
    const result = await withSession(() => setUserAiLimit(gateway, userId, raw));
    if (!result.ok) throw new Error(result.error);
    return result.value == null
      ? 'Лимит ИИ сброшен к общему'
      : `Лимит ИИ: ${result.value} запросов в день`;
  });
}
