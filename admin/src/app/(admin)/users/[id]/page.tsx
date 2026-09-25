import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MAX_AI_LIMIT } from '@/application/use-cases';
import { requireAdminContext, withSession } from '@/infrastructure/container';
import { ApiError } from '@/infrastructure/http/api-error';
import { AccessBadge, BlockedBadge } from '@/presentation/components/Badge';
import { Card } from '@/presentation/components/Card';
import { Notice } from '@/presentation/components/Notice';
import { date, groupDigits } from '@/presentation/format';
import { blockUserAction, setAiLimitAction, unblockUserAction } from './actions';

interface PageProps {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<Record<string, string | undefined>>;
}

export default async function UserPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { notice, error } = await searchParams;
  const { gateway } = await requireAdminContext();

  const user = await withSession(() => gateway.getUser(id)).catch((cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 404) notFound();
    throw cause;
  });

  const isAdmin = user.role === 'ADMIN';

  return (
    <>
      <p className="crumbs">
        <Link href="/users">← Пользователи</Link>
      </p>
      <h1 className="page-title">
        {user.email ?? 'без почты'} {user.isBlocked && <BlockedBadge />}
      </h1>

      <Notice notice={notice} error={error} />

      <Card title="Аккаунт">
        <dl className="facts">
          <dt>Имя</dt>
          <dd>{user.name ?? '—'}</dd>
          <dt>Роль</dt>
          <dd>{user.role}</dd>
          <dt>Доступ</dt>
          <dd>
            <AccessBadge access={user.access} />
          </dd>
          <dt>Триал до</dt>
          <dd>{date(user.trialEndsAt)}</dd>
          <dt>Регистрация</dt>
          <dd>{date(user.createdAt)}</dd>
          <dt>Вход через</dt>
          <dd>
            {[user.hasGoogleLinked && 'Google', user.hasAppleLinked && 'Apple']
              .filter(Boolean)
              .join(', ') || 'почта'}
          </dd>
          <dt>Данные</dt>
          <dd>
            {groupDigits(user._count.transactions)} операций, {groupDigits(user._count.accounts)}{' '}
            счетов, {groupDigits(user._count.categories)} категорий
          </dd>
        </dl>
      </Card>

      <Card
        title="Запросы к ИИ"
        description={`Сегодня использовано ${user.aiUsedToday} из ${user.aiLimit}. ${
          user.aiLimitCustom ? 'Лимит выставлен лично.' : 'Действует общий лимит.'
        } Сутки считаются по времени Душанбе.`}
      >
        <form action={setAiLimitAction.bind(null, user.id)} className="inline-form">
          <label>
            Запросов в день
            <input
              type="number"
              name="limit"
              min={0}
              max={MAX_AI_LIMIT}
              step={1}
              defaultValue={user.aiLimitCustom ? user.aiLimit : ''}
              placeholder={String(user.aiLimit)}
            />
          </label>
          <button type="submit">Сохранить</button>
          {user.aiLimitCustom && (
            <button type="submit" name="reset" value="1" className="button-ghost">
              Сбросить к общему
            </button>
          )}
        </form>
        <p className="form-hint">
          Любое число — например, для тестировщиков. 0 полностью отключает ИИ. Если у пользователя есть
          заявка на расширение, она закроется автоматически.
        </p>
      </Card>

      <Card
        title="Блокировка"
        description={
          user.isBlocked
            ? `Заблокирован ${date(user.blockedAt)}. Вход и синхронизация недоступны, данные сохранены.`
            : 'Бан закрывает вход, синхронизацию и ИИ сразу — без ожидания истечения токена. Данные не удаляются, блокировку можно снять.'
        }
      >
        {user.isBlocked ? (
          <>
            {user.blockedReason && <p className="form-hint">Причина: {user.blockedReason}</p>}
            <form action={unblockUserAction.bind(null, user.id)}>
              <button type="submit">Разблокировать</button>
            </form>
          </>
        ) : isAdmin ? (
          <p className="form-hint">Администратора заблокировать нельзя.</p>
        ) : (
          <form action={blockUserAction.bind(null, user.id)} className="stack-form">
            <label>
              Причина (увидит пользователь)
              <textarea name="reason" rows={2} maxLength={500} placeholder="Необязательно" />
            </label>
            <button type="submit" className="button-danger">
              Заблокировать аккаунт
            </button>
          </form>
        )}
      </Card>
    </>
  );
}
