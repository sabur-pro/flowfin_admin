/** Состояние доступа считает сервер: клиент не должен знать про даты триала. */
export type AccessState = 'subscribed' | 'trial' | 'expired';

export type UserRole = 'ADMIN' | 'USER';

export interface AdminUser {
  readonly id: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly role: UserRole;
  readonly createdAt: string;
  readonly trialEndsAt: string | null;
  readonly access: AccessState;
  readonly plan: string | null;
  readonly periodEnd: string | null;
  readonly provider: string | null;
}

export interface UserOverview {
  readonly users: {
    readonly total: number;
    readonly withEmail: number;
    readonly admins: number;
    readonly newLast30Days: number;
  };
  readonly access: Readonly<Record<AccessState, number>>;
  readonly plans: readonly {
    readonly name: string;
    readonly priceUsd: number;
    readonly durationDays: number;
    readonly subscribers: number;
  }[];
}

export const ACCESS_LABELS: Readonly<Record<AccessState, string>> = {
  subscribed: 'Подписка',
  trial: 'Триал',
  expired: 'Истёк',
};
