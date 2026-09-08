import Link from 'next/link';
import { listUsers, pageCount } from '@/application/use-cases';
import type { UserFilter } from '@/application/ports';
import { requireAdminContext } from '@/infrastructure/container';
import { AccessBadge } from '@/presentation/components/Badge';
import { Card } from '@/presentation/components/Card';
import { DataTable, type Column } from '@/presentation/components/DataTable';
import { date, groupDigits } from '@/presentation/format';
import type { AdminUser } from '@/domain/users';

const FILTERS: readonly { value: UserFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'subscribed', label: 'С подпиской' },
  { value: 'trial', label: 'В триале' },
  { value: 'expired', label: 'Доступ истёк' },
  { value: 'admins', label: 'Админы' },
];

interface PageProps {
  readonly searchParams: Promise<Record<string, string | undefined>>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = (params.filter ?? 'all') as UserFilter;
  const query = params.query ?? '';
  const page = Number(params.page ?? '1');

  const { gateway } = await requireAdminContext();
  const result = await listUsers(gateway, { query, filter, page });
  const pages = pageCount(result);

  return (
    <>
      <h1 className="page-title">Пользователи</h1>

      <Card
        title={`Найдено: ${groupDigits(result.total)}`}
        description="Состояние доступа считается на момент запроса: подписка активна, пока не истёк оплаченный период."
      >
        <form className="filters" action="/users" method="get">
          <input
            type="search"
            name="query"
            defaultValue={query}
            placeholder="Почта или имя"
            aria-label="Поиск"
          />
          <select name="filter" defaultValue={filter} aria-label="Фильтр">
            {FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit">Показать</button>
        </form>

        <DataTable
          columns={userColumns}
          rows={result.items}
          rowKey={(user) => user.id}
          empty="По этому запросу никого нет"
        />

        {pages > 1 && (
          <nav className="pagination">
            {Array.from({ length: pages }, (_, index) => index + 1).map((n) => (
              <Link
                key={n}
                href={`/users?query=${encodeURIComponent(query)}&filter=${filter}&page=${n}`}
                data-active={n === result.page ? '1' : undefined}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </Card>
    </>
  );
}

const userColumns: readonly Column<AdminUser>[] = [
  {
    key: 'email',
    header: 'Аккаунт',
    align: 'left',
    render: (user) => (
      <span className="cell-stack">
        <strong>{user.email ?? 'без почты'}</strong>
        <small>{user.name ?? '—'}</small>
      </span>
    ),
  },
  {
    key: 'access',
    header: 'Доступ',
    align: 'left',
    render: (user) => <AccessBadge access={user.access} />,
  },
  { key: 'plan', header: 'План', render: (user) => user.plan ?? '—' },
  {
    key: 'periodEnd',
    header: 'Оплачен до',
    render: (user) => date(user.periodEnd),
  },
  {
    key: 'trial',
    header: 'Триал до',
    render: (user) => date(user.trialEndsAt),
  },
  { key: 'role', header: 'Роль', render: (user) => user.role },
  {
    key: 'createdAt',
    header: 'Регистрация',
    render: (user) => date(user.createdAt),
  },
];
