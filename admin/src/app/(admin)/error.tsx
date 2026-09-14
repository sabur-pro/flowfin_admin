'use client';

import Link from 'next/link';

/**
 * Отказ API не должен выглядеть как поломка админки. Сюда попадает всё, что
 * не является протухшей сессией (её перехватывает withSession и уводит на
 * форму входа): недоступный контейнер, ошибка базы, неожиданный ответ.
 */
export default function AdminError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <div className="failure">
      <h1 className="page-title">Данные не пришли</h1>
      <p className="page-lede">
        Админка работает, но FlowFin API не ответил. Обычно это значит, что
        контейнер API перезапускается или недоступен — попробуйте обновить
        через полминуты.
      </p>

      <div className="failure-actions">
        <button type="button" onClick={reset}>
          Обновить
        </button>
        <Link href="/login" className="ghost-link">
          Войти заново
        </Link>
      </div>

      {error.digest && (
        <p className="note">
          Код ошибки для логов: <code>{error.digest}</code>. На сервере он
          виден в <code>docker logs flowfin_admin</code>.
        </p>
      )}
    </div>
  );
}
