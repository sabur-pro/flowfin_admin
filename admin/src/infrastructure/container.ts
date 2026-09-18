import 'server-only';
import { redirect } from 'next/navigation';
import type { AdminGateway, AuthGateway } from '@/application/ports';
import { AdminApiGateway } from './http/admin-api.gateway';
import { AuthApiGateway } from './http/auth-api.gateway';
import { HttpClient } from './http/http-client';
import { ApiError } from './http/api-error';
import { readSession, type AdminSession } from './session/session';

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
export async function requireAdminContext(): Promise<AdminContext> {
  const session = await readSession();
  if (!session) redirect('/login');

  return { session, gateway: adminGateway(session.accessToken) };
}

export async function withSession<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (cause) {
    if (cause instanceof ApiError && cause.isUnauthorized) {

      redirect('/session-expired');
    }
    throw cause;
  }
}
