import { averagePaymentTjs, type FinanceSummary } from '@/domain/finance';
import { requireAdminContext } from '@/infrastructure/container';
import { Card } from '@/presentation/components/Card';
import { DataTable, type Column } from '@/presentation/components/DataTable';
import { StatGrid, StatTile } from '@/presentation/components/StatTile';
import { groupDigits, percent, tjs } from '@/presentation/format';

const RANGE_DAYS = 90;

export default async function FinancePage() {
  const { gateway } = await requireAdminContext();
  const finance = await gateway.getFinanceSummary(RANGE_DAYS);

  return (
    <>
      <h1 className="page-title">Финансы</h1>
      <p className="page-lede">
        Пока сюда попадает только AlifPay — единственный подключённый способ
        оплаты. Суммы в сомони, как их принимает банк. Когда появятся Stripe или
        сторы, раздел дополнится, структура для этого уже готова.
      </p>

      <StatGrid>
        <StatTile
          label={`Принято за ${finance.rangeDays} дней`}
          value={tjs(finance.paid.amountTjs)}
          hint={`${groupDigits(finance.paid.count)} успешных платежей`}
          tone={finance.paid.amountTjs > 0 ? 'good' : 'neutral'}
        />
        <StatTile label="Средний чек" value={tjs(averagePaymentTjs(finance))} />
        <StatTile
          label="Доходят до оплаты"
          value={percent(finance.conversion.rate)}
          hint={`${groupDigits(finance.conversion.paid)} из ${groupDigits(finance.conversion.started)} начатых заказов`}
          tone={finance.conversion.rate >= 0.5 ? 'good' : 'neutral'}
        />
        <StatTile
          label="За всё время"
          value={tjs(finance.lifetime.amountTjs)}
          hint={`${groupDigits(finance.lifetime.count)} платежей`}
        />
      </StatGrid>

      <Card title="По тарифам">
        <DataTable
          columns={planColumns}
          rows={finance.byPlan}
          rowKey={(row) => row.plan}
          empty="За период не было успешных платежей"
        />
      </Card>

      <Card
        title="По способам оплаты"
        description="Гейты AlifPay: Korti Milli, кошелёк, карты Visa и Mastercard."
      >
        <DataTable
          columns={gateColumns}
          rows={finance.byGate}
          rowKey={(row) => row.gate}
          empty="За период не было успешных платежей"
        />
      </Card>

      <Card title="По дням">
        <DataTable
          columns={dailyColumns}
          rows={finance.daily}
          rowKey={(row) => row.date}
          empty="За период не было успешных платежей"
        />
      </Card>
    </>
  );
}

const planColumns: readonly Column<FinanceSummary['byPlan'][number]>[] = [
  { key: 'plan', header: 'План', align: 'left', render: (row) => row.plan },
  { key: 'count', header: 'Платежей', render: (row) => groupDigits(row.count) },
  { key: 'amount', header: 'Сумма', render: (row) => tjs(row.amountTjs) },
];

const gateColumns: readonly Column<FinanceSummary['byGate'][number]>[] = [
  { key: 'gate', header: 'Способ', align: 'left', render: (row) => row.gate },
  { key: 'count', header: 'Платежей', render: (row) => groupDigits(row.count) },
  { key: 'amount', header: 'Сумма', render: (row) => tjs(row.amountTjs) },
];

const dailyColumns: readonly Column<FinanceSummary['daily'][number]>[] = [
  { key: 'date', header: 'Дата', align: 'left', render: (row) => row.date },
  { key: 'count', header: 'Платежей', render: (row) => groupDigits(row.count) },
  { key: 'amount', header: 'Сумма', render: (row) => tjs(row.amountTjs) },
];
