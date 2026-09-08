import type { UserRole } from '@/domain/users';

export interface SignedInAdmin {
  readonly accessToken: string;
  readonly id: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly role: UserRole;
}

export interface AuthGateway {
  signIn(email: string, password: string): Promise<SignedInAdmin>;
}
