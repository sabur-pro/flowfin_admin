'use client';

import { useActionState } from 'react';
import { login, type LoginFormState } from './actions';

const INITIAL: LoginFormState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <main className="login">
      <form className="login-card" action={formAction}>
        <h1>FlowFin</h1>
        <p className="login-sub">Панель администратора</p>

        <label htmlFor="email">Почта</label>
        <input id="email" name="email" type="email" autoComplete="username" required />

        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        {state.error && <p className="login-error">{state.error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
