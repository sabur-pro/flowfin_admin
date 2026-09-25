import type {
  AdminGateway,
  AdminSettingKey,
  AdminSettingRecord,
  ListUsersQuery,
  Page,
} from '@/application/ports';
import type { AiUsageSummary } from '@/domain/ai';
import type { FinanceSummary } from '@/domain/finance';
import type {
  AdminUser,
  AdminUserDetail,
  AiLimitRequest,
  AiLimitRequestStatus,
  UserOverview,
} from '@/domain/users';
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

  getUser(id: string): Promise<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(id)}`);
  }

  async blockUser(id: string, reason: string | null): Promise<void> {
    await this.http.post(`/api/admin/users/${encodeURIComponent(id)}/block`, {
      reason: reason ?? undefined,
    });
  }

  async unblockUser(id: string): Promise<void> {
    await this.http.post(`/api/admin/users/${encodeURIComponent(id)}/unblock`, {});
  }

  async setAiLimit(id: string, limit: number | null): Promise<void> {
    await this.http.post(`/api/admin/users/${encodeURIComponent(id)}/ai-limit`, {
      limit,
    });
  }

  listAiRequests(status?: AiLimitRequestStatus): Promise<readonly AiLimitRequest[]> {
    return this.http.get<AiLimitRequest[]>('/api/admin/ai/limit-requests', { status });
  }

  async approveAiRequest(id: string): Promise<void> {
    await this.http.post(
      `/api/admin/ai/limit-requests/${encodeURIComponent(id)}/approve`,
      {},
    );
  }

  async rejectAiRequest(id: string): Promise<void> {
    await this.http.post(
      `/api/admin/ai/limit-requests/${encodeURIComponent(id)}/reject`,
      {},
    );
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
