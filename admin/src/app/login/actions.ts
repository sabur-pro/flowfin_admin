'use server';

import { redirect } from 'next/navigation';
import { signInAdmin, type SignInError } from '@/application/use-cases';
import { authGateway } from '@/infrastructure/container';
import { openSession } from '@/infrastructure/session/session';

export interface LoginFormState {
  readonly error: string | null;
}

const MESSAGES: Readonly<Record<SignInError, string>> = {
  'invalid-credentials': 'Неверная почта или пароль',
  'not-an-admin': 'У этого аккаунта нет доступа в админку',
  unavailable: 'API недоступен. Проверьте, что бэкенд запущен',
};

export async function login(
  _previous: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Введите почту и пароль' };
  }

  const result = await signInAdmin(authGateway(), email, password);

  if (!result.ok) {
    return { error: MESSAGES[result.error] };
  }

  await openSession(result.value);
  redirect('/');
}
