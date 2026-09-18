import type { AdminGateway } from '../ports';
import type { UserOverview } from '@/domain/users';
import type { FinanceSummary } from '@/domain/finance';

export interface Dashboard {
  readonly overview: UserOverview;
  readonly finance: FinanceSummary;
}

export async function loadDashboard(
  gateway: AdminGateway,
  financeRangeDays = 90,
): Promise<Dashboard> {
  const [overview, finance] = await Promise.all([
    gateway.getOverview(),
    gateway.getFinanceSummary(financeRangeDays),
  ]);

  return { overview, finance };
}
