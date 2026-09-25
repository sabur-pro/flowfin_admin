import Link from 'next/link';
import { requireAdminContext, withSession } from '@/infrastructure/container';
import { Card } from '@/presentation/components/Card';
import { DataTable, type Column } from '@/presentation/components/DataTable';
import { Notice } from '@/presentation/components/Notice';
import { date } from '@/presentation/format';
import { AI_REQUEST_STATUS_LABELS, type AiLimitRequest } from '@/domain/users';
import { approveRequestAction, rejectRequestAction } from './actions';

interface PageProps {
  readonly searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AiRequestsPage({ searchParams }: PageProps) {
  const { notice, error } = await searchParams;
  const { gateway } = await requireAdminContext();
  const [pending, all] = await withSession(() =>
    Promise.all([gateway.listAiRequests('PENDING'), gateway.listAiRequests()]),
  );
  const history = all.filter((request) => request.status !== 'PENDING');

  return (
    <>
      <h1 className="page-title">Заявки на лимит ИИ</h1>
      <p className="page-lede">
        Пользователь, исчерпавший дневной лимит, может попросить больше. Одобрение ставит
        лимит из заявки (колонка «Просит»). Больше — только вручную в карточке пользователя.
      </p>

      <Notice notice={notice} error={error} />

      <Card title={`Ждут решения: ${pending.length}`}>
        <DataTable
          columns={pendingColumns}
          rows={pending}
          rowKey={(request) => request.id}
          empty="Новых заявок нет"
        />
      </Card>

      <Card title="История" description="Последние 200 решённых заявок.">
        <DataTable
          columns={historyColumns}
          rows={history}
          rowKey={(request) => request.id}
          empty="Пока пусто"
        />
      </Card>
    </>
  );
}

const userColumn: Column<AiLimitRequest> = {
  key: 'user',
  header: 'Пользователь',
  align: 'left',
  render: (request) => (
    <span className="cell-stack">
      <Link href={`/users/${request.user.id}`}>
        <strong>{request.user.email ?? 'без почты'}</strong>
      </Link>
      <small>{request.user.name ?? '—'}</small>
    </span>
  ),
};

const pendingColumns: readonly Column<AiLimitRequest>[] = [
  userColumn,
  {
    key: 'usage',
    header: 'Сегодня',
    render: (request) => `${request.user.usedToday} / ${request.user.limit}`,
  },
  {
    key: 'limit',
    header: 'Просит',
    render: (request) => `${request.currentLimit} → ${request.requestedLimit}`,
  },
  { key: 'createdAt', header: 'Подана', render: (request) => date(request.createdAt) },
  {
    key: 'actions',
    header: '',
    render: (request) => (
      <span className="row-actions">
        <form action={approveRequestAction.bind(null, request.id)}>
          <button type="submit">Одобрить</button>
        </form>
        <form action={rejectRequestAction.bind(null, request.id)}>
          <button type="submit" className="button-ghost">
            Отклонить
          </button>
        </form>
      </span>
    ),
  },
];

const historyColumns: readonly Column<AiLimitRequest>[] = [
  userColumn,
  {
    key: 'status',
    header: 'Решение',
    align: 'left',
    render: (request) => (
      <span className="badge" data-tone={request.status === 'APPROVED' ? 'good' : 'muted'}>
        {AI_REQUEST_STATUS_LABELS[request.status]}
      </span>
    ),
  },
  {
    key: 'granted',
    header: 'Лимит',
    render: (request) => (request.grantedLimit != null ? String(request.grantedLimit) : '—'),
  },
  { key: 'createdAt', header: 'Подана', render: (request) => date(request.createdAt) },
  { key: 'resolvedAt', header: 'Решена', render: (request) => date(request.resolvedAt) },
  { key: 'by', header: 'Кем', render: (request) => request.resolvedByEmail ?? '—' },
];
