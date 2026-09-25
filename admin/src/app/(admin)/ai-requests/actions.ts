'use server';

import { redirect, unstable_rethrow as rethrowNextControl } from 'next/navigation';
import { requireAdminContext, withSession } from '@/infrastructure/container';

async function resolve(
  requestId: string,
  decide: 'approve' | 'reject',
): Promise<never> {
  const { gateway } = await requireAdminContext();
  let target: string;
  try {
    await withSession(() =>
      decide === 'approve'
        ? gateway.approveAiRequest(requestId)
        : gateway.rejectAiRequest(requestId),
    );
    target = `?notice=${encodeURIComponent(decide === 'approve' ? 'Заявка одобрена' : 'Заявка отклонена')}`;
  } catch (cause) {
    rethrowNextControl(cause);
    const message = cause instanceof Error ? cause.message : 'Не удалось обработать заявку';
    target = `?error=${encodeURIComponent(message)}`;
  }
  redirect(`/ai-requests${target}`);
}

export async function approveRequestAction(requestId: string): Promise<never> {
  return resolve(requestId, 'approve');
}

export async function rejectRequestAction(requestId: string): Promise<never> {
  return resolve(requestId, 'reject');
}
