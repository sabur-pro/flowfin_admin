import { loadDashboard } from '@/application/use-cases';
import { averagePaymentTjs } from '@/domain/finance';
import { requireAdminContext } from '@/infrastructure/container';
import { Card } from '@/presentation/components/Card';
import { DataTable, type Column } from '@/presentation/components/DataTable';
import { StatGrid, StatTile } from '@/presentation/components/StatTile';
import { groupDigits, percent, tjs, usd } from '@/presentation/format';
import type { UserOverview } from '@/domain/users';

export default async function OverviewPage() {
  const { gateway } = await requireAdminContext();
  const { overview, finance } = await loadDashboard(gateway);

  const paying = overview.access.subscribed;
  const conversion = overview.users.total > 0 ? paying / overview.users.total : 0;

  return (
    <>
      <h1 className="page-title">Обзор</h1>

      <StatGrid>
        <StatTile
          label="Всего аккаунтов"
          value={groupDigits(overview.users.total)}
          hint={`+${groupDigits(overview.users.newLast30Days)} за 30 дней`}
        />
        <StatTile
          label="С активной подпиской"
          value={groupDigits(paying)}
          hint={`${percent(conversion)} от базы`}
          tone={paying > 0 ? 'good' : 'neutral'}
        />
        <StatTile
          label="В триале"
          value={groupDigits(overview.access.trial)}
          hint={`${groupDigits(overview.access.expired)} с истёкшим доступом`}
        />
        <StatTile
          label={`Касса за ${finance.rangeDays} дней`}
          value={tjs(finance.paid.amountTjs)}
          hint={`${groupDigits(finance.paid.count)} платежей, средний чек ${tjs(averagePaymentTjs(finance))}`}
        />
      </StatGrid>

      <Card
        title="Тарифы"
        description="Подписчики по планам. Цены заданы в subscription_plans."
      >
        <DataTable
          columns={planColumns}
          rows={overview.plans}
          rowKey={(plan) => plan.name}
          empty="Планы не заведены — запустите prisma/seed.ts"
        />
      </Card>
    </>
  );
}

type Plan = UserOverview['plans'][number];

const planColumns: readonly Column<Plan>[] = [
  { key: 'name', header: 'План', align: 'left', render: (p) => p.name },
  { key: 'duration', header: 'Дней', render: (p) => groupDigits(p.durationDays) },
  { key: 'price', header: 'Цена', render: (p) => usd(p.priceUsd) },
  {
    key: 'subscribers',
    header: 'Подписчиков',
    render: (p) => groupDigits(p.subscribers),
  },
];
