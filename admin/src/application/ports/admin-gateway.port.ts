import type { AiUsageSummary } from '@/domain/ai';
import type { FinanceSummary } from '@/domain/finance';
import type { AdminUser, UserOverview } from '@/domain/users';

export type UserFilter = 'all' | 'subscribed' | 'trial' | 'expired' | 'admins';

export interface ListUsersQuery {
  readonly query?: string;
  readonly filter?: UserFilter;
  readonly page?: number;
  readonly perPage?: number;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
}

export type AdminSettingKey = 'unit-economics';

export interface AdminSettingRecord {
  readonly value: unknown;
  readonly updatedAt: string | null;
  readonly updatedByEmail: string | null;
}

export interface AdminGateway {
  getOverview(): Promise<UserOverview>;
  listUsers(query: ListUsersQuery): Promise<Page<AdminUser>>;
  getFinanceSummary(days: number): Promise<FinanceSummary>;
  getAiUsage(days: number): Promise<AiUsageSummary>;
  getSetting(key: AdminSettingKey): Promise<AdminSettingRecord>;
  saveSetting(key: AdminSettingKey, value: unknown): Promise<AdminSettingRecord>;
}
