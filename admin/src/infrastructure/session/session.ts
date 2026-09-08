import 'server-only';
import { cookies } from 'next/headers';
import type { SignedInAdmin } from '@/application/ports';
import type { UserRole } from '@/domain/users';
import { env } from '../config/env';

export interface AdminSession {
  readonly accessToken: string;
  readonly id: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly role: UserRole;
}

const MAX_AGE_SECONDS = 60 * 60 * 12;

/**
 * Токен живёт в httpOnly-куке и не попадает в клиентский бандл: страницы
 * ходят в API на сервере. В localStorage его класть нельзя — это XSS-мишень.
 */
export async function openSession(admin: SignedInAdmin): Promise<void> {
  const store = await cookies();
  store.set(env.sessionCookieName(), JSON.stringify(toSession(admin)), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction(),
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function closeSession(): Promise<void> {
  const store = await cookies();
  store.delete(env.sessionCookieName());
}

export async function readSession(): Promise<AdminSession | null> {
  const raw = (await cookies()).get(env.sessionCookieName())?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AdminSession;
    return parsed.role === 'ADMIN' && parsed.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

function toSession(admin: SignedInAdmin): AdminSession {
  return {
    accessToken: admin.accessToken,
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}
