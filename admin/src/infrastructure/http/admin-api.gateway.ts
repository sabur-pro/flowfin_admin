import type {
  AdminGateway,
  AdminSettingKey,
  AdminSettingRecord,
  ListUsersQuery,
  Page,
} from '@/application/ports';
import type { AiUsageSummary } from '@/domain/ai';
import type { FinanceSummary } from '@/domain/finance';
import type { AdminUser, UserOverview } from '@/domain/users';
import type { HttpClient } from './http-client';

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

  getAiUsage(days: number): Promise<AiUsageSummary> {
    return this.http.get<AiUsageSummary>('/api/admin/ai/usage', { days });
  }

  getSetting(key: AdminSettingKey): Promise<AdminSettingRecord> {
    return this.http.get<AdminSettingRecord>(`/api/admin/settings/${key}`);
  }

  saveSetting(key: AdminSettingKey, value: unknown): Promise<AdminSettingRecord> {
    return this.http.post<AdminSettingRecord>(`/api/admin/settings/${key}`, {
      value,
    });
  }
}
