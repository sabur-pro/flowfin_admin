import type {
  AdminGateway,
  ListUsersQuery,
  Page,
} from '@/application/ports';
import type { FinanceSummary } from '@/domain/finance';
import type { AdminUser, UserOverview } from '@/domain/users';
import type { HttpClient } from './http-client';

/** Реализация порта поверх FlowFin API. Ровно один способ достучаться до данных. */
export class AdminApiGateway implements AdminGateway {
  constructor(private readonly http: HttpClient) {}

  getOverview(): Promise<UserOverview> {
    return this.http.get<UserOverview>('/api/admin/overview');
  }

  listUsers(query: ListUsersQuery): Promise<Page<AdminUser>> {
    return this.http.get<Page<AdminUser>>('/api/admin/users', {
      query: query.query,
      filter: query.filter,
      page: query.page,
      perPage: query.perPage,
    });
  }

  getFinanceSummary(days: number): Promise<FinanceSummary> {
    return this.http.get<FinanceSummary>('/api/admin/finance/summary', { days });
  }
}
