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
  readonly isBlocked: boolean;
  readonly blockedReason: string | null;
  /** Дневной лимит запросов к ИИ, который действует для пользователя. */
  readonly aiLimit: number;
  /** Лимит выставлен лично ему (заявкой или вручную), а не общий. */
  readonly aiLimitCustom: boolean;
  readonly aiUsedToday: number;
}

/** Карточка пользователя: то же, что в списке, плюс детали для модерации. */
export interface AdminUserDetail
  extends Omit<AdminUser, 'plan' | 'periodEnd' | 'provider'> {
  readonly avatarUrl: string | null;
  readonly blockedAt: string | null;
  readonly hasGoogleLinked: boolean;
  readonly hasAppleLinked: boolean;
  readonly subscription: {
    readonly status: string;
    readonly provider: string;
    readonly currentPeriodEnd: string | null;
    readonly plan: { readonly name: string } | null;
  } | null;
  readonly _count: {
    readonly transactions: number;
    readonly accounts: number;
    readonly categories: number;
  };
}

export type AiLimitRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AiLimitRequest {
  readonly id: string;
  readonly status: AiLimitRequestStatus;
  readonly currentLimit: number;
  readonly requestedLimit: number;
  readonly grantedLimit: number | null;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly resolvedByEmail: string | null;
  readonly user: {
    readonly id: string;
    readonly email: string | null;
    readonly name: string | null;
    readonly limit: number;
    readonly usedToday: number;
  };
}

export const AI_REQUEST_STATUS_LABELS: Readonly<Record<AiLimitRequestStatus, string>> = {
  PENDING: 'Ждёт решения',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
};

export interface UserOverview {
  readonly users: {
    readonly total: number;
    readonly withEmail: number;
    readonly admins: number;
    readonly newLast30Days: number;
  };
  readonly access: Readonly<Record<AccessState, number>>;
  readonly blocked: number;
  readonly pendingAiRequests: number;
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
