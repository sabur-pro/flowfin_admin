import 'server-only';
import { redirect } from 'next/navigation';
import type { AdminGateway, AuthGateway } from '@/application/ports';
import { AdminApiGateway } from './http/admin-api.gateway';
import { AuthApiGateway } from './http/auth-api.gateway';
import { HttpClient } from './http/http-client';
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
