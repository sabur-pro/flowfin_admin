import type { AdminGateway } from '../ports';
import { parseWorkspace, type Workspace } from '@/domain/unit-economics';

const KEY = 'unit-economics' as const;

export interface SavedWorkspace {
  readonly workspace: Workspace | null;
  readonly updatedAt: string | null;
  readonly updatedByEmail: string | null;
}

export async function loadSavedWorkspace(
  gateway: AdminGateway,
): Promise<SavedWorkspace> {
  try {
    const record = await gateway.getSetting(KEY);
    return {
      workspace: parseWorkspace(record.value),
      updatedAt: record.updatedAt,
      updatedByEmail: record.updatedByEmail,
    };
  } catch (cause) {
    if (isUnauthorized(cause)) throw cause;
    return { workspace: null, updatedAt: null, updatedByEmail: null };
  }
}

function isUnauthorized(cause: unknown): boolean {
  if (typeof cause !== 'object' || cause === null || !('status' in cause)) {
    return false;
  }
  const { status } = cause as { status: number };
  return status === 401 || status === 403;
}

export async function saveWorkspace(
  gateway: AdminGateway,
  raw: unknown,
): Promise<SavedWorkspace> {
  const workspace = parseWorkspace(raw);
  if (!workspace) throw new Error('Настройки не прошли разбор и не сохранены');

  const record = await gateway.saveSetting(KEY, workspace);

  return {
    workspace: parseWorkspace(record.value) ?? workspace,
    updatedAt: record.updatedAt,
    updatedByEmail: record.updatedByEmail,
  };
}
