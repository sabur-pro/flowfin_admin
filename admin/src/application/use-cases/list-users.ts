import type { AdminGateway, ListUsersQuery, Page } from '../ports';
import type { AdminUser } from '@/domain/users';

export const USERS_PER_PAGE = 25;

export function listUsers(
  gateway: AdminGateway,
  query: ListUsersQuery,
): Promise<Page<AdminUser>> {
  return gateway.listUsers({ perPage: USERS_PER_PAGE, ...query });
}

/** Сколько всего страниц — чтобы пагинация не считала это в разметке. */
export function pageCount(page: Page<unknown>): number {
  return Math.max(1, Math.ceil(page.total / page.perPage));
}
