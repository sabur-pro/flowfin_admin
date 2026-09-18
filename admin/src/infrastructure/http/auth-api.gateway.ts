import type { AuthGateway, SignedInAdmin } from '@/application/ports';
import type { UserRole } from '@/domain/users';
import type { HttpClient } from './http-client';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role: UserRole;
    avatarUrl: string | null;
  };
}

export class AuthApiGateway implements AuthGateway {
  constructor(private readonly http: HttpClient) {}

  async signIn(email: string, password: string): Promise<SignedInAdmin> {
    const response = await this.http.post<LoginResponse>('/api/auth/login', {
      email,
      password,

      force: true,
    });

    return {
      accessToken: response.accessToken,
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role,
    };
  }
}
