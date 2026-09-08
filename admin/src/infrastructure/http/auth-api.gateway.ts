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
      // API держит одну активную сессию на аккаунт и отвечает 409, если она
      // уже есть. Для панели это норма: администратор входит с рабочего места
      // и забирает сессию себе. Побочный эффект — вход в панель разлогинивает
      // тот же аккаунт в мобильном приложении, поэтому для админки заводят
      // отдельный аккаунт, а не используют личный.
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
