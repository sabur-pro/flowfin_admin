import type { AiUsageSummary } from '@/domain/ai';
import type { FinanceSummary } from '@/domain/finance';
import type {
  AdminUser,
  AdminUserDetail,
  AiLimitRequest,
  AiLimitRequestStatus,
  UserOverview,
} from '@/domain/users';

export type UserFilter =
  | 'all'
  | 'subscribed'
  | 'trial'
  | 'expired'
  | 'admins'
  | 'blocked';

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
  getUser(id: string): Promise<AdminUserDetail>;
  blockUser(id: string, reason: string | null): Promise<void>;
  unblockUser(id: string): Promise<void>;
  /** null — вернуть пользователю общий лимит. */
  setAiLimit(id: string, limit: number | null): Promise<void>;
  listAiRequests(status?: AiLimitRequestStatus): Promise<readonly AiLimitRequest[]>;
  approveAiRequest(id: string): Promise<void>;
  rejectAiRequest(id: string): Promise<void>;
  getFinanceSummary(days: number): Promise<FinanceSummary>;
  getAiUsage(days: number): Promise<AiUsageSummary>;
  getSetting(key: AdminSettingKey): Promise<AdminSettingRecord>;
  saveSetting(key: AdminSettingKey, value: unknown): Promise<AdminSettingRecord>;
}
