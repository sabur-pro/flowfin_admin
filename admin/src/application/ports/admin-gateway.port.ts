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

/** Ключи общих настроек админки. Совпадают со списком, который знает API. */
export type AdminSettingKey = 'unit-economics';

/**
 * Настройка как её отдаёт API: значение произвольной формы плюс след того,
 * кто записал. value === null, пока настройку ни разу не сохраняли.
 */
export interface AdminSettingRecord {
  readonly value: unknown;
  readonly updatedAt: string | null;
  readonly updatedByEmail: string | null;
}

/**
 * Всё, что админке нужно от внешнего мира. Реализация живёт в infrastructure;
 * сценарии применения знают только этот интерфейс.
 */
export interface AdminGateway {
  getOverview(): Promise<UserOverview>;
  listUsers(query: ListUsersQuery): Promise<Page<AdminUser>>;
  getFinanceSummary(days: number): Promise<FinanceSummary>;
  getSetting(key: AdminSettingKey): Promise<AdminSettingRecord>;
  saveSetting(key: AdminSettingKey, value: unknown): Promise<AdminSettingRecord>;
}
