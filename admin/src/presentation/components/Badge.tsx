import type { AccessState } from '@/domain/users';
import { ACCESS_LABELS } from '@/domain/users';

const TONE: Readonly<Record<AccessState, string>> = {
  subscribed: 'good',
  trial: 'warn',
  expired: 'muted',
};

export function AccessBadge({ access }: { readonly access: AccessState }) {
  return (
    <span className="badge" data-tone={TONE[access]}>
      {ACCESS_LABELS[access]}
    </span>
  );
}
