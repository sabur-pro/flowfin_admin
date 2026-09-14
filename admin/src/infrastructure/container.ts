import 'server-only';
import { redirect } from 'next/navigation';
import type { AdminGateway, AuthGateway } from '@/application/ports';
import { AdminApiGateway } from './http/admin-api.gateway';
import { AuthApiGateway } from './http/auth-api.gateway';
import { HttpClient } from './http/http-client';
import { ApiError } from './http/api-error';
import { readSession, type AdminSession } from './session/session';

/**
 * Композиционный корень. Только здесь конкретные классы встречаются с
 * интерфейсами; страницы и сценарии получают уже готовые зависимости.
 */
export function authGateway(): AuthGateway {
  return new AuthApiGateway(new HttpClient());
}

export function adminGateway(accessToken: string): AdminGateway {
  return new AdminApiGateway(new HttpClient({ accessToken }));
}

export interface AdminContext {
  readonly session: AdminSession;
  readonly gateway: AdminGateway;
}

/** Контекст защищённой страницы: без валидной сессии — на форму входа. */
export async function requireAdminContext(): Promise<AdminContext> {
  const session = await readSession();
  if (!session) redirect('/login');

  return { session, gateway: adminGateway(session.accessToken) };
}

/**
 * Запрос к API от имени админа. Токен живёт 12 часов и отзывается, когда тот
 * же аккаунт входит с другого устройства, — то есть протухшая сессия это
 * обычное дело, а не сбой. Без этой обёртки 401 всплывает как необработанное
 * исключение, и вместо формы входа человек видит «A server error occurred».
 */
export async function withSession<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (cause) {
    if (cause instanceof ApiError && cause.isUnauthorized) {
      // Кука бесполезна: с этим токеном API больше не разговаривает. Удалить
      // её отсюда нельзя — страницы не вправе менять куки, этим занимается
      // /session-expired, туда и уходим.
      redirect('/session-expired');
    }
    throw cause;
  }
}
